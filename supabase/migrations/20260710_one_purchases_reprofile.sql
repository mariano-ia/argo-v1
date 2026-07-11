-- ════════════════════════════════════════════════════════════════════════════
-- Fase 3 (ArgoOne 6-month cycle): tag a purchase as a re-profile of an existing
-- child + carry which child + its authorization state. Additive, all nullable,
-- shadow until ONE_REPROFILE is on. Ships WITH the code that reads these columns
-- (one-checkout / one-webhook / session / one-complete select kind/child_id).
--
-- APPLIED to prod (luutdozbhinfiogugjbv) 2026-07-10 via Supabase MCP
-- apply_migration; columns + index verified present.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.one_purchases ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES public.children(id) ON DELETE SET NULL;
ALTER TABLE public.one_purchases ADD COLUMN IF NOT EXISTS kind text;
-- reprofile_status lifecycle: pending_payment → awaiting_auth → completed
--   (or fresh_delivered / no_authorizer / awaiting_auth_shared as terminal-ish).
ALTER TABLE public.one_purchases ADD COLUMN IF NOT EXISTS reprofile_status text;
ALTER TABLE public.one_purchases ADD COLUMN IF NOT EXISTS reprofile_authorized_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_one_purchases_child ON public.one_purchases (child_id) WHERE child_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
