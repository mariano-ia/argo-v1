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

## Fases 1-5 del front + money-path — HECHAS local, sin push (6 commits, `ba68b37`..`8abfeb1`)
Ejecución autónoma con el patrón por fase (comprensión workflow → build → review adversarial → fixes →
verificación typecheck/imports/qa/build + render Playwright → commit local). Todo detrás de flags (OFF = legacy).
- **L8 hub** (`ba68b37`) — B21 `one-panel.ts` v2 + F10 `OnePanel.tsx` (arriba).
- **Fase 1 / L6** (`a01b2bc`) — cuestionario del adulto GENÉRICO: `PuentesQuestion`/`PuentesIntro`/`PuentesFlow` sin
  ancla de niño ni `childName`; `puentesTranslations.subtitle` buyer-neutral. Resolver intacto (qa green).
- **Fase 2 / B9+B8** (`bbc32ae`) — **momento del dinero.** `one-complete` cierra **G2** (rama LINK a la row-A de
  `/api/session` con report_v4 cuando el front pasa `session_id`) + `responsible_adult_email` (R1) + `expires_at` +
  replay `child_id`; comp bridge al **COMPRADOR** (R4) vía hub. `one-webhook` email HUB de dos pistas. Flags acoplados
  (`ONE_UNIFIED_SKU` implica V2-complete) para que el rollout parcial no orfane. Hub muestra "Crear mi puente" gratis
  con `comp_token`.
- **Fase 3 / B13+B14+F8** (`5ff6f75`) — invitaciones + add-on. `puentes-checkout` acepta `invite_token` (bypass del
  gate, acoplado a `VITE_BRIDGES_V2`). `bridge-invite-accept` (nuevo, anti-enum). `PuenteInvite.tsx` (`/puente/invite/:token`,
  email fijado). Enciende "Crear nuevo puente con X" punta a punta.
- **Fase 4 / B15+F9** (`df3df36`) — borrado por `deletion_id`. `child-delete.ts` (cascade correcto: FK cascadean bridges/
  bridge_invites/puentes_*, cierra los aborts NO-ACTION de `parental_consents.child_id`+`merged_into`, scrub one_links,
  preserva one_purchases). DELETE detrás de **`CHILD_DELETE_ENABLED`** (dry-run + traza durable en admin_audit_log +
  copy honesta). `DeleteChildData.tsx` (`/eliminar/:deletion_id`, confirmación de dos pasos).
- **Fase 5 / F4+F3** (`8abfeb1`) — `PricingPage` producto único $12.99 + modal de email → one-checkout/Stripe (detrás de
  `VITE_BRIDGES_V2`). Copy buyer-neutral ("el niño"). Sweep de copy limpio en toda la superficie fusión.

## Fase 7 (2026-07-10, `078d1ac`) — el último código: B12 fast-path + Ver mi puente + B16 + B20
- **B12 fast-path (R6, `PUENTES_BRIDGES`):** `puentes-start` devuelve `profile_fresh`; `puentes-complete` acepta
  `{use_saved_profile}` (reusa el disc guardado SIN refrescar computed_at/expires_at del perfil; el bridge snapshot
  lleva el computed_at REAL; 409 → el front cae al cuestionario). `PuentesFlow`/`PuentesIntro` con copy fast-path.
- **"Ver mi puente" REAL:** el hub mapea las compras puente pagadas + sessions legacy **por SESSION** (una compra
  fan-out pre-L0 tiene varias — 6 compras / 23 sessions hermanas en prod; keyar por compra las escondía y podía
  RE-COBRAR $4.99). `bridge_token` abre `/puentes/:token` en cualquier estado; in-progress = "Continuar mi puente";
  el refresh $4.99 en stale queda deliberadamente AFUERA hasta que el checkout sea cycle-aware.
- **B16 (`RENEWAL_CRON_V2`):** branch de renovación por vencimiento en el reminder-cron — solo el perfilamiento
  CURRENT por niño (los superseded se neutralizan), demos excluidos, satélites en SU idioma con su magic link,
  `?dry=1`, errores de mark visibles. Arregla deuda #3. Legacy intacto con flag off.
- **B20:** verificado SIN cambio (lee una compra por id, ya es compatible per-child).
- Review adversarial: 10 hallazgos aplicados (incl. el HIGH del doble cobro por hermanos fan-out).

## QA (2026-07-10) — VERDE en todo lo automatizable
- **Local:** typecheck api+front, check:api-imports, qa:unit, build, `check:security` 26/26, content lint. ✅
- **Datos reales (read-only, prod):** children 163/163 con responsible/deletion_id; perfilamientos expires_at 100%;
  0 orphans/cadenas rotas; 9 niños de compradores reales visibles en el hub; **24 puentes legacy listos** que el hub
  mostrará vía fallback + 28 en curso ("Continuar"); **B16 mandaría 0 emails hoy** (sin blast al prender);
  fast-path inerte hasta dual-write (0 adult_profiles frescos). ✅
- **Ensayo M7/M8 (read-only):** M7 devuelve las mismas 152 filas + expires_at; M8 insertaría 4 adult_profiles +
  24 bridges, 0 orphans. ✅
- **Render Playwright:** 4 estados del hub + click-through hub → "Ver mi puente" → informe puente, 0 errores. ✅
- **NO cubierto (necesita humano/deploy):** compra Stripe test E2E en develop, verificación de emails reales,
  y el apply real de M7/M8.

## LA PRÓXIMA TAREA: cutover (L9) — NECESITA OK DEL OWNER
1. **Push a develop** + prender flags en develop.argomethod.com + **compra Stripe test E2E** (humano).
2. **M7 + M8** — aplicar a prod TRANSACCIONAL con ensayo/ROLLBACK + probe (SQL listo en
   `supabase/migrations/20260709_argoone_fusion_cutover_prep.sql`; ver caveat security_invoker).
3. **Habilitar `CHILD_DELETE_ENABLED`** (borrado destructivo real) — tu OK.
4. **L9 cutover** — prender flags en prod en orden (`ONE_UNIFIED_SKU` → `ONE_V2_COMPLETE` → `PUENTES_BRIDGES` →
   `PUENTES_ADDON_V2` → `RENEWAL_CRON_V2` → `VITE_BRIDGES_V2`), verificando entre cada uno. Rollback = apagar flags.
   Pendiente menor post-cutover: checkout cycle-aware (refresh $4.99 de un puente vencido) + F11 banner en /report.

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
