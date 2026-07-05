// HireEZ AI — Express Backend Entry Point
// This file: sets up middleware, mounts routes, starts server.
// Business logic lives in controllers/. AI logic lives in services/.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Allow requests from the React frontend.
// FRONTEND_URL can be a comma-separated list for multiple origins
// (e.g. main Vercel domain + preview URLs + localhost).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!requestOrigin) return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
      callback(new Error(`CORS: origin ${requestOrigin} not allowed`));
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/resume", require("./routes/resume"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/match", require("./routes/match"));
app.use("/api/interview", require("./routes/interview"));
app.use("/api/applications", require("./routes/applications"));

// Health check — Render uses this to confirm the server is alive
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global error handler — must be last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HireEZ backend running on port ${PORT}`));
