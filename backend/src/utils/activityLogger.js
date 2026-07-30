async function logActivity(client, {
  userId,
  username,
  fullName,
  actionType,
  action,
  section,
  details = null,
  ipAddress = null,
}) {
  try {
    await client.query(
      `INSERT INTO activity_logs
       (user_id, username, full_name, action_type, action, section, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, username, fullName, actionType, action, section, details, ipAddress]
    );
  } catch (error) {
    console.error("Activity log error:", error);
  }
}

module.exports = logActivity;
