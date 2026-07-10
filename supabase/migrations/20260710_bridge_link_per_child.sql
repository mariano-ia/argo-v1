-- ════════════════════════════════════════════════════════════════════════════
-- M9 — ONE shareable bridges-link token per child (ArgoOne fusion, Fase 1)
-- Frozen model (docs/ARGOONE-DECISIONES.md §4): each child has ONE link de
-- puentes. Only the authorizing adult shares it; any adult who opens it
-- onboards (name + email + T&C), pays their own $4.99 and gets ONLY their
-- bridge. Revoke = token rotation (existing paid bridges unaffected).
--
-- Additive + shadow: nothing reads the column until the Fase 1 code deploys
-- behind VITE_BRIDGES_V2. Mint is lazy (first "Compartir link de puentes").
--
-- APPLIED to prod (luutdozbhinfiogugjbv) 2026-07-10 via Supabase MCP
-- apply_migration; column + partial unique index verified present.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.children
    ADD COLUMN IF NOT EXISTS bridge_link_token text;

-- Unique where present (lazy mint leaves most rows NULL).
CREATE UNIQUE INDEX IF NOT EXISTS children_bridge_link_token_key
    ON public.children (bridge_link_token)
    WHERE bridge_link_token IS NOT NULL;

-- PostgREST must reload or new-column reads 500 (project gotcha).
NOTIFY pgrst, 'reload schema';
