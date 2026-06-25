// Application Controller
// Manages the full candidate pipeline:
//   pending → shortlisted / rejected (after resume review)
//   shortlisted → interviewed (after interview)
//   interviewed → approved / final_rejected (after interview review)
//
// Status flow:
//   pending → recruiter reviews resume match
//   shortlisted → recruiter invites for interview
//   rejected → recruiter rejects at resume stage
//   interviewed → candidate completes interview
//   approved → recruiter approves after interview
//   final_rejected → recruiter rejects after interview

const supabase = require("../utils/supabase");
const { analyzeResumeForRecruiter, chatAboutResume } = require("../services/resumeAnalysisAgent");

// Recruiter: update application status (invite/reject/approve/final_reject)
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["shortlisted", "rejected", "approved", "final_rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Application ${status}`, application: data });
  } catch (err) {
    next(err);
  }
}

// Recruiter: get full candidate detail — resume + match + interview scores
async function getCandidateDetail(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch application with all related data
    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        id, match_score, strengths, missing_skills, match_reason, status, created_at,
        profiles:candidate_id ( id, username ),
        resumes:resume_id ( id, file_url, parsed_data, extracted_skills, raw_text ),
        jobs:job_id ( id, title, description, required_skills )
      `)
      .eq("id", id)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Fetch interview if exists — take the most recent attempt if there are multiple
    const { data: interviewRows } = await supabase
      .from("interviews")
      .select("id, questions, transcripts, technical_score, communication_score, overall_score, recommendation, score_explanation, round_scores, rounds, created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(1);

    res.json({ application, interview: interviewRows?.[0] || null });
  } catch (err) {
    next(err);
  }
}

// Recruiter: get AI resume analysis for a specific application
async function getResumeAnalysis(req, res, next) {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        match_score,
        resumes:resume_id ( parsed_data, extracted_skills ),
        jobs:job_id ( title, description, required_skills )
      `)
      .eq("id", id)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const analysis = await analyzeResumeForRecruiter(
      application.resumes,
      application.jobs,
      application.match_score
    );

    res.json(analysis);
  } catch (err) {
    next(err);
  }
}

// Recruiter: chat with AI about a specific candidate's resume
async function chatWithResume(req, res, next) {
  try {
    const { id } = req.params;
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        resumes:resume_id ( parsed_data, extracted_skills ),
        jobs:job_id ( title, required_skills )
      `)
      .eq("id", id)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const reply = await chatAboutResume(
      application.resumes,
      application.jobs,
      history,
      message
    );

    res.json({ reply });
  } catch (err) {
    next(err);
  }
}

// Candidate: get their own applications with pipeline status
async function getMyApplications(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id, match_score, status, created_at,
        jobs:job_id ( id, title, required_skills )
      `)
      .eq("candidate_id", req.user.id)
      .eq("applied", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // For each application, check if interview exists and get score
    const withInterviews = await Promise.all(
      data.map(async (app) => {
        const { data: interviewRows } = await supabase
          .from("interviews")
          .select("overall_score, recommendation, technical_score, communication_score")
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

module.exports = { updateStatus, getCandidateDetail, getResumeAnalysis, chatWithResume, getMyApplications };
