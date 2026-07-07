-- 20260706_perfilamiento_ficha.sql
-- Fase 2A of the method redesign (naming eje×veta + motor as per-child insight).
-- ADDITIVE ONLY: new columns for the EvidenceFicha (spec §10) + recreate current_perfilamiento to
-- expose them. No NOT NULL, no backfill, no data rewrite. Old rows keep method_version=NULL (legacy
-- branch in report-recovery/admin-grant). game_metrics already exists; it just starts being populated.
--
-- HOW TO APPLY: single MCP apply_migration (NOT `supabase db push`). Then the NOTIFY at the end is
-- MANDATORY or PostgREST 500s on the recreated view.
-- STATUS: written 2026-07-06 during the autonomous run; HOLD applying until the owner is present
-- (owner decision — see docs/METODO-PLAN-IMPLEMENTACION.md §"última milla").

BEGIN;

ALTER TABLE public.perfilamientos
  ADD COLUMN IF NOT EXISTS method_version    text,
  ADD COLUMN IF NOT EXISTS question_version  text,
  ADD COLUMN IF NOT EXISTS band              text,   -- 'mezcla'|'con_matices'|'definido'
  ADD COLUMN IF NOT EXISTS registro          text,   -- 'mezcla'|'tentativo'|'claridad'
  ADD COLUMN IF NOT EXISTS forma             text,   -- duo_empate|equilibrio|duo|versatil|lider_acompanante|definido|muy_definido
  ADD COLUMN IF NOT EXISTS b_top             int,    -- B = 1º-2º (gatea primario)
  ADD COLUMN IF NOT EXISTS b2                int,    -- B2 = 2º-3º (gatea veta)
  ADD COLUMN IF NOT EXISTS top_count         int,
  ADD COLUMN IF NOT EXISTS second_count      int,
  ADD COLUMN IF NOT EXISTS third_count       int,
  ADD COLUMN IF NOT EXISTS vote_vector       jsonb,  -- {D,I,S,C}
  ADD COLUMN IF NOT EXISTS veta_eje          text,   -- eje secundario (D/I/S/C)
  ADD COLUMN IF NOT EXISTS nombre_gated      boolean,-- nombrarPrimario
  ADD COLUMN IF NOT EXISTS veta_en_nombre    boolean,
  ADD COLUMN IF NOT EXISTS veta_opuesta      boolean,
  ADD COLUMN IF NOT EXISTS motor_narratable  boolean,
  ADD COLUMN IF NOT EXISTS edad_meses        int,
  ADD COLUMN IF NOT EXISTS factor_edad       numeric,
  ADD COLUMN IF NOT EXISTS latency_af        numeric,
  ADD COLUMN IF NOT EXISTS reaction_af       numeric,
  ADD COLUMN IF NOT EXISTS adaptation_af     numeric,
  ADD COLUMN IF NOT EXISTS tempo_score       numeric,
  ADD COLUMN IF NOT EXISTS tempo_zona        text,   -- 'lento'|'intermedio'|'rapido'|NULL
  ADD COLUMN IF NOT EXISTS evidence_ficha    jsonb,  -- full snapshot (IC, nTrials, skeleton decisions)
  ADD COLUMN IF NOT EXISTS game_metrics      jsonb;  -- defensive: exists already, IF NOT EXISTS is a no-op

-- Additive CHECKs: NOT VALID so pre-existing NULL rows are never re-validated; new rows must conform.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfilamientos_band_chk') THEN
    ALTER TABLE public.perfilamientos
      ADD CONSTRAINT perfilamientos_band_chk
        CHECK (band IS NULL OR band IN ('mezcla','con_matices','definido')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfilamientos_tempo_zona_chk') THEN
    ALTER TABLE public.perfilamientos
      ADD CONSTRAINT perfilamientos_tempo_zona_chk
        CHECK (tempo_zona IS NULL OR tempo_zona IN ('lento','intermedio','rapido')) NOT VALID;
  END IF;
END $$;

-- Partial index for the opposite-veta population monitor (spec §3.2).
CREATE INDEX IF NOT EXISTS idx_perfilamientos_opposite_monitor
  ON public.perfilamientos (veta_opuesta) WHERE veta_en_nombre;

-- Recreate the view: EXISTING columns kept verbatim (name/order/type — CREATE OR REPLACE VIEW only
-- allows appending), ficha columns appended at the END. DISTINCT ON (c.id) + ORDER BY intact.
CREATE OR REPLACE VIEW public.current_perfilamiento AS
SELECT DISTINCT ON (c.id)
  c.id            AS id,
  c.tenant_id, c.child_name, c.child_age, c.adult_name, c.adult_email, c.sport,
  c.archived_at, c.deleted_at, c.is_demo, c.reprofile_token, c.merged_into,
  p.id            AS perfilamiento_id,
  p.eje, p.motor, p.eje_secundario, p.archetype_label, p.answers, p.ai_sections,
  p.ai_tokens_input, p.ai_tokens_output, p.ai_cost_usd,
  p.share_token, p.full_access, p.email_sent_at, p.lang,
  p.created_at    AS current_profile_date,
  (SELECT count(*) FROM public.perfilamientos pp
     WHERE pp.child_id = c.id AND pp.status = 'resolved' AND pp.deleted_at IS NULL) AS perfilamiento_count,
  -- ── v4 EvidenceFicha columns (appended) ──
  p.method_version, p.question_version, p.band, p.registro, p.forma,
  p.b_top, p.b2, p.top_count, p.second_count, p.third_count, p.vote_vector,
  p.veta_eje, p.nombre_gated, p.veta_en_nombre, p.veta_opuesta,
  p.motor_narratable, p.edad_meses, p.factor_edad,
  p.latency_af, p.reaction_af, p.adaptation_af, p.tempo_score, p.tempo_zona,
  p.evidence_ficha, p.game_metrics
FROM public.children c
JOIN public.perfilamientos p
  ON p.child_id = c.id AND p.status = 'resolved' AND p.deleted_at IS NULL
ORDER BY c.id, p.created_at DESC;

-- Preserve the security_invoker=true set by 20260706_security_rls_lockdown.sql
-- (CREATE OR REPLACE VIEW would otherwise reset it — do NOT undo the RLS fix).
ALTER VIEW public.current_perfilamiento SET (security_invoker = true);

COMMENT ON VIEW public.current_perfilamiento IS 'One row per child = latest resolved perfilamiento. Single source of truth for current profile. + v4 EvidenceFicha columns (2026-07-06).';

COMMIT;

-- MANDATORY after recreating the view or PostgREST 500s on current_perfilamiento:
NOTIFY pgrst, 'reload schema';
