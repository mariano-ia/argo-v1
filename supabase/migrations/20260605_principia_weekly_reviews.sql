-- Principia / Vigia v1 — weekly_reviews: the slow-clock Consilium snapshot store.
-- The Consilium endpoint (Part D) computes a 7-day rollup and UPSERTs `summary`
-- here. v1 is read-only: setpoint_changes/graduations stay empty until the
-- graduation phase. area=NULL means an org-wide review. Schema follows the design
-- spec (section 7.5); columns + unique match Part D's Consilium upsert
-- (onConflict 'area,period_start,period_end').
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id               BIGSERIAL PRIMARY KEY,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area             TEXT,                            -- NULL = org-wide review
    period_start     DATE        NOT NULL,
    period_end       DATE        NOT NULL,
    summary          JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- computed 7-day rollup
    setpoint_changes JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- phase posterior (empty in v1)
    graduations      JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- phase posterior (empty in v1)
    reviewed_by      TEXT,
    closed_at        TIMESTAMPTZ
);

-- Upsert target for the Consilium. NULLS NOT DISTINCT so org-wide (area=NULL)
-- reviews dedupe on (period_start, period_end) instead of inserting twins
-- (Postgres 15+, which Supabase runs).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_weekly_review_period
    ON weekly_reviews (area, period_start, period_end) NULLS NOT DISTINCT;

-- Service role only.
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
