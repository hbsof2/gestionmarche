const router = require("express").Router();
const pool = require("../config/db");
const { sendEmail } = require("../utils/email");

// POST /api/backup/create
router.post("/create", async (req, res) => {
  try {
    // Placeholder — full pg_dump integration to be implemented
    res.json({ message: "Backup created — to be implemented" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backup/send
router.post("/send", async (req, res) => {
  const { email } = req.body;
  try {
    await sendEmail({
      to: email,
      subject: "نسخة احتياطية من قاعدة البيانات",
      text: "مرفق نسخة احتياطية من قاعدة البيانات.",
    });
    res.json({ message: "Backup sent via email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backup/list
router.get("/list", async (req, res) => {
  try {
    res.json({ backups: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
