-- ============================================================================
-- Migration: Split "child" from "perfilamiento" (assessment history)
-- Date: 2026-06-29
-- ============================================================================
-- Root-causes & fixes the Fede incident: today a `sessions` row conflates the
-- child (roster slot + identity), the play, the current profile, and the report.
-- A second play with the same name+email silently OVERWROTE the row, leaving a
-- stale cross-axis report.
--
-- New model:
--   * children       = persistent roster entity (the slot + identity + reprofile token)
--   * perfilamientos = append-only assessment history (the re-homed `sessions` table,
--                      ids PRESERVED so /report/:id?token= links stay valid)
--   * current_perfilamiento (view) = the single source of truth for "current profile"
--     (latest status='resolved' perfilamiento per child). No snapshot, no divergence.
--
-- Identity dedup by (tenant,email,name) is REMOVED in code; this migration only
-- restructures storage. Re-profile appends a perfilamiento; merge unifies children.
--
-- SAFETY: one transaction (all-or-nothing) + integrity assertions that RAISE
-- (forcing rollback) if any invariant fails. Pre-change backup lives in schema
-- backup_pre_split_20260629. Validated on real data: 47 tenant children (1:1, no
-- collisions), 90 Argo One, 0 rows missing email/name, 0 FK orphans.
-- ============================================================================

BEGIN;

-- ── 0. Idempotency guard ────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='children') THEN
    RAISE EXCEPTION 'children already exists - migration already applied';
  END IF;
END $$;

-- ── 1. children: the persistent roster entity ───────────────────────────────
CREATE TABLE public.children (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES public.tenants(id) ON DELETE SET NULL,   -- NULL for Argo One
  adult_name    text,
  adult_email   text NOT NULL,
  child_name    text NOT NULL,
  child_age     int,
  sport         text,
  lang          text DEFAULT 'es',
  reprofile_token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  archived_at   timestamptz,
  deleted_at    timestamptz,
  merged_into   uuid REFERENCES public.children(id),                     -- tombstone set by merge
  is_demo       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.children IS 'Persistent child/roster entity. One child = one slot. Owns identity + per-child reprofile token.';
CREATE INDEX idx_children_tenant_active ON public.children(tenant_id)
  WHERE archived_at IS NULL AND deleted_at IS NULL AND merged_into IS NULL;
CREATE INDEX idx_children_reprofile_token ON public.children(reprofile_token);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
-- Mirror sessions' permissive read posture (writes are service-role and bypass RLS).
CREATE POLICY children_auth_read ON public.children FOR SELECT TO authenticated USING (true);

-- ── 2. Re-home sessions -> perfilamientos (ids preserved) ───────────────────
ALTER TABLE public.sessions RENAME TO perfilamientos;
ALTER TABLE public.perfilamientos ADD COLUMN child_id     uuid;
ALTER TABLE public.perfilamientos ADD COLUMN status       text NOT NULL DEFAULT 'in_flight';
ALTER TABLE public.perfilamientos ADD COLUMN game_metrics jsonb;  -- raw mini-game metrics (motor re-resolvable later)
COMMENT ON TABLE public.perfilamientos IS 'Append-only assessment history. eje/motor and ai_sections co-located so they cannot diverge. status: in_flight | resolved.';

-- ── 3. Backfill children + link every perfilamiento ─────────────────────────
-- 3a. Tenant children: one per (tenant, lower(email), lower(name)); earliest row seeds identity.
INSERT INTO public.children (tenant_id, adult_name, adult_email, child_name, child_age, sport, lang, is_demo, created_at)
SELECT DISTINCT ON (tenant_id, lower(trim(adult_email)), lower(trim(child_name)))
       tenant_id, adult_name, adult_email, child_name, child_age, sport, lang, is_demo, created_at
FROM public.perfilamientos
WHERE tenant_id IS NOT NULL
ORDER BY tenant_id, lower(trim(adult_email)), lower(trim(child_name)), created_at;

UPDATE public.perfilamientos p
SET child_id = c.id
FROM public.children c
WHERE p.tenant_id IS NOT NULL
  AND c.tenant_id = p.tenant_id
  AND lower(trim(c.adult_email)) = lower(trim(p.adult_email))
  AND lower(trim(c.child_name))  = lower(trim(p.child_name));

-- 3b. Argo One (tenant_id NULL): one child per perfilamiento (1:1). Generate child
--     id onto the row first, then create the matching child with that exact id.
UPDATE public.perfilamientos SET child_id = gen_random_uuid()
WHERE tenant_id IS NULL AND child_id IS NULL;

INSERT INTO public.children (id, tenant_id, adult_name, adult_email, child_name, child_age, sport, lang, is_demo, created_at)
SELECT child_id, NULL, adult_name, adult_email, child_name, child_age, sport, lang, is_demo, created_at
FROM public.perfilamientos
WHERE tenant_id IS NULL;

-- 3c. status: a finished questionnaire (eje computed) = resolved; abandoned = in_flight.
UPDATE public.perfilamientos SET status = CASE WHEN eje <> '_pending' THEN 'resolved' ELSE 'in_flight' END;

-- 3d. Lock in constraints.
ALTER TABLE public.perfilamientos ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE public.perfilamientos
  ADD CONSTRAINT perfilamientos_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;
ALTER TABLE public.perfilamientos
  ADD CONSTRAINT perfilamientos_status_eje_chk CHECK (status <> 'resolved' OR eje <> '_pending');
CREATE INDEX idx_perfilamientos_child ON public.perfilamientos(child_id);
CREATE INDEX idx_perfilamientos_child_resolved ON public.perfilamientos(child_id, created_at DESC)
  WHERE status = 'resolved' AND deleted_at IS NULL;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.perfilamientos WHERE child_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'backfill incomplete: % perfilamientos without child_id', n; END IF;
END $$;

-- ── 4. Repoint memberships to the CHILD (per-person, survive re-profile/merge) ─
-- 4a. group_members
ALTER TABLE public.group_members ADD COLUMN child_id uuid;
UPDATE public.group_members gm SET child_id = p.child_id
  FROM public.perfilamientos p WHERE p.id = gm.session_id;
-- dedupe (group_id, child_id) keeping one row per pair
DELETE FROM public.group_members a USING public.group_members b
  WHERE a.group_id = b.group_id AND a.child_id = b.child_id AND a.ctid > b.ctid;
ALTER TABLE public.group_members DROP CONSTRAINT group_members_session_id_fkey;
DROP INDEX IF EXISTS public.idx_group_members_unique;
DROP INDEX IF EXISTS public.idx_group_members_session_id;
ALTER TABLE public.group_members DROP COLUMN session_id;
ALTER TABLE public.group_members ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX idx_group_members_unique ON public.group_members(group_id, child_id);
CREATE INDEX idx_group_members_child ON public.group_members(child_id);

-- 4b. chem_group_members
ALTER TABLE public.chem_group_members ADD COLUMN child_id uuid;
UPDATE public.chem_group_members gm SET child_id = p.child_id
  FROM public.perfilamientos p WHERE p.id = gm.session_id;
DELETE FROM public.chem_group_members a USING public.chem_group_members b
  WHERE a.group_id = b.group_id AND a.child_id = b.child_id AND a.ctid > b.ctid;
ALTER TABLE public.chem_group_members DROP CONSTRAINT chem_group_members_session_id_fkey;
DROP INDEX IF EXISTS public.chem_group_members_unique;
DROP INDEX IF EXISTS public.chem_group_members_session_idx;
ALTER TABLE public.chem_group_members DROP COLUMN session_id;
ALTER TABLE public.chem_group_members ALTER COLUMN child_id SET NOT NULL;
ALTER TABLE public.chem_group_members
  ADD CONSTRAINT chem_group_members_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX chem_group_members_unique ON public.chem_group_members(group_id, child_id);
CREATE INDEX chem_group_members_child_idx ON public.chem_group_members(child_id);

-- ── 5. parental_consents: thread the child (keep session_id = the perfilamiento) ─
ALTER TABLE public.parental_consents ADD COLUMN child_id  uuid REFERENCES public.children(id);
ALTER TABLE public.parental_consents ADD COLUMN reprofile boolean NOT NULL DEFAULT false;
UPDATE public.parental_consents pc SET child_id = p.child_id
  FROM public.perfilamientos p WHERE p.id = pc.session_id AND pc.session_id IS NOT NULL;
-- session_id intentionally stays bound to the perfilamiento it authorized (COPPA chain, immutable).

-- ── 6. puentes_*, feedback: unchanged. Their source_session_id / session_id FKs
--     auto-follow the rename and remain bound to the PERFILAMIENTO (the specific
--     report/assessment they were authored against). No action.

-- ── 7. current_perfilamiento view = the "current profile" read shape ─────────
CREATE VIEW public.current_perfilamiento AS
SELECT DISTINCT ON (c.id)
  c.id            AS id,                 -- CHILD id (group_members joins resolve on this)
  c.tenant_id, c.child_name, c.child_age, c.adult_name, c.adult_email, c.sport,
  c.archived_at, c.deleted_at, c.is_demo, c.reprofile_token, c.merged_into,
  p.id            AS perfilamiento_id,
  p.eje, p.motor, p.eje_secundario, p.archetype_label, p.answers, p.ai_sections,
  p.ai_tokens_input, p.ai_tokens_output, p.ai_cost_usd,
  p.share_token, p.full_access, p.email_sent_at, p.lang,
  p.created_at    AS current_profile_date,   -- the 6-month reprofile clock
  (SELECT count(*) FROM public.perfilamientos pp
     WHERE pp.child_id = c.id AND pp.status='resolved' AND pp.deleted_at IS NULL) AS perfilamiento_count
FROM public.children c
JOIN public.perfilamientos p
  ON p.child_id = c.id AND p.status='resolved' AND p.deleted_at IS NULL
ORDER BY c.id, p.created_at DESC;
COMMENT ON VIEW public.current_perfilamiento IS 'One row per child = latest resolved perfilamiento. Single source of truth for current profile.';
GRANT SELECT ON public.current_perfilamiento TO authenticated, service_role;

-- ── 8. Roster capacity: count active CHILDREN (slot = child, not perfilamiento) ─
-- An incomplete child (only in_flight perfilamientos, never resolved) does NOT
-- occupy a slot; a fresh in-flight one (< 6h) holds a reservation so concurrent
-- new plays at the limit cannot over-allocate. Re-profile never adds a child.
CREATE OR REPLACE FUNCTION public.check_roster_capacity(p_tenant_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_roster_limit integer; v_active_count integer; v_plan text; v_trial_expires_at timestamptz;
BEGIN
  SELECT roster_limit, plan, trial_expires_at
    INTO v_roster_limit, v_plan, v_trial_expires_at
    FROM tenants WHERE id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
  IF v_plan = 'trial' AND v_trial_expires_at IS NOT NULL AND v_trial_expires_at < now() THEN
    RAISE EXCEPTION 'trial_expired';
  END IF;

  SELECT count(*) INTO v_active_count
    FROM children c
    WHERE c.tenant_id = p_tenant_id
      AND c.archived_at IS NULL AND c.deleted_at IS NULL AND c.merged_into IS NULL
      AND EXISTS (
        SELECT 1 FROM perfilamientos p
        WHERE p.child_id = c.id AND p.deleted_at IS NULL
          AND (p.status = 'resolved' OR p.created_at > now() - interval '6 hours')
      );

  IF v_active_count >= v_roster_limit THEN RAISE EXCEPTION 'roster_full'; END IF;

  RETURN json_build_object('tenant_id', p_tenant_id, 'roster_limit', v_roster_limit,
                           'active_count', v_active_count, 'available', v_roster_limit - v_active_count);
END; $$;

-- ── 9. Re-profile 6-month cooldown, now keyed on the CHILD's current profile ──
DROP FUNCTION IF EXISTS public.check_reprofile_cooldown(uuid);
CREATE FUNCTION public.check_reprofile_cooldown(p_child_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_last timestamptz; v_months numeric;
BEGIN
  SELECT max(created_at) INTO v_last
    FROM perfilamientos WHERE child_id = p_child_id AND status='resolved' AND deleted_at IS NULL;
  IF v_last IS NULL THEN
    RETURN json_build_object('allowed', true, 'months_remaining', 0);  -- never resolved
  END IF;
  v_months := EXTRACT(EPOCH FROM (now() - v_last)) / (30.44 * 86400);
  IF v_months < 6 THEN
    RETURN json_build_object('allowed', false, 'months_remaining', ceil(6 - v_months),
                             'available_at', v_last + interval '6 months');
  END IF;
  RETURN json_build_object('allowed', true, 'months_remaining', 0);
END; $$;

-- ── 10. Final integrity assertions (RAISE -> whole migration rolls back) ─────
DO $$
DECLARE v int; v_children int; v_perf int;
BEGIN
  SELECT count(*) INTO v FROM public.perfilamientos WHERE child_id IS NULL;
  IF v > 0 THEN RAISE EXCEPTION 'orphan perfilamientos: %', v; END IF;
  IF EXISTS (SELECT 1 FROM public.group_members WHERE child_id IS NULL) THEN
    RAISE EXCEPTION 'group_members with null child_id'; END IF;
  IF EXISTS (SELECT 1 FROM public.chem_group_members WHERE child_id IS NULL) THEN
    RAISE EXCEPTION 'chem_group_members with null child_id'; END IF;
  -- every child has >=1 perfilamiento
  IF EXISTS (SELECT 1 FROM public.children c
             WHERE NOT EXISTS (SELECT 1 FROM public.perfilamientos p WHERE p.child_id = c.id)) THEN
    RAISE EXCEPTION 'child with zero perfilamientos'; END IF;
  SELECT count(*) INTO v_children FROM public.children;
  SELECT count(*) INTO v_perf FROM public.perfilamientos;
  RAISE NOTICE 'split OK: children=%, perfilamientos=%', v_children, v_perf;
END $$;

COMMIT;
