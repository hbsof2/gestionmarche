-- ============================================================
-- Migration: 010_fix_deal_branches_cascade
-- Replace deal_branches.deal_id ON DELETE CASCADE with RESTRICT so a
-- deal with linked branches cannot be deleted out from under the
-- application-level check in dealsController.js.
-- ============================================================

ALTER TABLE deal_branches
  DROP CONSTRAINT deal_branches_deal_id_fkey;

ALTER TABLE deal_branches
  ADD CONSTRAINT deal_branches_deal_id_fkey
  FOREIGN KEY (deal_id)
  REFERENCES deals(id)
  ON DELETE RESTRICT;
