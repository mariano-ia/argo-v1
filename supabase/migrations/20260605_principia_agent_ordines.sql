-- Principia / Vigia v1 — agent_ordines: the centurion (Vigia) backlog (Commentarii · Ordines).
-- Each row is one ordo (a self-scheduled order, e.g. "watch signal X until back under setpoint").
-- v1 writes these but execution stays human-in-the-loop. Schema follows the design spec
-- (section 3); columns match what Part D reads/writes.
CREATE TABLE IF NOT EXISTS agent_ordines (
    id            BIGSERIAL PRIMARY KEY,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area          TEXT        NOT NULL,                  -- producto|marketing|ventas|personas|finanzas|sistema
    agent         TEXT        NOT NULL,                  -- e.g. 'vigia'
    kind          TEXT        NOT NULL,                  -- watch|patrol|task
    description   TEXT        NOT NULL,
    status        TEXT        NOT NULL DEFAULT 'open',   -- open|scheduled|done|dropped
    scheduled_for TIMESTAMPTZ,                           -- for patrols / dated tasks
    origin        TEXT,                                  -- self|consilium|imperator
    incident_id   BIGINT,                                -- logical link to incidents(id); NO hard REFERENCES
    closed_at     TIMESTAMPTZ,
    metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS agent_ordines_area_agent_status_idx
    ON agent_ordines (area, agent, status, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_ordines_incident_idx
    ON agent_ordines (incident_id);

-- Service role only.
ALTER TABLE agent_ordines ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
