const express = require("express");
const { getSlotsForDate } = require("../controllers/slotsController");

const router = express.Router();

// Kept as CLINIC_SLOTS reference for the frontend fallback comment in index.html:
// the actual source of truth is src/config/clinic.js -> generateDailySlots().
router.get("/", getSlotsForDate);

module.exports = router;
