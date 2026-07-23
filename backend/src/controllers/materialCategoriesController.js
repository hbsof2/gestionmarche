const pool = require("../config/db");
const tableExists = require("../utils/tableExists");

async function getAllCategories(req, res) {
  const { search = "" } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM material_categories
       WHERE name_ar ILIKE $1
       ORDER BY id ASC`,
      [`%${search}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCategoryById(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM material_categories WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الصنف غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createCategory(req, res) {
  const { name_ar, name_lat } = req.body;
  if (!name_ar?.trim()) return res.status(400).json({ error: "اسم الصنف بالعربي مطلوب" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO material_categories (name_ar, name_lat)
       VALUES ($1, $2) RETURNING *`,
      [name_ar.trim(), name_lat?.trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCategory(req, res) {
  const { name_ar, name_lat } = req.body;
  if (!name_ar?.trim()) return res.status(400).json({ error: "اسم الصنف بالعربي مطلوب" });
  try {
    const { rows } = await pool.query(
      `UPDATE material_categories
       SET name_ar=$1, name_lat=$2
       WHERE id=$3 RETURNING *`,
      [name_ar.trim(), name_lat?.trim() || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الصنف غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteCategory(req, res) {
  try {
    if (await tableExists(pool, "deal_items")) {
      const { rows: usage } = await pool.query(
        `SELECT COUNT(*) FROM deal_items di
         JOIN raw_materials rm ON rm.id = di.material_id
         WHERE rm.category_id = $1`,
        [req.params.id]
      );
      if (parseInt(usage[0].count) > 0) {
        return res.status(400).json({ error: "لا يمكن حذف هذا الصنف لأنه مرتبط بصفقة أو أكثر" });
      }
    }
    const { rows } = await pool.query(
      "DELETE FROM material_categories WHERE id=$1 RETURNING id, name_ar",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الصنف غير موجود" });
    res.json({ deleted: rows[0].id, name: rows[0].name_ar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
