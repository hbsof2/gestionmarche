const { Pool, types } = require("pg");

// DATE columns (OID 1082) are parsed by pg into local-timezone JS Date objects,
// which then serialize to a shifted UTC day (e.g. "2026-01-01" -> "2025-12-31T23:00:00.000Z").
// Keep them as the raw "YYYY-MM-DD" string from Postgres instead.
types.setTypeParser(1082, (val) => val);

function parseConnectionString(url) {
  const match = url.match(
    /^(?:postgresql|postgres):\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) throw new Error("Invalid DATABASE_URL format");
  const [, user, password, host, port, database] = match;
  // Supabase wraps passwords with special chars in [...] — strip brackets
  const cleanPassword =
    password.startsWith("[") && password.endsWith("]")
      ? password.slice(1, -1)
      : password;
  return { user, password: cleanPassword, host, port: parseInt(port), database };
}

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
