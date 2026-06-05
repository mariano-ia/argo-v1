-- Principia / Vigia v1 — health_checks: one row per sensor reading vs setpoint.
-- Each control loop's signal source writes its measured value vs its setpoint.
-- last_successful_check_at lets the out-of-band dead-man's-switch detect a sensor
-- that simply stopped reporting (silence is itself a signal). Schema follows the
-- design spec (section 7.4); columns match what Part C reads and Part D writes.
CREATE TABLE IF NOT EXISTS health_checks (
    id                       BIGSERIAL PRIMARY KEY,
    checked_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area                     TEXT        NOT NULL,   -- producto|marketing|ventas|personas|finanzas|sistema
    loop_id                  TEXT,                   -- which control loop this sensor belongs to
    signal_key               TEXT        NOT NULL,   -- stable sensor id, e.g. 'client_errors_per_day'
    source_type              TEXT,                   -- table|cron|webhook|external_mcp
    source_ref               TEXT,                   -- e.g. 'client_errors' | 'principia-detect' | 'windsor:googleanalytics4'
    shape                    TEXT,                   -- threshold|entity
    measured_value           NUMERIC,
    setpoint_value           NUMERIC,
    comparator               TEXT,                   -- '<' | '>' | '='
    unit                     TEXT,
    entity_type              TEXT,                   -- design-for-5 (entity-shaped signals)
    entity_ref               TEXT,
    breached                 BOOLEAN     NOT NULL DEFAULT FALSE,  -- crossed the human-defined setpoint?
    severity                 TEXT        NOT NULL DEFAULT 'sano', -- sano|medio|alto|offline|info
    last_successful_check_at TIMESTAMPTZ,            -- last time this sensor produced a non-offline reading
    raw                      JSONB
);

CREATE INDEX IF NOT EXISTS health_checks_signal_checked_idx ON health_checks (signal_key, checked_at DESC);
CREATE INDEX IF NOT EXISTS health_checks_area_checked_idx   ON health_checks (area, checked_at DESC);
CREATE INDEX IF NOT EXISTS health_checks_source_ref_idx     ON health_checks (source_ref, checked_at DESC);

-- Service role only.
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
