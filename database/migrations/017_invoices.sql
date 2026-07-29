-- ============================================================
-- Migration: 017_invoices
-- Tables: invoices, invoice_items (الفواتير)
-- ============================================================

-- 1. Tables
CREATE TABLE invoices (
  id              SERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  deal_id         INTEGER NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  contractor_id   INTEGER NOT NULL REFERENCES contractors(id) ON DELETE RESTRICT,
  authority_id    INTEGER NOT NULL REFERENCES contracting_authorities(id) ON DELETE RESTRICT,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  counter         INTEGER NOT NULL,
  total_ht        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_ttc       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, counter)
);

CREATE TABLE invoice_items (
  id              SERIAL PRIMARY KEY,
  invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  material_id     INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  name_ar         TEXT NOT NULL,
  name_lat        TEXT,
  unit            TEXT NOT NULL,
  category_name   TEXT NOT NULL,
  total_quantity  NUMERIC(15, 3) NOT NULL,
  unit_price      NUMERIC(15, 2) NOT NULL,
  tva             NUMERIC(5, 2) NOT NULL,
  total_ht        NUMERIC(15, 2) NOT NULL,
  total_ttc       NUMERIC(15, 2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE invoices IS 'جدول الفواتير';
COMMENT ON TABLE invoice_items IS 'جدول مواد الفواتير';

-- 2. Indexes
CREATE INDEX idx_invoices_reference ON invoices (reference);
CREATE INDEX idx_invoices_deal_id ON invoices (deal_id);
CREATE INDEX idx_invoices_contractor_id ON invoices (contractor_id);
CREATE INDEX idx_invoices_authority_id ON invoices (authority_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX idx_invoice_items_material_id ON invoice_items (material_id);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invoice_items_updated_at
BEFORE UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON invoice_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
