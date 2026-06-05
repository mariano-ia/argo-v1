-- Principia / Vigia v1 — incidents: the single mutable state source.
-- One row per open issue/observation. The Bandeja (approval inbox) is exactly
-- `SELECT ... WHERE status = 'awaiting_approval'`. The detect cron upserts here;
-- the actuator + verify-loop mutate status forward.
--
-- NOTE: class_id is a *logical* reference to incident_classes(id). We
-- deliberately DROP the hard `REFERENCES incident_classes(id)` foreign key:
-- it lets this migration run independently of table-creation order and keeps
-- the classes catalog editable without FK churn. Integrity is enforced in app
-- code (the detect cron only writes known class ids). Diverges intentionally
-- from the spec SQL, which shows a hard FK.
CREATE TABLE IF NOT EXISTS incidents (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area            TEXT        NOT NULL,            -- producto|marketing|ventas|personas|finanzas|sistema
    class_id        BIGINT,                          -- logical FK to incident_classes(id); NO hard REFERENCES
    action_key      TEXT        NOT NULL,            -- dedupe key, e.g. 'report_email_unsent'
    status          TEXT        NOT NULL DEFAULT 'open',
        -- open|diagnosing|proposed|awaiting_approval|acting|verifying|resolved|snoozed
    severity        TEXT        NOT NULL DEFAULT 'medio', -- alto|medio|sano|offline|info
    title           TEXT        NOT NULL,
    summary         TEXT,
    proposed_action JSONB,                           -- { type, label, params } or null
    entity_type     TEXT,                            -- design-for-5 (e.g. 'session')
    entity_ref      TEXT,
    signal_count    INTEGER     NOT NULL DEFAULT 1,  -- collapsed duplicate signals
    last_signal_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snoozed_until   TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    related_logs    TEXT[]      NOT NULL DEFAULT '{}',
    detail          JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Idempotency (fix 6): at most ONE not-yet-closed incident per (area, action_key).
-- The detect cron RELIES on this partial unique index for dedupe (insert; on
-- conflict, bump signal_count instead of creating a twin). A plain unique on
-- (id, action_key) would be a no-op since id is the PK.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_incident_open_per_action
    ON incidents (area, action_key)
    WHERE status NOT IN ('resolved', 'snoozed');

-- The Bandeja query (status = 'awaiting_approval') gets its own index.
CREATE INDEX IF NOT EXISTS incidents_inbox_idx
    ON incidents (status, severity, last_signal_at DESC)
    WHERE status = 'awaiting_approval';

CREATE INDEX IF NOT EXISTS incidents_area_status_idx
    ON incidents (area, status, last_signal_at DESC);

-- Service role only.
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
