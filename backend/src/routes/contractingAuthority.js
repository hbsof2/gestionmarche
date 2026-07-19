const router = require("express").Router();
const pool = require("../config/db");

// GET /api/contracting-authority
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM contracting_authority ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contracting-authority/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM contracting_authority WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contracting-authority
router.post("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO contracting_authority DEFAULT VALUES RETURNING *`
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contracting-authority/:id
router.put("/:id", async (req, res) => {
  try {
    res.json({ message: "Update contracting authority — to be implemented" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contracting-authority/:id
router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM contracting_authority WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
