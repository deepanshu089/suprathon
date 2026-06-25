const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { uploadResume, getMyResume } = require("../controllers/resumeController");

// multer stores file in memory (no disk), we pass the buffer to pdf-parse and Supabase
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/upload", authenticateToken, requireRole("candidate"), upload.single("resume"), uploadResume);
router.get("/me", authenticateToken, requireRole("candidate"), getMyResume);

module.exports = router;
