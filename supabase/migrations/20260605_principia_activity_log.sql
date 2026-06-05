-- Principia / Vigia v1 — append-only activity timeline.
-- Every product/marketing/ventas/etc. event of interest lands here as one
-- immutable row. Parts C/D render it (Registros tab) and the detect cron reads
-- it to derive sensor readings. Partitioned by month so old months can be
-- pruned/detached cheaply. Service-role only (RLS on, no policies) — same
-- pattern as webhook_events / ai_events.
CREATE TABLE IF NOT EXISTS system_activity_log (
    id            BIGSERIAL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    area          TEXT         NOT NULL,            -- producto|marketing|ventas|personas|finanzas|sistema
    source_type   TEXT         NOT NULL DEFAULT 'system', -- system|human|agent
    action        TEXT         NOT NULL,            -- e.g. session_completed, payment_received, report_email_failed
    severity      TEXT         NOT NULL DEFAULT 'info',   -- info|sano|medio|alto|offline
    entity_type   TEXT,                             -- design-for-5: e.g. 'session','one_purchase','tenant'
    entity_ref    TEXT,                             -- opaque id of the entity above
    summary       TEXT,                             -- short human-readable line
    detail        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    related_logs  TEXT[]       NOT NULL DEFAULT '{}',
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Current + next month partitions. Add more ahead of time before they are
-- needed (manual or future cron — out of scope for v1).
CREATE TABLE IF NOT EXISTS system_activity_log_2026_06
    PARTITION OF system_activity_log
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS system_activity_log_2026_07
    PARTITION OF system_activity_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX IF NOT EXISTS system_activity_log_area_created_idx
    ON system_activity_log (area, created_at DESC);
CREATE INDEX IF NOT EXISTS system_activity_log_action_created_idx
    ON system_activity_log (action, created_at DESC);

-- Service role only.
ALTER TABLE system_activity_log ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
