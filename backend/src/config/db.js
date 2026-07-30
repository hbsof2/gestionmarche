const { Pool, types } = require("pg");
const parseConnectionString = require("../utils/parseDbUrl");

// DATE columns (OID 1082) are parsed by pg into local-timezone JS Date objects,
// which then serialize to a shifted UTC day (e.g. "2026-01-01" -> "2025-12-31T23:00:00.000Z").
// Keep them as the raw "YYYY-MM-DD" string from Postgres instead.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  ...parseConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err.message);
});

module.exports = pool;
