-- Principia / Vigia v1 — incidents: the single mutable state source.
-- One row per open issue/observation. The Bandeja (approval inbox) is exactly
-- `SELECT ... WHERE status = 'awaiting_approval'`. The detect cron upserts here;
-- the actuator + verify-loop mutate status forward. Schema follows the design
-- spec (section 7.2); columns match what Parts C and D read/write.
--
-- NOTE: class_id is a *logical* reference to incident_classes(id). We deliberately
-- DROP the hard `REFERENCES incident_classes(id)` foreign key so this migration runs
-- independently of table-creation order. Integrity is enforced in app code.
CREATE TABLE IF NOT EXISTS incidents (
    id                  BIGSERIAL PRIMARY KEY,
    area                TEXT        NOT NULL,                 -- producto|marketing|ventas|personas|finanzas|sistema
    loop_id             TEXT,                                 -- tecnica|entrega|calidad_ia|dashboards
    class_id            BIGINT,                               -- logical FK to incident_classes(id); NO hard REFERENCES
    agent               TEXT,                                 -- controller that opened it, e.g. 'vigia'
    kind                TEXT        NOT NULL DEFAULT 'incident', -- incident|observation
    action_key          TEXT        NOT NULL,                 -- dedupe key, e.g. 'report_email_unsent'
    title               TEXT        NOT NULL,
    summary             TEXT,
    severity            TEXT        NOT NULL DEFAULT 'medio',  -- alto|medio|sano|offline|info
    status              TEXT        NOT NULL DEFAULT 'open',
        -- open|diagnosing|proposed|awaiting_approval|acting|verifying|resolved|snoozed
    signal_count        INTEGER     NOT NULL DEFAULT 1,       -- collapsed duplicate signals
    entity_type         TEXT,                                 -- design-for-5 (e.g. 'session')
    entity_ref          TEXT,
    diagnosis           JSONB,                                -- AI cause analysis
    proposed_action     JSONB,                                -- { type, label, params } or null
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    verified_at         TIMESTAMPTZ,                          -- verify-loop: when the fix was confirmed
    verification_result JSONB,                                -- { signal_back_under_setpoint, ... }
    resolution          JSONB,                                -- { decision, by } on reject/snooze (governance also lives in admin_audit_log)
    metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Idempotency (fix 6): at most ONE not-yet-closed incident per (area, action_key).
-- The detect cron RELIES on this partial unique index for dedupe.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_incident_open_per_action
    ON incidents (area, action_key)
    WHERE status NOT IN ('resolved', 'snoozed');

-- Bandeja query (status = 'awaiting_approval').
CREATE INDEX IF NOT EXISTS incidents_inbox_idx
    ON incidents (status, severity, last_seen_at DESC)
    WHERE status = 'awaiting_approval';

CREATE INDEX IF NOT EXISTS incidents_area_status_idx
    ON incidents (area, status, last_seen_at DESC);

-- Service role only.
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
