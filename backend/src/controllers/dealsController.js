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
    const { rows: itemRows } = await pool.query(
      "SELECT COUNT(*) FROM deal_items WHERE deal_id = $1",
      [req.params.id]
    );
    if (parseInt(itemRows[0].count) > 0) {
      return res.status(400).json({ error: "لا يمكن حذف هذه الصفقة لأنها تحتوي على مواد أولية مسجلة، قم بحذف المواد أولاً" });
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

function validateDealItemNumbers(body) {
  const { tva, max_quantity, min_quantity, unit_price } = body;
  if (tva === undefined || tva === null || tva === "") return "نسبة الضريبة على القيمة المضافة مطلوبة";
  if (Number(tva) < 0 || Number(tva) > 100) return "يجب أن تكون نسبة الضريبة بين 0 و 100";
  if (min_quantity === undefined || min_quantity === null || min_quantity === "") return "الكمية الدنيا مطلوبة";
  if (Number(min_quantity) < 0) return "يجب أن تكون الكمية الدنيا أكبر من أو تساوي 0";
  if (max_quantity === undefined || max_quantity === null || max_quantity === "") return "الكمية القصوى مطلوبة";
  if (Number(max_quantity) <= Number(min_quantity)) return "يجب أن تكون الكمية القصوى أكبر من الكمية الدنيا";
  if (unit_price === undefined || unit_price === null || unit_price === "") return "السعر الوحدوي مطلوب";
  if (Number(unit_price) <= 0) return "يجب أن يكون السعر الوحدوي أكبر من 0";
  return null;
}

function validateDealItem(body) {
  if (!body.material_id) return "المادة الأولية مطلوبة";
  if (!body.category_id) return "الصنف مطلوب";
  return validateDealItemNumbers(body);
}

async function getDealItems(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT di.*, rm.name_ar, rm.name_lat, rm.unit, mc.name_ar AS category_name
       FROM deal_items di
       JOIN raw_materials rm ON rm.id = di.material_id
       JOIN material_categories mc ON mc.id = di.category_id
       WHERE di.deal_id = $1
       ORDER BY di.id ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addDealItem(req, res) {
  const error = validateDealItem(req.body);
  if (error) return res.status(400).json({ error });
  const { material_id, category_id, tva, max_quantity, min_quantity, unit_price } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO deal_items (deal_id, material_id, category_id, tva, max_quantity, min_quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, material_id, category_id, tva, max_quantity, min_quantity, unit_price]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "هذه المادة الأولية مضافة مسبقاً لهذه الصفقة" });
    res.status(500).json({ error: err.message });
  }
}

async function updateDealItem(req, res) {
  const error = validateDealItemNumbers(req.body);
  if (error) return res.status(400).json({ error });
  const { category_id, tva, max_quantity, min_quantity, unit_price } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE deal_items
       SET tva=$1, max_quantity=$2, min_quantity=$3, unit_price=$4, category_id=COALESCE($5, category_id)
       WHERE id=$6 AND deal_id=$7 RETURNING *`,
      [tva, max_quantity, min_quantity, unit_price, category_id || null, req.params.itemId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المادة غير موجودة في هذه الصفقة" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeDealItem(req, res) {
  try {
    const { rows } = await pool.query(
      "DELETE FROM deal_items WHERE id=$1 AND deal_id=$2 RETURNING id",
      [req.params.itemId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "المادة غير موجودة في هذه الصفقة" });
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
  getDealItems,
  addDealItem,
  updateDealItem,
  removeDealItem,
};
