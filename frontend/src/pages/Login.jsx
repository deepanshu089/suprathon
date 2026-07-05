// Login.jsx — simple username/password form, redirects by role after success
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      login(res.data.token, res.data.user);
      // Each role has its own dashboard — send the user to the right one
      if (res.data.user.role === "recruiter") {
        navigate("/recruiter/dashboard");
      } else {
        navigate("/candidate/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
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
          <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>Welcome back</h2>
          <p style={{ margin: "0 0 24px", color: "#555", fontSize: "14px" }}>Log in to continue to your dashboard.</p>

          {error && (
            <div style={{ border: "1px solid #dc2626", background: "#fef2f2", color: "#dc2626", padding: "10px 12px", marginBottom: "18px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" style={{ width: "100%", padding: "10px 16px", fontSize: "15px" }} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#555" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#2563eb", fontWeight: "bold" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
