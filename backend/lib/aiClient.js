// AI client — text generation + transcription via Groq (free tier, no billing
// needed; Llama 3 models at very high speed), embeddings via HuggingFace's
// free Inference API (Groq has no embeddings endpoint of its own).

const { Groq, toFile } = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const HF_EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2";
// HuggingFace migrated off the old api-inference.huggingface.co domain to this
// "router" endpoint (Inference Providers) — the old URL no longer resolves.
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_EMBEDDING_MODEL}/pipeline/feature-extraction`;

// Speech-to-text: transcribes a recorded answer's audio buffer via Groq's free Whisper API.
// This is server-side (unlike the browser's Web Speech API), so it isn't affected by the
// candidate's connection dropping out mid-sentence, and it's far more accurate.
async function transcribeAudio(buffer, filename = "answer.webm") {
  const transcription = await groq.audio.transcriptions.create({
    file: await toFile(buffer, filename),
    model: "whisper-large-v3-turbo",
  });
  return transcription.text;
}

// Text-generation model used by every AI agent (resume parsing, job analysis,
// matching, interview question generation, evaluation, resume chat).
const llmModel = {
  generateContent: async (prompt) => {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    return {
      response: {
        text: () => completion.choices[0].message.content,
      },
    };
  },
};

// Embedding model — HuggingFace's free Inference API running a real
// sentence-transformers model (all-mpnet-base-v2, 768-dim output — matches
// the existing VECTOR(768) columns, so no schema migration is needed).
const embeddingModel = {
  embedContent: async (text) => {
    const values = await fetchHuggingFaceEmbedding(text);
    return { embedding: { values } };
  },
};

async function fetchHuggingFaceEmbedding(text) {
  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    // wait_for_model: the free Inference API can "cold start" a model that
    // hasn't been called recently — this tells HF to wait rather than
    // immediately return a 503.
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HuggingFace embedding request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();

  // sentence-transformers models on the free Inference API usually return the
  // already-pooled sentence embedding as a flat array (length 768). Some
  // model/runtime combinations instead return per-token embeddings as a 2D
  // array — mean-pool those down to a single vector if that shape shows up.
  const vector = Array.isArray(data[0]) ? meanPool(data) : data;

  return normalize(vector);
}

function meanPool(tokenVectors) {
  const dim = tokenVectors[0].length;
  const pooled = new Array(dim).fill(0);
  for (const tokenVec of tokenVectors) {
    for (let i = 0; i < dim; i++) pooled[i] += tokenVec[i];
  }
  return pooled.map((v) => v / tokenVectors.length);
}

function normalize(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

module.exports = { llmModel, embeddingModel, transcribeAudio };
