# HireEZ AI

An AI-powered recruitment platform: candidates upload resumes and apply to jobs, recruiters get AI-ranked candidates, and shortlisted candidates take a fully automatic AI video interview that is scored without human grading.

## Architecture

```
React (Vite) frontend  ──HTTP (Axios + JWT)──►  Express.js backend
                                                       │
                          ┌────────────────────┬──────┴──────┬────────────────────┐
                          ▼                    ▼             ▼
                  Supabase (Postgres      Groq API      HuggingFace
                  + pgvector)             - LLM (Llama   Inference API
                  profiles / resumes /      3.3 70B) for - sentence-transformers/
                  jobs / applications /     all AI agents  all-mpnet-base-v2 for
                  interviews              - Whisper for    resume/job embeddings
                                             speech-to-text  (768-dim)
```

**Backend layers** (`backend/`):
- `routes/` → `controllers/` → `services/` (AI agents) / `utils/` (DB, embeddings)
- `lib/aiClient.js` is the single AI client wrapper — every service calls through it, so swapping LLM/embedding providers never touches agent code.
- `middleware/` — JWT auth, role-based access control, centralized error handling.

**AI agents** (`backend/services/`), each with one job:
| Agent | Job |
|---|---|
| `resumeAgent` | Parses a resume PDF's text into structured JSON (name, skills, experience, education) |
| `jobAgent` | Extracts required skills, nice-to-have skills, seniority, responsibilities from a job description |
| `matchingAgent` | Turns a raw vector-similarity score into a human-readable match report (score, strengths, gaps, reasoning) |
| `interviewAgent` | Generates personalized interview questions using RAG (see below) |
| `evaluationAgent` | Scores a completed interview transcript (technical, communication, overall, recommendation) |
| `resumeAnalysisAgent` | Deep-dive resume analysis + a chatbot recruiters can ask questions to about a candidate |

**RAG (Retrieval-Augmented Generation):** before generating interview questions, the backend retrieves the candidate's actual parsed resume and the job's actual requirements from the database and injects them into the prompt — so questions reference real experience instead of being generic.

**Vector search:** resumes and jobs are embedded (via HuggingFace's free Inference API running `sentence-transformers/all-mpnet-base-v2`, 768 dimensions) and stored in `pgvector` columns. Matching uses cosine similarity (via a Postgres RPC function) to get a raw fit score, which the Matching Agent then explains in plain English — a candidate never just sees a bare percentage.

## Candidate Pipeline

```
pending → shortlisted → interviewed → approved
        ↘ rejected              ↘ final_rejected
```

- **Match**: candidate previews their fit score for a job privately — not visible to the recruiter yet.
- **Apply**: candidate explicitly applies — only now does the recruiter see them in their rankings.
- **Shortlist**: recruiter invites the candidate to interview, unlocking the "Start Interview" button.
- **Interview → Evaluate**: AI conducts and scores the interview automatically.
- **Approve / Reject**: recruiter makes the final call, with full AI scoring and transcripts to back the decision.

## Features

- **JWT authentication** with two roles (candidate / recruiter), enforced via middleware.
- **AI resume parsing** — upload a PDF, get structured data and a skills list automatically.
- **AI job posting** — write a description, get required skills, seniority, and responsibilities extracted automatically. Recruiters can also define custom interview rounds (topic + question count per round).
- **Explainable AI matching** — vector similarity search backed by a human-readable explanation, never a bare score.
- **Fully automatic AI video interview** — the interviewer asks questions aloud (speech synthesis), records the candidate's answer for a fixed window, and transcribes it server-side via Groq's Whisper API (more reliable than browser-based live transcription).
- **AI evaluation** — every interview is scored per round and overall, with a hire/no-hire recommendation and explanation, fully automatically — no human grading needed.
- **Recruiter dashboard** — candidates grouped by pipeline stage, with one-click invite/reject/approve actions.
- **Candidate detail view** — full resume breakdown, AI deep-analysis tab, interview transcript + scores, and a chatbot for asking questions about a candidate's resume.
- **Candidate dashboard** — live pipeline status and (once interviewed) score visibility, without exposing internal AI reasoning/feedback to the candidate.

## Setup

### 1. Supabase
- Create a project at supabase.com
- Run `backend/supabase_schema.sql` in the SQL editor
- Create a Storage bucket named `resumes` (set to public)
- Copy your project URL and service role key

### 2. Groq API key
- Get a free key at console.groq.com — used for both the LLM and Whisper transcription, no separate key needed.

### 3. HuggingFace API key
- Get a free token at huggingface.co/settings/tokens — when creating it, make sure **"Make calls to Inference Providers"** is checked, or embedding requests will fail with a 403. Used only for resume/job embeddings (`sentence-transformers/all-mpnet-base-v2`).

### 4. Backend
```bash
cd backend
# create a .env with PORT, JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY, HUGGINGFACE_API_KEY, FRONTEND_URL
npm install
npm run dev
```

### 5. Frontend
```bash
cd frontend
# create a .env with VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```
