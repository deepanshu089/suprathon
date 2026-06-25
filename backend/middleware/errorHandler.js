// Global Error Handler Middleware
// Catches any error passed via next(err) in controllers.
// Keeps error handling out of business logic.

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = { errorHandler };
