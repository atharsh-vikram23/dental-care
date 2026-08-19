const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: true,
});

// Fail loudly and early if the database is unreachable, rather than
// letting every request time out silently.
async function verifyConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log(`Connected to MySQL database "${process.env.DB_NAME}" at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  } finally {
    conn.release();
  }
}

module.exports = { pool, verifyConnection };
