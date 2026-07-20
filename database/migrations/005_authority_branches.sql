-- ============================================================
-- Migration: 005_authority_branches
-- Table: authority_branches (فروع المصلحة المتعاقدة)
-- ============================================================

-- 1. Table
CREATE TABLE authority_branches (
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

COMMENT ON TABLE authority_branches IS 'جدول فروع المصلحة المتعاقدة';

-- 2. Indexes
CREATE INDEX idx_authority_branches_name ON authority_branches (name);
CREATE INDEX idx_authority_branches_wilaya ON authority_branches (wilaya);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_authority_branches_updated_at
BEFORE UPDATE ON authority_branches
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE authority_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON authority_branches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
