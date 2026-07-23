async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

module.exports = tableExists;
