const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const {
  updateStatus,
  getCandidateDetail,
  getResumeAnalysis,
  chatWithResume,
  getMyApplications,
} = require("../controllers/applicationController");

// Candidate: see own applications + pipeline status
router.get("/my", authenticateToken, requireRole("candidate"), getMyApplications);

// Recruiter: get detailed candidate profile
router.get("/:id/detail", authenticateToken, requireRole("recruiter"), getCandidateDetail);

// Recruiter: get AI resume analysis
router.get("/:id/analysis", authenticateToken, requireRole("recruiter"), getResumeAnalysis);

// Recruiter: chat with AI about candidate resume
router.post("/:id/chat", authenticateToken, requireRole("recruiter"), chatWithResume);

// Recruiter: update pipeline status
router.patch("/:id/status", authenticateToken, requireRole("recruiter"), updateStatus);

module.exports = router;
