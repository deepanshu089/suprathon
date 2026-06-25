// Resume Analysis Agent
// Produces a detailed, recruiter-friendly analysis of a candidate's resume
// against a specific job. Goes much deeper than the matching agent —
// explains WHY the candidate is or isn't a fit with specific evidence.

const { geminiModel } = require("../lib/gemini");
const { parseAiJson } = require("../utils/parseAiJson");

// Builds an in-depth, recruiter-facing breakdown of one candidate's fit for
// one job — much more detailed than the quick match-score explanation.
async function analyzeResumeForRecruiter(resumeData, jobData, matchScore) {
  const prompt = `
You are a senior technical recruiter reviewing a candidate's profile for a specific role.
Provide a detailed, structured analysis that helps a non-technical recruiter understand this candidate.

Candidate Profile:
${JSON.stringify(resumeData.parsed_data, null, 2)}

Candidate Skills: ${JSON.stringify(resumeData.extracted_skills)}

Job Title: ${jobData.title}
Job Required Skills: ${JSON.stringify(jobData.required_skills)}
Job Description: ${jobData.description}

AI Match Score: ${matchScore}%

Provide a thorough analysis in the following JSON format:
{
  "summary": "2-3 sentence executive summary of this candidate",
  "overall_fit": "Strong Fit | Good Fit | Partial Fit | Poor Fit",
  "experience_analysis": {
    "total_years": number,
    "relevant_experience": "paragraph explaining which experiences are relevant to this role",
    "notable_projects": ["project or achievement 1", "project or achievement 2"]
  },
  "skills_breakdown": {
    "matched_skills": [{"skill": "name", "evidence": "where they used it"}],
    "missing_critical": ["skill1", "skill2"],
    "bonus_skills": ["skills they have beyond what was asked"]
  },
  "strengths": ["strength 1 with evidence", "strength 2 with evidence", "strength 3 with evidence"],
  "concerns": ["concern 1", "concern 2"],
  "interview_focus_areas": ["topic to probe in interview 1", "topic 2", "topic 3"],
  "recruiter_recommendation": "Detailed paragraph with final recommendation — should they move forward?"
}

Return ONLY valid JSON. No markdown.
`;

  const result = await geminiModel.generateContent(prompt);
  return parseAiJson(result.response.text());
}

async function chatAboutResume(resumeData, jobData, conversationHistory, userMessage) {
  // Resume chatbot — recruiter can ask anything about the candidate
  // We include full conversation history for context memory
  const systemContext = `
You are an expert AI recruitment assistant. A recruiter is asking you questions about a specific candidate.
Answer based ONLY on the candidate's resume data provided. Be specific and cite evidence from the resume.
If something is not in the resume, say so clearly.

Candidate: ${resumeData.parsed_data?.name}
Skills: ${JSON.stringify(resumeData.extracted_skills)}
Experience: ${JSON.stringify(resumeData.parsed_data?.experience)}
Education: ${JSON.stringify(resumeData.parsed_data?.education)}

Job they applied for: ${jobData.title}
Required Skills: ${JSON.stringify(jobData.required_skills)}
`;

  const history = conversationHistory
    .map((m) => `${m.role === "user" ? "Recruiter" : "AI"}: ${m.content}`)
    .join("\n");

  const prompt = `${systemContext}

Conversation so far:
${history}

Recruiter: ${userMessage}

AI:`;

  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { analyzeResumeForRecruiter, chatAboutResume };
