const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const { listBookings, updateBookingStatus } = require("../controllers/bookingsController");

const router = express.Router();

router.use(adminAuth);

router.get("/bookings", listBookings);
router.patch("/bookings/:id", updateBookingStatus);

module.exports = router;
