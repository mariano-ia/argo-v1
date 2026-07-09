# ArgoOne — Fase E: Plan de ejecución

> Fase E del roadmap (`ARGOONE-MODELO-NUEVO.md` §9). Plan secuenciado en 10 lotes para construir el ArgoOne
> fusionado sin romper prod. Sale de un workflow (3 planificadores de dominio + arquitecto de release,
> 2026-07-09). Basado en el mapa de cambios de `ARGOONE-FLUJOS.md` §E y el modelo de `ARGOONE-MODELO-DATOS.md`.
> **Aún NO tocado en código.** Requiere OK del owner + cerrar 2 bloqueadores (ver §Bloqueadores).

## Principio de rollout: shadow-live por subsistema (patrón V4_SEAL)

Todo se construye **aditivo/forward-only**: tablas y columnas nuevas conviven con `puentes_sessions`/
`puentes_purchases`/`one_purchases` legacy. El backend hace **dual-write** (escribe a legacy Y a lo nuevo)
durante el shadow, y el **lado-lectura se conmuta por flag env**. **Cutover** = prender el flag en prod;
**rollback** = apagarlo (los datos siguen en ambos lados, sin pérdida). Nunca big-bang: siempre dual-read,
se prende un flag, se verifica (qa-monitor, Stripe test, cron heartbeat), y recién el siguiente.

**Flags:**
- `ARGOONE_FUSION_V2` — read-gate umbrella de las tablas shadow.
- `ONE_UNIFIED_SKU` — one-checkout single-SKU $12.99 + email HUB de dos pistas.
- `ONE_V2_COMPLETE` — one-complete 1-sola-fila + append por child_id + responsible/deletion_id/expires_at + bridge comp del comprador.
- `PUENTES_BRIDGES` — el pipeline de puente lee `bridges`/`adult_profiles` en vez de `puentes_sessions`.
- `PUENTES_ADDON_V2` — add-on gateado por invitación/responsable + supresión R5 + cycle-aware.
- `RENEWAL_CRON_V2` — renewal cron por vencimiento.
- `VITE_BRIDGES_V2` — front en lockstep (prefijo VITE_, expuesto al build).

El front hace además **backward-compat POR SHAPE** del payload (OnePanel: pack legacy vs hub v2), así los
tokens/compradores viejos no se rompen aunque el flag esté ON. El **DROP** de `puentes_sessions`/
`puentes_purchases` y de la columna embebida `adult_profile` es una migración destructiva **POSTERIOR**,
fuera de este plan, surfaced al owner recién post-cutover verificado.

## Los 10 lotes

### L0 — Prioridad 0: fugas vivas + residuo MP + precio stale · **EJECUTADO 2026-07-09 (commit local, sin push)**
Cierra las 3 fugas de PII/plata vivas y limpia MP/precio, sobre el esquema actual, sin tocar el rediseño.
- Tareas: **B4, B3, B1, B2, B5, B6** — todas aplicadas. `typecheck:api` + `check:api-imports` verdes.
  - B1/B2/B5 (`puentes-checkout.ts`): gate de relación (recipient == adult_email del perfilamiento fuente, fail-closed), doble-compra por (email × niño), MP/ARS removido (Stripe USD only).
  - B3 (`one-webhook.ts`): fan-out muerto — 1 sola puentes_session por compra.
  - B4 (`one-complete.ts`): puente comp al comprador (`one_purchases.email`), scoped por perfilamiento.
  - B6 (`puentes-reminder-cron.ts` + `admin-send-puentes-invite.ts`): precio 9.99→4.99, sin ARS.
- Pendiente menor (no bloqueante): el front `PuentesCheckout.tsx` muestra error genérico ante el nuevo 403 `not_authorized`; pulir en L7.
- Safe-stop: 3 leaks cerrados, MP fuera de puentes-checkout, upsell a $4.99 correcto. El modelo legacy sigue 100% funcional. Se puede parar acá indefinidamente.
- Verificación: `typecheck:api` + `check:api-imports` + `build`; POST puentes-checkout con recipient≠adult del source → 403; mismo niño → 409; Stripe test → 1 sola fila puente; grep MP/9.99 vacío.
- Rollback: git revert por archivo. Cero estado, cero migración, cero flag.

### L1 — Esquema aditivo shadow · **M1-M6 APLICADO 2026-07-09 (prod, vía MCP); M7/M8 diferidos**
- Aplicado a prod (`docs`/registro local: `supabase/migrations/20260709_argoone_fusion_l1.sql`): **M1**
  adult_profiles, **M2** children +responsible_adult_email +deletion_id (backfill 164, sin expires_at),
  **M3** perfilamientos +expires_at +renewal_reminder_sent_at (backfill), **M6** one_links +child_id (FK
  SET NULL), **M4** bridges (UNIQUE parcial adult×perfilamiento), **M5** bridge_invites. Las 3 tablas nuevas
  con RLS activado + sin policies (solo service-role). Verificado: tablas/columnas/índices/FKs OK, backfills
  0 faltantes, 0 deletion_id duplicados. `NOTIFY pgrst` corrido.
- **M7 (vista) DIFERIDO — hallazgo clave:** la vista `current_perfilamiento` viva **NO tiene** `security_invoker`
  (reloptions null, corre con permisos del owner). El plan asumía `security_invoker=true`; agregarlo **habría
  roto** los ~15 readers (RLS lockdown de children devolvería 0 filas). Se difiere hasta que un reader necesite
  `expires_at` desde la vista; mientras tanto el backend lo lee de `perfilamientos` directo.
- **M8 (backfill puentes_sessions.adult_profile → adult_profiles + bridges) DIFERIDO:** 24 filas; con dual-read
  puede correr justo antes del cutover (forward-only mientras tanto).
- Tareas restantes/orden original: M1→M4→M8 (FK + backfill); M3→M7 (vista). `bridges` es TABLA NUEVA, nunca rename.
- Safe-stop: todo el esquema en pie, nadie lo lee → prod intacto. Se puede quedar acá semanas. M7 (la única op live-read) puede diferirse hasta justo antes del hub.
- Verificación: MCP `apply_migration` (NO db push); `information_schema` + índices únicos + FKs; aserciones de backfill (responsible_adult_email/deletion_id/expires_at NULL == 0); NOTIFY pgrst + probe REST `?limit=0`; qa-monitor CHECK 8 verde. M7: probe a tenant-sessions → 200 + `security_invoker=true`.
- Rollback: DROP TABLE (shadow) / DROP COLUMN (casi vacías). CHECKs siempre NOT VALID. Nada destructivo sobre legacy.

### L2 — Flujo de pago ArgoOne v2 (checkout→webhook→start-play→complete) · shadow, flags OFF
- Tareas: **B7, B8, B10, B9, B17**. Un pago fluye ENTERO en el lote. Flags `ONE_UNIFIED_SKU` + `ONE_V2_COMPLETE`.
- Safe-stop: flujo de pago nuevo en develop con flags OFF → prod sigue legacy. Con flags ON en develop se hace E2E.
- Verificación: `typecheck:api` + `check:api-imports` + `qa:unit`; Stripe unit_amount=1299; webhook idempotente; B10 email doble-confirmación (mismatch → 400); B9 → 1 child + 1 perfilamiento (G2), replay → append; B17 child ArgoOne → 402.
- Rollback: flags OFF = prod legacy; git revert de 5 archivos.

### L3 — Pipeline de puente sobre bridges/adult_profiles · dual-write, `PUENTES_BRIDGES` OFF
- Tareas: **B11, B12, B18, B19**. Dual-write (puentes_sessions Y adult_profiles+bridges); resolver de 15 respuestas INLINE con paridad a `src/lib/puentesProfileResolver.ts`. Gate R2 estricto (solo bridge PAGADO).
- Safe-stop: pipeline sobre bridges con flag OFF → puente legacy sigue desde puentes_sessions.
- Verificación: `qa:unit` (paridad resolver); perfil fresco → fast-path; nombre real nunca sale al proveedor IA; B19 hermano nuevo → NO auto-genera.
- Rollback: flag OFF = lectura vuelve a puentes_sessions (datos en ambos lados).

### L4 — Add-on $4.99 + invitaciones + entitlement + borrado + renewal cron · flags OFF, endpoints inertes
- Tareas: **B13, B14, B15, B16, B20**. Flags `PUENTES_ADDON_V2` + `RENEWAL_CRON_V2`. B14/B15 nuevos e inertes hasta que el front (F8/F9) los cablee.
- Safe-stop: construido, flags OFF y endpoints sin cablear → prod intacto.
- Verificación: B13 token válido → 200, source abierto → 403, ya tiene bridge → suprimido; B15 delete cascade a satélites + scrub one_links + preserva one_purchases; B16 dry-run con CRON_SECRET.
- Rollback: flags OFF. **Única acción irreversible: la EJECUCIÓN de B15** (borra datos de un menor, iniciada por el responsable, idempotente, scoped por deletion_id) → surface al owner antes de habilitar.

### L5 — Front copy base (sin acoplamiento) · directo, puro copy
- Tareas: **F1, F2, F12**. Genericizar cuestionario (quitar {nombre}, ids/tags intactos), translations buyer-neutral, legal (D21/D22/D24, USD-only). Va antes de L6.
- Verificación: `tsc --noEmit` + `build`; grep `{nombre}` == 0, `ARS` == 0, `tu hijo/tus hijos` == 0; hook voseo pasa.

### L6 — Front flujo Puente v2 (deploy ATÓMICO) · `VITE_BRIDGES_V2` OFF, dark
- Tareas: **F5, F6, F7** (un solo deploy indivisible: quitar la prop childName rompe al caller hasta F7). Depende de L5 + L3 (contrato v2) + L1.
- Safe-stop: código dark en develop con flag OFF → flujo Puente legacy sin cambio.
- Verificación: `tsc --noEmit` + `build` con los 3 juntos; con flag ON: perfil fresco → salta preguntas; sin pago → 402.

### L7 — Front landing single-product + banner retrasado + páginas nuevas · `VITE_BRIDGES_V2` / aditivo
- Tareas: **F4, F11, F8, F9**. F4 (landing $12.99, recomendado que B7 acepte body dual). F11 banner derivado (R7, no bloquea). F8 `/puente/invite/:token` (dep B14). F9 `/eliminar/:deletion_id` (dep B15, confirmación explícita + aviso D21).
- Verificación: `tsc` + `build`; grep `one_puente/kind` == 0; banner solo si expires_at pasado; F9 ningún fetch de borrado sin confirmación.

### L8 — Hub OnePanel v2 (state-adaptive, backward-compat por shape) · `VITE_BRIDGES_V2`
- Tareas: **F10** (+ el backend one-panel v2, ver Bloqueadores). Secciones perfil/niños/puentes/compartidos; 6 sub-acciones; backward-compat por shape (pack legacy → panel actual; hub v2 → state-adaptive).
- Safe-stop: tokens/packs viejos → panel actual intacto. Parada segura con flag OFF.
- Verificación: token legacy → panel actual; email nuevo → hub; cada botón postea su sub-acción.

### L9 — Cutover en prod + sweep final de copy · **NO shippable solo (es el go-live)**
- Tareas: **F3** (sweep final tuteo/®/buyer-neutral/sin-guiones). Cutover = prender flags en prod en orden con verificación entre cada uno: `ONE_UNIFIED_SKU` → `ONE_V2_COMPLETE` → `PUENTES_BRIDGES` → `PUENTES_ADDON_V2` → `RENEWAL_CRON_V2` → `VITE_BRIDGES_V2`. Los crons recién cambian acá (no corren en preview).
- Rollback: apagar el/los flag(s) en prod (Vercel CLI) = vuelta a legacy inmediata, sin pérdida (dual-write). Ningún DROP acá.

## Legend de tareas

**Migraciones (L1):** M1 adult_profiles (email único, DISC snapshot, computed_at/expires_at) · M2 children +responsible_adult_email +deletion_id (backfill; **sin expires_at** — el vencimiento vive en el perfilamiento) · M3 perfilamientos +expires_at +renewal_reminder_sent_at (OJO no duplicar last_profiled_at/puentes_reminder_sent_at) · M4 bridges (tabla nueva, UNIQUE(adult_email,perfilamiento_id), FK perfilamiento_id CASCADE) · M5 bridge_invites · M6 one_links +child_id (FK SET NULL) · M7 vista current_perfilamiento +expires_at (verbatim + security_invoker) · M8 backfill embebido→adult_profiles+bridges.

**Backend — L0 (fugas):** B1 gate $4.99 por relación real · B2 doble-compra por (email×niño) · B3 matar fan-out webhook · B4 comp al comprador (R4) · B5 remover MP de puentes-checkout · B6 precio stale 9.99→4.99.
**Backend — rediseño:** B7 one-checkout un-SKU · B8 webhook rutear SKUs + email HUB + upsert adult_profiles · B9 one-complete G2 + responsible/deletion/expires + bridge comp · B10 start-play email doble-confirmación (D23) + child_id firmado · B11 puentes-complete → adult_profiles + snapshot · B12 generate/send/start → leer bridges, gate pagado · B13 add-on $4.99 por invitación (R1/R2/R5) · B14 bridge-invite-accept (NUEVO) · B15 child-delete + request-child-delete (NUEVOS, **destructivo**) · B16 renewal-reminder-cron por vencimiento + satélites · B17 start-reprofile rechaza reprofile gratis ArgoOne · B18 admin-grant per-niño · B19 puentes-sync-cron a bridges, sin auto-cover · B20 puentes-check-purchase backward-compat · **B21 one-panel v2** (endpoint state-adaptive por email + 6 sub-acciones + backward-compat por shape; va en L8 antes de F10).

**Front:** F1 cuestionario sin {nombre} · F2 translations buyer-neutral · F3 sweep copy final · F4 landing single-product · F5 PuentesQuestion sin childName · F6 PuentesIntro sin selector ancla · F7 PuentesFlow genérico + fast-path · F8 /puente/invite/:token · F9 /eliminar/:deletion_id · F10 OnePanel hub v2 · F11 banner retrasado · F12 legal.

## Orden crítico
L0 suelto (primero, sin dependencias) → L1 (migraciones antes de todo backend que las lee) → L2 (pago entero) → L3 (pipeline puente sobre bridges que L2 puebla) → L4 (add-on/invite/delete/cron sobre el entitlement de L3) → L5 (copy) → L6 (deploy atómico F5+F6+F7) → L7 (landing/banner/páginas) → L8 (hub, tras F8/F9) → L9 (cutover, flags en prod en lockstep).

## Riesgos globales
- **DB compartida prod+develop**: una migración "para develop" impacta prod al instante. Neutralizado: todo L1 aditivo/forward-only, nullable, read-gateado; ningún objeto legacy se dropea/renombra.
- **M7 (vista current_perfilamiento)** = única op live-read (~15 endpoints + Sessions.tsx). CREATE OR REPLACE solo APPENDea columnas → copiar VERBATIM la def de `20260706_perfilamiento_ficha.sql` + re-setear `security_invoker=true` (o se deshace el RLS lockdown). Ensayo transaccional con ROLLBACK + NOTIFY pgrst + probe. Sin NOTIFY, PostgREST 500ea (~1min, precedente split 2026-06-29).
- **one-webhook (B8)** = el momento del dinero: no debe throw ni romper idempotencia; upsert adult_profiles best-effort. El handler MP de one-webhook NO se toca (sirve subscriptions+one); solo se remueve el path MP de puentes-checkout.
- **B15 child-delete irreversible**: CASCADE borra bridges de TODOS los satélites + scrub one_links + delete child_memory. Mitigado: idempotente, scoped por deletion_id de alta entropía, one_purchases preservado (D21), anti-enum. Ejecutarlo no es reversible → surface antes de habilitar.
- **Restricción serverless /api**: ningún archivo (incl. nuevos B14/B15 y lógica inline de B9/B11) importa entre api/ ni desde src/ (ERR_MODULE_NOT_FOUND, outage 2026-06-05). Inline de todo helper. Gate: `check:api-imports`.
- **Crons no corren en preview**: B16/B19 solo cambian comportamiento al prender el flag en prod (L9). Validación por dry-run con CRON_SECRET.
- **Paridad del resolver** de 15 respuestas: la versión inline en B11 espeja `src/lib/puentesProfileResolver.ts`; cubierto por `qa:unit`.

## Bloqueadores — RESUELTOS (2026-07-09)
1. **B21 — backend one-panel v2 → AGREGADO al plan de backend** (owner: "sin panel no hay producto"). Endpoint
   nuevo `api/one-panel.ts` v2: payload state-adaptive resuelto por email (perfil/niños/puentes/compartidos) +
   6 sub-acciones (invite-adult, start-adult-profile, resend-play-link, start-replay $12.99, refresh-bridge
   $4.99, delete-child) + backward-compat por shape. Mismo patrón inline (sin import cross-api/src). Va en L8,
   ANTES de F10. Dep: M1/M4/M5 + B9/B11/B13/B15.
2. **`children.expires_at` → NO se agrega** (owner). Lo que vence es la **jugada** (el perfilamiento): el
   vencimiento vive solo en `perfilamientos` (`last_profiled_at`+6m). El niño como entidad no vence. A los 6
   meses se informa "potencialmente desactualizado" pero sigue consultable siempre (R7 soft-nudge). → M2 crea
   solo `responsible_adult_email` + `deletion_id` en children, sin `expires_at`.
