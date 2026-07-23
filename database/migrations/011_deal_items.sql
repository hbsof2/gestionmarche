-- ============================================================
-- Migration: 011_deal_items
-- Table: deal_items (المواد الأولية للصفقة)
-- ============================================================

-- 1. Table
CREATE TABLE deal_items (
  id              SERIAL PRIMARY KEY,
  deal_id         INTEGER NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  material_id     INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  category_id     INTEGER NOT NULL REFERENCES material_categories(id) ON DELETE RESTRICT,
  tva             NUMERIC(5, 2) NOT NULL,
  max_quantity    NUMERIC(15, 3) NOT NULL,
  min_quantity    NUMERIC(15, 3) NOT NULL,
  unit_price      NUMERIC(15, 2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, material_id)
);

COMMENT ON TABLE deal_items IS 'جدول المواد الأولية للصفقة';

-- 2. Indexes
CREATE INDEX idx_deal_items_deal_id ON deal_items (deal_id);
CREATE INDEX idx_deal_items_material_id ON deal_items (material_id);
CREATE INDEX idx_deal_items_category_id ON deal_items (category_id);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_deal_items_updated_at
BEFORE UPDATE ON deal_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON deal_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
