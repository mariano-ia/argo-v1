-- Audio-recovery telemetry: every time the in-flow watchdog or revive
-- branch heals a stalled / silent audio element on the client, it beams
-- one event here. Lets the superadmin dashboard surface a real-world
-- signal of how often audio dies on which screens / devices.
CREATE TABLE IF NOT EXISTS audio_events (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id      UUID,
  screen_index    INTEGER,
  recovery_type   TEXT NOT NULL,
  ctx_state       TEXT,
  effect_src      TEXT,
  ua              TEXT,
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS audio_events_created_at_idx
  ON audio_events (created_at DESC);

CREATE INDEX IF NOT EXISTS audio_events_recovery_type_idx
  ON audio_events (recovery_type);

CREATE INDEX IF NOT EXISTS audio_events_screen_idx
  ON audio_events (screen_index);

-- RLS: only the service role writes. No direct client reads.
ALTER TABLE audio_events ENABLE ROW LEVEL SECURITY;
