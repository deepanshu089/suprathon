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

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "24px", border: "1px solid #000" }}>
      <h2 style={{ marginBottom: "24px" }}>Sign Up — HireEZ AI</h2>
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
        <div style={{ marginBottom: "16px" }}>
          <label>I am a</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>
        <button className="btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      <p style={{ marginTop: "16px" }}>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
