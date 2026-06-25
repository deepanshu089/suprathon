// App.jsx — Root component with routing
// React Router v6: routes defined here, role-based redirects handled per page.

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import ResumeUpload from "./pages/ResumeUpload";
import JobList from "./pages/JobList";
import JobCreate from "./pages/JobCreate";
import VideoInterview from "./pages/VideoInterview";
import CandidateDetail from "./pages/CandidateDetail";

// Wraps a route so it's only reachable by a logged-in user with the right role.
// No user → bounce to login. Wrong role (e.g. recruiter on a candidate page) → also bounce.
function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Candidate routes */}
          <Route path="/candidate/dashboard" element={
            <PrivateRoute role="candidate"><CandidateDashboard /></PrivateRoute>
          } />
          <Route path="/candidate/resume" element={
            <PrivateRoute role="candidate"><ResumeUpload /></PrivateRoute>
          } />
          <Route path="/candidate/jobs" element={
            <PrivateRoute role="candidate"><JobList /></PrivateRoute>
          } />
          <Route path="/candidate/interview/:applicationId" element={
            <PrivateRoute role="candidate"><VideoInterview /></PrivateRoute>
          } />

          {/* Recruiter routes */}
          <Route path="/recruiter/dashboard" element={
            <PrivateRoute role="recruiter"><RecruiterDashboard /></PrivateRoute>
          } />
          <Route path="/recruiter/jobs/new" element={
            <PrivateRoute role="recruiter"><JobCreate /></PrivateRoute>
          } />
          <Route path="/recruiter/candidate/:applicationId" element={
            <PrivateRoute role="recruiter"><CandidateDetail /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
