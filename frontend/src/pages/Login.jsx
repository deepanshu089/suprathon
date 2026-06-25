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

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "24px", border: "1px solid #000" }}>
      <h2 style={{ marginBottom: "24px" }}>Login — HireEZ AI</h2>
      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: "16px" }}>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}
