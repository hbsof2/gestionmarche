async function createDealSnapshot(client, dealId) {
  const existing = await client.query(
    "SELECT COUNT(*) FROM deal_items_snapshot WHERE deal_id = $1",
    [dealId]
  );
  if (parseInt(existing.rows[0].count) > 0) return;

  const items = await client.query(
    "SELECT id, deal_id, material_id, min_quantity, max_quantity FROM deal_items WHERE deal_id = $1",
    [dealId]
  );

  for (const item of items.rows) {
    await client.query(
      `INSERT INTO deal_items_snapshot
        (deal_id, deal_item_id, material_id, initial_min_qty, initial_max_qty, remaining_qty)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [dealId, item.id, item.material_id, item.min_quantity, item.max_quantity]
    );
  }
}

module.exports = createDealSnapshot;
