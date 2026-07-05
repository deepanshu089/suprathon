// Signup.jsx — registration form; lets the user pick candidate vs recruiter role
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", { username, password, role });
      login(res.data.token, res.data.user);
      if (role === "recruiter") navigate("/recruiter/dashboard");
      else navigate("/candidate/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#555",
    marginBottom: "6px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f5",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "#2563eb",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "17px",
          }}>
            H
          </div>
          <span style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "0.3px" }}>HireEZ AI</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid #000", padding: "32px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>Create your account</h2>
          <p style={{ margin: "0 0 24px", color: "#555", fontSize: "14px" }}>Get started in a few seconds.</p>

          {error && (
            <div style={{ border: "1px solid #dc2626", background: "#fef2f2", color: "#dc2626", padding: "10px 12px", marginBottom: "18px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>I am a</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "candidate", label: "Candidate" },
                  { value: "recruiter", label: "Recruiter" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight: role === opt.value ? "bold" : "normal",
                      background: role === opt.value ? "#2563eb" : "#fff",
                      color: role === opt.value ? "#fff" : "#000",
                      border: `1px solid ${role === opt.value ? "#2563eb" : "#000"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" style={{ width: "100%", padding: "10px 16px", fontSize: "15px" }} disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#555" }}>
          Already have an account? <Link to="/login" style={{ color: "#2563eb", fontWeight: "bold" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
