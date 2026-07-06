-- ============================================================================
-- 20260706_security_rls_lockdown
-- Closes the permissive RLS / grants exposure found in the 2026-07-05 audit.
--
-- Access patterns VERIFIED in code before writing (2026-07-06):
--   children, one_links, one_purchases : NO direct client access -> service-role only
--   perfilamientos, admin_audit_log     : read by ADMIN dashboard pages only
--   blog_topics                         : managed by the admin blog editor only
--   leads                               : authenticated self-upsert (user_id=auth.uid())
--                                         + admin read/delete
--   system_activity_log (+partitions)   : written by service-role (/api) only,
--                                         never read from the browser client
--   current_perfilamiento (view)        : queried only from /api (service-role)
--   SECURITY DEFINER RPCs               : called only from /api (service-role)
--
-- Design: deny-by-default for clients; every legitimate write already goes through
-- /api with the service-role key (which bypasses RLS). Admin dashboard reads are
-- preserved via admin_users-scoped policies mirroring the existing
-- `admin_select_sessions` policy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. children : kill cross-tenant `SELECT USING(true)` -> service-role only
-- ---------------------------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.children'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.children', r.polname);
  END LOOP;
END $$;
REVOKE ALL ON public.children FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. one_links / one_purchases : kill `FOR ALL USING(true)` public -> svc only
-- ---------------------------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.one_links'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.one_links', r.polname);
  END LOOP;
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.one_purchases'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.one_purchases', r.polname);
  END LOOP;
END $$;
REVOKE ALL ON public.one_links     FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.one_purchases FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------------
-- 3. perfilamientos : drop cross-tenant read + vestigial anon insert +
--    public DELETE. Keep `admin_select_sessions` (admin dashboard reads).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS auth_read              ON public.perfilamientos;  -- SELECT USING(true) cross-tenant
DROP POLICY IF EXISTS anon_insert            ON public.perfilamientos;  -- vestigial (inserts go via service-role)
DROP POLICY IF EXISTS "Allow delete sessions" ON public.perfilamientos; -- public DELETE
REVOKE ALL ON public.perfilamientos FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.perfilamientos FROM authenticated;
GRANT  SELECT ON public.perfilamientos TO authenticated;  -- admin_select_sessions needs the grant

-- ---------------------------------------------------------------------------
-- 4. admin_audit_log : public ALL -> admin read only, service-role writes
--    (makes the audit trail tamper-evident from any client)
-- ---------------------------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.admin_audit_log'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.admin_audit_log', r.polname);
  END LOOP;
END $$;
REVOKE ALL ON public.admin_audit_log FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_log FROM authenticated;
GRANT  SELECT ON public.admin_audit_log TO authenticated;
CREATE POLICY admin_read_audit ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.email()));

-- ---------------------------------------------------------------------------
-- 5. leads : self-scoped authenticated upsert (user_id = auth.uid()) +
--    admin read/delete. Kills the public SELECT (email-list leak) and the
--    public DELETE. No code change: App.tsx upserts with user_id = s.user.id.
-- ---------------------------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.leads'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.leads', r.polname);
  END LOOP;
END $$;
REVOKE ALL ON public.leads FROM anon, PUBLIC;
REVOKE ALL ON public.leads FROM authenticated;
GRANT  SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;  -- DELETE gated to admins by policy below
CREATE POLICY leads_self_insert ON public.leads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY leads_self_update ON public.leads
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY leads_read ON public.leads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.email()));
CREATE POLICY leads_admin_delete ON public.leads
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.email()));

-- ---------------------------------------------------------------------------
-- 6. blog_topics : public ALL -> admin manage, service-role (blog-cron) writes
-- ---------------------------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.blog_topics'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.blog_topics', r.polname);
  END LOOP;
END $$;
REVOKE ALL ON public.blog_topics FROM anon, PUBLIC;
REVOKE ALL ON public.blog_topics FROM authenticated;
GRANT  SELECT, UPDATE, DELETE ON public.blog_topics TO authenticated;
CREATE POLICY blog_topics_admin_manage ON public.blog_topics
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.email()));

-- ---------------------------------------------------------------------------
-- 7. system_activity_log (+ every monthly partition) : RLS was DISABLED
--    (wide open). Enable RLS + revoke client grants. Written by service-role
--    only; not read from the browser. Loop covers current + future partitions.
-- ---------------------------------------------------------------------------
DO $$ DECLARE r record; BEGIN
  FOR r IN
    SELECT c.oid::regclass::text AS t
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
      AND c.relname LIKE 'system_activity_log%'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', r.t);
    EXECUTE format('REVOKE ALL ON %s FROM anon, authenticated, PUBLIC', r.t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 8. current_perfilamiento view : it is SECURITY DEFINER (bypasses RLS).
--    Make it honor the querying user's RLS AND remove client access entirely
--    (it is read only via /api service-role).
-- ---------------------------------------------------------------------------
ALTER VIEW public.current_perfilamiento SET (security_invoker = true);
REVOKE ALL ON public.current_perfilamiento FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------------
-- 9. SECURITY DEFINER functions callable by anon/authenticated via /rest/v1/rpc.
--    Revoke from PUBLIC (anon/authenticated inherit EXECUTE via PUBLIC) and
--    grant only to service_role. All are invoked from /api with service-role.
-- ---------------------------------------------------------------------------
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
      'public.merge_children(uuid,uuid,text)',
      'public.add_credits(uuid,integer,text,text)',
      'public.deduct_credit(text)',
      'public.check_roster_capacity(uuid)',
      'public.check_reprofile_cooldown(uuid)',
      'public.increment_ai_queries(uuid)'
  ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT  EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Reload PostgREST schema cache so grant/policy changes take effect immediately.
-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- 10. Pin search_path on SECURITY DEFINER / trigger functions (advisor 0011).
--     Prevents search_path injection now that only service_role can EXECUTE them.
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.update_updated_at()                 SET search_path = public, pg_temp;
ALTER FUNCTION public.merge_children(uuid,uuid,text)      SET search_path = public, pg_temp;
ALTER FUNCTION public.check_roster_capacity(uuid)         SET search_path = public, pg_temp;
ALTER FUNCTION public.check_reprofile_cooldown(uuid)      SET search_path = public, pg_temp;
ALTER FUNCTION public.add_credits(uuid,integer,text,text) SET search_path = public, pg_temp;
ALTER FUNCTION public.deduct_credit(text)                 SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_ai_queries(uuid)          SET search_path = public, pg_temp;

NOTIFY pgrst, 'reload schema';
