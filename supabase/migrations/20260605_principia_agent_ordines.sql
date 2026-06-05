-- Principia / Vigia v1 — agent_ordines: the centurion (Vigia) backlog.
-- Each row is one ordo (a derived task/order, e.g. "draft a PR proposal for
-- incident #N"). v1 writes these but execution stays human-in-the-loop.
CREATE TABLE IF NOT EXISTS agent_ordines (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area         TEXT        NOT NULL,               -- producto|marketing|ventas|personas|finanzas|sistema
    incident_id  BIGINT,                             -- logical link to incidents(id); NO hard REFERENCES
    kind         TEXT        NOT NULL,               -- e.g. 'draft_pr', 'investigate', 'notify'
    status       TEXT        NOT NULL DEFAULT 'pending', -- pending|in_progress|done|cancelled
    title        TEXT        NOT NULL,
    detail       JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS agent_ordines_status_created_idx
    ON agent_ordines (status, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_ordines_incident_idx
    ON agent_ordines (incident_id);

-- Service role only.
ALTER TABLE agent_ordines ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
