// JobCreate.jsx — recruiter posts a new job and optionally customizes the
// interview round structure (topic + question count per round). The backend's
// Job Agent extracts skills/seniority/responsibilities automatically from the
// description, which we display once the job is created.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";

const ROUND_PRESETS = ["DSA", "SDE", "UI/UX", "Payments", "Behavioural", "Product Design", "Technical", "Aptitude", "System Design"];

export default function JobCreate() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rounds, setRounds] = useState([{ topic: "", count: 2 }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function addRound() {
    setRounds([...rounds, { topic: "", count: 2 }]);
  }

  function removeRound(idx) {
    setRounds(rounds.filter((_, i) => i !== idx));
  }

  // Updates a single round's topic or question count, keeping the rest of the array untouched
  function updateRound(idx, field, value) {
    setRounds(rounds.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  const totalQuestions = rounds.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Drop any blank/incomplete rounds before sending — backend falls back
      // to its default round structure if this array ends up empty.
      const interview_rounds = rounds.filter((r) => r.topic.trim() && Number(r.count) > 0);
      const res = await api.post("/jobs", { title, description, interview_rounds });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 24px" }}>
        <h2>Post a New Job</h2>
        <p style={{ color: "#555" }}>AI will automatically extract required skills from your description.</p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label>Job Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label>Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Describe the role, responsibilities, and requirements..."
              required
            />
          </div>
          <div style={{ marginBottom: "16px", border: "1px solid #000", padding: "16px" }}>
            <label style={{ fontWeight: "bold" }}>Interview Rounds</label>
            <p style={{ color: "#555", fontSize: "13px", margin: "4px 0 12px" }}>
              Define each round's topic and how many questions the AI should ask. Leave blank to use the default
              (Resume, Job Role, Technical, Behavioural).
            </p>

            {rounds.map((round, idx) => (
              <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                <input
                  list="round-presets"
                  placeholder="e.g. DSA, Behavioural, Payments..."
                  value={round.topic}
                  onChange={(e) => updateRound(idx, "topic", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={round.count}
                  onChange={(e) => updateRound(idx, "count", e.target.value)}
                  style={{ width: "70px" }}
                />
                <span style={{ fontSize: "12px", color: "#555" }}>questions</span>
                <button
                  type="button"
                  onClick={() => removeRound(idx)}
                  style={{ background: "none", border: "1px solid #dc2626", color: "#dc2626", cursor: "pointer", padding: "4px 10px", fontSize: "12px" }}
                >
                  Remove
                </button>
              </div>
            ))}

            <datalist id="round-presets">
              {ROUND_PRESETS.map((p) => <option key={p} value={p} />)}
            </datalist>

            <button type="button" className="btn-secondary" style={{ fontSize: "13px", marginTop: "4px" }} onClick={addRound}>
              + Add Round
            </button>

            {totalQuestions > 0 && (
              <p style={{ fontSize: "13px", color: "#2563eb", marginTop: "12px", marginBottom: 0 }}>
                Total: {rounds.filter((r) => r.topic.trim()).length} round(s), {totalQuestions} question(s)
              </p>
            )}
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating job (AI extracting skills)..." : "Create Job"}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: "32px", border: "1px solid #000", padding: "16px" }}>
            <h3>Job Created Successfully</h3>
            <p><strong>Title:</strong> {result.job.title}</p>
            <p><strong>AI-Extracted Required Skills:</strong> {result.job.required_skills?.join(", ")}</p>
            {result.job.analysis?.nice_to_have?.length > 0 && (
              <p><strong>AI-Extracted Nice-to-Have Skills:</strong> {result.job.analysis.nice_to_have.join(", ")}</p>
            )}
            {result.job.analysis?.seniority && (
              <p><strong>AI-Assessed Seniority Level:</strong> {result.job.analysis.seniority}</p>
            )}
            {result.job.analysis?.responsibilities?.length > 0 && (
              <div>
                <p style={{ marginBottom: "6px" }}><strong>AI-Extracted Responsibilities:</strong></p>
                <ul style={{ marginTop: 0 }}>
                  {result.job.analysis.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {result.job.interview_rounds?.length > 0 ? (
              <p><strong>Interview Rounds:</strong> {result.job.interview_rounds.map((r) => `${r.topic} (${r.count})`).join(", ")}</p>
            ) : (
              <p><strong>Interview Rounds:</strong> Default (Resume, Job Role, Technical, Behavioural)</p>
            )}
            <button className="btn-secondary" style={{ marginTop: "12px" }} onClick={() => navigate("/recruiter/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
