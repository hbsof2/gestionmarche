const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { backupDatabase, generateBackupSqlInMemory } = require("../utils/backupDatabase");
const sendBackupEmail = require("../utils/sendBackupEmail");

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return "-";
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

async function createBackup(req, res) {
  try {
    const { filename, filePath, fileSize } = await backupDatabase();

    const { rows } = await pool.query(
      `INSERT INTO backups (filename, file_path, file_size, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [filename, filePath, fileSize, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Backup creation error:", err);
    res.status(500).json({ error: "فشل إنشاء النسخة الاحتياطية، تحقق من إعدادات الخادم" });
  }
}

// Always regenerates the dump in memory and emails it directly — Railway's
// filesystem is ephemeral, so this never depends on a file surviving on disk
// (unlike createBackup/downloadBackup below, which still use local disk).
async function sendBackup(req, res) {
  const toEmail = process.env.SMTP_USER;
  if (!toEmail) {
    return res.status(400).json({ error: "لم يتم إعداد البريد الإلكتروني في إعدادات الخادم" });
  }

  try {
    const { filename, content } = await generateBackupSqlInMemory();

    await sendBackupEmail(content, filename, toEmail);

    const fileSize = Buffer.byteLength(content, "utf8");
    const { rows } = await pool.query(
      `INSERT INTO backups (filename, file_path, file_size, email_sent_to, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [filename, "in-memory", fileSize, toEmail, req.user.id]
    );

    res.json(rows[0]);
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
  try {
    const { rows } = await pool.query(
      "SELECT filename, file_path FROM backups WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "النسخة الاحتياطية غير موجودة" });

    const { filename, file_path } = rows[0];
    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: "ملف النسخة الاحتياطية غير موجود على الخادم" });
    }

    res.download(path.resolve(file_path), filename);
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
    res.json({ deleted: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createBackup, sendBackup, downloadBackup, getAll, remove, testSmtp };
