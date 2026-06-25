// RecruiterDashboard.jsx
// Shows all jobs with candidates organized by pipeline stage.
// Pipeline: pending → shortlisted/rejected → interviewed → approved/final_rejected

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const STATUS_LABEL = {
  pending: "Pending Review",
  shortlisted: "Interview Invited",
  rejected: "Rejected",
  interviewed: "Interview Done",
  approved: "Approved",
  final_rejected: "Not Selected",
};

const STATUS_COLOR = {
  pending: "#555",
  shortlisted: "#2563eb",
  rejected: "#dc2626",
  interviewed: "#b45309",
  approved: "#16a34a",
  final_rejected: "#dc2626",
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [rankings, setRankings] = useState({});
  const [loadingRankings, setLoadingRankings] = useState({});
  const [activeJob, setActiveJob] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    api.get("/jobs").then((res) => setJobs(res.data));
  }, []);

  // Toggles the candidates panel for a job open/closed, fetching rankings
  // from the server the first time it's opened (or every time it's re-opened).
  async function loadCandidates(jobId) {
    if (activeJob === jobId) { setActiveJob(null); return; }
    setActiveJob(jobId);
    setLoadingRankings((p) => ({ ...p, [jobId]: true }));
    try {
      const res = await api.get(`/match/rankings/${jobId}`);
      setRankings((p) => ({ ...p, [jobId]: res.data }));
    } catch { alert("Failed to load candidates"); }
    finally { setLoadingRankings((p) => ({ ...p, [jobId]: false })); }
  }

  // Moves one candidate's application to a new pipeline status, then
  // refreshes the rankings list so the UI reflects the change immediately.
  async function handleStatusChange(appId, jobId, newStatus) {
    setUpdatingStatus((p) => ({ ...p, [appId]: true }));
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
      // Refresh rankings for this job
      const res = await api.get(`/match/rankings/${jobId}`);
      setRankings((p) => ({ ...p, [jobId]: res.data }));
    } catch { alert("Failed to update status"); }
    finally { setUpdatingStatus((p) => ({ ...p, [appId]: false })); }
  }

  // Splits the flat candidates list into buckets by pipeline stage so the
  // UI can render a separate table for each stage.
  function groupByStatus(candidates) {
    return {
      pending: candidates.filter((c) => c.status === "pending"),
      shortlisted: candidates.filter((c) => c.status === "shortlisted"),
      rejected: candidates.filter((c) => c.status === "rejected"),
      interviewed: candidates.filter((c) => c.status === "interviewed"),
      approved: candidates.filter((c) => c.status === "approved"),
      final_rejected: candidates.filter((c) => c.status === "final_rejected"),
    };
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "32px auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0 }}>Recruiter Dashboard</h2>
            <p style={{ margin: "4px 0 0", color: "#555" }}>Welcome, {user?.username}</p>
          </div>
          <Link to="/recruiter/jobs/new">
            <button className="btn-primary">+ Post New Job</button>
          </Link>
        </div>

        {/* Jobs list */}
        {jobs.length === 0 && (
          <p>No jobs posted yet. <Link to="/recruiter/jobs/new">Post your first job</Link></p>
        )}

        {jobs.map((job) => {
          const candidates = rankings[job.id] || [];
          const grouped = groupByStatus(candidates);
          const isOpen = activeJob === job.id;

          return (
            <div key={job.id} style={{ border: "1px solid #000", marginBottom: "20px" }}>
              {/* Job header */}
              <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: isOpen ? "1px solid #000" : "none" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px" }}>{job.title}</h3>
                  <p style={{ margin: "0 0 8px", color: "#555", fontSize: "13px" }}>{job.description.substring(0, 120)}...</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {job.required_skills?.map((s, i) => (
                      <span key={i} style={{ border: "1px solid #000", padding: "2px 8px", fontSize: "12px" }}>{s}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ whiteSpace: "nowrap", marginLeft: "16px" }}
                  onClick={() => loadCandidates(job.id)}
                  disabled={loadingRankings[job.id]}
                >
                  {loadingRankings[job.id] ? "Loading..." : isOpen ? "Hide Candidates" : "View Candidates"}
                </button>
              </div>

              {/* Candidates panel */}
              {isOpen && (
                <div style={{ padding: "16px" }}>

                  {candidates.length === 0 && <p style={{ color: "#555" }}>No candidates have applied yet.</p>}

                  {/* Stage 1: Pending Review */}
                  {grouped.pending.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ margin: "0 0 12px", borderBottom: "2px solid #000", paddingBottom: "6px" }}>
                        Stage 1 — Resume Review ({grouped.pending.length} candidates)
                      </h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Candidate</th>
                            <th>Match Score</th>
                            <th>Strengths</th>
                            <th>Missing Skills</th>
                            <th>AI Reason</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grouped.pending.map((app, idx) => (
                            <tr key={app.id}>
                              <td>#{idx + 1}</td>
                              <td>
                                <button
                                  style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                                  onClick={() => navigate(`/recruiter/candidate/${app.id}`)}
                                >
                                  {app.profiles?.username}
                                </button>
                              </td>
                              <td><strong style={{ color: app.match_score >= 70 ? "#16a34a" : app.match_score >= 50 ? "#b45309" : "#dc2626" }}>{app.match_score}%</strong></td>
                              <td style={{ fontSize: "13px" }}>{app.strengths?.slice(0, 3).join(", ")}</td>
                              <td style={{ fontSize: "13px", color: "#dc2626" }}>{app.missing_skills?.slice(0, 3).join(", ") || "None"}</td>
                              <td style={{ fontSize: "12px", color: "#555", maxWidth: "200px" }}>{app.match_reason?.substring(0, 80)}...</td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    className="btn-primary"
                                    style={{ fontSize: "12px", padding: "4px 10px" }}
                                    disabled={updatingStatus[app.id]}
                                    onClick={() => handleStatusChange(app.id, job.id, "shortlisted")}
                                  >
                                    Invite
                                  </button>
                                  <button
                                    style={{ fontSize: "12px", padding: "4px 10px", background: "#dc2626", color: "white", border: "1px solid #dc2626", cursor: "pointer" }}
                                    disabled={updatingStatus[app.id]}
                                    onClick={() => handleStatusChange(app.id, job.id, "rejected")}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Stage 2: Invited for Interview */}
                  {grouped.shortlisted.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ margin: "0 0 12px", borderBottom: "2px solid #2563eb", paddingBottom: "6px", color: "#2563eb" }}>
                        Stage 2 — Interview Invited ({grouped.shortlisted.length} candidates)
                      </h4>
                      <table>
                        <thead>
                          <tr><th>Candidate</th><th>Match Score</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {grouped.shortlisted.map((app) => (
                            <tr key={app.id}>
                              <td>
                                <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, textDecoration: "underline" }} onClick={() => navigate(`/recruiter/candidate/${app.id}`)}>
                                  {app.profiles?.username}
                                </button>
                              </td>
                              <td><strong>{app.match_score}%</strong></td>
                              <td style={{ color: "#2563eb" }}>Waiting for interview</td>
                              <td>
                                <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => navigate(`/recruiter/candidate/${app.id}`)}>
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Stage 3: Interview Completed */}
                  {grouped.interviewed.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ margin: "0 0 12px", borderBottom: "2px solid #b45309", paddingBottom: "6px", color: "#b45309" }}>
                        Stage 3 — Interview Completed ({grouped.interviewed.length} candidates)
                      </h4>
                      <table>
                        <thead>
                          <tr><th>Candidate</th><th>Match Score</th><th>Technical</th><th>Communication</th><th>Overall</th><th>AI Recommendation</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {grouped.interviewed.map((app) => (
                            <tr key={app.id}>
                              <td>
                                <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, textDecoration: "underline" }} onClick={() => navigate(`/recruiter/candidate/${app.id}`)}>
                                  {app.profiles?.username}
                                </button>
                              </td>
                              <td><strong>{app.match_score}%</strong></td>
                              <td>{app.interview?.technical_score ?? "—"}</td>
                              <td>{app.interview?.communication_score ?? "—"}</td>
                              <td>{app.interview?.overall_score ?? "—"}</td>
                              <td style={{ fontSize: "12px" }}>{app.interview?.recommendation ?? "—"}</td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    className="btn-primary"
                                    style={{ fontSize: "12px", padding: "4px 10px", background: "#16a34a", borderColor: "#16a34a" }}
                                    disabled={updatingStatus[app.id]}
                                    onClick={() => handleStatusChange(app.id, job.id, "approved")}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    style={{ fontSize: "12px", padding: "4px 10px", background: "#dc2626", color: "white", border: "1px solid #dc2626", cursor: "pointer" }}
                                    disabled={updatingStatus[app.id]}
                                    onClick={() => handleStatusChange(app.id, job.id, "final_rejected")}
                                  >
                                    Reject
                                  </button>
                                  <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => navigate(`/recruiter/candidate/${app.id}`)}>
                                    Full Report
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Final Decisions */}
                  {(grouped.approved.length > 0 || grouped.final_rejected.length > 0 || grouped.rejected.length > 0) && (
                    <div>
                      <h4 style={{ margin: "0 0 12px", borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>Final Decisions</h4>
                      <table>
                        <thead><tr><th>Candidate</th><th>Match Score</th><th>Decision</th><th></th></tr></thead>
                        <tbody>
                          {[...grouped.approved, ...grouped.rejected, ...grouped.final_rejected].map((app) => (
                            <tr key={app.id}>
                              <td>{app.profiles?.username}</td>
                              <td>{app.match_score}%</td>
                              <td style={{ color: STATUS_COLOR[app.status], fontWeight: "bold" }}>{STATUS_LABEL[app.status]}</td>
                              <td>
                                <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => navigate(`/recruiter/candidate/${app.id}`)}>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
