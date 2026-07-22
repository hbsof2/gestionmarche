const pool = require("../config/db");

async function getAll(req, res) {
  const { page = 1, search = "" } = req.query;
  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;
  try {
    const pattern = `%${search}%`;
    const [{ rows: data }, { rows: countRows }] = await Promise.all([
      pool.query(
        `SELECT * FROM contractors WHERE full_name ILIKE $1 ORDER BY id ASC LIMIT $2 OFFSET $3`,
        [pattern, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM contractors WHERE full_name ILIKE $1`,
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

async function getById(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM contractors WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المتعامل المتعاقد غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validate(body) {
  const {
    designation, full_name, birth_date, wilaya, commune,
    nis, nif, rc_number, rc_date, address, phone_fixed, phone_mobile,
  } = body;
  if (!designation?.trim()) return "تعيين المتعامل المتعاقد مطلوب";
  if (!full_name?.trim()) return "الإسم واللقب مطلوب";
  if (!birth_date) return "تاريخ الميلاد مطلوب";
  if (!wilaya?.trim()) return "الولاية مطلوبة";
  if (!commune?.trim()) return "البلدية مطلوبة";
  if (!nis?.trim()) return "الرقم الإحصائي مطلوب";
  if (!nif?.trim()) return "الرقم الجبائي مطلوب";
  if (!rc_number?.trim()) return "رقم السجل التجاري مطلوب";
  if (!rc_date) return "تاريخ السجل التجاري مطلوب";
  if (!address?.trim()) return "العنوان الكامل مطلوب";
  if (!phone_fixed?.trim()) return "رقم الهاتف الثابت مطلوب";
  if (!phone_mobile?.trim()) return "رقم الهاتف المحمول مطلوب";
  return null;
}

async function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const {
    designation, full_name, birth_date, wilaya, commune,
    nis, nif, rc_number, rc_date, address, phone_fixed, phone_mobile, fax,
  } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO contractors
        (designation, full_name, birth_date, wilaya, commune, nis, nif, rc_number, rc_date, address, phone_fixed, phone_mobile, fax)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        designation.trim(), full_name.trim(), birth_date, wilaya.trim(), commune.trim(),
        nis.trim(), nif.trim(), rc_number.trim(), rc_date, address.trim(),
        phone_fixed.trim(), phone_mobile.trim(), fax?.trim() || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const {
    designation, full_name, birth_date, wilaya, commune,
    nis, nif, rc_number, rc_date, address, phone_fixed, phone_mobile, fax,
  } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE contractors
       SET designation=$1, full_name=$2, birth_date=$3, wilaya=$4, commune=$5, nis=$6, nif=$7,
           rc_number=$8, rc_date=$9, address=$10, phone_fixed=$11, phone_mobile=$12, fax=$13
       WHERE id=$14 RETURNING *`,
      [
        designation.trim(), full_name.trim(), birth_date, wilaya.trim(), commune.trim(),
        nis.trim(), nif.trim(), rc_number.trim(), rc_date, address.trim(),
        phone_fixed.trim(), phone_mobile.trim(), fax?.trim() || null,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "المتعامل المتعاقد غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const { rows } = await pool.query(
      "DELETE FROM contractors WHERE id=$1 RETURNING id, full_name",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المتعامل المتعاقد غير موجود" });
    res.json({ deleted: rows[0].id, full_name: rows[0].full_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
