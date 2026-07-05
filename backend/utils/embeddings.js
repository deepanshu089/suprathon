// Embedding utility
// Takes any text and returns a 768-dimension float array using HuggingFace's
// sentence-transformers embedding model. These vectors are stored in
// pgvector columns and used for cosine similarity search.

const { embeddingModel } = require("../lib/aiClient");

async function generateEmbedding(text) {
  // embedContent returns { embedding: { values: float[] } }
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // float[768]
}

module.exports = { generateEmbedding };
