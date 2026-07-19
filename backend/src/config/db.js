const { Pool } = require("pg");

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
