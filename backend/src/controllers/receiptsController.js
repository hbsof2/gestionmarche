const pool = require("../config/db");
const tableExists = require("../utils/tableExists");
const createDealSnapshot = require("../utils/dealSnapshot");

const FULL_SELECT = `
  SELECT r.*, d.reference AS deal_reference,
         c.full_name AS contractor_name,
         a.name AS authority_name,
         b.name AS branch_name,
         u.full_name AS created_by_name
  FROM receipts r
  JOIN deals d ON d.id = r.deal_id
  JOIN contractors c ON c.id = r.contractor_id
  JOIN contracting_authorities a ON a.id = r.authority_id
  JOIN authority_branches b ON b.id = r.branch_id
  LEFT JOIN users u ON u.id = r.created_by
`;

async function getAll(req, res) {
  const { page = 1, search = "" } = req.query;
  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;
  try {
    const pattern = `%${search}%`;
    const [{ rows: data }, { rows: countRows }] = await Promise.all([
      pool.query(
        `${FULL_SELECT} WHERE r.reference ILIKE $1 ORDER BY r.id ASC LIMIT $2 OFFSET $3`,
        [pattern, limit, offset]
      ),
      pool.query(
        "SELECT COUNT(*) FROM receipts WHERE reference ILIKE $1",
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
      `${FULL_SELECT} WHERE r.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الوصل غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDealsByContractorAndAuthority(req, res) {
  const { contractor_id, authority_id } = req.query;
  if (!contractor_id || !authority_id) {
    return res.status(400).json({ error: "المتعامل المتعاقد والمصلحة المتعاقدة مطلوبان" });
  }
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT d.*
       FROM deals d
       WHERE d.contractor_id = $1 AND d.authority_id = $2
         AND EXISTS (SELECT 1 FROM deal_items di WHERE di.deal_id = d.id)
         AND EXISTS (SELECT 1 FROM deal_branches db WHERE db.deal_id = d.id)
       ORDER BY d.id ASC`,
      [contractor_id, authority_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDealBranchesForReceipt(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*
       FROM deal_branches db
       JOIN authority_branches b ON b.id = db.branch_id
       WHERE db.deal_id = $1
       ORDER BY b.id ASC`,
      [req.params.dealId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getNextCounter(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT COALESCE(MAX(counter), 0) + 1 AS next_counter FROM receipts WHERE deal_id = $1",
      [req.params.dealId]
    );
    res.json({ next_counter: rows[0].next_counter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validate(body) {
  const { deal_id, contractor_id, authority_id, branch_id, receipt_date } = body;
  if (!deal_id) return "الصفقة مطلوبة";
  if (!contractor_id) return "المتعامل المتعاقد مطلوب";
  if (!authority_id) return "المصلحة المتعاقدة مطلوبة";
  if (!branch_id) return "فرع المصلحة مطلوب";
  if (!receipt_date) return "تاريخ الوصل مطلوب";
  return null;
}

async function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { deal_id, contractor_id, authority_id, branch_id, receipt_date } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: dealRows } = await client.query(
      "SELECT reference FROM deals WHERE id = $1",
      [deal_id]
    );
    if (!dealRows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "الصفقة غير موجودة" });
    }

    const { rows: counterRows } = await client.query(
      "SELECT COALESCE(MAX(counter), 0) + 1 AS next_counter FROM receipts WHERE deal_id = $1",
      [deal_id]
    );
    const counter = counterRows[0].next_counter;
    const reference = `${dealRows[0].reference}-${counter}`;

    await createDealSnapshot(client, deal_id);

    const { rows } = await client.query(
      `INSERT INTO receipts (reference, deal_id, contractor_id, authority_id, branch_id, receipt_date, counter, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [reference, deal_id, contractor_id, authority_id, branch_id, receipt_date, counter, req.user.id]
    );

    await client.query("COMMIT");

    const { rows: fullRows } = await pool.query(
      `${FULL_SELECT} WHERE r.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(fullRows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return res.status(400).json({ error: "رمز الوصل موجود مسبقاً" });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function update(req, res) {
  const { receipt_date, branch_id } = req.body;
  if (!receipt_date) return res.status(400).json({ error: "تاريخ الوصل مطلوب" });
  if (!branch_id) return res.status(400).json({ error: "فرع المصلحة مطلوب" });
  try {
    const { rows } = await pool.query(
      "UPDATE receipts SET receipt_date=$1, branch_id=$2 WHERE id=$3 RETURNING id",
      [receipt_date, branch_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الوصل غير موجود" });

    const { rows: fullRows } = await pool.query(
      `${FULL_SELECT} WHERE r.id = $1`,
      [rows[0].id]
    );
    res.json(fullRows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    if (await tableExists(pool, "receipt_items")) {
      const { rows: itemRows } = await pool.query(
        "SELECT COUNT(*) FROM receipt_items WHERE receipt_id = $1",
        [req.params.id]
      );
      if (parseInt(itemRows[0].count) > 0) {
        return res.status(400).json({ error: "لا يمكن حذف هذا الوصل لأنه يحتوي على مواد مسجلة" });
      }
    }
    const { rows } = await pool.query(
      "DELETE FROM receipts WHERE id=$1 RETURNING id, reference",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الوصل غير موجود" });
    res.json({ deleted: rows[0].id, reference: rows[0].reference });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAll,
  getById,
  getDealsByContractorAndAuthority,
  getDealBranchesForReceipt,
  getNextCounter,
  create,
  update,
  remove,
};
