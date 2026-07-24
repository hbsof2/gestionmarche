-- ============================================================
-- Migration: 012_deal_items_snapshot
-- Table: deal_items_snapshot (الكميات الابتدائية والمتبقية لكل مادة في الصفقة)
-- ============================================================

-- 1. Table
CREATE TABLE deal_items_snapshot (
  id              SERIAL PRIMARY KEY,
  deal_id         INTEGER NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  deal_item_id    INTEGER NOT NULL REFERENCES deal_items(id) ON DELETE RESTRICT,
  material_id     INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  initial_min_qty NUMERIC(15, 3) NOT NULL,
  initial_max_qty NUMERIC(15, 3) NOT NULL,
  remaining_qty   NUMERIC(15, 3) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, deal_item_id)
);

COMMENT ON TABLE deal_items_snapshot
IS 'جدول حفظ الكميات الابتدائية والمتبقية لكل مادة في الصفقة';

-- 2. Indexes
CREATE INDEX idx_deal_items_snapshot_deal_id ON deal_items_snapshot (deal_id);
CREATE INDEX idx_deal_items_snapshot_deal_item_id ON deal_items_snapshot (deal_item_id);
CREATE INDEX idx_deal_items_snapshot_material_id ON deal_items_snapshot (material_id);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_deal_items_snapshot_updated_at
BEFORE UPDATE ON deal_items_snapshot
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE deal_items_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON deal_items_snapshot
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
