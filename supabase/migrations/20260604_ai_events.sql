-- Argo Coach quality telemetry. api/tenant-chat.ts writes one row per AI
-- response (best-effort, never blocks the chat). Stores only non-PII signals
-- (flags + placeholders), never the child's real name. The superadmin
-- dashboard + api/qa-monitor.ts aggregate these for alerting. See
-- docs/ARGO-COACH-AUDIT.md (Wave E).
CREATE TABLE IF NOT EXISTS ai_events (
  id                      BIGSERIAL PRIMARY KEY,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id               UUID,
  thread_id               UUID,
  source                  TEXT NOT NULL DEFAULT 'tenant-chat',
  provider                TEXT,                 -- 'gemini' | 'openai'
  model                   TEXT,
  lang                    TEXT,
  tokens_in               INTEGER DEFAULT 0,
  tokens_out              INTEGER DEFAULT 0,
  cost_usd                NUMERIC(12,6) DEFAULT 0,
  latency_ms              INTEGER,
  mentioned_player        BOOLEAN DEFAULT FALSE,
  groundtruth_violation   BOOLEAN DEFAULT FALSE, -- wrong axis attributed to a named player
  label_violation         BOOLEAN DEFAULT FALSE, -- old forbidden archetype label served (bug #2)
  prohibited_hit          BOOLEAN DEFAULT FALSE, -- prohibited word in first draft
  prohibited_after_retry  BOOLEAN DEFAULT FALSE, -- prohibited word survived the retry (safe fallback served)
  context_miss            BOOLEAN DEFAULT FALSE, -- a name was mentioned but no roster player matched
  fair_use_exceeded       BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS ai_events_created_idx
  ON ai_events (created_at DESC);

CREATE INDEX IF NOT EXISTS ai_events_tenant_created_idx
  ON ai_events (tenant_id, created_at DESC);

-- Partial index for the rare-but-critical quality incidents the dashboard pages on.
CREATE INDEX IF NOT EXISTS ai_events_incident_idx
  ON ai_events (created_at DESC)
  WHERE groundtruth_violation OR label_violation OR prohibited_after_retry;

-- Service role writes; clients never read this table. RLS on with no policies
-- = denied for anon/authenticated, bypassed by the service role.
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
