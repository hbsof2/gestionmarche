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

async function runMigration() {
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  const env = loadEnv(envPath);

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  const filename = process.argv[2] || "001_raw_materials.sql";
  const sqlPath = path.join(__dirname, "../migrations", filename);
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found: ${sqlPath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, "utf-8");
  console.log(`📄 Migration file: ${filename}`);

  // Parse manually to handle special characters in the password
  // Format: postgresql://user:password@host:port/database
  const match = databaseUrl.match(
    /^(?:postgresql|postgres):\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) {
    console.error("❌ Could not parse DATABASE_URL format");
    process.exit(1);
  }
  const [, parsedUser, password, parsedHost, parsedPort, database] = match;

  const user = parsedUser;
  // Supabase wraps passwords with special chars in [...] — strip them
  const cleanPassword = password.startsWith("[") && password.endsWith("]")
    ? password.slice(1, -1)
    : password;
  const host = parsedHost;
  const port = parseInt(parsedPort);

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
    console.log("✅ Connected successfully");

    console.log(`⚙️  Running migration ${filename}...`);
    await client.query(sql);
    console.log("✅ Migration executed successfully");

    // Verify storage policies if this is a storage migration
    if (filename.includes("storage")) {
      const result = await client.query(`
        SELECT policyname, cmd, roles
        FROM pg_policies
        WHERE tablename = 'objects' AND schemaname = 'storage'
        ORDER BY policyname;
      `);
      console.log("\n📋 Storage policies active:");
      console.table(result.rows);
    }
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log("⚠️  Table or type already exists — migration skipped (safe)");
    } else {
      console.error("❌ Migration failed:", err.message);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log("\n🔌 Connection closed");
  }
}

runMigration();
