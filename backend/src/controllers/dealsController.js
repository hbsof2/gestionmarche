const pool = require("../config/db");
const tableExists = require("../utils/tableExists");

async function getAll(req, res) {
  const { page = 1, search = "" } = req.query;
  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;
  try {
    const pattern = `%${search}%`;
    const [{ rows: data }, { rows: countRows }] = await Promise.all([
      pool.query(
        `SELECT d.*, c.designation AS contractor_designation, c.full_name AS contractor_name,
                a.name AS authority_name
         FROM deals d
         JOIN contractors c ON c.id = d.contractor_id
         JOIN contracting_authorities a ON a.id = d.authority_id
         WHERE d.reference ILIKE $1
         ORDER BY d.id ASC LIMIT $2 OFFSET $3`,
        [pattern, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM deals WHERE reference ILIKE $1`,
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
      `SELECT d.*, c.designation AS contractor_designation, c.full_name AS contractor_name,
              a.name AS authority_name
       FROM deals d
       JOIN contractors c ON c.id = d.contractor_id
       JOIN contracting_authorities a ON a.id = d.authority_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الصفقة غير موجودة" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validate(body) {
  const { reference, contractor_id, authority_id, start_date, end_date } = body;
  if (!reference?.trim()) return "مرجع الصفقة مطلوب";
  if (!contractor_id) return "المتعامل المتعاقد مطلوب";
  if (!authority_id) return "المصلحة المتعاقدة مطلوبة";
  if (!start_date) return "تاريخ بداية الصفقة مطلوب";
  if (!end_date) return "تاريخ نهاية الصفقة مطلوب";
  if (new Date(end_date) <= new Date(start_date)) return "يجب أن يكون تاريخ النهاية بعد تاريخ البداية";
  return null;
}

async function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { reference, contractor_id, authority_id, start_date, end_date, total_amount } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO deals (reference, contractor_id, authority_id, start_date, end_date, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [reference.trim(), contractor_id, authority_id, start_date, end_date, total_amount || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "مرجع الصفقة موجود مسبقاً" });
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { reference, contractor_id, authority_id, start_date, end_date, total_amount } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE deals
       SET reference=$1, contractor_id=$2, authority_id=$3, start_date=$4, end_date=$5, total_amount=$6
       WHERE id=$7 RETURNING *`,
      [reference.trim(), contractor_id, authority_id, start_date, end_date, total_amount || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الصفقة غير موجودة" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "مرجع الصفقة موجود مسبقاً" });
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const { rows: linkedRows } = await pool.query(
      "SELECT COUNT(*) FROM deal_branches WHERE deal_id = $1",
      [req.params.id]
    );
    if (parseInt(linkedRows[0].count) > 0) {
      return res.status(400).json({ error: "لا يمكن حذف هذه الصفقة لأنها تحتوي على فروع مصلحة مرتبطة بها، قم بحذف الفروع أولاً" });
    }
    if (await tableExists(pool, "receipts")) {
      const { rows: receiptRows } = await pool.query(
        "SELECT COUNT(*) FROM receipts WHERE deal_id = $1",
        [req.params.id]
      );
      if (parseInt(receiptRows[0].count) > 0) {
        return res.status(400).json({ error: "لا يمكن حذف هذه الصفقة لأنها تحتوي على وصولات مرتبطة بها" });
      }
    }
    const { rows } = await pool.query(
      "DELETE FROM deals WHERE id=$1 RETURNING id, reference",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الصفقة غير موجودة" });
    res.json({ deleted: rows[0].id, reference: rows[0].reference });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDealBranches(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT db.id, db.deal_id, db.branch_id, db.created_at,
              b.name, b.wilaya, b.commune, b.phone
       FROM deal_branches db
       JOIN authority_branches b ON b.id = db.branch_id
       WHERE db.deal_id = $1
       ORDER BY db.id ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addBranchToDeal(req, res) {
  const { branch_id } = req.body;
  if (!branch_id) return res.status(400).json({ error: "الفرع مطلوب" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO deal_branches (deal_id, branch_id) VALUES ($1, $2) RETURNING *`,
      [req.params.id, branch_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "هذا الفرع مضاف مسبقاً للصفقة" });
    res.status(500).json({ error: err.message });
  }
}

async function removeBranchFromDeal(req, res) {
  try {
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) FROM deal_branches WHERE deal_id = $1",
      [req.params.id]
    );
    if (parseInt(countRows[0].count) <= 1) {
      return res.status(400).json({ error: "يجب أن تحتوي الصفقة على فرع واحد على الأقل" });
    }
    const { rows } = await pool.query(
      "DELETE FROM deal_branches WHERE deal_id = $1 AND branch_id = $2 RETURNING id",
      [req.params.id, req.params.branchId]
    );
    if (!rows.length) return res.status(404).json({ error: "الفرع غير موجود في هذه الصفقة" });
    res.json({ deleted: rows[0].id });
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
  getDealBranches,
  addBranchToDeal,
  removeBranchFromDeal,
};
