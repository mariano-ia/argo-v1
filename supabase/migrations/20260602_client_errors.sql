-- Custom in-house client-error telemetry (lighter alternative to Sentry).
-- src/main.tsx beams every uncaught window.error and unhandledrejection
-- here via sendBeacon. The superadmin /admin/health page aggregates.
CREATE TABLE IF NOT EXISTS client_errors (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind        TEXT NOT NULL,             -- 'error' | 'unhandledrejection'
  message     TEXT,
  source      TEXT,
  line        INTEGER,
  col         INTEGER,
  stack       TEXT,
  url         TEXT,
  ua          TEXT
);

CREATE INDEX IF NOT EXISTS client_errors_created_at_idx
  ON client_errors (created_at DESC);

CREATE INDEX IF NOT EXISTS client_errors_kind_idx
  ON client_errors (kind);

CREATE INDEX IF NOT EXISTS client_errors_msg_prefix_idx
  ON client_errors (LEFT(message, 80));

ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;
