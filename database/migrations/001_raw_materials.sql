-- ============================================================
-- Migration: 001_raw_materials
-- Table: raw_materials (المواد الأولية)
-- ============================================================

-- 1. Enum type for measurement units
CREATE TYPE material_unit AS ENUM (
  'كغ',      -- كيلوغرام
  'لتر',     -- لتر
  'و',       -- وحدة
  'علبة',    -- علبة
  'ربطة',    -- ربطة
  'حبة'      -- حبة
);

-- 2. Table
CREATE TABLE raw_materials (
  id           SERIAL PRIMARY KEY,
  name_ar      TEXT NOT NULL,
  name_lat     TEXT,
  description  TEXT,
  unit         material_unit NOT NULL,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE raw_materials IS 'جدول المواد الأولية';

-- 3. Index on name_ar for faster search
CREATE INDEX idx_raw_materials_name_ar ON raw_materials (name_ar);

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_raw_materials_updated_at
BEFORE UPDATE ON raw_materials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 5. Row Level Security
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON raw_materials
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
