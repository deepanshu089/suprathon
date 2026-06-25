// LLMs wrap JSON in code fences inconsistently (```json, plain ```, or no fence at all).
// This strips any fence and falls back to extracting the first {...} or [...] block.
function parseAiJson(text) {
  let cleaned = text.trim().replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/[\{\[][\s\S]*[\}\]]/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI response was not valid JSON: " + cleaned.slice(0, 200));
  }
}

module.exports = { parseAiJson };
