const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const {
  startInterview,
  submitAnswer,
  evaluateFinal,
  getInterview,
  transcribeAnswer,
} = require("../controllers/interviewController");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/start", authenticateToken, requireRole("candidate"), startInterview);
router.post("/transcribe", authenticateToken, requireRole("candidate"), upload.single("audio"), transcribeAnswer);
router.post("/answer", authenticateToken, requireRole("candidate"), submitAnswer);
router.post("/evaluate", authenticateToken, requireRole("candidate"), evaluateFinal);
router.get("/:id", authenticateToken, getInterview);

module.exports = router;
