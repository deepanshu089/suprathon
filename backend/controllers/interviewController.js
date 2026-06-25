// Interview Controller
// Manages the full interview lifecycle:
//   start → answer (loop) → evaluate
//
// RAG happens in startInterview:
//   We fetch resume + job from DB and inject into Interview Agent prompt.
//   This is what makes questions personalized instead of generic.

const supabase = require("../utils/supabase");
const { generateQuestions } = require("../services/interviewAgent");
const { evaluateInterview } = require("../services/evaluationAgent");
const { transcribeAudio } = require("../lib/gemini");

// Candidate: upload the recorded answer audio for one question, get back the transcribed text.
// Server-side transcription (Groq Whisper) instead of the browser's Web Speech API —
// more accurate and not affected by the candidate's connection dropping mid-sentence.
async function transcribeAnswer(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    const text = await transcribeAudio(req.file.buffer, req.file.originalname || "answer.webm");
    res.json({ transcript: text?.trim() || "" });
  } catch (err) {
    next(err);
  }
}

async function startInterview(req, res, next) {
  try {
    const { application_id } = req.body;

    // Fetch application to get job_id and resume_id
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("job_id, resume_id")
      .eq("id", application_id)
      .eq("candidate_id", req.user.id) // security: ensure it belongs to this candidate
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // RAG Step 1: Retrieve resume context
    const { data: resume } = await supabase
      .from("resumes")
      .select("parsed_data, extracted_skills")
      .eq("id", application.resume_id)
      .single();

    // RAG Step 2: Retrieve job context
    const { data: job } = await supabase
      .from("jobs")
      .select("title, description, required_skills, interview_rounds")
      .eq("id", application.job_id)
      .single();

    // Interview Agent: generate personalized questions using both contexts,
    // following the recruiter's custom round configuration (or the default format)
    const questions = await generateQuestions(
      resume.parsed_data,
      {
        title: job.title,
        required_skills: job.required_skills,
        seniority: "mid",
      },
      job.interview_rounds
    );

    // Remove any prior interview attempt for this application so retries
    // don't leave behind duplicate rows (which breaks .single()/latest lookups)
    await supabase.from("interviews").delete().eq("application_id", application_id);

    // Create interview record with questions, empty transcripts initially
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .insert({
        application_id,
        questions,
        transcripts: [],
        rounds: job.interview_rounds || [],
      })
      .select()
      .single();

    if (interviewError) throw interviewError;

    res.status(201).json({
      interview_id: interview.id,
      questions,
      total_questions: questions.length,
      rounds: job.interview_rounds || [],
    });
  } catch (err) {
    next(err);
  }
}

async function submitAnswer(req, res, next) {
  try {
    const { interview_id, question_id, question, answer, round } = req.body;

    // Fetch interview to get current transcripts
    const { data: interview, error } = await supabase
      .from("interviews")
      .select("transcripts, application_id")
      .eq("id", interview_id)
      .single();

    if (error || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    // Append this Q&A to the transcripts array
    const updatedTranscripts = [
      ...interview.transcripts,
      { question_id, question, answer, round },
    ];

    await supabase
      .from("interviews")
      .update({ transcripts: updatedTranscripts })
      .eq("id", interview_id);

    res.json({ message: "Answer recorded" });
  } catch (err) {
    next(err);
  }
}

async function evaluateFinal(req, res, next) {
  try {
    const { interview_id } = req.body;

    const { data: interview, error } = await supabase
      .from("interviews")
      .select("transcripts, application_id")
      .eq("id", interview_id)
      .single();

    if (error || !interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const { data: application } = await supabase
      .from("applications")
      .select("job_id")
      .eq("id", interview.application_id)
      .single();

    const { data: job } = await supabase
      .from("jobs")
      .select("title, required_skills")
      .eq("id", application.job_id)
      .single();

    // Evaluation Agent: score all transcripts
    const evaluation = await evaluateInterview(interview.transcripts, job);

    // Save scores back to the interview record
    await supabase
      .from("interviews")
      .update({
        technical_score: evaluation.technical_score,
        communication_score: evaluation.communication_score,
        overall_score: evaluation.overall_score,
        recommendation: evaluation.recommendation,
        score_explanation: evaluation.explanation,
        round_scores: evaluation.round_scores || [],
      })
      .eq("id", interview_id);

    // Mark application as "interviewed" so recruiter knows to review it
    await supabase
      .from("applications")
      .update({ status: "interviewed" })
      .eq("id", interview.application_id);

    res.json(evaluation);
  } catch (err) {
    next(err);
  }
}

async function getInterview(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) return res.status(404).json({ error: "Interview not found" });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { startInterview, submitAnswer, evaluateFinal, getInterview, transcribeAnswer };
