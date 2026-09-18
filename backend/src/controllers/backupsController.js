const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { generateBackupSqlInMemory } = require("../utils/backupDatabase");
const sendBackupEmail = require("../utils/sendBackupEmail");

// Short-lived in-process cache so a backup's exact bytes can be re-downloaded
// or re-sent shortly after creation without touching disk (Railway's
// filesystem is ephemeral). This does NOT survive a process restart/redeploy
// and isn't shared across replicas if this app is ever scaled horizontally —
// every reader below falls back to regenerating a fresh dump on a cache miss,
// so a stale/missing entry never hard-fails, it just won't be byte-identical
// to the original.
if (!global.backupCache) global.backupCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheBackup(id, filename, content) {
  global.backupCache.set(id, { filename, content });
  setTimeout(() => global.backupCache.delete(id), CACHE_TTL_MS);
}

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return "-";
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

async function createBackup(req, res) {
  try {
    const { filename, content } = await generateBackupSqlInMemory();
    const fileSize = Buffer.byteLength(content, "utf8");

    const { rows } = await pool.query(
      `INSERT INTO backups (filename, file_path, file_size, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [filename, "in-memory", fileSize, req.user.id]
    );

    const backup = rows[0];
    cacheBackup(backup.id, filename, content);

    res.status(201).json(backup);
  } catch (err) {
    console.error("Backup creation error:", err);
    res.status(500).json({ error: "فشل إنشاء النسخة الاحتياطية، تحقق من إعدادات الخادم" });
  }
}

async function sendBackup(req, res) {
  console.log("sendBackup called with body:", req.body);
  console.log("SMTP settings:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM,
    pass: process.env.SMTP_PASS ? "exists" : "missing",
  });

  const { backup_id } = req.body;
  const toEmail = process.env.SMTP_USER;
  if (!toEmail) {
    return res.status(400).json({ error: "لم يتم إعداد البريد الإلكتروني في إعدادات الخادم" });
  }

  try {
    const cached = backup_id ? global.backupCache.get(Number(backup_id)) : null;
    let filename, content;
    if (cached) {
      console.log("Using cached backup content");
      ({ filename, content } = cached);
    } else {
      console.log(backup_id ? "Cache miss - regenerating backup" : "No backup_id - generating fresh backup");
      ({ filename, content } = await generateBackupSqlInMemory());
    }

    await sendBackupEmail(content, filename, toEmail);

    let backupRow;
    if (backup_id) {
      const { rows } = await pool.query(
        "UPDATE backups SET email_sent_to = $1 WHERE id = $2 RETURNING *",
        [toEmail, backup_id]
      );
      backupRow = rows[0];
    }
    if (!backupRow) {
      const fileSize = Buffer.byteLength(content, "utf8");
      const { rows } = await pool.query(
        `INSERT INTO backups (filename, file_path, file_size, email_sent_to, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [filename, "in-memory", fileSize, toEmail, req.user.id]
      );
      backupRow = rows[0];
    }

    console.log("Email sent successfully to:", toEmail);
    res.json(backupRow);
  } catch (err) {
    console.error("Send backup full error:", err);
    console.error("Error code:", err.code);
    console.error("Error response:", err.response);
    res.status(500).json({
      error: "فشل إرسال البريد الإلكتروني، تحقق من إعدادات SMTP",
      details: err.message,
    });
  }
}

async function downloadBackup(req, res) {
  const id = Number(req.params.id);
  try {
    const cached = global.backupCache.get(id);
    if (cached) {
      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${cached.filename}"`);
      return res.send(Buffer.from(cached.content, "utf8"));
    }

    const { rows } = await pool.query(
      "SELECT filename, file_path FROM backups WHERE id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "النسخة الاحتياطية غير موجودة" });

    const { filename, file_path } = rows[0];
    if (file_path !== "in-memory" && fs.existsSync(file_path)) {
      return res.download(path.resolve(file_path), filename);
    }

    // Cache expired (or this row was always in-memory-only) — regenerate a
    // fresh dump rather than 404ing. Not byte-identical to the original, but
    // keeps the download button working regardless of Railway's ephemeral fs.
    const fresh = await generateBackupSqlInMemory();
    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="${fresh.filename}"`);
    res.send(Buffer.from(fresh.content, "utf8"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function testSmtp(req, res) {
  res.json({
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_user: process.env.SMTP_USER,
    smtp_from: process.env.SMTP_FROM,
    smtp_pass: process.env.SMTP_PASS ? "موجود ✅" : "غير موجود ❌",
  });
}

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.filename, b.file_size, b.email_sent_to, b.created_at,
              u.full_name AS created_by_name
       FROM backups b
       LEFT JOIN users u ON u.id = b.created_by
       ORDER BY b.created_at DESC`
    );
    const data = rows.map((row) => ({ ...row, file_size_formatted: formatFileSize(row.file_size) }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT file_path FROM backups WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "النسخة الاحتياطية غير موجودة" });

    try {
      if (fs.existsSync(rows[0].file_path)) {
        fs.unlinkSync(rows[0].file_path);
      }
    } catch (e) {
      console.error(`Failed to delete file: ${rows[0].file_path}`);
    }

    await pool.query("DELETE FROM backups WHERE id = $1", [req.params.id]);
    global.backupCache.delete(Number(req.params.id));
    res.json({ deleted: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createBackup, sendBackup, downloadBackup, getAll, remove, testSmtp };
