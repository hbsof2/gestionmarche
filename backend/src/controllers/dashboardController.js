const pool = require("../config/db");

async function getOverallStats(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM deals) AS total_deals,
        (SELECT COUNT(*)::int FROM receipts) AS total_receipts,
        (SELECT COUNT(*)::int FROM invoices) AS total_invoices,
        (SELECT COUNT(*)::int FROM contractors) AS total_contractors,
        (SELECT COUNT(*)::int FROM contracting_authorities) AS total_authorities,
        (SELECT COUNT(*)::int FROM authority_branches) AS total_branches,
        (SELECT COUNT(*)::int FROM raw_materials) AS total_materials,
        (SELECT COUNT(*)::int FROM users WHERE is_active = true) AS total_users
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMonthlyActivity(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count, 'receipt' AS type
      FROM receipts
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month

      UNION ALL

      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count, 'invoice' AS type
      FROM invoices
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month

      UNION ALL

      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count, 'deal' AS type
      FROM deals
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month

      ORDER BY month DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRecentActivity(req, res) {
  try {
    const [receipts, invoices, deals] = await Promise.all([
      pool.query(`
        SELECT r.id, r.reference, r.receipt_date,
          c.full_name AS contractor_name,
          ab.name AS branch_name,
          'receipt' AS type
        FROM receipts r
        JOIN contractors c ON r.contractor_id = c.id
        JOIN authority_branches ab ON r.branch_id = ab.id
        ORDER BY r.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT i.id, i.reference, i.invoice_date,
          c.full_name AS contractor_name,
          i.total_ttc,
          'invoice' AS type
        FROM invoices i
        JOIN contractors c ON i.contractor_id = c.id
        ORDER BY i.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT d.id, d.reference, d.start_date, d.end_date,
          c.full_name AS contractor_name,
          'deal' AS type
        FROM deals d
        JOIN contractors c ON d.contractor_id = c.id
        ORDER BY d.created_at DESC LIMIT 5
      `),
    ]);

    res.json({
      receipts: receipts.rows,
      invoices: invoices.rows,
      deals: deals.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAlerts(req, res) {
  try {
    const [expiringDeals, lowQuantityMaterials] = await Promise.all([
      pool.query(`
        SELECT id, reference, end_date,
          EXTRACT(DAY FROM end_date - CURRENT_DATE)::int AS days_left,
          'expiring_deal' AS type
        FROM deals
        WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        ORDER BY end_date ASC
      `),
      pool.query(`
        SELECT
          rm.name_ar,
          d.reference AS deal_reference,
          dis.remaining_qty,
          dis.initial_max_qty,
          ROUND((dis.remaining_qty / dis.initial_max_qty) * 100)::int AS percentage,
          'low_quantity' AS type
        FROM deal_items_snapshot dis
        JOIN raw_materials rm ON dis.material_id = rm.id
        JOIN deals d ON dis.deal_id = d.id
        WHERE dis.initial_max_qty > 0
          AND (dis.remaining_qty / dis.initial_max_qty) <= 0.10
          AND dis.remaining_qty > 0
        ORDER BY percentage ASC
      `),
    ]);

    res.json({
      expiring_deals: expiringDeals.rows,
      low_quantity_materials: lowQuantityMaterials.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMaterialsDistribution(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        mc.name_ar AS category,
        COUNT(di.id)::int AS count
      FROM material_categories mc
      LEFT JOIN deal_items di ON di.category_id = mc.id
      GROUP BY mc.name_ar
      ORDER BY count DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getOverallStats,
  getMonthlyActivity,
  getRecentActivity,
  getAlerts,
  getMaterialsDistribution,
};
