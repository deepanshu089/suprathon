// CandidateDetail.jsx — Full candidate profile for recruiter
// Shows: resume analysis, match breakdown, interview transcript + scores, chatbot, approve/reject

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";

const STATUS_COLOR = {
  pending: "#555", shortlisted: "#2563eb", rejected: "#dc2626",
  interviewed: "#b45309", approved: "#16a34a", final_rejected: "#dc2626",
};
const STATUS_LABEL = {
  pending: "Pending Review", shortlisted: "Interview Invited", rejected: "Rejected",
  interviewed: "Interview Done", approved: "Approved", final_rejected: "Not Selected",
};

// Lightweight markdown rendering for chat replies: **bold** + numbered points on their own line
function renderBold(line, keyPrefix) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      : <span key={`${keyPrefix}-${i}`}>{part}</span>
  );
}

function formatChatMessage(text) {
  const withBreaks = text.replace(/\s*(\d+)\.\s+\*\*/g, "\n$1. **");
  const lines = withBreaks.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, i) => (
    <p key={i} style={{ margin: i === 0 ? "0 0 8px" : "8px 0 0" }}>
      {renderBold(line, i)}
    </p>
  ));
}

export default function CandidateDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get(`/applications/${applicationId}/detail`)
      .then((res) => setData(res.data))
      .catch(() => navigate("/recruiter/dashboard"));
  }, [applicationId]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Lazily fetches the deep AI analysis the first time the tab is opened,
  // then just switches tabs on subsequent clicks (no re-fetch needed).
  async function loadAnalysis() {
    if (analysis) { setActiveTab("analysis"); return; }
    setLoadingAnalysis(true);
    setActiveTab("analysis");
    try {
      const res = await api.get(`/applications/${applicationId}/analysis`);
      setAnalysis(res.data);
    } catch { alert("Failed to generate analysis"); }
    finally { setLoadingAnalysis(false); }
  }

  // Sends one chat message to the AI and appends both the user's message
  // and the AI's reply to the conversation history shown in the chat tab.
  async function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const res = await api.post(`/applications/${applicationId}/chat`, {
        message: msg,
        history: chatHistory,
      });
      setChatHistory([...newHistory, { role: "ai", content: res.data.reply }]);
    } catch { setChatHistory([...newHistory, { role: "ai", content: "Error getting response." }]); }
    finally { setChatLoading(false); }
  }

  // Recruiter action: moves the application to a new pipeline stage
  // (e.g. "shortlisted", "rejected", "approved", "final_rejected").
  async function updateStatus(status) {
    setUpdating(true);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      setData((prev) => ({ ...prev, application: { ...prev.application, status } }));
    } catch { alert("Failed to update status"); }
    finally { setUpdating(false); }
  }

  if (!data) return <div><Navbar /><p style={{ padding: "24px" }}>Loading candidate profile...</p></div>;

  const { application, interview } = data;
  const resume = application.resumes;
  const job = application.jobs;
  const candidate = application.profiles;

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "1000px", margin: "32px auto", padding: "0 24px" }}>

        {/* Top header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", padding: 0, marginBottom: "8px", fontSize: "13px" }} onClick={() => navigate("/recruiter/dashboard")}>
              ← Back to Dashboard
            </button>
            <h2 style={{ margin: "0 0 4px" }}>{candidate?.username}</h2>
            <p style={{ margin: "0 0 4px", color: "#555" }}>Applied for: <strong>{job?.title}</strong></p>
            <span style={{ color: STATUS_COLOR[application.status], fontWeight: "bold", fontSize: "14px" }}>
              ● {STATUS_LABEL[application.status]}
            </span>
          </div>

          {/* Action buttons based on status */}
          <div style={{ display: "flex", gap: "8px", flexDirection: "column", alignItems: "flex-end" }}>
            {application.status === "pending" && (
              <>
                <button className="btn-primary" disabled={updating} onClick={() => updateStatus("shortlisted")}>
                  ✓ Invite for Interview
                </button>
                <button style={{ background: "#dc2626", color: "white", border: "1px solid #dc2626", padding: "8px 16px", cursor: "pointer" }} disabled={updating} onClick={() => updateStatus("rejected")}>
                  ✗ Reject at this Stage
                </button>
              </>
            )}
            {application.status === "interviewed" && (
              <>
                <button style={{ background: "#16a34a", color: "white", border: "1px solid #16a34a", padding: "8px 16px", cursor: "pointer" }} disabled={updating} onClick={() => updateStatus("approved")}>
                  ✓ Approve — Final Selection
                </button>
                <button style={{ background: "#dc2626", color: "white", border: "1px solid #dc2626", padding: "8px 16px", cursor: "pointer" }} disabled={updating} onClick={() => updateStatus("final_rejected")}>
                  ✗ Reject — Not Selected
                </button>
              </>
            )}
          </div>
        </div>

        {/* Match score bar */}
        <div style={{ border: "1px solid #000", padding: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <strong>Resume Match Score</strong>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: application.match_score >= 70 ? "#16a34a" : application.match_score >= 50 ? "#b45309" : "#dc2626" }}>
              {application.match_score}%
            </span>
          </div>
          <div style={{ height: "12px", background: "#e5e7eb", border: "1px solid #ccc" }}>
            <div style={{ height: "100%", width: `${application.match_score}%`, background: application.match_score >= 70 ? "#16a34a" : application.match_score >= 50 ? "#b45309" : "#dc2626" }} />
          </div>
          <div style={{ display: "flex", gap: "24px", marginTop: "12px", fontSize: "13px" }}>
            <div>
              <strong>Strengths:</strong>{" "}
              <span style={{ color: "#16a34a" }}>{application.strengths?.join(", ") || "—"}</span>
            </div>
            <div>
              <strong>Missing:</strong>{" "}
              <span style={{ color: "#dc2626" }}>{application.missing_skills?.join(", ") || "None"}</span>
            </div>
          </div>
          {application.match_reason && (
            <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#333", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <strong>AI Reasoning:</strong> {application.match_reason}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid #000" }}>
          {[
            { key: "overview", label: "Resume Overview" },
            { key: "analysis", label: "AI Deep Analysis" },
            { key: "interview", label: "Interview Report" },
            { key: "chat", label: "Ask AI about Candidate" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => tab.key === "analysis" ? loadAnalysis() : setActiveTab(tab.key)}
              style={{
                padding: "10px 20px", border: "none", cursor: "pointer",
                borderBottom: activeTab === tab.key ? "3px solid #2563eb" : "3px solid transparent",
                fontWeight: activeTab === tab.key ? "bold" : "normal",
                background: "white", fontSize: "14px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Resume Overview */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: "20px" }}>
              {/* Left: Parsed info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: 0 }}>Candidate Information</h3>
                <table>
                  <tbody>
                    <tr><td style={{ padding: "6px 16px 6px 0", fontWeight: "bold" }}>Name</td><td>{resume?.parsed_data?.name || "—"}</td></tr>
                    <tr><td style={{ padding: "6px 16px 6px 0", fontWeight: "bold" }}>Email</td><td>{resume?.parsed_data?.email || "—"}</td></tr>
                    <tr><td style={{ padding: "6px 16px 6px 0", fontWeight: "bold" }}>Phone</td><td>{resume?.parsed_data?.phone || "—"}</td></tr>
                    <tr><td style={{ padding: "6px 16px 6px 0", fontWeight: "bold" }}>Experience</td><td>{resume?.parsed_data?.total_years_experience || "—"} years</td></tr>
                  </tbody>
                </table>

                <h4 style={{ marginTop: "20px" }}>Technical Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {resume?.extracted_skills?.map((s, i) => (
                    <span key={i} style={{
                      border: `1px solid ${job?.required_skills?.includes(s) ? "#16a34a" : "#000"}`,
                      padding: "3px 10px", fontSize: "13px",
                      color: job?.required_skills?.includes(s) ? "#16a34a" : "#000",
                      fontWeight: job?.required_skills?.includes(s) ? "bold" : "normal",
                    }}>
                      {s} {job?.required_skills?.includes(s) ? "✓" : ""}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>
                  Green = matches job requirements
                </p>
              </div>

              {/* Right: Experience */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: 0 }}>Work Experience</h3>
                {resume?.parsed_data?.experience?.length > 0 ? (
                  resume.parsed_data.experience.map((exp, i) => (
                    <div key={i} style={{ border: "1px solid #ccc", padding: "12px", marginBottom: "10px" }}>
                      <p style={{ fontWeight: "bold", margin: "0 0 4px" }}>{exp.role}</p>
                      <p style={{ color: "#555", margin: "0 0 4px", fontSize: "13px" }}>{exp.company} — {exp.duration}</p>
                      <p style={{ margin: 0, fontSize: "13px" }}>{exp.description}</p>
                    </div>
                  ))
                ) : <p style={{ color: "#555" }}>No experience data extracted.</p>}

                <h4>Education</h4>
                {resume?.parsed_data?.education?.map((edu, i) => (
                  <div key={i} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "8px", fontSize: "13px" }}>
                    <strong>{edu.degree}</strong> — {edu.institution} ({edu.year})
                  </div>
                ))}

                {resume?.file_url && (
                  <a href={resume.file_url} target="_blank" rel="noreferrer">
                    <button className="btn-secondary" style={{ marginTop: "12px" }}>View Original PDF</button>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI Deep Analysis */}
        {activeTab === "analysis" && (
          <div>
            {loadingAnalysis && <p>Generating detailed AI analysis... (this takes ~10 seconds)</p>}
            {analysis && (
              <div>
                {/* Summary */}
                <div style={{ border: "2px solid #000", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Executive Summary</h3>
                    <span style={{ fontWeight: "bold", padding: "4px 12px", border: `2px solid ${analysis.overall_fit === "Strong Fit" ? "#16a34a" : analysis.overall_fit === "Good Fit" ? "#2563eb" : "#b45309"}`, color: analysis.overall_fit === "Strong Fit" ? "#16a34a" : analysis.overall_fit === "Good Fit" ? "#2563eb" : "#b45309" }}>
                      {analysis.overall_fit}
                    </span>
                  </div>
                  <p style={{ marginTop: "12px", marginBottom: 0, lineHeight: "1.6" }}>{analysis.summary}</p>
                </div>

                <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                  {/* Strengths */}
                  <div style={{ flex: 1, border: "1px solid #16a34a", padding: "14px" }}>
                    <h4 style={{ margin: "0 0 10px", color: "#16a34a" }}>Strengths</h4>
                    {analysis.strengths?.map((s, i) => (
                      <p key={i} style={{ margin: "0 0 6px", fontSize: "13px" }}>✓ {s}</p>
                    ))}
                  </div>
                  {/* Concerns */}
                  <div style={{ flex: 1, border: "1px solid #dc2626", padding: "14px" }}>
                    <h4 style={{ margin: "0 0 10px", color: "#dc2626" }}>Concerns</h4>
                    {analysis.concerns?.map((c, i) => (
                      <p key={i} style={{ margin: "0 0 6px", fontSize: "13px" }}>⚠ {c}</p>
                    ))}
                  </div>
                </div>

                {/* Skills breakdown */}
                <div style={{ border: "1px solid #000", padding: "14px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 12px" }}>Skills Breakdown</h4>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", color: "#16a34a", marginBottom: "8px" }}>Matched Skills</p>
                      {analysis.skills_breakdown?.matched_skills?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "6px", fontSize: "13px" }}>
                          <strong>{s.skill}</strong> — {s.evidence}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", color: "#dc2626", marginBottom: "8px" }}>Missing Critical Skills</p>
                      {analysis.skills_breakdown?.missing_critical?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "6px", fontSize: "13px", color: "#dc2626" }}>✗ {s}</div>
                      ))}
                      <p style={{ fontWeight: "bold", color: "#555", marginBottom: "8px", marginTop: "12px" }}>Bonus Skills</p>
                      {analysis.skills_breakdown?.bonus_skills?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "6px", fontSize: "13px" }}>+ {s}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Experience analysis */}
                <div style={{ border: "1px solid #000", padding: "14px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 8px" }}>Experience Analysis</h4>
                  <p style={{ fontSize: "13px", marginBottom: "8px" }}><strong>Total Experience:</strong> {analysis.experience_analysis?.total_years} years</p>
                  <p style={{ fontSize: "13px", marginBottom: "12px" }}>{analysis.experience_analysis?.relevant_experience}</p>
                  {analysis.experience_analysis?.notable_projects?.length > 0 && (
                    <>
                      <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "6px" }}>Notable Projects/Achievements:</p>
                      {analysis.experience_analysis.notable_projects.map((p, i) => (
                        <p key={i} style={{ fontSize: "13px", margin: "0 0 4px" }}>• {p}</p>
                      ))}
                    </>
                  )}
                </div>

                {/* Interview focus areas */}
                <div style={{ border: "1px solid #2563eb", padding: "14px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 10px", color: "#2563eb" }}>Suggested Interview Focus Areas</h4>
                  {analysis.interview_focus_areas?.map((area, i) => (
                    <p key={i} style={{ fontSize: "13px", margin: "0 0 6px" }}>→ {area}</p>
                  ))}
                </div>

                {/* Final recommendation */}
                <div style={{ border: "2px solid #000", padding: "16px" }}>
                  <h4 style={{ margin: "0 0 10px" }}>AI Recruiter Recommendation</h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{analysis.recruiter_recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Interview Report */}
        {activeTab === "interview" && (
          <div>
            {!interview ? (
              <p style={{ color: "#555" }}>
                {application.status === "shortlisted"
                  ? "Candidate has been invited but hasn't completed the interview yet."
                  : "No interview data available."}
              </p>
            ) : (
              <div>
                {/* Scores */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                  {[
                    { label: "Technical", value: interview.technical_score, color: "#2563eb" },
                    { label: "Communication", value: interview.communication_score, color: "#16a34a" },
                    { label: "Overall", value: interview.overall_score, color: "#000" },
                  ].map((s) => (
                    <div key={s.label} style={{ flex: 1, border: `2px solid ${s.color}`, padding: "16px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: s.color }}>{s.value}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#555" }}>/ 100</p>
                    </div>
                  ))}
                  <div style={{ flex: 1, border: "2px solid #000", padding: "16px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}>Recommendation</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: interview.recommendation === "Strong Hire" ? "#16a34a" : interview.recommendation === "No Hire" ? "#dc2626" : "#b45309" }}>
                      {interview.recommendation}
                    </p>
                  </div>
                </div>

                {/* AI Explanation */}
                {interview.score_explanation && (
                  <div style={{ border: "1px solid #ccc", padding: "14px", marginBottom: "20px", background: "#fafafa" }}>
                    <h4 style={{ margin: "0 0 8px" }}>AI Score Explanation</h4>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6" }}>{interview.score_explanation}</p>
                  </div>
                )}

                {/* Round-by-round breakdown */}
                {interview.round_scores?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 8px" }}>Round-by-Round Breakdown</h4>
                    <table>
                      <thead>
                        <tr><th>Round</th><th>Score</th><th>Feedback</th></tr>
                      </thead>
                      <tbody>
                        {interview.round_scores.map((r, i) => (
                          <tr key={i}>
                            <td><strong>{r.round}</strong></td>
                            <td>{r.score}/100</td>
                            <td style={{ fontSize: "13px" }}>{r.feedback}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Full transcript */}
                <h4>Interview Transcript</h4>
                {interview.transcripts?.map((t, i) => (
                  <div key={i} style={{ border: "1px solid #ccc", padding: "14px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "12px", color: "#555", margin: "0 0 6px", textTransform: "uppercase" }}>
                      Q{i + 1} [{t.round || t.type}]
                    </p>
                    <p style={{ fontWeight: "bold", margin: "0 0 8px" }}>Q: {t.question}</p>
                    <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#333" }}>A: {t.answer || "(No response)"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Resume Chatbot */}
        {activeTab === "chat" && (
          <div>
            <p style={{ color: "#555", marginTop: 0 }}>
              Ask the AI anything about this candidate's resume. It will answer based only on their actual resume data.
            </p>
            <p style={{ fontSize: "13px", color: "#555" }}>
              Example questions: "Does this candidate have team leadership experience?" • "How many years of React experience do they have?" • "Are they a good fit for a backend role?"
            </p>

            {/* Chat messages */}
            <div style={{ border: "1px solid #000", padding: "16px", height: "350px", overflowY: "auto", marginBottom: "12px", background: "#fafafa" }}>
              {chatHistory.length === 0 && (
                <p style={{ color: "#aaa", textAlign: "center", marginTop: "40px" }}>
                  Start a conversation about {candidate?.username}'s resume
                </p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ marginBottom: "12px", display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{
                    maxWidth: "75%", padding: "10px 14px", fontSize: "14px", lineHeight: "1.5",
                    background: msg.role === "user" ? "#2563eb" : "#fff",
                    color: msg.role === "user" ? "#fff" : "#000",
                    border: "1px solid " + (msg.role === "user" ? "#2563eb" : "#ccc"),
                  }}>
                    {msg.role === "ai" ? formatChatMessage(msg.content) : msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ color: "#555", fontSize: "13px" }}>AI is thinking...</div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendChat} style={{ display: "flex", gap: "8px" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about this candidate..."
                style={{ flex: 1 }}
                disabled={chatLoading}
              />
              <button className="btn-primary" type="submit" disabled={chatLoading || !chatInput.trim()}>
                Ask
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
