import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Chat from './pages/Chat';
import Resume from './pages/Resume';
import ResumeAnalysis from './pages/ResumeAnalysis.tsx';
import BulkScreening from './pages/BulkScreening'; // Add this import

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/resumes" element={<Resume />} />
        <Route path="/analysis/:id" element={<ResumeAnalysis />} />
        <Route path="/bulk-screening" element={<BulkScreening />} /> {/* Add this route */}
      </Route>
    </Routes>
  );
}

export default App;