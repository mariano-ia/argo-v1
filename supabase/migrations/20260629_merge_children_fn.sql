-- ============================================================================
-- Migration: merge_children() — unify two children confirmed to be the same person
-- Date: 2026-06-29  (applies AFTER 20260629_child_perfilamiento_split.sql)
-- ============================================================================
-- Non-destructive, reversible merge. Re-parents the absorbed child's perfilamientos
-- and memberships onto the survivor, frees one roster slot, and TOMBSTONES the absorbed
-- child (never hard-deletes: puentes_*.source_session_id is NOT NULL + ON DELETE CASCADE,
-- so a hard delete would erase a paid purchase). Runs in one transaction with both child
-- rows locked FOR UPDATE (ordered by id, deadlock-safe). Full old_state snapshot is
-- written to system_activity_log for reversibility.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.merge_children(p_survivor uuid, p_absorbed uuid, p_actor text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  c_survivor public.children%ROWTYPE;
  c_absorbed public.children%ROWTYPE;
  v_old_state jsonb;
  v_moved int;
  v_new_token text;
BEGIN
  IF p_survivor = p_absorbed THEN RAISE EXCEPTION 'merge_same_child'; END IF;

  -- Lock both children, ordered by id (deadlock-safe).
  IF p_survivor < p_absorbed THEN
    SELECT * INTO c_survivor FROM public.children WHERE id = p_survivor FOR UPDATE;
    SELECT * INTO c_absorbed FROM public.children WHERE id = p_absorbed FOR UPDATE;
  ELSE
    SELECT * INTO c_absorbed FROM public.children WHERE id = p_absorbed FOR UPDATE;
    SELECT * INTO c_survivor FROM public.children WHERE id = p_survivor FOR UPDATE;
  END IF;

  IF c_survivor.id IS NULL OR c_absorbed.id IS NULL THEN RAISE EXCEPTION 'child_not_found'; END IF;
  IF c_absorbed.merged_into IS NOT NULL THEN RAISE EXCEPTION 'already_merged'; END IF;
  IF c_survivor.merged_into IS NOT NULL THEN RAISE EXCEPTION 'survivor_already_merged'; END IF;
  -- Argo One (tenant_id NULL) children are never mergeable; both must be same tenant.
  IF c_survivor.tenant_id IS NULL OR c_absorbed.tenant_id IS NULL THEN RAISE EXCEPTION 'not_mergeable'; END IF;
  IF c_survivor.tenant_id <> c_absorbed.tenant_id THEN RAISE EXCEPTION 'cross_tenant'; END IF;
  -- is_demo must agree (a demo child and a real child are not the same person).
  IF c_survivor.is_demo <> c_absorbed.is_demo THEN RAISE EXCEPTION 'is_demo_mismatch'; END IF;

  -- Block if either child has a fresh in-flight perfilamiento (a play in progress).
  IF EXISTS (SELECT 1 FROM public.perfilamientos p
             WHERE p.child_id IN (p_survivor, p_absorbed)
               AND p.status = 'in_flight' AND p.created_at > now() - interval '30 minutes') THEN
    RAISE EXCEPTION 'reprofile_in_progress';
  END IF;

  -- Reversibility snapshot.
  v_old_state := jsonb_build_object(
    'absorbed_child', to_jsonb(c_absorbed),
    'absorbed_perfilamiento_ids', (SELECT coalesce(jsonb_agg(id), '[]'::jsonb) FROM public.perfilamientos WHERE child_id = p_absorbed),
    'absorbed_group_ids',         (SELECT coalesce(jsonb_agg(group_id), '[]'::jsonb) FROM public.group_members WHERE child_id = p_absorbed),
    'absorbed_chem_group_ids',    (SELECT coalesce(jsonb_agg(group_id), '[]'::jsonb) FROM public.chem_group_members WHERE child_id = p_absorbed),
    'absorbed_consent_ids',       (SELECT coalesce(jsonb_agg(id), '[]'::jsonb) FROM public.parental_consents WHERE child_id = p_absorbed),
    'survivor_prior', to_jsonb(c_survivor)
  );

  -- Re-parent perfilamientos (append; ids unchanged so puentes/feedback/consents stay valid).
  UPDATE public.perfilamientos SET child_id = p_survivor WHERE child_id = p_absorbed;
  GET DIAGNOSTICS v_moved = ROW_COUNT;

  -- Union team memberships, then drop absorbed leftovers (avoids unique-key collision).
  INSERT INTO public.group_members (group_id, child_id, added_at)
    SELECT group_id, p_survivor, added_at FROM public.group_members WHERE child_id = p_absorbed
    ON CONFLICT (group_id, child_id) DO NOTHING;
  DELETE FROM public.group_members WHERE child_id = p_absorbed;

  INSERT INTO public.chem_group_members (group_id, child_id, added_at)
    SELECT group_id, p_survivor, added_at FROM public.chem_group_members WHERE child_id = p_absorbed
    ON CONFLICT (group_id, child_id) DO NOTHING;
  DELETE FROM public.chem_group_members WHERE child_id = p_absorbed;

  -- Re-thread consents to the survivor (session_id stays bound to its perfilamiento).
  UPDATE public.parental_consents SET child_id = p_survivor WHERE child_id = p_absorbed;

  -- Safety: no orphaned paid Puentes after re-parenting (their ids never changed).
  IF EXISTS (SELECT 1 FROM public.puentes_purchases pp
             LEFT JOIN public.perfilamientos p ON p.id = pp.source_session_id
             WHERE p.id IS NULL) THEN
    RAISE EXCEPTION 'dangling_puentes';
  END IF;

  -- Tombstone absorbed (frees a slot), keep survivor active if either input was active,
  -- rotate survivor's reprofile token (absorbed token now redirects via merged_into).
  v_new_token := replace(gen_random_uuid()::text, '-', '');
  UPDATE public.children SET deleted_at = now(), merged_into = p_survivor WHERE id = p_absorbed;
  UPDATE public.children
     SET archived_at = CASE WHEN c_survivor.archived_at IS NULL OR c_absorbed.archived_at IS NULL
                            THEN NULL ELSE archived_at END,
         reprofile_token = v_new_token
   WHERE id = p_survivor;

  -- Audit (reversible).
  INSERT INTO public.system_activity_log
    (area, action, source_type, severity, resource_type, resource_id, reason, old_state, new_state, related_logs)
  VALUES
    ('roster', 'children_merged', 'system', 'info', 'child', p_survivor::text,
     jsonb_build_object('absorbed', p_absorbed, 'survivor', p_survivor, 'actor', p_actor, 'moved_perfilamientos', v_moved),
     v_old_state,
     jsonb_build_object('survivor', p_survivor, 'moved_perfilamientos', v_moved),
     ARRAY['children.' || p_survivor::text, 'children.' || p_absorbed::text]);

  RETURN json_build_object('ok', true, 'survivor', p_survivor, 'absorbed', p_absorbed, 'moved_perfilamientos', v_moved);
END; $$;

COMMIT;
