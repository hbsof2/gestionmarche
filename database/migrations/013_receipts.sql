-- ============================================================
-- Migration: 013_receipts
-- Table: receipts (الوصولات)
-- ============================================================

-- 1. Table
CREATE TABLE receipts (
  id              SERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  deal_id         INTEGER NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  contractor_id   INTEGER NOT NULL REFERENCES contractors(id) ON DELETE RESTRICT,
  authority_id    INTEGER NOT NULL REFERENCES contracting_authorities(id) ON DELETE RESTRICT,
  branch_id       INTEGER NOT NULL REFERENCES authority_branches(id) ON DELETE RESTRICT,
  receipt_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  counter         INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, counter)
);

COMMENT ON TABLE receipts IS 'جدول الوصولات';

-- 2. Indexes
CREATE INDEX idx_receipts_reference ON receipts (reference);
CREATE INDEX idx_receipts_deal_id ON receipts (deal_id);
CREATE INDEX idx_receipts_contractor_id ON receipts (contractor_id);
CREATE INDEX idx_receipts_authority_id ON receipts (authority_id);
CREATE INDEX idx_receipts_branch_id ON receipts (branch_id);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_receipts_updated_at
BEFORE UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON receipts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
