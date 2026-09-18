const pool = require("../config/db");

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const unreadCount = rows.filter((n) => !n.is_read).length;
    res.json({ data: rows, unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUnreadCount(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الإشعار غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const { rows } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "الإشعار غير موجود" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeAll(req, res) {
  try {
    await pool.query(
      `DELETE FROM notifications WHERE user_id = $1 AND is_read = true`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAll,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  removeAll,
};
