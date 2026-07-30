-- Database backups: log of generated backup files (downloaded and/or emailed)
CREATE TABLE backups (
  id              SERIAL PRIMARY KEY,
  filename        TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       BIGINT,
  email_sent_to   TEXT,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE backups IS 'جدول سجل النسخ الاحتياطية';

CREATE INDEX idx_backups_created_at ON backups(created_at);

ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_full_access ON backups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
