export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  score: number;
}

export interface Resume {
  id: string;
  candidate_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
  analysis?: ResumeAnalysis;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  skills: string[];
  experience: string[];
  education: string[];
  score: number;
  summary: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface BulkUploadResult {
  id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface ParsedResume {
  skills: string[];
  education: Education[];
  experience: Experience[];
  summary?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  start_date?: string;
  end_date?: string;
}

export interface Experience {
  company: string;
  position: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'recruiter';
  created_at: string;
}

export interface JobPosition {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}