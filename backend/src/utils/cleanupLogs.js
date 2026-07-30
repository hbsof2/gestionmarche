async function cleanupOldLogs(client) {
  try {
    await client.query(
      `DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '3 days'`
    );
  } catch (error) {
    console.error("Cleanup logs error:", error);
  }
}

module.exports = cleanupOldLogs;
