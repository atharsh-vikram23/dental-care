require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { verifyConnection } = require("./src/config/db");
const servicesRouter = require("./src/routes/services");
const slotsRouter = require("./src/routes/slots");
const bookingsRouter = require("./src/routes/bookings");
const adminRouter = require("./src/routes/admin");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key"],
    credentials: false,
  })
);

app.use(express.json());

app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

app.use("/api/services", servicesRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: "Not found." }));

// Central error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await verifyConnection();

    app.listen(PORT, () => {
      console.log(
        `Dr. Deleep Dental Care API listening on port ${PORT}`
      );
    });
  } catch (err) {
    console.error(
      "Failed to connect to MySQL. Check your .env values and that MySQL is running."
    );
    console.error(err.message);
    process.exit(1);
  }
})();