// Evaluation Agent
// Responsibility: Read all Q&A transcripts and score the candidate.
// Scores are ALWAYS accompanied by explanation — never a bare number.
// This is the final step of the interview pipeline.

const { llmModel } = require("../lib/aiClient");
const { parseAiJson } = require("../utils/parseAiJson");

// Scores a completed interview from its full list of Q&A transcripts.
// Produces per-round scores plus overall technical/communication/overall
// scores and a hire recommendation, all grounded in the actual answers given.
async function evaluateInterview(transcripts, jobData) {
  // Collect the distinct round names that actually appear in this interview
  const rounds = [...new Set(transcripts.map((t) => t.round || t.type || "General"))];

  const prompt = `
You are a senior hiring manager evaluating a candidate interview that was conducted in multiple rounds.

Job Title: ${jobData.title}
Required Skills: ${JSON.stringify(jobData.required_skills)}

Rounds in this interview: ${JSON.stringify(rounds)}

Interview Transcripts (grouped by round):
${transcripts
  .map(
    (t, i) => `
Q${i + 1} [Round: ${t.round || t.type || "General"}]: ${t.question}
Answer: ${t.answer}
`
  )
  .join("\n")}

Evaluate the candidate:
1. For EACH round listed above, give a score (0-100) and a 1-2 sentence feedback note specific to that round's questions.
2. Technical knowledge (0-100, overall across all rounds): Did they demonstrate relevant technical skills?
3. Communication (0-100, overall across all rounds): Were their answers clear and structured?
4. Overall score (0-100): Weighted average reflecting performance across all rounds.

Also provide:
- recommendation: "Strong Hire" | "Hire" | "Consider" | "No Hire"
- explanation: 3-4 sentences justifying the scores and recommendation, referencing standout or weak rounds by name

Return ONLY valid JSON:
{
  "round_scores": [ { "round": "...", "score": number, "feedback": "..." } ],
  "technical_score": number,
  "communication_score": number,
  "overall_score": number,
  "recommendation": string,
  "explanation": string
}
`;

  const result = await llmModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

module.exports = { evaluateInterview };
