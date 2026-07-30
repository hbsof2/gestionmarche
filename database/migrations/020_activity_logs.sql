-- Activity logs: tracks all user actions across the platform (login, create, update, delete)
CREATE TABLE activity_logs (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  action          TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  section         TEXT NOT NULL,
  details         TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_logs IS 'جدول سجل عمليات المستخدمين';

-- action_type values: 'login', 'logout', 'create', 'update', 'delete'
-- section values: 'raw_materials', 'contracting_authority',
--                 'authority_branches', 'contractor', 'deals',
--                 'receipts', 'invoices', 'users', 'categories', 'auth'

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_full_access ON activity_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
