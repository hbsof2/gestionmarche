-- ============================================================
-- Migration: 022_notifications
-- Table: notifications (الإشعارات)
-- ============================================================

-- 1. Table
CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- type values:
-- 'warning' -> تحذير (كميات منخفضة)
-- 'alert'   -> تنبيه (صفقات منتهية قريباً)
-- 'info'    -> معلومة (عمليات المستخدمين)
-- 'backup'  -> نسخ احتياطية

COMMENT ON TABLE notifications IS 'جدول الإشعارات';

-- 2. Indexes
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_is_read ON notifications (is_read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);

-- 3. Auto-update updated_at (reuses set_updated_at() from migration 001)
CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
