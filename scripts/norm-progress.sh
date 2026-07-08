#!/usr/bin/env bash
# scripts/norm-progress.sh
# Progreso hacia las 500 jugadas reales con datos CRUDOS de juego (evidence_ficha.motor) para definir
# las normas de motor propias de Argo y reemplazar la referencia bibliográfica (spec §14.1 + decisión
# owner 2026-07-07). Cuenta solo jugadas resueltas, reales (excluye is_demo + emails de owners/test),
# con motor narratable (o sea, con datos de mini-juego usables). Corta por franja de edad.
#
# Uso:  bash scripts/norm-progress.sh
set -euo pipefail
export PATH="$HOME/.npm-global/bin:$PATH"

supabase db query --linked -o table "
select
  count(*) filter (where evidence_ficha->'motor'->>'narratable' = 'true')                                as con_motor_v4,
  500                                                                                                      as objetivo,
  count(*) filter (where evidence_ficha->'motor'->>'narratable' = 'true' and child_age between  8 and 10) as f_8_10,
  count(*) filter (where evidence_ficha->'motor'->>'narratable' = 'true' and child_age between 11 and 13) as f_11_13,
  count(*) filter (where evidence_ficha->'motor'->>'narratable' = 'true' and child_age between 14 and 16) as f_14_16,
  count(*) filter (where evidence_ficha is not null)                                                       as con_shadow_total
from public.perfilamientos
where status = 'resolved' and deleted_at is null and is_demo is not true
  and coalesce(adult_email,'') not in ('marianonoceti@gmail.com','mariano@yacare.io','federico.diaz.goberna@gmail.com');
"
