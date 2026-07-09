# ArgoOne fusión — RUNBOOK de retome (leé esto primero)

> Punto de entrada para retomar el build de la fusión ArgoOne en una **sesión nueva**. Estado al
> 2026-07-09. Todo LOCAL en `develop`, **sin push** (regla del owner). 10 commits (`e87c07f`..`3cdd206`).

## Qué es esto (en 3 líneas)
Se fusionan ArgoOne + ArgoOne+ en un solo **ArgoOne $12.99** (siempre incluye el informe puente) + add-on
**ArgoPuente® $4.99** (un adulto suma su puente a un niño ya jugado). El adulto tiene un **perfil DISC
reusable por email** (`adult_profiles`); el puente es un **bridge = (adulto × perfilamiento)**. Rollout
shadow-live: se construye aditivo detrás de flags env en OFF; el producto vivo no cambia.

## Documentos canónicos (fuente de verdad, en orden)
1. `ARGOONE-MODELO-NUEVO.md` — el modelo + decisiones cerradas (incl. adulto-sin-perfil-visible, autorizador≠comprador, frontera One→Academy).
2. `ARGOONE-CASOS-DE-USO.md` — Fase A: casos UC1-22 + decisiones D1-24.
3. `ARGOONE-MODELO-DATOS.md` — Fase B: esquema objetivo.
4. `ARGOONE-FLUJOS.md` — Fase C: 8 flujos + las 7 reglas canónicas (R1-R7).
5. `ARGOONE-PLAN-EJECUCION.md` — Fase E: **plan por lotes L0-L9 + tabla de estado de ejecución** (mirar primero la tabla).
Memoria persistente: `project_argoone_fusion.md` (índice en `MEMORY.md`).

## Estado de ejecución (qué está hecho)
- **L0** (fugas + MP + precio) ✅ · **L1** (esquema aditivo M1-M6 + M2b) ✅ **APLICADO A PROD** (`luutdozbhinfiogugjbv`, vía MCP Supabase) · **L5** (cuestionario genérico + precio) ✅ · **L2** (checkout un-SKU B7, replay child_id B10, B17) 🟡 parcial · **L3** (dual-write B11 + sync-cron + admin-grant B18) 🟡 core hecho · **Revisión funcional** ✅ (9 hallazgos, 7 fixes).
- Tablas nuevas en prod (vacías, RLS on, solo service-role): `adult_profiles`, `bridges`, `bridge_invites`. Columnas nuevas: `children.responsible_adult_email/deletion_id` (deletion_id con DEFAULT), `perfilamientos.expires_at/renewal_reminder_sent_at`, `one_links.child_id`.
- **Flags env (todos OFF en prod):** `ONE_UNIFIED_SKU`, `PUENTES_BRIDGES` (dual-write ON escribe a las tablas nuevas), `PUENTES_ADDON_V2`, `RENEWAL_CRON_V2`, `VITE_BRIDGES_V2` (front).

## LA PRÓXIMA TAREA: el FRONT (es donde todo se vuelve real + testeable)
El backend shadow está completo. Lo que sigue es el front, **empezando por el hub**, que el owner ya revisó y aprobó como mockup.
1. **Mockup aprobado del hub:** `docs/mockups/argoone-hub-v2.html`. Servilo con `python3 -m http.server` y miralo. Es la referencia de diseño (paleta Argo, wordmark ArgoOne®, buyer-neutral, 4 estados con selector). Ajustes ya incorporados: sin sección "perfil del adulto" (su DISC vive dentro del informe puente); "Crear nuevo puente con [niño]" + (i) tooltip; sin "entrá con tu email" en el panel; **sin nombres** (no tenemos el nombre del usuario, la identidad es el email); CTA Academy solo en el dashboard del comprador (gate por escala/coach en el build, no familias); botones que no envuelven.
2. **B21 — backend `one-panel` v2** (hacelo primero, es la data del hub): payload state-adaptive resuelto por EMAIL (perfil/niños/puentes/compartidos), 6 sub-acciones (invite-adult, start-adult-profile, resend-play-link, start-replay $12.99, refresh-bridge $4.99, delete-child), backward-compat por SHAPE del payload (tokens viejos → panel actual). Lee `children` (por responsible_adult_email) + `adult_profiles` (por email) + `bridges`. Inline todo helper (no importar entre api/ ni desde src/). Detrás de `VITE_BRIDGES_V2`.
3. **F10 — `OnePanel.tsx` hub v2 React** desde el mockup, es/en/pt, backward-compat por shape.
4. Después: páginas `/puente/invite/:token` (F8) + `/eliminar/:deletion_id` (F9), y sus backends B14/B15.

## Deuda registrada (NO se te olvide)
- **#3** reminder `skip-if-paid` sigue per-email (suprime recordatorios legítimos) → va con B16 (renewal-cron per-child).
- **#4** el gate del $4.99 da 403 si el adulto tipea un email distinto al del perfilamiento → **el front debe pre-llenar/fijar el email** (en el flujo de invitación, el token reemplaza el gate por email).
- **G2** (ArgoOne crea 2 filas: `/api/session` con report_v4 + `one-complete` legacy) → fix coordinado front+backend al reescribir `OnboardingFlowV2` (que el front pase el id de la fila v4 a one-complete, y one-complete linkee en vez de crear la 2ª fila).
- **B12** (read-side: generate/send/start leen de bridges) → cutover-prep, cero valor en shadow (el dual-write mantiene el legacy funcionando). Hacer al cutover.
- **M7** (vista `current_perfilamiento` + expires_at) DIFERIDA: **la vista viva NO tiene `security_invoker`** (reloptions null); agregarlo rompería ~15 readers. Recrearla verbatim + append expires_at SIN security_invoker cuando un reader lo necesite.
- **M8** (backfill 24 puentes históricas → adult_profiles+bridges) + autofill de `responsible_adult_email`/`expires_at` en filas nuevas (trigger) → cutover-prep.
- **R4** el puente incluido en $12.99 es del comprador → necesita el canal de entrega del hub (hoy el comp va al jugador, que es donde send-email lo entrega). NO re-adjudicar al comprador sin el canal (orfanó el puente, ver commit `039e849`).

## Reglas duras / gotchas
- **NO PUSH** sin OK explícito del owner (ni a develop). Commits locales OK.
- Serverless /api NO importa entre archivos ni desde src/ (inline helpers). Gate: `npm run check:api-imports`.
- Migraciones vía **MCP Supabase `apply_migration`** (quirúrgico), NO `db push`. NOTIFY pgrst tras crear objetos.
- Copy: español latam tuteo (NO voseo), sin guiones em/en, buyer-neutral ("el niño" no "tu hijo"), marcas joined + ® (ArgoOne®/ArgoPuente®/ArgoAcademy®, Argo bold + resto fino), es/en/pt.
- Verificación: `npm run typecheck:api` + `npx tsc --noEmit` + `npm run check:api-imports` + `npm run qa:unit`.

## Prompt de arranque para la sesión nueva (pegar tal cual)
> Retomamos el build de la fusión ArgoOne. Leé `docs/ARGOONE-RESUME.md` primero (y de ahí los canónicos + la memoria). Estado: backend shadow completo, todo local sin push. La próxima tarea es el front: servime `docs/mockups/argoone-hub-v2.html` para que lo mire, y arrancá por B21 (backend one-panel v2) + F10 (hub React) desde ese mockup, es/en/pt, detrás de VITE_BRIDGES_V2. No pushees. Confirmame el plan antes de codear.
