-- Principia / Vigia v1 — weekly_reviews: read-only Consilium snapshot store.
-- The Consilium view (Part D) computes a 7-day summary per area and UPSERTs
-- the `summary` JSONB here. v1 is read-only: no setpoint edits, no graduation.
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area        TEXT        NOT NULL,                -- producto|marketing|ventas|personas|finanzas|sistema
    week_start  DATE        NOT NULL,                -- Monday of the reviewed week
    summary     JSONB       NOT NULL DEFAULT '{}'::jsonb, -- computed 7-day rollup
    UNIQUE (area, week_start)
);

CREATE INDEX IF NOT EXISTS weekly_reviews_area_week_idx
    ON weekly_reviews (area, week_start DESC);

-- Service role only.
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
