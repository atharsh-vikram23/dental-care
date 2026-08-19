const { pool } = require("../config/db");
const { generateDailySlots } = require("../config/clinic");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/slots?date=YYYY-MM-DD
// Returns every slot for that day with an `available` flag, based on which
// times already have a non-cancelled booking.
async function getSlotsForDate(req, res) {
  const { date } = req.query;

  if (!date || !DATE_RE.test(date)) {
    return res.status(400).json({ error: "Query param 'date' is required in YYYY-MM-DD format." });
  }

  const requested = new Date(`${date}T00:00:00`);
  if (Number.isNaN(requested.getTime())) {
    return res.status(400).json({ error: "Invalid date." });
  }

  try {
    const [booked] = await pool.query(
      `SELECT booking_time FROM bookings
       WHERE booking_date = ? AND status IN ('pending', 'confirmed')`,
      [date]
    );
    const bookedTimes = new Set(booked.map((b) => b.booking_time));

    const slots = generateDailySlots().map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));

    res.json({ date, slots });
  } catch (err) {
    console.error("getSlotsForDate error:", err);
    res.status(500).json({ error: "Could not load slot availability." });
  }
}

module.exports = { getSlotsForDate };
