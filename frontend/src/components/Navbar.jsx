// Navbar — shown on every authenticated page.
// Shows different nav links depending on whether the logged-in user is a
// candidate or a recruiter, plus a logout button.
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkStyle = {
    color: "#000",
    textDecoration: "none",
    fontSize: "14px",
  };

  return (
    <nav style={{
      borderBottom: "2px solid #000",
      padding: "0 24px",
      height: "56px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "28px", height: "28px",
          background: "#2563eb",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: "14px",
        }}>
          H
        </div>
        <span style={{ fontWeight: "bold", fontSize: "17px", letterSpacing: "0.3px" }}>HireEZ AI</span>
      </div>

      <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
        {user?.role === "candidate" && (
          <>
            <Link to="/candidate/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/candidate/resume" style={linkStyle}>Resume</Link>
            <Link to="/candidate/jobs" style={linkStyle}>Jobs</Link>
          </>
        )}
        {user?.role === "recruiter" && (
          <>
            <Link to="/recruiter/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/recruiter/jobs/new" style={linkStyle}>Post Job</Link>
          </>
        )}

        <div style={{ width: "1px", height: "24px", background: "#ddd" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "26px", height: "26px",
            border: "1px solid #000",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "bold",
            background: "#f5f5f5",
          }}>
            {user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.1" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>{user?.username}</span>
            <span style={{ fontSize: "11px", color: "#777", textTransform: "capitalize" }}>{user?.role}</span>
          </div>
        </div>

        <button className="btn-secondary" style={{ fontSize: "13px", padding: "6px 14px" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
