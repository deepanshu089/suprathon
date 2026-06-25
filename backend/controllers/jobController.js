// Job Controller
// Recruiter creates a job → Job Agent extracts required skills → embedding stored.
// Candidates can list and view jobs.

const supabase = require("../utils/supabase");
const { analyzeJob } = require("../services/jobAgent");
const { generateEmbedding } = require("../utils/embeddings");

async function createJob(req, res, next) {
  try {
    const { title, description, interview_rounds } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    // Validate recruiter-defined interview rounds, if provided.
    // Each round needs a topic and a positive question count; cap count at 10
    // per round so the interview doesn't end up unreasonably long.
    let rounds = [];
    if (Array.isArray(interview_rounds)) {
      rounds = interview_rounds
        .filter((r) => r && r.topic && Number(r.count) > 0)
        .map((r) => ({ topic: String(r.topic).trim(), count: Math.min(Number(r.count), 10) }));
    }

    // Job Agent: extract structured requirements from job description
    const jobAnalysis = await analyzeJob(title, description);

    // Generate embedding from title + description for semantic matching
    const embedding = await generateEmbedding(`${title} ${description}`);

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        recruiter_id: req.user.id,
        title,
        description,
        required_skills: jobAnalysis.required_skills,
        nice_to_have: jobAnalysis.nice_to_have || [],
        seniority: jobAnalysis.seniority || null,
        responsibilities: jobAnalysis.responsibilities || [],
        embedding,
        interview_rounds: rounds,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Job created successfully",
      job: {
        id: job.id,
        title: job.title,
        required_skills: job.required_skills,
        nice_to_have: job.nice_to_have,
        seniority: job.seniority,
        responsibilities: job.responsibilities,
        interview_rounds: job.interview_rounds,
        analysis: jobAnalysis,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listJobs(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, description, required_skills, nice_to_have, seniority, responsibilities, interview_rounds, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, description, required_skills, nice_to_have, seniority, responsibilities, interview_rounds, created_at")
      .eq("id", req.params.id)
      .single();

    if (error) return res.status(404).json({ error: "Job not found" });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { createJob, listJobs, getJob };
