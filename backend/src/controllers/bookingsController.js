const { pool } = require("../config/db");
const { generateDailySlots } = require("../config/clinic");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;

function validateBookingInput(body) {
  const errors = [];
  const { name, phone, service, date, time } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Please provide the patient's full name.");
  }
  if (!phone || !PHONE_RE.test(phone.trim())) {
    errors.push("Please provide a valid phone number.");
  }
  if (!service || typeof service !== "string") {
    errors.push("Please select a service.");
  }
  if (!date || !DATE_RE.test(date)) {
    errors.push("Please provide a valid date (YYYY-MM-DD).");
  } else {
    const requested = new Date(`${date}T00:00:00`);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (Number.isNaN(requested.getTime()) || requested < todayStart) {
      errors.push("The preferred date can't be in the past.");
    }
  }
  if (!time || !generateDailySlots().includes(time)) {
    errors.push("Please select a valid clinic time slot.");
  }
  return errors;
}

// POST /api/bookings
// Creates a booking after re-checking, inside a transaction, that the
// requested slot is still free — protects against two patients grabbing
// the same time at once.
async function createBooking(req, res) {
  const errors = validateBookingInput(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  const name = req.body.name.trim();
  const phone = req.body.phone.trim();
  const service = req.body.service.trim();
  const date = req.body.date;
  const time = req.body.time;
  const notes = (req.body.notes || "").trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT id FROM bookings
       WHERE booking_date = ? AND booking_time = ? AND status IN ('pending', 'confirmed')
       FOR UPDATE`,
      [date, time]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: "That slot was just booked by someone else. Please pick another time." });
    }

    const [result] = await conn.query(
      `INSERT INTO bookings (name, phone, service, booking_date, booking_time, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name, phone, service, date, time, notes || null]
    );

    await conn.commit();

    res.status(201).json({
      id: result.insertId,
      name,
      phone,
      service,
      date,
      time,
      notes,
      status: "pending",
    });
  } catch (err) {
    await conn.rollback();
    console.error("createBooking error:", err);
    res.status(500).json({ error: "Could not save the booking. Please try again or call the clinic." });
  } finally {
    conn.release();
  }
}

// GET /api/admin/bookings?date=YYYY-MM-DD&status=pending  (admin only)
async function listBookings(req, res) {
  const { date, status } = req.query;
  const clauses = [];
  const params = [];

  if (date) {
    clauses.push("booking_date = ?");
    params.push(date);
  }
  if (status) {
    clauses.push("status = ?");
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `SELECT id, name, phone, service, booking_date AS date, booking_time AS time,
              notes, status, created_at AS createdAt
       FROM bookings
       ${where}
       ORDER BY booking_date ASC, booking_time ASC`,
      params
    );
    res.json({ bookings: rows });
  } catch (err) {
    console.error("listBookings error:", err);
    res.status(500).json({ error: "Could not load bookings." });
  }
}

// PATCH /api/admin/bookings/:id  { status: 'confirmed' | 'cancelled' | 'completed' }  (admin only)
async function updateBookingStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "cancelled", "completed"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
  }

  try {
    const [result] = await pool.query(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.json({ id: Number(id), status });
  } catch (err) {
    console.error("updateBookingStatus error:", err);
    res.status(500).json({ error: "Could not update the booking." });
  }
}

module.exports = { createBooking, listBookings, updateBookingStatus };
