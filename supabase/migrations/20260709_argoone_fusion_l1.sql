-- ============================================================================
-- Migration: ArgoOne fusion — L1 (additive shadow schema)
-- Date: 2026-07-09
-- ============================================================================
-- Applied to prod via MCP as 6 separate migrations (m1..m6). This file is the
-- idempotent repo record. All ADDITIVE / forward-only: new tables + nullable
-- columns, nothing reads them until the backend flags flip (shadow-live, V4_SEAL
-- pattern). The live product is unaffected. See docs/ARGOONE-PLAN-EJECUCION.md.
--
-- DEFERRED from L1 (riskier / not yet needed):
--   * M7 (current_perfilamiento view + expires_at): the LIVE view has NO
--     security_invoker (reloptions null); adding it would break ~15 readers.
--     Deferred until a reader needs expires_at from the view (backend reads it
--     from perfilamientos directly meanwhile).
--   * M8 (backfill puentes_sessions.adult_profile -> adult_profiles + bridges):
--     24 rows; forward-only + dual-read means this can run right before cutover.
-- ============================================================================

-- ── M1: adult_profiles — reusable adult DISC profile, one row per email ──────
CREATE TABLE IF NOT EXISTS public.adult_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  adult_name   text,
  lang         text DEFAULT 'es',
  disc         jsonb,
  adult_answers jsonb,
  access_token text NOT NULL DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  computed_at  timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS adult_profiles_email_uniq ON public.adult_profiles (lower(btrim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS adult_profiles_access_token_uniq ON public.adult_profiles (access_token);
ALTER TABLE public.adult_profiles ENABLE ROW LEVEL SECURITY;

-- ── M2: children + responsible_adult_email + deletion_id (NO expires_at) ─────
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS responsible_adult_email text;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS deletion_id text;
-- M2b: DEFAULT so every NEW child mints its own token (like reprofile_token).
ALTER TABLE public.children ALTER COLUMN deletion_id SET DEFAULT replace(gen_random_uuid()::text, '-', '');
UPDATE public.children SET responsible_adult_email = adult_email WHERE responsible_adult_email IS NULL;
UPDATE public.children SET deletion_id = replace(gen_random_uuid()::text,'-','') WHERE deletion_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS children_deletion_id_uniq ON public.children (deletion_id);
CREATE INDEX IF NOT EXISTS idx_children_responsible_email ON public.children (lower(btrim(responsible_adult_email)));

-- ── M3: perfilamientos + expires_at + renewal_reminder_sent_at ──────────────
ALTER TABLE public.perfilamientos ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.perfilamientos ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at timestamptz;
UPDATE public.perfilamientos SET expires_at = coalesce(last_profiled_at, created_at) + interval '6 months' WHERE expires_at IS NULL;

-- ── M6: one_links + child_id (replay bound to existing child) ───────────────
ALTER TABLE public.one_links ADD COLUMN IF NOT EXISTS child_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'one_links_child_id_fkey') THEN
    ALTER TABLE public.one_links ADD CONSTRAINT one_links_child_id_fkey
      FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE SET NULL;
  END IF;
END $$;
UPDATE public.one_links ol SET child_id = p.child_id
  FROM public.perfilamientos p WHERE p.id = ol.session_id AND ol.child_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_one_links_child ON public.one_links(child_id);

-- ── M4: bridges — (adult_profile x perfilamiento) cross = informe puente ─────
CREATE TABLE IF NOT EXISTS public.bridges (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adult_profile_id          uuid REFERENCES public.adult_profiles(id) ON DELETE CASCADE,
  perfilamiento_id          uuid REFERENCES public.perfilamientos(id) ON DELETE CASCADE,
  adult_email               text NOT NULL,
  disc_snapshot             jsonb,
  adult_profile_computed_at timestamptz,
  ai_sections               jsonb,
  status                    text NOT NULL DEFAULT 'created',
  lang                      text DEFAULT 'es',
  computed_at               timestamptz,
  expires_at                timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bridges_adult_perfilamiento_uniq
  ON public.bridges (lower(btrim(adult_email)), perfilamiento_id) WHERE perfilamiento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bridges_perfilamiento ON public.bridges(perfilamiento_id);
CREATE INDEX IF NOT EXISTS idx_bridges_adult_email ON public.bridges (lower(btrim(adult_email)));
CREATE INDEX IF NOT EXISTS idx_bridges_adult_profile ON public.bridges(adult_profile_id);
ALTER TABLE public.bridges ENABLE ROW LEVEL SECURITY;

-- ── M5: bridge_invites — adult-to-adult invitation (the invite = authorization) ─
CREATE TABLE IF NOT EXISTS public.bridge_invites (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token            text UNIQUE NOT NULL DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  perfilamiento_id uuid NOT NULL REFERENCES public.perfilamientos(id) ON DELETE CASCADE,
  inviter_email    text,
  invited_email    text,
  relation         text,
  status           text NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz
);
CREATE INDEX IF NOT EXISTS idx_bridge_invites_perfilamiento ON public.bridge_invites(perfilamiento_id);
CREATE INDEX IF NOT EXISTS idx_bridge_invites_token ON public.bridge_invites(token);
ALTER TABLE public.bridge_invites ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache (run after applying).
NOTIFY pgrst, 'reload schema';
