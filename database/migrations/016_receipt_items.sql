-- ============================================================
-- Migration: 016_receipt_items
-- Table: receipt_items (المواد الأولية للوصل)
-- ============================================================

-- 1. Table
CREATE TABLE receipt_items (
  id              SERIAL PRIMARY KEY,
  receipt_id      INTEGER NOT NULL REFERENCES receipts(id) ON DELETE RESTRICT,
  deal_item_id    INTEGER NOT NULL REFERENCES deal_items(id) ON DELETE RESTRICT,
  material_id     INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity        NUMERIC(15, 3) NOT NULL,
  unit_price      NUMERIC(15, 2) NOT NULL,
  tva             NUMERIC(5, 2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(receipt_id, material_id)
);

COMMENT ON TABLE receipt_items IS 'جدول المواد الأولية للوصل';

-- 2. Indexes
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items (receipt_id);
CREATE INDEX idx_receipt_items_deal_item_id ON receipt_items (deal_item_id);
CREATE INDEX idx_receipt_items_material_id ON receipt_items (material_id);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_receipt_items_updated_at
BEFORE UPDATE ON receipt_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON receipt_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
