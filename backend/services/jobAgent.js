// Job Analysis Agent
// Responsibility: Analyze a job description and extract structured requirements.
// This lets us compare "what the job needs" vs "what the candidate has" clearly.

const { geminiModel } = require("../lib/gemini");
const { parseAiJson } = require("../utils/parseAiJson");

// Sends the job title + description to the LLM and gets back structured
// requirements (skills, seniority, responsibilities) as JSON.
async function analyzeJob(title, description) {
  const prompt = `
You are a job requirements analyst. Analyze this job posting and extract structured data.
Return ONLY valid JSON. No markdown. No explanation.

Extract:
- required_skills: string[] (must-have technical skills)
- nice_to_have: string[] (preferred but not required)
- seniority: string ("junior" | "mid" | "senior")
- responsibilities: string[] (key job responsibilities)

Job Title: ${title}
Job Description: ${description}
`;

  const result = await geminiModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

module.exports = { analyzeJob };
