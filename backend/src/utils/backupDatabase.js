const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const parseConnectionString = require("./parseDbUrl");

const execAsync = promisify(exec);

const TABLES = [
  "users", "raw_materials", "material_categories",
  "contracting_authorities", "authority_branches",
  "contractors", "deals", "deal_branches", "deal_items",
  "deal_items_snapshot", "receipts", "receipt_items",
  "invoices", "invoice_items", "activity_logs", "backups",
];

function buildFilename(now) {
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
  return `backup_${dateStr}_${timeStr}.sql`;
}

async function buildBackupSql(client, now) {
  let sqlContent = `-- Database Backup\n-- Created: ${now.toISOString()}\n-- Platform: منصة تسيير الصفقات\n\n`;
  sqlContent += `SET client_encoding = 'UTF8';\n\n`;

  for (const table of TABLES) {
    try {
      const result = await client.query(`SELECT * FROM ${table}`);
      if (result.rows.length > 0) {
        sqlContent += `-- Table: ${table}\n`;
        for (const row of result.rows) {
          const columns = Object.keys(row).join(", ");
          const values = Object.values(row)
            .map((val) => {
              if (val === null) return "NULL";
              if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
              if (typeof val === "number") return val;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return `'${String(val).replace(/'/g, "''")}'`;
            })
            .join(", ");
          sqlContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
        }
        sqlContent += `\n`;
      }
    } catch (e) {
      sqlContent += `-- Skipped table ${table}: ${e.message}\n\n`;
    }
  }

  return sqlContent;
}

async function jsonFallbackBackup(filePath, now) {
  console.warn("pg_dump not available, creating SQL INSERT backup instead");

  const client = await pool.connect();
  try {
    const sqlContent = await buildBackupSql(client, now);
    fs.writeFileSync(filePath, sqlContent, "utf8");
  } finally {
    client.release();
  }
}

// Used by the "send backup by email" flow, which must not depend on the local
// disk at all (Railway's filesystem is ephemeral and gets wiped on redeploy).
async function generateBackupSqlInMemory() {
  const now = new Date();
  const client = await pool.connect();
  try {
    const content = await buildBackupSql(client, now);
    return { filename: buildFilename(now), content };
  } finally {
    client.release();
  }
}

async function backupDatabase() {
  const backupDir = process.env.BACKUP_DIR || "./backups";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const filename = buildFilename(now);
  const filePath = path.join(backupDir, filename);

  const { host, port, database, user, password } = parseConnectionString(process.env.DATABASE_URL);
  const env = { ...process.env, PGPASSWORD: password };
  const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}" --no-password --format=plain --encoding=UTF8`;

  try {
    await execAsync(command, { env });
  } catch (error) {
    await jsonFallbackBackup(filePath, now);
  }

  const stats = fs.statSync(filePath);
  return { filename, filePath, fileSize: stats.size };
}

module.exports = { backupDatabase, generateBackupSqlInMemory };
