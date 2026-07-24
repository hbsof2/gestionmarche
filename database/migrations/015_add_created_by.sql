-- ============================================================
-- Migration: 015_add_created_by
-- Add created_by column to track which user created each record
-- ============================================================

ALTER TABLE deals
  ADD COLUMN created_by INTEGER REFERENCES users(id);

ALTER TABLE contracting_authorities
  ADD COLUMN created_by INTEGER REFERENCES users(id);

ALTER TABLE contractors
  ADD COLUMN created_by INTEGER REFERENCES users(id);

ALTER TABLE authority_branches
  ADD COLUMN created_by INTEGER REFERENCES users(id);

ALTER TABLE receipts
  ADD COLUMN created_by INTEGER REFERENCES users(id);

ALTER TABLE raw_materials
  ADD COLUMN created_by INTEGER REFERENCES users(id);
