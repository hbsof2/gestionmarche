const pool = require("../config/db");
const createDealSnapshot = require("../utils/dealSnapshot");

const FULL_SELECT = `
  SELECT r.*, d.reference AS deal_reference,
         c.full_name AS contractor_name,
         c.phone_mobile AS contractor_phone,
         a.name AS authority_name,
         b.name AS branch_name,
         b.wilaya AS branch_wilaya,
         b.commune AS branch_commune,
         u.full_name AS created_by_name
  FROM receipts r
  JOIN deals d ON d.id = r.deal_id
  JOIN contractors c ON c.id = r.contractor_id
  JOIN contracting_authorities a ON a.id = r.authority_id
  JOIN authority_branches b ON b.id = r.branch_id
  LEFT JOIN users u ON u.id = r.created_by
`;

async function getAll(req, res) {
  const { search = "", contractor_id, authority_id, deal_id, branch_id } = req.query;
  try {
    const conditions = ["r.reference ILIKE $1"];
    const params = [`%${search}%`];

    if (contractor_id) { params.push(contractor_id); conditions.push(`r.contractor_id = $${params.length}`); }
    if (authority_id) { params.push(authority_id); conditions.push(`r.authority_id = $${params.length}`); }
    if (deal_id) { params.push(deal_id); conditions.push(`r.deal_id = $${params.length}`); }
    if (branch_id) { params.push(branch_id); conditions.push(`r.branch_id = $${params.length}`); }

    const hasFilters = Boolean(contractor_id || authority_id || deal_id || branch_id);
    const whereClause = conditions.join(" AND ");
    const limitClause = hasFilters ? "" : " LIMIT 10";

    const { rows } = await pool.query(
      `${FULL_SELECT} WHERE ${whereClause} ORDER BY r.created_at DESC${limitClause}`,
      params
    );
    res.json({ data: rows, total: rows.length, filtered: hasFilters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getFilterOptions(req, res) {
  try {
    const [{ rows: contractors }, { rows: authorities }] = await Promise.all([
      pool.query("SELECT id, designation, full_name FROM contractors ORDER BY full_name"),
      pool.query("SELECT id, name FROM contracting_authorities ORDER BY name"),
    ]);
    res.json({ contractors, authorities });
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

async function checkReceiptOwnership(receiptId, req, res, message) {
  const { rows } = await pool.query("SELECT created_by FROM receipts WHERE id = $1", [receiptId]);
  if (!rows.length) {
    res.status(404).json({ error: "الوصل غير موجود" });
    return false;
  }
  if (rows[0].created_by !== req.user.id && req.user.role !== "admin") {
    res.status(403).json({ error: message });
    return false;
  }
  return true;
}

async function update(req, res) {
  const { receipt_date, branch_id } = req.body;
  if (!receipt_date) return res.status(400).json({ error: "تاريخ الوصل مطلوب" });
  if (!branch_id) return res.status(400).json({ error: "فرع المصلحة مطلوب" });
  try {
    if (!(await checkReceiptOwnership(
      req.params.id, req, res,
      "لا يمكنك تعديل هذا الوصل لأنه أنشئ بواسطة مستخدم آخر"
    ))) return;

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
    if (!(await checkReceiptOwnership(
      req.params.id, req, res,
      "لا يمكنك حذف هذا الوصل لأنه أنشئ بواسطة مستخدم آخر"
    ))) return;

    const { rows: itemRows } = await pool.query(
      "SELECT COUNT(*) FROM receipt_items WHERE receipt_id = $1",
      [req.params.id]
    );
    if (parseInt(itemRows[0].count) > 0) {
      return res.status(400).json({
        error: "لا يمكن حذف هذا الوصل لأنه يحتوي على مواد أولية، قم بحذف المواد أولاً",
      });
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

const RECEIPT_ITEMS_SELECT = `
  SELECT
    ri.id,
    ri.receipt_id,
    ri.material_id,
    ri.deal_item_id,
    rm.name_ar,
    rm.name_lat,
    rm.unit,
    mc.name_ar AS category_name,
    ri.quantity,
    ri.unit_price,
    ri.tva,
    (ri.quantity * ri.unit_price) AS total_ht,
    (ri.quantity * ri.unit_price * (1 + ri.tva/100)) AS total_ttc
  FROM receipt_items ri
  JOIN raw_materials rm ON ri.material_id = rm.id
  JOIN deal_items di ON ri.deal_item_id = di.id
  JOIN material_categories mc ON di.category_id = mc.id
`;

async function getReceiptItems(req, res) {
  try {
    const { rows } = await pool.query(
      `${RECEIPT_ITEMS_SELECT} WHERE ri.receipt_id = $1 ORDER BY ri.id`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDealMaterialsForReceipt(req, res) {
  try {
    const { rows: receiptRows } = await pool.query(
      "SELECT deal_id FROM receipts WHERE id = $1",
      [req.params.id]
    );
    if (!receiptRows.length) return res.status(404).json({ error: "الوصل غير موجود" });
    const dealId = receiptRows[0].deal_id;

    const { rows } = await pool.query(
      `SELECT
        di.id AS deal_item_id,
        di.material_id,
        rm.name_ar,
        rm.name_lat,
        rm.unit,
        mc.name_ar AS category_name,
        di.unit_price,
        di.tva,
        di.min_quantity,
        di.max_quantity,
        COALESCE(dis.initial_max_qty, di.max_quantity) AS initial_max_qty,
        COALESCE(dis.remaining_qty, di.max_quantity) AS remaining_qty,
        (ri.id IS NOT NULL) AS already_in_receipt
      FROM deal_items di
      JOIN raw_materials rm ON di.material_id = rm.id
      JOIN material_categories mc ON di.category_id = mc.id
      LEFT JOIN deal_items_snapshot dis ON dis.deal_item_id = di.id
      LEFT JOIN receipt_items ri ON ri.receipt_id = $1 AND ri.material_id = di.material_id
      WHERE di.deal_id = $2
        AND COALESCE(dis.remaining_qty, di.max_quantity) > 0
      ORDER BY rm.name_ar`,
      [req.params.id, dealId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addReceiptItem(req, res) {
  const { deal_item_id, material_id, quantity } = req.body;
  if (!deal_item_id) return res.status(400).json({ error: "المادة الأولية مطلوبة" });
  if (!material_id) return res.status(400).json({ error: "المادة الأولية مطلوبة" });
  if (quantity === undefined || quantity === null || quantity === "" || Number(quantity) <= 0) {
    return res.status(400).json({ error: "الكمية يجب أن تكون أكبر من 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: receiptRows } = await client.query(
      "SELECT deal_id, created_by FROM receipts WHERE id = $1",
      [req.params.id]
    );
    if (!receiptRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "الوصل غير موجود" });
    }
    if (receiptRows[0].created_by !== req.user.id && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "لا يمكنك التعديل على هذا الوصل لأنه أنشئ بواسطة مستخدم آخر",
      });
    }
    const dealId = receiptRows[0].deal_id;

    const { rows: dealItemRows } = await client.query(
      `SELECT di.id, di.unit_price, di.tva, di.max_quantity, rm.unit
       FROM deal_items di
       JOIN raw_materials rm ON rm.id = di.material_id
       WHERE di.id = $1 AND di.deal_id = $2`,
      [deal_item_id, dealId]
    );
    if (!dealItemRows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "المادة الأولية غير موجودة في هذه الصفقة" });
    }
    const dealItem = dealItemRows[0];

    const { rows: existingRows } = await client.query(
      "SELECT id FROM receipt_items WHERE receipt_id = $1 AND material_id = $2",
      [req.params.id, material_id]
    );
    if (existingRows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "هذه المادة الأولية مضافة مسبقاً لهذا الوصل" });
    }

    await createDealSnapshot(client, dealId);

    const { rows: snapshotRows } = await client.query(
      "SELECT remaining_qty FROM deal_items_snapshot WHERE deal_item_id = $1",
      [deal_item_id]
    );
    const remainingQty = snapshotRows.length
      ? Number(snapshotRows[0].remaining_qty)
      : Number(dealItem.max_quantity);

    if (Number(quantity) > remainingQty) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `الكمية المدخلة تتجاوز الكمية المتبقية المتاحة (${remainingQty} ${dealItem.unit})`,
      });
    }

    const { rows: insertRows } = await client.query(
      `INSERT INTO receipt_items (receipt_id, deal_item_id, material_id, quantity, unit_price, tva)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.params.id, deal_item_id, material_id, quantity, dealItem.unit_price, dealItem.tva]
    );

    await client.query(
      "UPDATE deal_items_snapshot SET remaining_qty = remaining_qty - $1 WHERE deal_item_id = $2",
      [quantity, deal_item_id]
    );

    await client.query("COMMIT");

    const { rows: fullRows } = await pool.query(
      `${RECEIPT_ITEMS_SELECT} WHERE ri.id = $1`,
      [insertRows[0].id]
    );
    res.status(201).json(fullRows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return res.status(400).json({ error: "هذه المادة الأولية مضافة مسبقاً لهذا الوصل" });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function updateReceiptItem(req, res) {
  const { quantity } = req.body;
  if (quantity === undefined || quantity === null || quantity === "" || Number(quantity) <= 0) {
    return res.status(400).json({ error: "الكمية يجب أن تكون أكبر من 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: receiptRows } = await client.query(
      "SELECT created_by FROM receipts WHERE id = $1",
      [req.params.id]
    );
    if (!receiptRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "الوصل غير موجود" });
    }
    if (receiptRows[0].created_by !== req.user.id && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "لا يمكنك التعديل على هذا الوصل لأنه أنشئ بواسطة مستخدم آخر",
      });
    }

    const { rows: itemRows } = await client.query(
      `SELECT ri.id, ri.quantity, ri.deal_item_id, rm.unit
       FROM receipt_items ri
       JOIN raw_materials rm ON rm.id = ri.material_id
       WHERE ri.id = $1 AND ri.receipt_id = $2`,
      [req.params.itemId, req.params.id]
    );
    if (!itemRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "المادة غير موجودة في هذا الوصل" });
    }
    const item = itemRows[0];
    const oldQuantity = Number(item.quantity);

    const { rows: snapshotRows } = await client.query(
      "SELECT remaining_qty FROM deal_items_snapshot WHERE deal_item_id = $1",
      [item.deal_item_id]
    );
    const remainingQty = snapshotRows.length ? Number(snapshotRows[0].remaining_qty) : 0;
    const available = remainingQty + oldQuantity;

    if (Number(quantity) > available) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `الكمية المدخلة تتجاوز الكمية المتبقية المتاحة (${available} ${item.unit})`,
      });
    }

    await client.query(
      "UPDATE receipt_items SET quantity = $1 WHERE id = $2",
      [quantity, req.params.itemId]
    );

    const newRemaining = remainingQty + oldQuantity - Number(quantity);
    await client.query(
      "UPDATE deal_items_snapshot SET remaining_qty = $1 WHERE deal_item_id = $2",
      [newRemaining, item.deal_item_id]
    );

    await client.query("COMMIT");

    const { rows: fullRows } = await pool.query(
      `${RECEIPT_ITEMS_SELECT} WHERE ri.id = $1`,
      [req.params.itemId]
    );
    res.json(fullRows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function removeReceiptItem(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: receiptRows } = await client.query(
      "SELECT created_by FROM receipts WHERE id = $1",
      [req.params.id]
    );
    if (!receiptRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "الوصل غير موجود" });
    }
    if (receiptRows[0].created_by !== req.user.id && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "لا يمكنك التعديل على هذا الوصل لأنه أنشئ بواسطة مستخدم آخر",
      });
    }

    const { rows: itemRows } = await client.query(
      "SELECT id, quantity, deal_item_id FROM receipt_items WHERE id = $1 AND receipt_id = $2",
      [req.params.itemId, req.params.id]
    );
    if (!itemRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "المادة غير موجودة في هذا الوصل" });
    }
    const item = itemRows[0];

    await client.query("DELETE FROM receipt_items WHERE id = $1", [item.id]);

    await client.query(
      "UPDATE deal_items_snapshot SET remaining_qty = remaining_qty + $1 WHERE deal_item_id = $2",
      [item.quantity, item.deal_item_id]
    );

    await client.query("COMMIT");
    res.json({ deleted: item.id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function getCumulativeItems(req, res) {
  const { deal_id, branch_id, start_date, end_date } = req.query;
  if (!deal_id || !branch_id || !start_date || !end_date) {
    return res.status(400).json({ error: "يرجى تحديد الصفقة والفرع وتاريخ البداية وتاريخ النهاية" });
  }
  try {
    const { rows: infoRows } = await pool.query(
      `SELECT
        d.reference AS deal_reference,
        ab.name AS branch_name,
        ab.wilaya,
        ab.commune,
        ab.phone AS branch_phone,
        ca.name AS authority_name,
        c.full_name AS contractor_name,
        c.phone_fixed AS contractor_phone
       FROM deals d
       JOIN authority_branches ab ON ab.id = $2
       JOIN contracting_authorities ca ON d.authority_id = ca.id
       JOIN contractors c ON d.contractor_id = c.id
       WHERE d.id = $1`,
      [deal_id, branch_id]
    );
    if (!infoRows.length) return res.status(404).json({ error: "الصفقة غير موجودة" });

    const { rows: items } = await pool.query(
      `SELECT
        rm.name_ar,
        rm.name_lat,
        rm.unit,
        mc.name_ar AS category_name,
        SUM(ri.quantity) AS total_quantity,
        ri.unit_price,
        ri.tva,
        SUM(ri.quantity * ri.unit_price) AS total_ht,
        SUM(ri.quantity * ri.unit_price * (1 + ri.tva/100)) AS total_ttc
       FROM receipt_items ri
       JOIN receipts r ON ri.receipt_id = r.id
       JOIN raw_materials rm ON ri.material_id = rm.id
       JOIN deal_items di ON ri.deal_item_id = di.id
       JOIN material_categories mc ON di.category_id = mc.id
       WHERE r.deal_id = $1
         AND r.branch_id = $2
         AND r.receipt_date >= $3
         AND r.receipt_date <= $4
       GROUP BY rm.name_ar, rm.name_lat, rm.unit, mc.name_ar, ri.unit_price, ri.tva
       ORDER BY rm.name_ar`,
      [deal_id, branch_id, start_date, end_date]
    );

    res.json({
      items,
      info: infoRows[0],
      period: { start_date, end_date },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAll,
  getFilterOptions,
  getById,
  getDealsByContractorAndAuthority,
  getDealBranchesForReceipt,
  getNextCounter,
  getCumulativeItems,
  create,
  update,
  remove,
  getReceiptItems,
  getDealMaterialsForReceipt,
  addReceiptItem,
  updateReceiptItem,
  removeReceiptItem,
};
