// JobList.jsx — candidate-facing "Available Jobs" browser.
// Flow per job: Match (private preview of fit) → Apply (recruiter can now see
// you) → if the recruiter shortlists you, a "Start Interview" button appears.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchResults, setMatchResults] = useState({}); // jobId -> match/application info
  const [matching, setMatching] = useState({}); // jobId -> is a match request in flight
  const [applying, setApplying] = useState({}); // jobId -> is an apply request in flight
  const [applied, setApplied] = useState({}); // jobId -> has the candidate applied
  const [expanded, setExpanded] = useState({}); // jobId -> is the "show more" panel open
  const navigate = useNavigate();

  // On load, fetch all jobs plus the candidate's existing applications, so
  // match/apply/shortlist state survives a page refresh instead of resetting.
  useEffect(() => {
    Promise.all([
      api.get("/jobs").then((res) => setJobs(res.data)),
      api.get("/applications/my").then((res) => {
        const results = {};
        const appliedMap = {};
        res.data.forEach((app) => {
          if (!app.jobs?.id) return;
          results[app.jobs.id] = {
            application_id: app.id,
            match_score: app.match_score,
            status: app.status,
          };
          appliedMap[app.jobs.id] = true;
        });
        setMatchResults((prev) => ({ ...results, ...prev }));
        setApplied((prev) => ({ ...appliedMap, ...prev }));
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  // Privately checks how well the candidate's resume fits this job.
  // This does NOT make the candidate visible to the recruiter yet.
  async function handleMatch(jobId) {
    setMatching((prev) => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.post(`/match/${jobId}`);
      setMatchResults((prev) => ({ ...prev, [jobId]: res.data }));
    } catch (err) {
      alert(err.response?.data?.error || "Match failed. Make sure you uploaded a resume.");
    } finally {
      setMatching((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  // Explicitly applies to the job — only after this does the recruiter see the candidate.
  async function handleApply(jobId) {
    if (!matchResults[jobId]) {
      alert("Please match your resume to this job first.");
      return;
    }
    setApplying((prev) => ({ ...prev, [jobId]: true }));
    try {
      await api.post(`/match/${jobId}/apply`);
      setApplied((prev) => ({ ...prev, [jobId]: true }));
    } catch (err) {
      alert(err.response?.data?.error || "Apply failed.");
    } finally {
      setApplying((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  // Navigates to the video interview page for this job's application.
  // Only reachable once the recruiter has shortlisted the candidate (see render below).
  async function handleInterview(jobId) {
    const matchData = matchResults[jobId];
    if (!matchData) {
      alert("Please match your resume to this job first.");
      return;
    }
    navigate(`/candidate/interview/${matchData.application_id}`);
  }

  if (loading) return <div><Navbar /><p style={{ padding: "24px" }}>Loading jobs...</p></div>;

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 24px" }}>
        <h2>Available Jobs</h2>
        {jobs.length === 0 && <p>No jobs posted yet.</p>}

        {jobs.map((job) => (
          <div key={job.id} style={{ border: "1px solid #000", padding: "16px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 8px" }}>{job.title}</h3>
            <p style={{ color: "#555", margin: "0 0 8px" }}>
              {job.description.substring(0, 150)}
              {job.description.length > 150 ? "..." : ""}
            </p>
            <p><strong>Required Skills:</strong> {job.required_skills?.join(", ")}</p>

            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, fontSize: "13px", marginBottom: "8px", textDecoration: "underline" }}
            >
              {expanded[job.id] ? "▲ Show less" : "▼ Show more details"}
            </button>

            {expanded[job.id] && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginBottom: "8px" }}>
                <p style={{ color: "#555", margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{job.description}</p>
                {job.nice_to_have?.length > 0 && (
                  <p><strong>Nice-to-Have Skills:</strong> {job.nice_to_have.join(", ")}</p>
                )}
                {job.seniority && (
                  <p><strong>Seniority Level:</strong> {job.seniority}</p>
                )}
                {job.responsibilities?.length > 0 && (
                  <div>
                    <p style={{ marginBottom: "4px" }}><strong>Responsibilities:</strong></p>
                    <ul style={{ marginTop: 0 }}>
                      {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {job.interview_rounds?.length > 0 ? (
                  <p><strong>Interview Rounds:</strong> {job.interview_rounds.map((r) => `${r.topic} (${r.count})`).join(", ")}</p>
                ) : (
                  <p><strong>Interview Rounds:</strong> Default (Resume, Job Role, Technical, Behavioural)</p>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button className="btn-primary" onClick={() => handleMatch(job.id)} disabled={matching[job.id]}>
                {matching[job.id] ? "Matching..." : "Match My Resume"}
              </button>
              {matchResults[job.id] && !applied[job.id] && (
                <button className="btn-secondary" onClick={() => handleApply(job.id)} disabled={applying[job.id]}>
                  {applying[job.id] ? "Applying..." : "Apply"}
                </button>
              )}
              {applied[job.id] && (
                <span style={{ color: "#16a34a", fontWeight: "bold", fontSize: "13px", alignSelf: "center" }}>✓ Applied</span>
              )}
              {matchResults[job.id]?.status === "shortlisted" && (
                <button className="btn-secondary" onClick={() => handleInterview(job.id)}>
                  Start Interview
                </button>
              )}
            </div>

            {applied[job.id] && matchResults[job.id]?.status === "pending" && (
              <p style={{ fontSize: "12px", color: "#b45309", marginTop: "8px" }}>
                Waiting for recruiter to review your application and invite you to interview.
              </p>
            )}

            {/* Show match result inline */}
            {matchResults[job.id] && (
              <div style={{ marginTop: "16px", background: "#f9f9f9", border: "1px solid #ccc", padding: "12px" }}>
                <p><strong>Match Score:</strong> {matchResults[job.id].match_score}%</p>
                <p><strong>Strengths:</strong> {matchResults[job.id].strengths?.join(", ")}</p>
                <p><strong>Missing Skills:</strong> {matchResults[job.id].missing_skills?.join(", ") || "None"}</p>
                <p><strong>Reason:</strong> {matchResults[job.id].reason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
