const pool = require("../config/db");
const logActivity = require("../utils/activityLogger");

async function getAllBranches(req, res) {
  const { page = 1, search = "" } = req.query;
  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;
  try {
    const pattern = `%${search}%`;
    const [{ rows: data }, { rows: countRows }] = await Promise.all([
      pool.query(
        `SELECT b.*, u.full_name AS created_by_name
         FROM authority_branches b
         LEFT JOIN users u ON u.id = b.created_by
         WHERE b.name ILIKE $1 ORDER BY b.id ASC LIMIT $2 OFFSET $3`,
        [pattern, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM authority_branches WHERE name ILIKE $1`,
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

async function getBranchById(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, u.full_name AS created_by_name
       FROM authority_branches b
       LEFT JOIN users u ON u.id = b.created_by
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "فرع المصلحة المتعاقدة غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validate(body) {
  const { name, wilaya, commune, address, phone } = body;
  if (!name?.trim()) return "اسم فرع المصلحة المتعاقدة مطلوب";
  if (!wilaya?.trim()) return "الولاية مطلوبة";
  if (!commune?.trim()) return "البلدية مطلوبة";
  if (!address?.trim()) return "العنوان الكامل مطلوب";
  if (!phone?.trim()) return "رقم الهاتف مطلوب";
  return null;
}

async function createBranch(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone, fax } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO authority_branches
        (name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone, fax, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name.trim(), wilaya.trim(), commune.trim(), nis?.trim() || null, nif?.trim() || null,
        rc_number?.trim() || null, rc_date || null, address.trim(), phone.trim(), fax?.trim() || null, req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateBranch(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone, fax } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE authority_branches
       SET name=$1, wilaya=$2, commune=$3, nis=$4, nif=$5, rc_number=$6, rc_date=$7, address=$8, phone=$9, fax=$10
       WHERE id=$11 RETURNING *`,
      [
        name.trim(), wilaya.trim(), commune.trim(), nis?.trim() || null, nif?.trim() || null,
        rc_number?.trim() || null, rc_date || null, address.trim(), phone.trim(), fax?.trim() || null,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "فرع المصلحة المتعاقدة غير موجود" });
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "update",
      action: `تعديل فرع مصلحة: ${rows[0].name}`,
      section: "authority_branches",
      ipAddress: req.ip,
    });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteBranch(req, res) {
  try {
    const { rows: linkedRows } = await pool.query(
      "SELECT COUNT(*) FROM deal_branches WHERE branch_id = $1",
      [req.params.id]
    );
    if (parseInt(linkedRows[0].count) > 0) {
      return res.status(400).json({ error: "لا يمكن حذف هذا الفرع لأنه مرتبط بصفقة أو أكثر" });
    }
    const { rows: receiptRows } = await pool.query(
      "SELECT COUNT(*) FROM receipts WHERE branch_id = $1",
      [req.params.id]
    );
    if (parseInt(receiptRows[0].count) > 0) {
      return res.status(400).json({ error: "لا يمكن حذف هذا الفرع لأنه مرتبط بوصل أو أكثر" });
    }
    const { rows } = await pool.query(
      "DELETE FROM authority_branches WHERE id=$1 RETURNING id, name",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "فرع المصلحة المتعاقدة غير موجود" });
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "delete",
      action: `حذف فرع مصلحة: ${rows[0].name}`,
      section: "authority_branches",
      ipAddress: req.ip,
    });
    res.json({ deleted: rows[0].id, name: rows[0].name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
