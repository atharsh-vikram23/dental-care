const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const localCaPath = path.join(
  process.env.USERPROFILE || "",
  "Downloads",
  "isrgrootx1.pem"
);

const ca =
  process.env.DB_SSL_CA ||
  (fs.existsSync(localCaPath) ? fs.readFileSync(localCaPath, "utf8") : null);

const poolConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: true,
};

if (ca) {
  poolConfig.ssl = {
    ca: ca.replace(/\\n/g, "\n"),
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool(poolConfig);

async function verifyConnection() {
  const conn = await pool.getConnection();

  try {
    await conn.ping();

    console.log(
      `Connected to MySQL database "${process.env.DB_NAME}" at ${process.env.DB_HOST}:${process.env.DB_PORT}`
    );
  } finally {
    conn.release();
  }
}

module.exports = { pool, verifyConnection };