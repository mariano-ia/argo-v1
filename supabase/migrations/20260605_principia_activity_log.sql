-- Principia / Vigia v1 — append-only activity timeline ("los registros de todo").
-- Every area's event of interest lands here as one immutable row. Parts C/D render
-- it (Registros tab) and the detect cron reads/writes it. Partitioned by month.
-- Service-role only (RLS on, no policies) — same pattern as webhook_events / ai_events.
-- Schema follows the design spec (section 7.1); columns match what Parts C and D read/write.
CREATE TABLE IF NOT EXISTS system_activity_log (
    id            BIGSERIAL,
    recorded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),   -- when we recorded it (partition key)
    occurred_at   TIMESTAMPTZ,                            -- when the real event happened
    area          TEXT         NOT NULL,                  -- producto|marketing|ventas|personas|finanzas|sistema
    source_type   TEXT         NOT NULL DEFAULT 'system', -- sensor|controller|actuator|cron|human|webhook|system
    event_type    TEXT,                                   -- user_action|ai_decision|health_check|delivery|audit
    actor         TEXT,                                   -- agent id 'vigia' | admin email | 'system'
    action        TEXT         NOT NULL,                  -- e.g. session_completed, payment_received, incident_detected
    resource_type TEXT,
    resource_id   TEXT,
    severity      TEXT         NOT NULL DEFAULT 'info',   -- info|sano|medio|alto|offline
    status        TEXT,                                   -- initiated|success|failed|pending_review|auto_executed
    reason        JSONB,                                  -- why: { metric, threshold, current_value }
    result        JSONB,                                  -- what: { pr_url, email_sent, ... }
    old_state     JSONB,
    new_state     JSONB,
    related_logs  TEXT[]       NOT NULL DEFAULT '{}',     -- soft FKs to other tables
    incident_id   BIGINT,                                 -- logical link to incidents(id) for timelines
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS system_activity_log_2026_06
    PARTITION OF system_activity_log FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS system_activity_log_2026_07
    PARTITION OF system_activity_log FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX IF NOT EXISTS system_activity_log_area_time_idx   ON system_activity_log (area, recorded_at DESC);
CREATE INDEX IF NOT EXISTS system_activity_log_action_time_idx ON system_activity_log (action, recorded_at DESC);
CREATE INDEX IF NOT EXISTS system_activity_log_status_time_idx ON system_activity_log (status, recorded_at DESC);
CREATE INDEX IF NOT EXISTS system_activity_log_incident_idx    ON system_activity_log (incident_id);
CREATE INDEX IF NOT EXISTS system_activity_log_severity_idx    ON system_activity_log (severity);

-- Service role only.
ALTER TABLE system_activity_log ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
