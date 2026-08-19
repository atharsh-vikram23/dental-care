// Convenience script: creates the database/tables and loads the 15
// services if you'd rather not use the `mysql` CLI directly.
//
// Usage:
//   1. Fill in backend/.env (DB_HOST, DB_USER, DB_PASSWORD at minimum —
//      DB_USER needs privileges to CREATE DATABASE the first time).
//   2. npm run db:init
//
// This is equivalent to running db/schema.sql and db/seed.sql by hand.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  const schemaSql = fs.readFileSync(path.join(__dirname, "../../db/schema.sql"), "utf8");
  const seedSql = fs.readFileSync(path.join(__dirname, "../../db/seed.sql"), "utf8");

  console.log("Applying schema.sql ...");
  await connection.query(schemaSql);

  console.log("Applying seed.sql ...");
  await connection.query(seedSql);

  console.log("Database initialized: dr_deleep_dental (15 services loaded).");
  await connection.end();
}

run().catch((err) => {
  console.error("Database init failed:", err.message);
  process.exit(1);
});
