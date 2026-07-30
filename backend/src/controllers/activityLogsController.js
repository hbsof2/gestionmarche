const pool = require("../config/db");

async function getUsers(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT user_id, username, full_name
       FROM activity_logs
       ORDER BY full_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUserLogs(req, res) {
  const { userId } = req.params;
  const { date } = req.query;
  try {
    const { rows: userRows } = await pool.query(
      "SELECT id, username, full_name FROM users WHERE id = $1",
      [userId]
    );
    if (!userRows.length) return res.status(404).json({ error: "المستخدم غير موجود" });

    const params = [userId];
    let dateCondition;
    if (date) {
      params.push(date);
      dateCondition = `AND DATE(created_at AT TIME ZONE 'Africa/Algiers') = $2::date`;
    } else {
      dateCondition = `AND created_at >= NOW() - INTERVAL '3 days'`;
    }

    const { rows } = await pool.query(
      `SELECT
        DATE(created_at AT TIME ZONE 'Africa/Algiers') AS log_date,
        action_type,
        action,
        section,
        details,
        to_char(created_at AT TIME ZONE 'Africa/Algiers', 'HH24:MI:SS') AS local_time
       FROM activity_logs
       WHERE user_id = $1
         ${dateCondition}
       ORDER BY created_at DESC`,
      params
    );

    const logsByDate = {};
    for (const row of rows) {
      if (!logsByDate[row.log_date]) logsByDate[row.log_date] = [];
      logsByDate[row.log_date].push({
        action_type: row.action_type,
        action: row.action,
        section: row.section,
        local_time: row.local_time,
        details: row.details,
      });
    }

    const summary = rows.reduce(
      (acc, row) => {
        acc.total_actions += 1;
        if (row.action_type === "login") acc.logins += 1;
        if (row.action_type === "update") acc.updates += 1;
        if (row.action_type === "delete") acc.deletes += 1;
        return acc;
      },
      { total_actions: 0, logins: 0, updates: 0, deletes: 0 }
    );

    res.json({
      user: userRows[0],
      logs_by_date: logsByDate,
      summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllLogs(req, res) {
  const { limit: limitParam } = req.query;
  const limit = limitParam ? Math.min(parseInt(limitParam), 500) : 100;
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, username, full_name, action_type, action, section, details, ip_address, created_at
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getUsers, getUserLogs, getAllLogs };
