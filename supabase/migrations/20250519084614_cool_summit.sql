/*
  # Initial Schema Setup for AI Recruitment Platform

  1. New Tables
    - `candidates` - Store candidate information
    - `resumes` - Store resume files and parsed data
    - `chat_messages` - Store conversation history
    - `job_positions` - Store job listings
    - `resume_analyses` - Store resume analysis results

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'new',
  score integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  parsed_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  sender text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create job_positions table
CREATE TABLE IF NOT EXISTS job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  requirements text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resume_analyses table
CREATE TABLE IF NOT EXISTS resume_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  candidate_name text NOT NULL,
  file_name text NOT NULL,
  job_description text NOT NULL,
  analysis_results jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add candidate_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resume_analyses' 
    AND column_name = 'candidate_id'
  ) THEN
    ALTER TABLE resume_analyses 
    ADD COLUMN candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read resumes"
  ON resumes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert resumes"
  ON resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read job positions"
  ON job_positions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert job positions"
  ON job_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update job positions"
  ON job_positions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read resume analyses"
  ON resume_analyses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert resume analyses"
  ON resume_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS candidates_status_idx ON candidates(status);
CREATE INDEX IF NOT EXISTS resumes_candidate_id_idx ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS job_positions_status_idx ON job_positions(status);
CREATE INDEX IF NOT EXISTS resume_analyses_candidate_id_idx ON resume_analyses(candidate_id);

-- Insert sample data for testing
INSERT INTO job_positions (title, description, requirements) 
VALUES (
  'Frontend Developer',
  'We are looking for a Frontend Developer to join our team and help build beautiful and responsive web applications.',
  ARRAY['React', 'JavaScript', 'CSS', 'HTML', '3+ years experience']
),
(
  'Backend Developer',
  'Seeking a skilled Backend Developer to design and implement scalable APIs and services.',
  ARRAY['Node.js', 'Express', 'SQL', 'NoSQL', 'RESTful API design', '3+ years experience']
),
(
  'Full Stack Developer',
  'We need a Full Stack Developer who can work on both frontend and backend aspects of our applications.',
  ARRAY['React', 'Node.js', 'Express', 'SQL', 'JavaScript', '4+ years experience']
);

-- Insert sample candidates
INSERT INTO candidates (name, email, phone, status, score)
VALUES 
('John Smith', 'john.smith@example.com', '(123) 456-7890', 'new', 85),
('Emily Johnson', 'emily.johnson@example.com', '(234) 567-8901', 'screening', 72),
('Michael Brown', 'michael.brown@example.com', '(345) 678-9012', 'shortlisted', 91),
('Sarah Davis', 'sarah.davis@example.com', '(456) 789-0123', 'rejected', 45),
('Robert Wilson', 'robert.wilson@example.com', '(567) 890-1234', 'new', 68);