const pool = require("../config/db");
const tableExists = require("../utils/tableExists");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_UNITS = ["كغ", "لتر", "و", "علبة", "ربطة", "حبة"];

async function getAllMaterials(req, res) {
  const { page = 1, search = "", limit: limitParam } = req.query;
  const limit = limitParam ? Math.min(parseInt(limitParam), 1000) : 10;
  const offset = (parseInt(page) - 1) * limit;
  try {
    const pattern = `%${search}%`;
    const [{ rows: data }, { rows: countRows }] = await Promise.all([
      pool.query(
        `SELECT * FROM raw_materials WHERE name_ar ILIKE $1 ORDER BY id ASC LIMIT $2 OFFSET $3`,
        [pattern, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM raw_materials WHERE name_ar ILIKE $1`,
        [pattern]
      ),
    ]);
    const total = parseInt(countRows[0].count);
    res.json({
      data,
      pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / limit), limit },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMaterialById(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM raw_materials WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المادة غير موجودة" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createMaterial(req, res) {
  const { name_ar, name_lat, description, unit, image_url } = req.body;
  if (!name_ar?.trim()) return res.status(400).json({ error: "اسم المادة بالعربي مطلوب" });
  if (!unit) return res.status(400).json({ error: "الوحدة مطلوبة" });
  if (!VALID_UNITS.includes(unit)) return res.status(400).json({ error: "قيمة الوحدة غير صحيحة" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO raw_materials (name_ar, name_lat, description, unit, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name_ar.trim(), name_lat || null, description || null, unit, image_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateMaterial(req, res) {
  const { name_ar, name_lat, description, unit, image_url } = req.body;
  if (!name_ar?.trim()) return res.status(400).json({ error: "اسم المادة بالعربي مطلوب" });
  if (!unit) return res.status(400).json({ error: "الوحدة مطلوبة" });
  if (!VALID_UNITS.includes(unit)) return res.status(400).json({ error: "قيمة الوحدة غير صحيحة" });
  try {
    const { rows } = await pool.query(
      `UPDATE raw_materials
       SET name_ar=$1, name_lat=$2, description=$3, unit=$4, image_url=$5
       WHERE id=$6 RETURNING *`,
      [name_ar.trim(), name_lat || null, description || null, unit, image_url || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المادة غير موجودة" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteMaterial(req, res) {
  try {
    const { rows: dealUsage } = await pool.query(
      "SELECT COUNT(*) FROM deal_items WHERE material_id = $1",
      [req.params.id]
    );
    if (parseInt(dealUsage[0].count) > 0) {
      return res.status(400).json({ error: "لا يمكن حذف هذه المادة الأولية لأنها مرتبطة بصفقة أو أكثر" });
    }
    if (await tableExists(pool, "receipt_items")) {
      const { rows: receiptUsage } = await pool.query(
        "SELECT COUNT(*) FROM receipt_items WHERE material_id = $1",
        [req.params.id]
      );
      if (parseInt(receiptUsage[0].count) > 0) {
        return res.status(400).json({ error: "لا يمكن حذف هذه المادة الأولية لأنها مرتبطة بصفقة أو وصل تسليم" });
      }
    }
    const { rows } = await pool.query(
      "DELETE FROM raw_materials WHERE id=$1 RETURNING id, name_ar",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المادة غير موجودة" });
    res.json({ deleted: rows[0].id, name: rows[0].name_ar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: "لم يتم اختيار صورة" });
  const ext = req.file.originalname.split(".").pop().toLowerCase();
  const filename = `material_${Date.now()}.${ext}`;
  try {
    const { error } = await supabase.storage
      .from("materials")
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(filename);
    res.json({ url: urlData.publicUrl, path: filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllMaterials, getMaterialById, createMaterial, updateMaterial, deleteMaterial, uploadImage };
