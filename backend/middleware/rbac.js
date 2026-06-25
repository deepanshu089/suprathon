// Role-Based Access Control Middleware
// Used after authenticateToken to restrict routes by role.
// Usage: router.post("/jobs", authenticateToken, requireRole("recruiter"), controller)

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        error: `Access denied. This route requires role: ${role}`,
      });
    }
    next();
  };
}

module.exports = { requireRole };
