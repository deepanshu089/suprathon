// Embedding utility
// Takes any text and returns a 768-dimension float array using Gemini's embedding model.
// These vectors are stored in pgvector columns and used for cosine similarity search.

const { embeddingModel } = require("../lib/gemini");

async function generateEmbedding(text) {
  // Gemini's embedContent returns { embedding: { values: float[] } }
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // float[768]
}

module.exports = { generateEmbedding };
