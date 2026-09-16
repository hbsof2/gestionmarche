const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Parse .env.local manually (no extra dependencies)
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

async function runAllMigrations() {
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  const env = loadEnv(envPath);

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  // Parse manually to handle special characters in the password
  // Format: postgresql://user:password@host:port/database
  const match = databaseUrl.match(
    /^(?:postgresql|postgres):\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) {
    console.error("❌ Could not parse DATABASE_URL format");
    process.exit(1);
  }
  const [, user, password, host, parsedPort, database] = match;

  // Supabase wraps passwords with special chars in [...] — strip them
  const cleanPassword =
    password.startsWith("[") && password.endsWith("]")
      ? password.slice(1, -1)
      : password;
  const port = parseInt(parsedPort);

  const migrationsDir = path.join(__dirname, "../migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files`);

  const client = new Client({
    user,
    password: cleanPassword,
    host,
    port,
    database,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔌 Connecting to Supabase PostgreSQL...");
    await client.connect();
    console.log("✅ Connected successfully\n");

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        await client.query(sql);
        console.log(`✅ ${file} - Success`);
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log(`⚠️  ${file} - Skipped (already exists)`);
        } else {
          console.error(`❌ ${file} - Error: ${err.message}`);
          console.error("\nStopping — later migrations may depend on this one.");
          process.exit(1);
        }
      }
    }

    console.log("\n✅ All migrations completed!");
  } finally {
    await client.end();
    console.log("🔌 Connection closed");
  }
}

runAllMigrations();
