-- Mark sessions created by the public /demo flow.
-- Allows the superadmin dashboard to visually flag them so demo sessions
-- don't get confused with real client plays.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS sessions_is_demo_idx
  ON sessions (is_demo)
  WHERE is_demo = TRUE;
