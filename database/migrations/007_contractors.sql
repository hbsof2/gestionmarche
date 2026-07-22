-- ============================================================
-- Migration: 007_contractors
-- Table: contractors (المتعامل المتعاقد)
-- ============================================================

-- 1. Table
CREATE TABLE contractors (
  id            SERIAL PRIMARY KEY,
  designation   TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  birth_date    DATE NOT NULL,
  wilaya        TEXT NOT NULL,
  commune       TEXT NOT NULL,
  nis           TEXT NOT NULL,
  nif           TEXT NOT NULL,
  rc_number     TEXT NOT NULL,
  rc_date       DATE NOT NULL,
  address       TEXT NOT NULL,
  phone_fixed   TEXT NOT NULL,
  phone_mobile  TEXT NOT NULL,
  fax           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE contractors IS 'جدول المتعامل المتعاقد';

-- 2. Indexes
CREATE INDEX idx_contractors_full_name ON contractors (full_name);
CREATE INDEX idx_contractors_wilaya ON contractors (wilaya);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_contractors_updated_at
BEFORE UPDATE ON contractors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON contractors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
