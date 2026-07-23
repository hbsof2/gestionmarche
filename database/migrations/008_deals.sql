-- ============================================================
-- Migration: 008_deals
-- Table: deals (الصفقات)
-- ============================================================

-- 1. Table
CREATE TABLE deals (
  id              SERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  contractor_id   INTEGER NOT NULL REFERENCES contractors(id),
  authority_id    INTEGER NOT NULL REFERENCES contracting_authorities(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  total_amount    NUMERIC(15, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE deals IS 'جدول الصفقات';

-- 2. Indexes
CREATE INDEX idx_deals_reference ON deals (reference);
CREATE INDEX idx_deals_contractor_id ON deals (contractor_id);
CREATE INDEX idx_deals_authority_id ON deals (authority_id);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_deals_updated_at
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
