const router = require("express").Router();
const pool = require("../config/db");

// GET /api/contractor
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM contractor ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contractor/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM contractor WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contractor
router.post("/", async (req, res) => {
  try {
    res.status(201).json({ message: "Create contractor — to be implemented" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contractor/:id
router.put("/:id", async (req, res) => {
  try {
    res.json({ message: "Update contractor — to be implemented" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
