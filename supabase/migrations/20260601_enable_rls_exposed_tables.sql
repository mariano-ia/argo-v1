-- SECURITY FIX: enable RLS on three tables that were fully exposed to the
-- anon/authenticated roles (the anon key ships in the frontend bundle, so any
-- visitor could read/modify these rows directly via the Supabase REST API).
--
-- This matches the rest of the app's model: all /api/* endpoints use the
-- service-role key, which BYPASSES RLS, so enabling RLS does NOT affect them.
-- It only closes direct anon/authenticated access.
--
-- Exposed data this protects:
--   puentes_purchases — parent emails + payment status
--   puentes_sessions  — children's Argo Puentes session data
--   credit_transactions — legacy credits ledger

-- puentes_purchases is read by the SUPERADMIN dashboard (Sessions.tsx) with the
-- authenticated client, so it needs an admin-read policy (mirrors
-- admin_select_sessions). Everything else goes through the service role.
ALTER TABLE public.puentes_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_puentes_purchases" ON public.puentes_purchases
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- puentes_sessions and credit_transactions are NOT read by the frontend
-- (only via service-role /api endpoints), so service-role-only is correct:
-- enable RLS with no policy → anon/authenticated blocked, service role bypasses.
ALTER TABLE public.puentes_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
