-- ============================================================
-- Migration: 009_deal_branches
-- Table: deal_branches (فروع المصلحة المستفيدة من الصفقة)
-- ============================================================

-- 1. Table
CREATE TABLE deal_branches (
  id          SERIAL PRIMARY KEY,
  deal_id     INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  branch_id   INTEGER NOT NULL REFERENCES authority_branches(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, branch_id)
);

COMMENT ON TABLE deal_branches IS 'جدول فروع المصلحة المستفيدة من الصفقة';

-- 2. Indexes
CREATE INDEX idx_deal_branches_deal_id ON deal_branches (deal_id);
CREATE INDEX idx_deal_branches_branch_id ON deal_branches (branch_id);

-- 3. Row Level Security
ALTER TABLE deal_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON deal_branches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
