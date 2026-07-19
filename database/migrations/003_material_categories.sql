-- ============================================================
-- Migration: 003_material_categories
-- Table: material_categories (أصناف المواد الأولية)
-- ============================================================

-- 1. Table
CREATE TABLE material_categories (
  id          SERIAL PRIMARY KEY,
  name_ar     TEXT NOT NULL,
  name_lat    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE material_categories IS 'جدول أصناف المواد الأولية';

-- 2. Index on name_ar for faster search
CREATE INDEX idx_material_categories_name_ar ON material_categories (name_ar);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_material_categories_updated_at
BEFORE UPDATE ON material_categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON material_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
