# ArgoOne fusión — RUNBOOK de retome (leé esto primero)

> Punto de entrada para retomar el build de la fusión ArgoOne en una **sesión nueva**. Estado al
> 2026-07-09. Todo LOCAL en `develop`, **sin push** (regla del owner). 10 commits (`e87c07f`..`3cdd206`)
> + el lote de front del hub (B21 + F10, ver abajo), sin commitear al escribir esto.

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

## Hecho en esta ronda: B21 + F10 (el HUB) — HECHO local, sin push
El hub del mockup aprobado (`docs/mockups/argoone-hub-v2.html`) está construido, revisado (workflow adversarial,
7 hallazgos aplicados) y verificado (typecheck api+front, check:api-imports, qa:unit, build; render visual de
los 4 estados con Playwright, 0 errores de consola). Detrás de `VITE_BRIDGES_V2` (OFF = v1 intacto).
- **B21** (`api/one-panel.ts`): branch `if (bridgesV2On())` (acepta `1`/`on`/`true`). Resuelve el email desde token
  de `one_purchases` **o** `adult_profiles`. GET → `{ version:2, role, children[], available_slots, can_upgrade_academy }`
  con flags por niño (`is_buyer`/`is_responsible`/`is_invited`/`my_bridge`/`play_link`/`report{archetype_label,
  motor_line,is_stale,...}`). Lee `children` por (responsible_adult_email OR adult_email) + `bridges` + one_links →
  perfilamientos (últ. resuelto por `created_at DESC` + `deleted_at IS NULL`, alineado a `current_perfilamiento`).
  4 sub-acciones inline: **invite-adult** (crea `bridge_invite` + email ArgoPuente®, rate-limited, solo responsable),
  **resend-play-link** (rate-limited + solo estado sent/pending), **delete-child** (devuelve ruta `/eliminar/:id`, NO
  destructiva), **start-adult-profile** (stub `{pending:true}`, F7 no cableado). Todo helper inline.
- **F10** (`src/pages/OnePanel.tsx`): branch por `payload.version === 2` → `HubV2` (en `ToastProvider`), es/en/pt,
  tokens `AXIS_COLORS` + `InfoTip`. Tarjetas fieles al mockup (chip arquetipo, "Su motor", banner retrasado, fila
  puente, tooltip (i), Academy gateado por escala ≥3). Demo local: `/one/panel?demo=padre|familia|comprador|invitada`.
- **Pagos ($12.99 replay / $4.99 add-on):** el front postea a `one-checkout` / `puentes-checkout` existentes (decisión
  del owner). refresh-bridge fija `recipient_email` al del viewer (pasa el gate; deuda #4). start-replay manda `child_id`
  (one-checkout lo IGNORA hoy → crea niño nuevo; el binding real es **G2/B9**, pendiente antes del cutover).

## LA PRÓXIMA TAREA
1. **Páginas `/puente/invite/:token` (F8)** + su backend **B14** (bridge-invite-accept). Sin esto, el email de
   invite-adult 404ea (esperado, gateado). Pre-fill/fijar el email del invitado (deuda #4 la resuelve el token).
2. **Página `/eliminar/:deletion_id` (F9)** + backend **B15** (child-delete cascade, DESTRUCTIVO → surface al owner).
3. **F7** (cuestionario genérico del adulto) — destraba `start-adult-profile` (hoy stub) y "Crear mi puente".
4. **B12** (read-side de puente sobre bridges) — destraba "Ver mi puente" (hoy toast "próximamente").
5. **G2/B9** (one-checkout/one-complete honran `child_id`) — para que "Actualizar el informe $12.99" no cree un niño nuevo.

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
