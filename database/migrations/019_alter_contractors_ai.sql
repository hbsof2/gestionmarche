-- ============================================================
-- Migration: 019_alter_contractors_ai
-- Add optional AI (article d'imposition) number field to contractors
-- ============================================================

ALTER TABLE contractors
  ADD COLUMN ai_number TEXT;
