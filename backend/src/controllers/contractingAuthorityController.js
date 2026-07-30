const pool = require("../config/db");
const logActivity = require("../utils/activityLogger");

async function getAllAuthorities(req, res) {
  const { page = 1, search = "", limit: limitParam } = req.query;
  const limit = limitParam ? Math.min(parseInt(limitParam), 1000) : 10;
  const offset = (parseInt(page) - 1) * limit;
  try {
    const pattern = `%${search}%`;
    const [{ rows: data }, { rows: countRows }] = await Promise.all([
      pool.query(
        `SELECT a.*, u.full_name AS created_by_name
         FROM contracting_authorities a
         LEFT JOIN users u ON u.id = a.created_by
         WHERE a.name ILIKE $1 ORDER BY a.id ASC LIMIT $2 OFFSET $3`,
        [pattern, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM contracting_authorities WHERE name ILIKE $1`,
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

async function getAuthorityById(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.full_name AS created_by_name
       FROM contracting_authorities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المصلحة المتعاقدة غير موجودة" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validate(body) {
  const { name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone } = body;
  if (!name?.trim()) return "اسم المصلحة المتعاقدة مطلوب";
  if (!wilaya?.trim()) return "الولاية مطلوبة";
  if (!commune?.trim()) return "البلدية مطلوبة";
  if (!nis?.trim()) return "الرقم الإحصائي مطلوب";
  if (!nif?.trim()) return "الرقم الجبائي مطلوب";
  if (!rc_number?.trim()) return "رقم السجل التجاري مطلوب";
  if (!rc_date) return "تاريخ السجل التجاري مطلوب";
  if (!address?.trim()) return "العنوان الكامل مطلوب";
  if (!phone?.trim()) return "رقم الهاتف مطلوب";
  return null;
}

async function createAuthority(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone, fax } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO contracting_authorities
        (name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone, fax, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name.trim(), wilaya.trim(), commune.trim(), nis.trim(), nif.trim(),
        rc_number.trim(), rc_date, address.trim(), phone.trim(), fax?.trim() || null, req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateAuthority(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { name, wilaya, commune, nis, nif, rc_number, rc_date, address, phone, fax } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE contracting_authorities
       SET name=$1, wilaya=$2, commune=$3, nis=$4, nif=$5, rc_number=$6, rc_date=$7, address=$8, phone=$9, fax=$10
       WHERE id=$11 RETURNING *`,
      [
        name.trim(), wilaya.trim(), commune.trim(), nis.trim(), nif.trim(),
        rc_number.trim(), rc_date, address.trim(), phone.trim(), fax?.trim() || null,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "المصلحة المتعاقدة غير موجودة" });
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "update",
      action: `تعديل مصلحة متعاقدة: ${rows[0].name}`,
      section: "contracting_authority",
      ipAddress: req.ip,
    });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteAuthority(req, res) {
  try {
    const { rows: linkedRows } = await pool.query(
      "SELECT COUNT(*) FROM deals WHERE authority_id = $1",
      [req.params.id]
    );
    if (parseInt(linkedRows[0].count) > 0) {
      return res.status(400).json({ error: "لا يمكن حذف هذه المصلحة المتعاقدة لأنها مرتبطة بصفقة أو أكثر" });
    }
    const { rows } = await pool.query(
      "DELETE FROM contracting_authorities WHERE id=$1 RETURNING id, name",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المصلحة المتعاقدة غير موجودة" });
    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "delete",
      action: `حذف مصلحة متعاقدة: ${rows[0].name}`,
      section: "contracting_authority",
      ipAddress: req.ip,
    });
    res.json({ deleted: rows[0].id, name: rows[0].name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllAuthorities,
  getAuthorityById,
  createAuthority,
  updateAuthority,
  deleteAuthority,
};
