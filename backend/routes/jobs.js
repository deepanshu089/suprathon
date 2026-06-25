// Job Routes — posting and browsing job listings
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { createJob, listJobs, getJob } = require("../controllers/jobController");

router.post("/", authenticateToken, requireRole("recruiter"), createJob); // recruiter posts a new job
router.get("/", authenticateToken, listJobs); // anyone logged in can browse jobs
router.get("/:id", authenticateToken, getJob); // view a single job's full details

module.exports = router;
