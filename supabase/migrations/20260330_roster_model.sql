-- ============================================================================
-- Migration: Credits → Roster model
-- Date: 2026-03-30
-- Description: Replaces credit-based system with roster capacity model.
--              Adds roster_limit, archived_at, last_profiled_at, AI query tracking.
--              Deprecates credits_remaining (kept for rollback safety).
-- ============================================================================

BEGIN;

-- ── 1. Add roster columns to tenants ────────────────────────────────────────

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS roster_limit integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS ai_queries_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_queries_reset_at timestamptz NOT NULL DEFAULT now();

-- Set roster_limit based on current plan
UPDATE tenants SET roster_limit = 8   WHERE plan = 'trial';
UPDATE tenants SET roster_limit = 50  WHERE plan = 'pro';
UPDATE tenants SET roster_limit = 100 WHERE plan = 'academy';

COMMENT ON COLUMN tenants.roster_limit IS 'Max active (non-archived) players for this tenant';
COMMENT ON COLUMN tenants.ai_queries_count IS 'AI consultant queries used in current billing period';
COMMENT ON COLUMN tenants.ai_queries_reset_at IS 'When ai_queries_count was last reset to 0';

-- ── 2. Add roster columns to sessions ───────────────────────────────────────

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_profiled_at timestamptz;

-- Backfill last_profiled_at from created_at for existing completed sessions
UPDATE sessions
  SET last_profiled_at = created_at
  WHERE eje IS NOT NULL AND eje != '_pending' AND last_profiled_at IS NULL;

COMMENT ON COLUMN sessions.archived_at IS 'When this player was archived (NULL = active)';
COMMENT ON COLUMN sessions.last_profiled_at IS 'When this player was last profiled (for 6-month cooldown)';

-- ── 3. Create roster check function (replaces deduct_credit) ────────────────

CREATE OR REPLACE FUNCTION check_roster_capacity(p_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roster_limit integer;
  v_active_count integer;
  v_plan text;
  v_trial_expires_at timestamptz;
BEGIN
  -- Lock tenant row
  SELECT roster_limit, plan, trial_expires_at
    INTO v_roster_limit, v_plan, v_trial_expires_at
    FROM tenants
    WHERE id = p_tenant_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'tenant_not_found';
  END IF;

  -- Check trial expiration
  IF v_plan = 'trial' AND v_trial_expires_at IS NOT NULL AND v_trial_expires_at < now() THEN
    RAISE EXCEPTION 'trial_expired';
  END IF;

  -- Count active (non-archived, non-deleted) players
  SELECT count(*)
    INTO v_active_count
    FROM sessions
    WHERE tenant_id = p_tenant_id
      AND archived_at IS NULL
      AND deleted_at IS NULL;

  IF v_active_count >= v_roster_limit THEN
    RAISE EXCEPTION 'roster_full';
  END IF;

  RETURN json_build_object(
    'tenant_id', p_tenant_id,
    'roster_limit', v_roster_limit,
    'active_count', v_active_count,
    'available', v_roster_limit - v_active_count
  );
END;
$$;

-- ── 4. Create re-profile check function ─────────────────────────────────────

CREATE OR REPLACE FUNCTION check_reprofile_cooldown(p_session_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_profiled timestamptz;
  v_months_since numeric;
BEGIN
  SELECT last_profiled_at
    INTO v_last_profiled
    FROM sessions
    WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found';
  END IF;

  IF v_last_profiled IS NULL THEN
    -- Never profiled (pending), allow
    RETURN json_build_object('allowed', true, 'months_remaining', 0);
  END IF;

  v_months_since := EXTRACT(EPOCH FROM (now() - v_last_profiled)) / (30.44 * 86400);

  IF v_months_since < 6 THEN
    RETURN json_build_object(
      'allowed', false,
      'months_remaining', ceil(6 - v_months_since),
      'available_at', v_last_profiled + interval '6 months'
    );
  END IF;

  RETURN json_build_object('allowed', true, 'months_remaining', 0);
END;
$$;

-- ── 5. AI query tracking function ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_ai_queries(p_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_reset_at timestamptz;
  v_plan text;
  v_soft_cap integer;
BEGIN
  SELECT ai_queries_count, ai_queries_reset_at, plan
    INTO v_count, v_reset_at, v_plan
    FROM tenants
    WHERE id = p_tenant_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'tenant_not_found';
  END IF;

  -- Reset counter if more than 30 days since last reset
  IF v_reset_at + interval '30 days' < now() THEN
    v_count := 0;
    UPDATE tenants
      SET ai_queries_count = 1, ai_queries_reset_at = now()
      WHERE id = p_tenant_id;
    RETURN json_build_object('count', 1, 'fair_use_exceeded', false);
  END IF;

  -- Increment
  v_count := v_count + 1;
  UPDATE tenants SET ai_queries_count = v_count WHERE id = p_tenant_id;

  -- Determine soft cap based on plan
  v_soft_cap := CASE v_plan
    WHEN 'trial' THEN 10
    WHEN 'pro' THEN 500
    WHEN 'academy' THEN 1000
    ELSE 999999  -- enterprise: effectively unlimited
  END;

  RETURN json_build_object(
    'count', v_count,
    'fair_use_exceeded', v_count > v_soft_cap
  );
END;
$$;

-- ── 6. Index for roster count queries ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_tenant_active
  ON sessions (tenant_id)
  WHERE archived_at IS NULL AND deleted_at IS NULL;

COMMIT;
