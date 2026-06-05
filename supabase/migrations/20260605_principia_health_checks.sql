-- Principia / Vigia v1 — health_checks: one row per sensor reading.
-- Each control loop's signal source writes its measured value vs. its setpoint.
-- last_successful_check_at lets the out-of-band dead-man's-switch detect a
-- sensor that simply stopped reporting (silence is itself a signal).
CREATE TABLE IF NOT EXISTS health_checks (
    id                       BIGSERIAL PRIMARY KEY,
    checked_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area                     TEXT        NOT NULL,   -- producto|marketing|ventas|personas|finanzas|sistema
    loop_id                  TEXT        NOT NULL,   -- which control loop this sensor belongs to
    check_key                TEXT        NOT NULL,   -- stable sensor id, e.g. 'report_delivery_lag'
    value                    NUMERIC,                -- measured value
    setpoint                 NUMERIC,                -- target/threshold
    status                   TEXT        NOT NULL DEFAULT 'sano', -- sano|medio|alto|offline
    detail                   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    last_successful_check_at TIMESTAMPTZ             -- last time this sensor produced a non-offline reading
);

CREATE INDEX IF NOT EXISTS health_checks_key_checked_idx
    ON health_checks (check_key, checked_at DESC);
CREATE INDEX IF NOT EXISTS health_checks_area_checked_idx
    ON health_checks (area, checked_at DESC);

-- Service role only.
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
