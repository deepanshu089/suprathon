// Resume Agent
// Responsibility: Parse raw resume text and extract structured information using the LLM.
// This is a dedicated AI agent — it has one job and does it well.
// Separation of concerns: AI logic lives here, not in the controller.

const { llmModel } = require("../lib/aiClient");
const { parseAiJson } = require("../utils/parseAiJson");

// Converts raw resume text into structured fields (name, skills, experience, etc.)
async function parseResume(rawText) {
  const prompt = `
You are a resume parser. Extract structured information from the resume text below.
Return ONLY a valid JSON object. Do not include any markdown, explanation, or code blocks.

Extract:
- name: string
- email: string
- phone: string
- skills: string[] (technical skills only)
- experience: array of { company, role, duration, description }
- education: array of { degree, institution, year }
- total_years_experience: number (estimate if not stated)

Resume text:
${rawText}
`;

  const result = await llmModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

// Lighter-weight call that only pulls out the technical skills list
// (used by the matcher, which doesn't need the full parsed resume).
async function extractSkills(rawText) {
  const prompt = `
Extract ONLY technical skills from this resume. Return a JSON array of strings.
Example: ["React", "Node.js", "PostgreSQL", "Python"]
No explanation. No markdown. Just the JSON array.

Resume:
${rawText}
`;

  const result = await llmModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

module.exports = { parseResume, extractSkills };
