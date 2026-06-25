// AI client — using Groq (free tier, no billing needed)
// Groq runs Llama 3 models at very high speed for free.
// We keep the same export names (geminiModel) so no other files need to change.
// For embeddings we use a simple TF-IDF style fallback since Groq doesn't do embeddings.

const { Groq, toFile } = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// Wrapper that mimics the Gemini generateContent interface
// so all agent files work without any changes
const geminiModel = {
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

// Embedding model — Groq doesn't support embeddings
// We use a hash-based vector as a lightweight fallback
// For a real deployment, swap with HuggingFace or OpenAI embeddings
const embeddingModel = {
  embedContent: async (text) => {
    // Generate a deterministic 768-dim pseudo-vector from text
    // This enables the app to run without an embedding API
    const values = generatePseudoEmbedding(text);
    return { embedding: { values } };
  },
};

function generatePseudoEmbedding(text) {
  const vector = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word, i) => {
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * 31 + i * 17 + j * 7) % 768;
      vector[idx] += 1 / (i + 1);
    }
  });
  // Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

module.exports = { geminiModel, embeddingModel, transcribeAudio };
