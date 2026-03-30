-- ============================================================
-- Argo Method — RLS Migration
-- Project: luutdozbhinfiogugjbv
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS on all public tables
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback           ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_transactions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. sessions — admin SELECT only
--    All writes go through service role API (/api/session.ts)
--    Tiebreaker reads go through /api/session-context (no client direct access)
-- ============================================================
CREATE POLICY "admin_select_sessions" ON sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
  );


-- ============================================================
-- 3. leads
--    App.tsx upserts the logged-in user's own lead record.
--    Admin dashboard reads/deletes all leads.
-- ============================================================
CREATE POLICY "user_insert_own_lead" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_lead" ON leads
  FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_select_leads" ON leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
  );

CREATE POLICY "admin_delete_leads" ON leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
  );


-- ============================================================
-- 4. admin_users — any authenticated user can read
--    Needed by AdminRoute.tsx to check if logged-in email is admin.
--    Writes go through service role (/api/admin-users.ts).
-- ============================================================
CREATE POLICY "authenticated_read_admin_users" ON admin_users
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- 5. tenants — users can read their own tenant record
--    TenantDashboard.tsx queries: .eq('auth_user_id', session.user.id)
-- ============================================================
CREATE POLICY "tenant_read_own" ON tenants
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());


-- ============================================================
-- 6. blog_posts — public read published posts, admin full access
-- ============================================================
CREATE POLICY "public_read_published_posts" ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "admin_all_posts" ON blog_posts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
  );


-- ============================================================
-- 7. feedback, groups, group_members, chat_messages, credit_transactions
--    All access goes through service role API endpoints only.
--    RLS enabled with NO client policies = deny all anon/authenticated.
--    (service_role bypasses RLS, so the API keeps working.)
-- ============================================================

-- No policies added for these tables intentionally.
