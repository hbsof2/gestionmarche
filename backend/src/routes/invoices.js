const router = require("express").Router();
const pool = require("../config/db");

// GET /api/invoices
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM invoices ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoices/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM invoices WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices
router.post("/", async (req, res) => {
  try {
    res.status(201).json({ message: "Create invoice — to be implemented" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/invoices/:id
router.put("/:id", async (req, res) => {
  try {
    res.json({ message: "Update invoice — to be implemented" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/invoices/:id
router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM invoices WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
