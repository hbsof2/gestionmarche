-- ============================================================
-- Migration: 006_alter_authority_branches
-- Make nis, nif, rc_number, rc_date optional on authority_branches
-- ============================================================

ALTER TABLE authority_branches
  ALTER COLUMN nis       DROP NOT NULL,
  ALTER COLUMN nif       DROP NOT NULL,
  ALTER COLUMN rc_number DROP NOT NULL,
  ALTER COLUMN rc_date   DROP NOT NULL;
