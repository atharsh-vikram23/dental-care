// Lightweight API-key check for the clinic's admin endpoints (viewing and
// updating bookings). This is intentionally simple — swap for proper
// session/JWT auth if the admin dashboard grows beyond one staff login.
function adminAuth(req, res, next) {
  const key = req.header("x-admin-key");
  if (!process.env.ADMIN_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured: ADMIN_API_KEY is not set." });
  }
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Missing or invalid admin key." });
  }
  next();
}

module.exports = adminAuth;
