// Match Routes — resume/job matching and recruiter rankings
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { matchResumeToJob, applyToJob, getRankings } = require("../controllers/matchController");

// Candidate: privately preview how well their resume matches this job (not visible to recruiter yet)
router.post("/:jobId", authenticateToken, requireRole("candidate"), matchResumeToJob);
// Candidate: explicitly apply — only now does the recruiter see this candidate
router.post("/:jobId/apply", authenticateToken, requireRole("candidate"), applyToJob);
// Recruiter: view all candidates who applied to this job, ranked by match score
router.get("/rankings/:jobId", authenticateToken, requireRole("recruiter"), getRankings);

module.exports = router;
