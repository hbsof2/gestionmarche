-- ============================================================
-- Migration: 004_contracting_authority
-- Table: contracting_authorities (المصلحة المتعاقدة)
-- ============================================================

-- 1. Table
CREATE TABLE contracting_authorities (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  wilaya        TEXT NOT NULL,
  commune       TEXT NOT NULL,
  nis           TEXT NOT NULL,
  nif           TEXT NOT NULL,
  rc_number     TEXT NOT NULL,
  rc_date       DATE NOT NULL,
  address       TEXT NOT NULL,
  phone         TEXT NOT NULL,
  fax           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE contracting_authorities IS 'جدول المصلحة المتعاقدة';

-- 2. Indexes
CREATE INDEX idx_contracting_authorities_name ON contracting_authorities (name);
CREATE INDEX idx_contracting_authorities_wilaya ON contracting_authorities (wilaya);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_contracting_authorities_updated_at
BEFORE UPDATE ON contracting_authorities
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE contracting_authorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON contracting_authorities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
