// CandidateDashboard.jsx — Shows candidate's application pipeline status

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const PIPELINE_STEPS = ["pending", "shortlisted", "interviewed", "approved"];

const STATUS_INFO = {
  pending: { label: "Under Review", color: "#555", desc: "Recruiter is reviewing your resume match score." },
  shortlisted: { label: "Interview Invited!", color: "#2563eb", desc: "You've been selected for a video interview. Go take it now!" },
  rejected: { label: "Not Selected", color: "#dc2626", desc: "Thank you for applying. The recruiter has moved forward with other candidates." },
  interviewed: { label: "Interview Complete", color: "#b45309", desc: "Your interview has been reviewed. Awaiting final recruiter decision." },
  approved: { label: "Selected!", color: "#16a34a", desc: "Congratulations! You have been selected for this position." },
  final_rejected: { label: "Not Selected", color: "#dc2626", desc: "Thank you for your time. The recruiter has selected other candidates." },
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/resume/me").catch(() => null),
      api.get("/applications/my").catch(() => []),
    ]).then(([resumeRes, appsRes]) => {
      setResume(resumeRes?.data || null);
      setApplications(appsRes?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // Renders the 4-step progress bar (Reviewed → Invited → Interviewed → Selected),
  // highlighting steps up to the application's current status.
  function PipelineBar({ status }) {
    if (status === "rejected" || status === "final_rejected") {
      return <div style={{ padding: "6px 12px", background: "#fee2e2", border: "1px solid #dc2626", color: "#dc2626", fontSize: "13px", display: "inline-block" }}>✗ Application Rejected</div>;
    }
    const steps = ["pending", "shortlisted", "interviewed", "approved"];
    const current = steps.indexOf(status);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div style={{
              padding: "4px 10px", fontSize: "12px", fontWeight: i <= current ? "bold" : "normal",
              background: i < current ? "#2563eb" : i === current ? "#000" : "#fff",
              color: i <= current ? "#fff" : "#aaa",
              border: "1px solid " + (i <= current ? (i < current ? "#2563eb" : "#000") : "#ccc"),
            }}>
              {["Reviewed", "Invited", "Interviewed", "Selected"][i]}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: "20px", height: "2px", background: i < current ? "#2563eb" : "#ccc" }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (loading) return <div><Navbar /><p style={{ padding: "24px" }}>Loading...</p></div>;

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "32px auto", padding: "0 24px" }}>
        <h2>Welcome, {user?.username}</h2>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <Link to="/candidate/resume">
            <button className={resume ? "btn-secondary" : "btn-primary"}>
              {resume ? "Update Resume" : "Upload Resume"}
            </button>
          </Link>
          <Link to="/candidate/jobs">
            <button className="btn-primary">Browse Jobs</button>
          </Link>
        </div>

        {/* Resume status */}
        {resume && (
          <div style={{ border: "1px solid #000", padding: "16px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px" }}>Your Resume</h3>
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 6px" }}><strong>Name:</strong> {resume.parsed_data?.name}</p>
                <p style={{ margin: "0 0 6px" }}><strong>Experience:</strong> {resume.parsed_data?.total_years_experience || "—"} years</p>
                <p style={{ margin: 0 }}><strong>Skills:</strong> {resume.extracted_skills?.join(", ")}</p>
              </div>
              <a href={resume.file_url} target="_blank" rel="noreferrer">
                <button className="btn-secondary" style={{ fontSize: "13px" }}>View PDF</button>
              </a>
            </div>
          </div>
        )}

        {/* Applications pipeline */}
        <h3>Your Applications</h3>
        {applications.length === 0 ? (
          <div style={{ border: "1px solid #ccc", padding: "24px", textAlign: "center", color: "#555" }}>
            <p style={{ margin: "0 0 12px" }}>No applications yet.</p>
            <Link to="/candidate/jobs"><button className="btn-primary">Browse Jobs & Apply</button></Link>
          </div>
        ) : (
          applications.map((app) => {
            const info = STATUS_INFO[app.status] || STATUS_INFO.pending;
            return (
              <div key={app.id} style={{ border: "1px solid #000", padding: "16px", marginBottom: "16px" }}>
                {/* Job title + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px" }}>{app.jobs?.title}</h4>
                    <span style={{ color: info.color, fontWeight: "bold", fontSize: "13px" }}>● {info.label}</span>
                  </div>
                  <span style={{ fontWeight: "bold", fontSize: "18px", color: app.match_score >= 70 ? "#16a34a" : app.match_score >= 50 ? "#b45309" : "#dc2626" }}>
                    {app.match_score}% match
                  </span>
                </div>

                {/* Pipeline bar */}
                <div style={{ marginBottom: "12px" }}>
                  <PipelineBar status={app.status} />
                </div>

                {/* Status message */}
                <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#555", padding: "8px", background: "#f9f9f9", border: "1px solid #eee" }}>
                  {info.desc}
                </p>

                {/* Action: take interview if invited */}
                {app.status === "shortlisted" && (
                  <button className="btn-primary" onClick={() => navigate(`/candidate/interview/${app.id}`)}>
                    Start Video Interview →
                  </button>
                )}

                {/* Show interview scores if done */}
                {app.interview && (app.status === "interviewed" || app.status === "approved" || app.status === "final_rejected") && (
                  <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "4px" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 8px", fontSize: "13px" }}>Your Interview Results</p>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ textAlign: "center", border: "1px solid #ccc", padding: "8px 16px" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>Technical</p>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px" }}>{app.interview.technical_score}</p>
                      </div>
                      <div style={{ textAlign: "center", border: "1px solid #ccc", padding: "8px 16px" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>Communication</p>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px" }}>{app.interview.communication_score}</p>
                      </div>
                      <div style={{ textAlign: "center", border: "1px solid #ccc", padding: "8px 16px" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>Overall</p>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px" }}>{app.interview.overall_score}</p>
                      </div>
                      <div style={{ textAlign: "center", border: "1px solid #ccc", padding: "8px 16px" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>Recommendation</p>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: "13px", color: app.interview.recommendation === "Strong Hire" ? "#16a34a" : "#b45309" }}>
                          {app.interview.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
