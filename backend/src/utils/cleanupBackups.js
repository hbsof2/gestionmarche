const fs = require("fs");

async function cleanupOldBackups(pool) {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, filename, file_path FROM backups WHERE created_at < $1`,
        [fiveDaysAgo.toISOString()]
      );

      for (const backup of result.rows) {
        try {
          if (fs.existsSync(backup.file_path)) {
            fs.unlinkSync(backup.file_path);
          }
        } catch (e) {
          console.error(`Failed to delete file: ${backup.file_path}`);
        }

        await client.query("DELETE FROM backups WHERE id = $1", [backup.id]);
      }

      if (result.rows.length > 0) {
        console.log(`Cleaned up ${result.rows.length} old backups`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Backup cleanup error:", error);
  }
}

module.exports = cleanupOldBackups;
