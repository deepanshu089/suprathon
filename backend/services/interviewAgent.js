// Interview Agent
// Responsibility: Generate personalized interview questions using RAG.
// RAG = Retrieval Augmented Generation.
//
// Instead of asking Gemini generic questions, we first RETRIEVE:
//   1. The candidate's parsed resume (from DB)
//   2. The job description data (from DB)
// Then we INJECT this context into the prompt before generating questions.
// This grounds the AI's output in real candidate data — no hallucinations.
//
// Question distribution:
//   2 resume-based, 2 job-based, 1 technical, 1 behavioral = 6 total

const { geminiModel } = require("../lib/gemini");
const { parseAiJson } = require("../utils/parseAiJson");

// Default round structure used when a recruiter hasn't configured custom rounds —
// preserves the original 6-question behavior.
const DEFAULT_ROUNDS = [
  { topic: "Resume", count: 2 },
  { topic: "Job Role", count: 2 },
  { topic: "Technical", count: 1 },
  { topic: "Behavioural", count: 1 },
];

// Builds the full question set for one interview, following either the
// recruiter's custom rounds or the DEFAULT_ROUNDS fallback.
async function generateQuestions(resumeData, jobData, rounds) {
  const activeRounds = Array.isArray(rounds) && rounds.length > 0 ? rounds : DEFAULT_ROUNDS;
  const totalQuestions = activeRounds.reduce((sum, r) => sum + Number(r.count || 0), 0);

  // Turn each round into a plain-English instruction line for the prompt,
  // e.g. `Round 1 — "Resume": generate exactly 2 question(s) on this topic.`
  const roundInstructions = activeRounds
    .map((r, i) => `Round ${i + 1} — "${r.topic}": generate exactly ${r.count} question(s) on this topic.`)
    .join("\n");

  const prompt = `
You are an expert interviewer conducting a multi-round interview. Generate exactly ${totalQuestions} interview questions across the following rounds, in order.

Candidate Profile:
- Name: ${resumeData.name}
- Skills: ${JSON.stringify(resumeData.skills)}
- Experience: ${JSON.stringify(resumeData.experience)}

Job Requirements:
- Title: ${jobData.title}
- Required Skills: ${JSON.stringify(jobData.required_skills)}
- Seniority: ${jobData.seniority || "mid"}

Round plan:
${roundInstructions}

Rules:
- Ground questions in the candidate's actual resume and the job's actual requirements where the round topic allows it (e.g. a "DSA" round should still be a real DSA problem, a "Behavioural" round should use STAR format, a "Payments" or domain round should reference relevant concepts).
- Keep each question self-contained and answerable verbally in under a minute.
- "round" must exactly match the round topic given above. Number questions sequentially by overall position, not per-round.

Return ONLY a JSON array:
[
  { "id": 1, "round": "<round topic>", "question": "...", "topic": "<specific subtopic>" }
]
`;

  const result = await geminiModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

module.exports = { generateQuestions };
