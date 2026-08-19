const { pool } = require("../config/db");

// GET /api/services
// Returns every active service, in display order, with benefits/steps
// parsed back out of JSON columns for the frontend to render directly.
async function listServices(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, icon, title, teaser, duration, ideal_for AS idealFor,
              description, benefits, steps
       FROM services
       WHERE active = 1
       ORDER BY sort_order ASC, id ASC`
    );

    const services = rows.map((row) => ({
      ...row,
      benefits: typeof row.benefits === "string" ? JSON.parse(row.benefits) : row.benefits,
      steps: typeof row.steps === "string" ? JSON.parse(row.steps) : row.steps,
    }));

    res.json({ services });
  } catch (err) {
    console.error("listServices error:", err);
    res.status(500).json({ error: "Could not load services." });
  }
}

module.exports = { listServices };
