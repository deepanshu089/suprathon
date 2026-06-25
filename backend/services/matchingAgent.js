// Matching Agent
// Responsibility: Given a resume and a job, explain the match in human terms.
// The cosine similarity score from pgvector gives us a raw number.
// This agent's job is to make that number EXPLAINABLE — required for interviews.
// A recruiter should never see just "85%" — they need to know WHY.

const { geminiModel } = require("../lib/gemini");
const { parseAiJson } = require("../utils/parseAiJson");

// Turns a raw cosine-similarity score (0-1) plus skill lists into a
// recruiter-readable match report: score, strengths, gaps, and reasoning.
async function explainMatch(resumeSkills, jobRequirements, similarityScore) {
  const matchPercent = Math.round(similarityScore * 100);

  const prompt = `
You are a recruitment analyst. Evaluate a candidate's fit for a job.

Candidate Skills: ${JSON.stringify(resumeSkills)}
Job Required Skills: ${JSON.stringify(jobRequirements.required_skills)}
Job Nice-to-Have: ${JSON.stringify(jobRequirements.nice_to_have || [])}
Semantic Similarity Score: ${matchPercent}%

Return ONLY valid JSON with this structure:
{
  "match_score": number (0-100),
  "strengths": string[] (skills candidate has that job needs),
  "missing_skills": string[] (required skills candidate lacks),
  "recommendation": string (one sentence summary for recruiter),
  "reason": string (2-3 sentence explanation of the score)
}
`;

  const result = await geminiModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

module.exports = { explainMatch };
