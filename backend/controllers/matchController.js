// Match Controller
// The core AI feature: semantic similarity between resume and job using pgvector.
//
// How it works:
// 1. Get candidate's resume embedding from DB
// 2. Get job's embedding from DB
// 3. Run pgvector cosine similarity (via RPC call to Supabase)
// 4. Pass result to Matching Agent to generate human-readable explanation
// 5. Save application with score + explanation

const supabase = require("../utils/supabase");
const { explainMatch } = require("../services/matchingAgent");

async function matchResumeToJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    // Fetch candidate's latest resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, extracted_skills, embedding")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (resumeError || !resume) {
      return res.status(404).json({ error: "Please upload a resume first" });
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, description, required_skills, embedding")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // pgvector cosine similarity via Supabase RPC
    // We created a DB function match_resume_to_job that does:
    // SELECT 1 - (resume_embedding <=> job_embedding) AS similarity
    const { data: similarityData, error: simError } = await supabase.rpc(
      "cosine_similarity",
      {
        vec1: resume.embedding,
        vec2: job.embedding,
      }
    );

    if (simError) throw simError;

    const similarityScore = similarityData || 0;

    // Matching Agent: turn the raw score into a human-readable explanation
    const matchResult = await explainMatch(
      resume.extracted_skills,
      { required_skills: job.required_skills, title: job.title },
      similarityScore
    );

    // Save or update the application record. Important: we intentionally do NOT
    // include "status" or "applied" here — upsert only overwrites the fields we
    // list, so re-matching (e.g. after re-uploading a resume) never resets a
    // recruiter's existing decision (shortlisted/rejected) or applied flag.
    const { data: application, error: appError } = await supabase
      .from("applications")
      .upsert(
        {
          job_id: jobId,
          candidate_id: candidateId,
          resume_id: resume.id,
          match_score: matchResult.match_score,
          missing_skills: matchResult.missing_skills,
          strengths: matchResult.strengths,
          match_reason: matchResult.reason,
        },
        { onConflict: "job_id,candidate_id" }
      )
      .select()
      .single();

    if (appError) throw appError;

    res.json({
      application_id: application.id,
      match_score: matchResult.match_score,
      strengths: matchResult.strengths,
      missing_skills: matchResult.missing_skills,
      recommendation: matchResult.recommendation,
      reason: matchResult.reason,
      status: application.status,
    });
  } catch (err) {
    next(err);
  }
}

// Candidate: explicitly apply to a job after matching.
// Recruiters only see candidates who have applied — matching alone is just a
// private preview for the candidate and does not notify the recruiter.
async function applyToJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    const { data: application, error } = await supabase
      .from("applications")
      .update({ applied: true })
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .select()
      .single();

    if (error || !application) {
      return res.status(404).json({ error: "Please match your resume to this job before applying" });
    }

    res.json({ message: "Applied successfully", application_id: application.id });
  } catch (err) {
    next(err);
  }
}

// Recruiter: Get all candidates for a job, ranked by match score
async function getRankings(req, res, next) {
  try {
    const { jobId } = req.params;

    const { data, error } = await supabase
      .from("applications")
      .select(`
        id, match_score, strengths, missing_skills, match_reason, status,
        profiles:candidate_id ( id, username ),
        resumes:resume_id ( parsed_data, extracted_skills )
      `)
      .eq("job_id", jobId)
      .eq("applied", true)
      .order("match_score", { ascending: false });

    if (error) throw error;

    // Attach interview scores (if an interview has been completed)
    const withInterviews = await Promise.all(
      data.map(async (app) => {
        const { data: interviewRows } = await supabase
          .from("interviews")
          .select("technical_score, communication_score, overall_score, recommendation")
          .eq("application_id", app.id)
          .order("created_at", { ascending: false })
          .limit(1);
        return { ...app, interview: interviewRows?.[0] || null };
      })
    );

    res.json(withInterviews);
  } catch (err) {
    next(err);
  }
}

module.exports = { matchResumeToJob, applyToJob, getRankings };
