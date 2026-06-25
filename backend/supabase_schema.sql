-- HireEZ AI — Supabase Database Schema
-- Run this in your Supabase SQL editor to set up the database.

-- Step 1: Enable pgvector extension for storing AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: User profiles table
-- We manage auth ourselves (JWT + bcrypt), so this is a standalone table.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'candidate')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Resumes table
-- embedding is a 768-dimension vector (matches Gemini text-embedding-004 output size)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  raw_text TEXT,
  parsed_data JSONB,        -- AI-extracted: {name, email, experience[], education[]}
  extracted_skills JSONB,   -- ["React", "Node.js", "Python"]
  embedding VECTOR(768),    -- semantic vector for similarity search
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills JSONB,    -- AI-extracted required skills
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 5: Applications table
-- Links candidates to jobs with AI-generated match analysis
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id),
  match_score FLOAT,
  strengths JSONB,
  missing_skills JSONB,
  match_reason TEXT,        -- AI explanation of the score
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, candidate_id)  -- one application per candidate per job
);

-- Step 6: Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  questions JSONB,           -- [{id, question, type, topic}]
  transcripts JSONB,         -- [{question_id, question, answer, follow_up, type}]
  communication_score INT,
  technical_score INT,
  overall_score INT,
  recommendation TEXT,       -- "Strong Hire" | "Hire" | "Consider" | "No Hire"
  score_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 7: Vector similarity indexes using HNSW algorithm
-- HNSW = Hierarchical Navigable Small World — fast approximate nearest neighbor search
-- vector_cosine_ops = use cosine distance (best for text embeddings)
CREATE INDEX IF NOT EXISTS resumes_embedding_idx ON resumes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON jobs USING hnsw (embedding vector_cosine_ops);

-- Step 8: Helper function for cosine similarity between two vectors
-- Used in matchController.js via supabase.rpc("cosine_similarity", ...)
-- Returns a value between 0 (unrelated) and 1 (identical)
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 VECTOR, vec2 VECTOR)
RETURNS FLOAT AS $$
  SELECT 1 - (vec1 <=> vec2);
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- Step 9: Supabase Storage bucket for resume PDFs
-- Run this manually in Supabase dashboard: Storage → New Bucket → "resumes" → Public
-- Or use the Supabase JS client to create it programmatically.

-- Step 10: Interview Rounds feature
-- Recruiter defines custom rounds per job, e.g. [{ "topic": "DSA", "count": 3 }, { "topic": "Behavioural", "count": 2 }]
-- If empty, the Interview Agent falls back to the default 6-question format.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_rounds JSONB DEFAULT '[]'::jsonb;

-- Per-round scores saved alongside the existing overall scores
-- [{ "round": "DSA", "score": 72, "feedback": "..." }, ...]
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS round_scores JSONB;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS rounds JSONB; -- snapshot of the round config used for this interview

-- Step 11: Job analysis details (persist full Job Agent output, not just required_skills)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS nice_to_have JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seniority TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities JSONB;

-- Step 12: Apply flow — matching a resume to a job no longer makes a candidate visible
-- to the recruiter. Only an explicit "Apply" action sets applied = true, and only
-- applied applications show up in recruiter rankings.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applied BOOLEAN DEFAULT false;
