const express = require("express");
const rateLimit = require("express-rate-limit");
const { createBooking } = require("../controllers/bookingsController");

const router = express.Router();

// Basic abuse protection on the public booking endpoint.
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking attempts. Please wait a few minutes and try again." },
});

router.post("/", bookingLimiter, createBooking);

module.exports = router;
