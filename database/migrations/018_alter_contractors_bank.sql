-- ============================================================
-- Migration: 018_alter_contractors_bank
-- Add optional bank information fields to contractors
-- ============================================================

ALTER TABLE contractors
  ADD COLUMN bank_name    TEXT,
  ADD COLUMN bank_address TEXT,
  ADD COLUMN bank_rip     TEXT;
