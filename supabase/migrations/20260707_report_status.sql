-- 20260707_report_status.sql
-- Fail-closed engine (doc METODO-FALLBACK-INFORME.md §4): sella el veredicto SEND-vs-HOLD en la DB.
-- ADDITIVE ONLY. Sin default en report_status (NULL = fila legacy, NO gateada: backward-compat total;
-- solo las filas v4 nuevas escriben 'pending'->'ready'/'held'/'sent'). Sin NOT NULL, sin backfill.
-- report_v4 persiste el informe ENSAMBLADO para que el cron/send-email (que NO pueden importar src/lib)
-- rendericen sin regenerar. evidence_ficha ya existe (20260706).
--
-- HOW TO APPLY: single MCP apply_migration (NOT `supabase db push`). Then the NOTIFY is MANDATORY or
-- PostgREST no ve las columnas nuevas por REST.
-- STATUS: APPLIED to prod 2026-07-07 via `supabase db query --linked --file` (MCP was unauth; this path
-- uses the Management API, no DB password). Verified: 7 columns + CHECK + partial index present.

BEGIN;

ALTER TABLE public.perfilamientos
  ADD COLUMN IF NOT EXISTS report_status  text,          -- NULL(legacy) | 'pending'|'ready'|'held'|'sent'
  ADD COLUMN IF NOT EXISTS held_reason    text,          -- código de HoldReason (reportQuality.ts)
  ADD COLUMN IF NOT EXISTS held_at        timestamptz,   -- borde pending->held (para SLA + alerta 1-shot)
  ADD COLUMN IF NOT EXISTS retry_count    int DEFAULT 0, -- reintentos del recovery-cron
  ADD COLUMN IF NOT EXISTS last_error     text,          -- último error de generación/gate
  ADD COLUMN IF NOT EXISTS report_qc      jsonb,         -- {pass, reasons[], stats, provenance[]}
  ADD COLUMN IF NOT EXISTS report_v4      jsonb;         -- ReportV4 ensamblado (Capa1/Capa2) para render sin src/lib

-- CHECK additive NOT VALID: filas viejas (NULL) nunca re-validadas; filas nuevas deben conformar.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfilamientos_report_status_chk') THEN
    ALTER TABLE public.perfilamientos
      ADD CONSTRAINT perfilamientos_report_status_chk
        CHECK (report_status IS NULL OR report_status IN ('pending','ready','held','sent')) NOT VALID;
  END IF;
END $$;

-- Cola de "Informes retenidos": índice parcial para la vista admin (query report_status='held').
CREATE INDEX IF NOT EXISTS idx_perfilamientos_held
  ON public.perfilamientos (held_at) WHERE report_status = 'held';

COMMENT ON COLUMN public.perfilamientos.report_status IS
  'Fail-closed gate verdict. NULL=legacy (ungated). pending->ready(send)|held(HOLD+human)->sent. Doc METODO-FALLBACK-INFORME.md.';

COMMIT;

-- MANDATORY o PostgREST no expone las columnas nuevas por REST:
NOTIFY pgrst, 'reload schema';
