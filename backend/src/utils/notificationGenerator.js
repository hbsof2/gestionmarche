async function generateNotifications(pool) {
  const client = await pool.connect();
  try {
    const admins = await client.query(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true`
    );
    const adminIds = admins.rows.map((a) => a.id);
    if (adminIds.length === 0) return;

    // ═══════════════════════════════
    // CHECK 1: Low remaining quantities (<= 10%)
    // ═══════════════════════════════
    const lowQtyItems = await client.query(`
      SELECT
        dis.remaining_qty,
        dis.initial_max_qty,
        rm.name_ar,
        d.reference AS deal_reference,
        d.id AS deal_id
      FROM deal_items_snapshot dis
      JOIN raw_materials rm ON dis.material_id = rm.id
      JOIN deals d ON dis.deal_id = d.id
      WHERE dis.remaining_qty > 0
        AND dis.initial_max_qty > 0
        AND (dis.remaining_qty / dis.initial_max_qty) <= 0.10
    `);

    for (const item of lowQtyItems.rows) {
      const percentage = Math.round(
        (item.remaining_qty / item.initial_max_qty) * 100
      );

      const exists = await client.query(
        `SELECT id FROM notifications
         WHERE type = 'warning'
           AND message LIKE $1
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [`%${item.name_ar}%${item.deal_reference}%`]
      );

      if (exists.rows.length === 0) {
        for (const adminId of adminIds) {
          await client.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              adminId,
              "كمية منخفضة",
              `المادة "${item.name_ar}" في صفقة ${item.deal_reference} وصلت كميتها المتبقية إلى ${percentage}% فقط`,
              "warning",
              `/deals/${item.deal_id}`,
            ]
          );
        }
      }
    }

    // ═══════════════════════════════
    // CHECK 2: Deals expiring within 7 days
    // ═══════════════════════════════
    const expiringDeals = await client.query(`
      SELECT id, reference, end_date
      FROM deals
      WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `);

    for (const deal of expiringDeals.rows) {
      const daysLeft = Math.ceil(
        (new Date(deal.end_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const exists = await client.query(
        `SELECT id FROM notifications
         WHERE type = 'alert'
           AND message LIKE $1
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [`%${deal.reference}%`]
      );

      if (exists.rows.length === 0) {
        for (const adminId of adminIds) {
          await client.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              adminId,
              "صفقة تنتهي قريباً",
              `صفقة ${deal.reference} ستنتهي خلال ${daysLeft} أيام (${new Date(
                deal.end_date
              ).toLocaleDateString("ar-DZ")})`,
              "alert",
              `/deals/${deal.id}`,
            ]
          );
        }
      }
    }

    // ═══════════════════════════════
    // CHECK 3: No backup in last 7 days
    // ═══════════════════════════════
    const lastBackup = await client.query(`
      SELECT created_at FROM backups
      ORDER BY created_at DESC LIMIT 1
    `);

    const shouldNotifyBackup =
      lastBackup.rows.length === 0 ||
      Date.now() - new Date(lastBackup.rows[0].created_at).getTime() >
        7 * 24 * 60 * 60 * 1000;

    if (shouldNotifyBackup) {
      const exists = await client.query(
        `SELECT id FROM notifications
         WHERE type = 'backup'
           AND created_at > NOW() - INTERVAL '24 hours'`
      );

      if (exists.rows.length === 0) {
        for (const adminId of adminIds) {
          await client.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              adminId,
              "نسخة احتياطية مطلوبة",
              "لم يتم إنشاء نسخة احتياطية منذ أكثر من 7 أيام. يُنصح بإنشاء نسخة الآن.",
              "backup",
              "/database-backup",
            ]
          );
        }
      }
    }

    // ═══════════════════════════════
    // DELETE old read notifications (older than 30 days)
    // ═══════════════════════════════
    await client.query(
      `DELETE FROM notifications
       WHERE is_read = true
         AND created_at < NOW() - INTERVAL '30 days'`
    );
  } finally {
    client.release();
  }
}

module.exports = generateNotifications;
