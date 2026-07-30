const pool = require("../config/db");
const logActivity = require("../utils/activityLogger");

const FULL_SELECT = `
  SELECT i.*, d.reference AS deal_reference,
         c.full_name AS contractor_name,
         a.name AS authority_name,
         u.full_name AS created_by_name
  FROM invoices i
  JOIN deals d ON d.id = i.deal_id
  JOIN contractors c ON c.id = i.contractor_id
  JOIN contracting_authorities a ON a.id = i.authority_id
  LEFT JOIN users u ON u.id = i.created_by
`;

async function getAll(req, res) {
  const { search = "", contractor_id, authority_id, deal_id } = req.query;
  try {
    const conditions = ["i.reference ILIKE $1"];
    const params = [`%${search}%`];

    if (contractor_id) { params.push(contractor_id); conditions.push(`i.contractor_id = $${params.length}`); }
    if (authority_id) { params.push(authority_id); conditions.push(`i.authority_id = $${params.length}`); }
    if (deal_id) { params.push(deal_id); conditions.push(`i.deal_id = $${params.length}`); }

    const hasFilters = Boolean(contractor_id || authority_id || deal_id);
    const whereClause = conditions.join(" AND ");
    const limitClause = hasFilters ? "" : " LIMIT 10";

    const { rows } = await pool.query(
      `${FULL_SELECT} WHERE ${whereClause} ORDER BY i.created_at DESC${limitClause}`,
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
    const { rows } = await pool.query(`${FULL_SELECT} WHERE i.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "الفاتورة غير موجودة" });
    const invoice = rows[0];

    const [{ rows: contractorRows }, { rows: authorityRows }, { rows: items }] = await Promise.all([
      pool.query("SELECT * FROM contractors WHERE id = $1", [invoice.contractor_id]),
      pool.query("SELECT * FROM contracting_authorities WHERE id = $1", [invoice.authority_id]),
      pool.query("SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id", [invoice.id]),
    ]);

    res.json({
      ...invoice,
      contractor: contractorRows[0] || null,
      authority: authorityRows[0] || null,
      items,
    });
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
         AND EXISTS (
           SELECT 1 FROM receipts r
           JOIN receipt_items ri ON ri.receipt_id = r.id
           WHERE r.deal_id = d.id
         )
       ORDER BY d.id ASC`,
      [contractor_id, authority_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function fetchCumulativeItems(queryable, dealId, startDate, endDate, categoryIds = null) {
  const params = [dealId, startDate, endDate];
  let categoryFilter = "";
  if (categoryIds && categoryIds.length) {
    params.push(categoryIds);
    categoryFilter = `AND mc.id = ANY($${params.length}::int[])`;
  }

  const { rows } = await queryable.query(
    `SELECT
      rm.id AS material_id,
      rm.name_ar,
      rm.name_lat,
      rm.unit,
      mc.name_ar AS category_name,
      mc.id AS category_id,
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
       AND r.receipt_date >= $2
       AND r.receipt_date <= $3
       ${categoryFilter}
     GROUP BY rm.id, rm.name_ar, rm.name_lat, rm.unit, mc.name_ar, mc.id, ri.unit_price, ri.tva
     ORDER BY mc.name_ar, rm.name_ar`,
    params
  );
  return rows;
}

function parseCategoryIds(raw) {
  if (!raw) return null;
  const list = Array.isArray(raw) ? raw : String(raw).split(",");
  const ids = list.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
  return ids.length ? ids : null;
}

async function getDealCategories(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT mc.id, mc.name_ar, mc.name_lat
       FROM deal_items di
       JOIN material_categories mc ON di.category_id = mc.id
       WHERE di.deal_id = $1
       ORDER BY mc.name_ar`,
      [req.params.dealId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCumulativeItemsForInvoice(req, res) {
  const { deal_id, start_date, end_date, category_ids } = req.query;
  if (!deal_id || !start_date || !end_date) {
    return res.status(400).json({ error: "يرجى تحديد الصفقة وتاريخ البداية وتاريخ النهاية" });
  }
  const categoryIds = parseCategoryIds(category_ids);
  try {
    const { rows: dealRows } = await pool.query(
      "SELECT reference, start_date, end_date FROM deals WHERE id = $1",
      [deal_id]
    );
    if (!dealRows.length) return res.status(404).json({ error: "الصفقة غير موجودة" });

    const [{ rows: contractorRows }, { rows: authorityRows }, items] = await Promise.all([
      pool.query(
        `SELECT c.* FROM contractors c JOIN deals d ON d.contractor_id = c.id WHERE d.id = $1`,
        [deal_id]
      ),
      pool.query(
        `SELECT ca.* FROM contracting_authorities ca JOIN deals d ON d.authority_id = ca.id WHERE d.id = $1`,
        [deal_id]
      ),
      fetchCumulativeItems(pool, deal_id, start_date, end_date, categoryIds),
    ]);

    res.json({
      items,
      contractor: contractorRows[0] || null,
      authority: authorityRows[0] || null,
      deal: dealRows[0],
      period: { start_date, end_date },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function validateCreate(body) {
  const { deal_id, contractor_id, authority_id, start_date, end_date } = body;
  if (!deal_id) return "الصفقة مطلوبة";
  if (!contractor_id) return "المتعامل المتعاقد مطلوب";
  if (!authority_id) return "المصلحة المتعاقدة مطلوبة";
  if (!start_date) return "تاريخ البداية مطلوب";
  if (!end_date) return "تاريخ النهاية مطلوب";
  if (start_date > end_date) return "يجب أن يكون تاريخ البداية قبل تاريخ النهاية";
  return null;
}

async function create(req, res) {
  const error = validateCreate(req.body);
  if (error) return res.status(400).json({ error });
  const { deal_id, contractor_id, authority_id, start_date, end_date, category_ids } = req.body;
  const categoryIds = parseCategoryIds(category_ids);

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

    const items = await fetchCumulativeItems(client, deal_id, start_date, end_date, categoryIds);

    if (!items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: categoryIds
          ? "لا توجد مواد موزعة تابعة للأصناف المختارة في هذه الفترة"
          : "لا توجد مواد موزعة في هذه الفترة لإنشاء فاتورة",
      });
    }

    const { rows: counterRows } = await client.query(
      "SELECT COALESCE(MAX(counter), 0) + 1 AS next_counter FROM invoices WHERE deal_id = $1",
      [deal_id]
    );
    const counter = counterRows[0].next_counter;
    const reference = `${dealRows[0].reference}-F${counter}`;

    const totals = items.reduce(
      (acc, item) => ({
        ht: acc.ht + Number(item.total_ht),
        ttc: acc.ttc + Number(item.total_ttc),
      }),
      { ht: 0, ttc: 0 }
    );

    const { rows: invoiceRows } = await client.query(
      `INSERT INTO invoices
        (reference, deal_id, contractor_id, authority_id, start_date, end_date, counter, total_ht, total_ttc, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [reference, deal_id, contractor_id, authority_id, start_date, end_date, counter, totals.ht, totals.ttc, req.user.id]
    );
    const invoiceId = invoiceRows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items
          (invoice_id, material_id, name_ar, name_lat, unit, category_name, total_quantity, unit_price, tva, total_ht, total_ttc)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          invoiceId,
          item.material_id,
          item.name_ar,
          item.name_lat,
          item.unit,
          item.category_name,
          item.total_quantity,
          item.unit_price,
          item.tva,
          item.total_ht,
          item.total_ttc,
        ]
      );
    }

    await client.query("COMMIT");

    const { rows: fullRows } = await pool.query(`${FULL_SELECT} WHERE i.id = $1`, [invoiceId]);
    res.status(201).json(fullRows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return res.status(400).json({ error: "رمز الفاتورة موجود مسبقاً" });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function remove(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT created_by, reference FROM invoices WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "الفاتورة غير موجودة" });
    }
    if (rows[0].created_by !== req.user.id && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "لا يمكنك حذف هذه الفاتورة لأنها أنشئت بواسطة مستخدم آخر",
      });
    }

    await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM invoices WHERE id = $1", [req.params.id]);

    await client.query("COMMIT");

    await logActivity(pool, {
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      actionType: "delete",
      action: `حذف فاتورة: ${rows[0].reference}`,
      section: "invoices",
      ipAddress: req.ip,
    });

    res.json({ deleted: Number(req.params.id), reference: rows[0].reference });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getAll,
  getFilterOptions,
  getById,
  getDealsByContractorAndAuthority,
  getDealCategories,
  getCumulativeItemsForInvoice,
  create,
  remove,
};
