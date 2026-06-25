// ResumeUpload.jsx — candidate uploads a PDF resume, which the backend
// parses with AI; this page shows the freshly parsed result (or, if no
// new upload has happened yet, whatever resume is already on file).
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../lib/api";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    // Load existing resume on mount
    api.get("/resume/me").then((res) => setExisting(res.data)).catch(() => {});
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setStatus("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setParsedData(res.data.resume.parsed_data);
      setStatus("Resume uploaded and parsed successfully.");
    } catch (err) {
      setStatus(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 24px" }}>
        <h2>Upload Resume</h2>
        <p style={{ color: "#555" }}>Upload your PDF resume. We'll automatically parse and extract your skills.</p>

        <form onSubmit={handleUpload} style={{ marginTop: "24px" }}>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
          <button className="btn-primary" type="submit" style={{ marginTop: "12px" }} disabled={loading}>
            {loading ? "Uploading and parsing..." : "Upload Resume"}
          </button>
        </form>

        {status && <p style={{ marginTop: "16px", color: status.includes("success") ? "green" : "red" }}>{status}</p>}

        {/* Show parsed result after upload */}
        {parsedData && (
          <div style={{ marginTop: "32px", border: "1px solid #000", padding: "16px" }}>
            <h3>Parsed Resume</h3>
            <p><strong>Name:</strong> {parsedData.name}</p>
            <p><strong>Email:</strong> {parsedData.email}</p>
            <p><strong>Skills:</strong> {parsedData.skills?.join(", ")}</p>
            <p><strong>Experience:</strong></p>
            <ul>
              {parsedData.experience?.map((exp, i) => (
                <li key={i}>{exp.role} at {exp.company} ({exp.duration})</li>
              ))}
            </ul>
          </div>
        )}

        {/* Show previously uploaded resume */}
        {!parsedData && existing && (
          <div style={{ marginTop: "32px", border: "1px solid #000", padding: "16px" }}>
            <h3>Current Resume</h3>
            <p><strong>Name:</strong> {existing.parsed_data?.name}</p>
            <p><strong>Skills:</strong> {existing.extracted_skills?.join(", ")}</p>
            <a href={existing.file_url} target="_blank" rel="noreferrer">View PDF</a>
          </div>
        )}
      </div>
    </div>
  );
}
