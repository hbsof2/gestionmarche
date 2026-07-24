-- ============================================================
-- Migration: 014_users
-- Table: users (المستخدمين)
-- ============================================================

-- 1. Enum
CREATE TYPE user_role AS ENUM ('admin', 'secondary');

-- 2. Table
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'secondary',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  -- Permissions (only meaningful for secondary users, admin has all)
  can_manage_deals              BOOLEAN NOT NULL DEFAULT false,
  can_manage_authorities        BOOLEAN NOT NULL DEFAULT false,
  can_manage_contractors        BOOLEAN NOT NULL DEFAULT false,
  can_manage_branches           BOOLEAN NOT NULL DEFAULT false,
  can_manage_receipts           BOOLEAN NOT NULL DEFAULT false,
  can_manage_raw_materials      BOOLEAN NOT NULL DEFAULT false,
  can_manage_invoices           BOOLEAN NOT NULL DEFAULT false,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'جدول المستخدمين';

-- 3. Default admin user (username: admin / password: Admin@1234 — must be changed after first login)
INSERT INTO users (
  full_name, phone, username, password_hash, role,
  can_manage_deals, can_manage_authorities, can_manage_contractors,
  can_manage_branches, can_manage_receipts, can_manage_raw_materials,
  can_manage_invoices
) VALUES (
  'المدير الرئيسي', '0000000000', 'admin',
  '$2b$10$MAhrHsYkYxqK.xUD6TZqZ.HI.KMmHxzBaXodGvY2xA8LZ/dEqqIuG',
  'admin', true, true, true, true, true, true, true
);

-- 4. Indexes
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);

-- 5. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 6. Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
