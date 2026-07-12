# ArgoOne fusión — Tareas post-cutover (handoff para sesión nueva)

> **✅ COMPLETADO Y EN PRODUCCIÓN (2026-07-11).** Todas las tareas en alcance de este doc
> están hechas, QA-verde, revisadas adversarialmente y **desplegadas en `main` (producción)**.
> `main == develop == 2e2d3d0`. **V4 está VIVO en prod de punta a punta** (`V4_SEAL=on` +
> `V4_CAPA2=on`) en Academy y ArgoOne. Detalle completo abajo en **"EJECUTADO (as-built final)"**.
> El resto de este doc queda como registro histórico del plan.
>
> **Estado (2026-07-11):** La fusión ArgoOne está **LIVE en producción**. Cutover hecho:
> 8 flags on/1 en Production (`ONE_UNIFIED_SKU`, `ONE_V2_COMPLETE`, `PUENTES_BRIDGES`,
> `PUENTES_ADDON_V2`, `RENEWAL_CRON_V2`, `VITE_BRIDGES_V2=1`, `ONE_REPROFILE`, `V4_SEAL`),
> verificado `one-panel version:2` + cero 5xx. `main` = producción (fusión viva), `develop`
> = staging (misma DB prod). As-built del cutover: `docs/ARGOONE-FUSION-ESTADO-Y-CUTOVER.md`.
> Modelo congelado (fuente de verdad): `docs/ARGOONE-DECISIONES.md`.
>
> Un **audit de verificación** (11 dimensiones) encontró la causa raíz: **el frontend nunca
> se migró al modelo de fusión** (el backend cobra el combo unificado $12.99, pero varias
> superficies públicas siguen vendiendo el esquema muerto de dos niveles $9.99/$12.99 y naming
> viejo `[Eje][Motor]`). Este doc es la lista de tareas resultante con las decisiones del owner.

## Modelo vivo (recordatorio)
- **ArgoOne® = $12.99** (unificado): el informe del niño **+ el puente del comprador incluido**.
- **ArgoPuente® = $4.99** (add-on): un adulto suma su puente a un niño ya jugado.
- **ArgoOne+® está MUERTO como producto vendible** (solo histórico).
- Ciclo de 6 meses (re-perfilado). USD/Stripe únicamente (NO MercadoPago/ARS).
- Dos modelos de negocio: **ArgoOne** (consumidor) y **ArgoAcademy** (tenant/coach).

---

## TAREAS EN ALCANCE (el owner dijo "hacelo vos")

### 0. Nuevo cuadro de pricing en el home — PRIMERO (mismatch de precio EN VIVO)
El botón "$9.99 ArgoOne®" del home **ya cobra $12.99** atrás. Cliente ve $9.99, se le cobra $12.99.
Implementar el cuadro de pricing nuevo con el modelo de fusión.
- Target: `src/pages/Landing.tsx:705-753`.
- Mostrar: ArgoOne® $12.99 (informe + puente incluido) + ArgoPuente® $4.99 add-on. Sin ArgoOne+ como SKU.

### 1. Migración del frontend al modelo de fusión (matar el esquema de dos niveles)
- `/one` checkout: `src/pages/ArgoOneLanding.tsx:17-18` (ofrece el SKU muerto `one_puente`; cards $9.99/$12.99/$14.99).
- `/pricing`: `src/pages/PricingPage.tsx:353-354` (rama V1 de dos cards; el gate `bridgesV2` en :169/:337 ya muestra el $12.99 único cuando el flag está on, que en prod está on — revisar y retirar/actualizar la rama V1).
- Pricing tenant: `src/pages/tenant/TenantPricing.tsx:330-331`.
- Deck instituciones: `public/sales/argo-instituciones.html:1089,1114,1202-1211` (slide "5. ARGO ONE +").

### 2. Migración del naming de arquetipos `[Eje][Motor]` → `[Eje primario] con veta [Eje secundario]`
Canónico: `docs/archetype-naming.md` + `docs/METODO-CALCULO-NUEVO.md` (tempo FUERA del nombre).
- **JSON-LD FAQ (SEO público):** `index.html:87,95,103` (lista vieja "Impulsor Dinámico...", "12 arquetipos + 36 variantes", "brújula secundaria"). También noscript `index.html:125-129`.
- Homepage: `src/pages/Landing.tsx:28-40`.
- `/deck`: `src/pages/Deck.tsx:36,42,111,114,129,135,175` (nombres + tempo-en-el-nombre).
- Help center: `src/lib/helpContent.ts:258` (explica el esquema muerto eje+motor).
- Datos legacy: `src/lib/archetypeData.ts:45,157,269` (+ mirror pt) — **estos labels llegan a usuarios porque el motor legacy aún entrega informes**.
- Privacy: `src/pages/PrivacyPage.tsx:44,113,182` ("DISC + Motor / 36 variantes"). `public/llms.txt` (modelo/pricing viejos).

### 4. Gates que atrapan datos/plata
- **Reprofile `pending_payment` sin TTL:** `api/one-checkout.ts:148-160,174`. Un checkout de reprofile abandonado deja `reprofile_status='pending_payment'` y bloquea al niño para siempre (409 `reprofile_already_in_progress`). Agregar TTL/cleanup (guard por edad, ej. >1h, o un cron que lo expire).
- **Reprofile sin autorizador:** `api/one-webhook.ts:755-760`, `api/one-complete.ts:120-126`. Un reprofile pago de un niño con `responsible_adult_email` NULL termina en `no_authorizer`, sin informe. Manejar con gracia (no hay compras reprofile reales hoy, así que sin refunds pendientes; pero el path debe cerrar bien).
- **Puente satélite atado por `source_session_id` (perfilamiento) en vez de por niño:** `api/puentes-reminder-cron.ts:274-281`, `api/puentes-start.ts:52-84`. Tras un reprofile, los adultos del ciclo anterior no reciben renovación y su link permanente renderiza el perfil viejo congelado.
- **Consentimiento COPPA de primer juego no atado a `one_link_id`** (la ruta reprofile sí): `api/session.ts:337-374` (riesgo bajo).

### 6. Analítica de admin (owner-facing, no toca plata de clientes)
- **Ingreso del add-on $4.99 invisible en Revenue:** `api/admin-revenue.ts:52-70` (solo agrega `one_purchases`; el add-on vive en `puentes_purchases` provider='stripe' 499). Sumarlo.
- Panel ArgoOne no muestra puentes: `api/admin-argo-one.ts:30-57` (unir `puentes_purchases`; filtrar `is_demo`/sintéticos como hace admin-revenue).
- Columna "Pack" muerta (`pack_size` siempre 1): `src/pages/dashboard/AdminArgoOne.tsx:79-91` → reemplazar por tipo de producto (One/combo/reprofile) + indicador `includes_puente`.
- Stat "Perfiles vendidos" cuenta reprofiles como nuevos y suma pack_size=1: `api/admin-revenue.ts:59-67`. Agregar desglose de mix (`includes_puente`/`kind`).

### 7. Legal (texto sensible, revisar con cuidado)
- **Sacar MercadoPago** de PrivacyPage (ya es Stripe/USD puro): `src/pages/PrivacyPage.tsx:58,127,196` (3 idiomas).
- Revisar la descripción del puente en Términos vs la entrega en vivo: `src/pages/TermsPage.tsx:39,61`.

### 9. Higiene
- **"créditos"** en un toast del dashboard tenant: `src/lib/dashboardTranslations.ts:398` (+ 701, 1004) y otras (`creditos`, `creditosDisponibles`, `sinCreditos`, `creditoNota`). **INVESTIGAR PRIMERO** si el flujo de créditos del tenant sigue vivo o es solo copy stale (el modelo actual es roster-based, sin créditos). Si es legacy-vivo, es una limpieza más grande.
- **10 perfilamientos `in_flight` viejos (>7d)** en prod: traban el próximo reprofile/start-play de esos niños (guard `in_flight`). Barrido a estado terminal (muta datos de prod, sin drop). Prod Supabase project `luutdozbhinfiogugjbv`.
- **Strings ARS muertos:** `src/lib/puentesTranslations.ts:93,139,185` (residuo, NO se renderiza — verificar que ninguna key esté referenciada antes de borrar).
- **KB del chat de ventas del deck** enseña el modelo muerto de dos niveles: `api/deck-chat.ts:88` (actualizar al unificado; factual, no naming).
- Voseo/otros: ya se barrió una tanda (commit `e209817`); si aparecen más, tuteo.

---

## FUERA DE ALCANCE (decisiones del owner)
- **3. Plata real / datos de test:** NO tocar ahora. (Refund de la compra sintética `04119d6e` + purga de filas de test del owner = el owner lo maneja.)
- **5. Puentes standalone legacy:** "olvidate de esos links". NO decomisionar ni migrar `/puentes/*` ni `puentes_*` (hay 32 compras + 58 sesiones de clientes prepagos reales; se dejan como están).
- **8. ArgoCoach:** NO enseñarle ningún modelo de pricing. ArgoCoach no es para eso; que siga deflectando preguntas comerciales ("fuera de mi área"). Dejar como está.
- **Verificación humana** (el owner se encarga): cobro real de Stripe punta a punta, render mobile/pixel-match, deliverability real de emails.

---

## CONVENCIONES Y GOTCHAS (críticos para no romper prod)
- **Git:** `main` = producción (fusión VIVA, cambios al home son customer-facing — cuidado). `develop` = staging (misma DB prod). **NO push sin OK explícito del owner** (commit local siempre OK). Al pushear develop, también `git push origin develop:main` mantiene sync (owner autoriza cada push).
- **Ciclo de QA obligatorio tras cada tanda** (todo verde antes de commit): `npx tsc --noEmit` + `npm run typecheck:api` + `npm run qa:unit` + `npm run check:api-imports` + `npm run build`.
- **Prompts del coach son GENERADOS:** editar `src/lib/situationalGuide*.ts` o `scripts/coach-prompt-source.ts`, luego `npm run gen:coach` (NUNCA editar a mano dentro de los markers `GENERATED:` en `api/tenant-chat.ts`). `check:coach-gen` es parte de `qa:unit`.
- **Serverless `/api`:** NO importar entre archivos `api/` ni desde `src/` (pasa tsc, explota en runtime). Inline los helpers. Gate: `npm run check:api-imports`.
- **Marca (STRICT):** joined + ® — `ArgoOne®`, `ArgoPuente®` (nunca "Argo Puentes"/"Argo Puente"/plural), `ArgoMethod®` = empresa. Componentes dinámicos (`<ProductName>`/`<BrandName>`) parten el wordmark en spans → un grep de string contiguo NO los agarra. Detalle: `docs/BRAND-NAMING.md`.
- **Copy (STRICT):** español latam **NO voseo** (tú); **sin guiones** (— –) en copy de usuario; **"niños"** no "chicos"; **"el niño"** no "tu hijo"; **"equipo"** no "roster"; **NUNCA "créditos"**. Marco actividad (no solo "entrenamiento"): `docs/COPY-MARCO-ACTIVIDAD.md`. Hay un hook post-edición que bloquea voseo.
- **Vercel CLI gotcha:** `vercel env add` por stdin (pipe/echo/redirect) **setea VACÍO** en CLI 54.9.1 → usar `--value <v>`. Vars sensibles-por-defecto se ven **en blanco en `env pull`** → `--no-sensitive` para leerlas. Prefijar Bash con `export PATH="$HOME/.npm-global/bin:$PATH"`.
- **Panel aprobado:** `docs/mockups/argoone-hub-v2.html` + `docs/mockups/argoone-roles.html` (donde difieren, gana roles.html). El código es `src/pages/OnePanel.tsx` (rama `version===2`).
- **Docs de referencia:** `docs/ARGOONE-DECISIONES.md` (modelo congelado), `docs/pricing-v3.md`, `docs/ARGOONE-FUSION-ESTADO-Y-CUTOVER.md` (cutover), `docs/archetype-naming.md` (naming), `CLAUDE.md` (todo).

## Orden sugerido
0 (pricing home, urgente) → 1 (migración frontend) → 2 (naming arquetipos) → 6 (admin) → 7 (legal) → 4 (gates) → 9 (higiene). QA verde + commit por tanda; push cuando el owner lo pida.

---

## EJECUTADO (as-built final, 2026-07-11) — LIVE EN PRODUCCIÓN

**14 commits, `e209817..2e2d3d0`. `main == develop == 2e2d3d0`, desplegado y verificado sano
(www.argomethod.com home 200 / /one 200 / /api/one-panel 401 sin 5xx).** Ciclo de QA verde en
cada tanda (tsc + typecheck:api + qa:unit + check:api-imports + build). Descubrimiento y revisión
final con workflows adversariales multi-agente (hallazgos confiables corregidos).

### Tanda 1 — migración frontend (P0-P9), commits `4f043b5`..`3604ce1`
- **P0 + P1 — pricing / matar dos niveles.** Fixeado el mismatch en vivo ($9.99 mostrado / $12.99 cobrado). `/one` (ArgoOneLanding) a producto único $12.99 (informe + puente incluido); `/pricing` público **borrado por completo** (página + ruta + import; el `/dashboard/pricing` del tenant se conserva); TenantPricing a una card + copy comprador-neutral.
- **P2 — naming eje×veta.** Todas las superficies públicas/SEO: index.html (JSON-LD FAQ + noscript), LangContext, Landing (ARCHETYPES + 12 descripciones autoradas es/en/pt + ROTATING_PROFILES + render, motor → "Su motor"), Deck.tsx (es+en, matriz reescrita a eje×veta), helpContent×3, PrivacyPage, llms.txt, argo-instituciones.html, blog-generate/blog-cron, archetypeData×3 (labels legacy colapsados a primario puro).
- **P6 — admin analytics.** admin-revenue (ingreso del add-on $4.99 + mix new/reprofile/combo), admin-argo-one (unión de puentes stripe + columna Producto), AdminRevenue/AdminArgoOne. (No hay columna is_demo/is_synthetic en las tablas de compras; predicado add-on = `provider='stripe' AND status='paid'`.)
- **P7 — legal.** PrivacyPage sin MercadoPago (es/en/pt) + fecha; Terms §3 (ArgoOne = informe + puente incluido + ciclo 6m) y §6 reescrito al modelo de fusión (sin el funnel de upsell muerto).
- **P4 — gates de plata/datos.** one-checkout TTL en el dedup de reprofile; one-webhook payer-fallback (no más `no_authorizer` con plata trabada) + backfill; puentes-reminder-cron satélites por niño + dedup; session.ts COPPA ata `one_link_id` (soft). Todo inline. `puentes-start` NO cambiado a propósito (render del perfil congelado que el satélite pagó = intencional, `ARGOONE-DECISIONES` §5.7).
- **P9 — higiene (código).** créditos/ARS muertos removidos; deck-chat KB unificado.

### Tanda 2 — directivas del owner tras ver develop, commits `ddf22a1`..`63d3a8a`
- **Home widget = ArgoOne® + ArgoAcademy® (2 columnas).** Quitada la columna de ArgoPuente® (el $4.99 no es un plan del home; vive en el flujo del link del adulto). `/pricing` borrado.
- **Demo unlock → ArgoOne $12.99 con Puente.** `unlock-checkout` precio 1299; `handleUnlockPaid` ahora setea full_access + mintea el puente comp del comprador + manda email con informe + puente (antes era informe solo por $9.99).
- **Créditos "de todos lados".** Borrado el endpoint huérfano `api/create-checkout.ts`, removidos los probes add_credits/deduct_credit del canary + expected-denied.json, renombrada la key `noCredits`→`rosterFull`. **DROPeadas las 2 RPCs** `add_credits`/`deduct_credit` en la DB prod. La columna `tenants.credits_remaining` se **DEJA** (decisión del owner) — quedó 100% huérfana (0 código / 0 policies / 0 RPCs).
- **V4 naming en el dashboard.** TenantHome ahora seal-aware canónico (`report_v4.hero.arquetipoLabel ?? getArchetypeLabel(eje)`, retirado el mapa eje×motor); descriptor de veta "brújula social" → "con don para conectar" en argosEngine + tenant-chat (fuera de las regiones GENERATED; check:coach-gen verde).
- **Barrido in_flight.** 10 perfilamientos in_flight >7d soft-deleted (reversible). Nota: no bloqueaban nada activo (los guards usan ventana de 30 min).

### Cutover a producción + V4 activado, commit `2e2d3d0`
- **`git push origin develop:main`** (fast-forward `e209817..63d3a8a`) — todo lo de estos días quedó definitivamente en `main`.
- **V4 VIVO en prod de punta a punta.** `V4_SEAL="on"` (ya estaba desde el cutover; el render flip + email v4 + sealV4 ya estaban en el código de prod) → informes + emails + panel de jugadores + Argo Coach + TenantHome, todos con naming canónico eje×veta, en **Academy (tenant)** y **ArgoOne (consumidor)**. Sella solo jugadas nuevas (forward-only; las viejas quedan legacy). Fail-closed: un informe que no pasa el gate cae en "preparando" (cola de retenidos + cron para liberar).
- **`V4_CAPA2="on"`** en prod (variación con IA, Capa 2): la IA solo reescribe la prosa; arquetipo/ejes/contadores/palabras curadas quedan inmutables de Capa 1; 3 recaudos (distinción <55% trigramas, hechos preservados, gate completo) y ante cualquier fallo → Capa 1 (piso). Commit trigger `2e2d3d0` para que el runtime lo tome.
- Flags Vercel: se setean con `vercel env add <NAME> <env> [branch] --value <v> --force --no-sensitive` (el stdin setea VACÍO en CLI 54.9.1). V4_SEAL y V4_CAPA2 = `on` en Production; develop en sync.

### Panel ArgoOne reconstruido al mockup aprobado, commit `e7bd791` (LIVE en main)
El panel v2 (`src/pages/OnePanel.tsx`, `HubV2`) se había desviado del diseño aprobado. Reconstruido **fiel a `docs/mockups/argoone-roles.html`**, manteniendo el contrato de datos del backend y los estados reales que el mockup estático no dibuja. Roles documentados en `ARGOONE-DECISIONES.md` §2 (los tres roles) + §7 (qué puede cada uno):
- **Familia** (satélite): **sin panel**, solo su informe puente en `/puente/:token` (`PuenteLink.tsx`, ya fiel con wordmark **ArgoPuente®** + "Tu puente con {niño}" + $4.99 + la nota de que el informe del niño lo tiene el adulto). No se tocó.
- **Coach** (comprador no adulto): ve informe + su puente (incluido) de cada niño, sección **"Links de juego"** + **"Perfilar a otro niño $12.99"** arriba. **NO** comparte link de puentes ni ve adultos vinculados.
- **Adulto** (autoriza): comparte el **link de puentes** (exclusivo) + ve/**revoca** adultos vinculados; su puente es el add-on **$4.99** ("Crear mi puente $4.99", único botón violeta); **sin** Links de juego / Perfilar a otro niño.
- **Padre** (comprador + adulto): todo junto, puente **incluido** ("Ver mi puente").
- **Cambios de UI (mockup):** filas minimalistas (sin avatar/chip/motor) en un contenedor con divisores; **"Ver informe de {nombre}"**; puente **inline** en la fila (Ver / Continuar / Responder cuestionario [comp incluido] / Crear $4.99 [adulto]); subacts (compartir link + adultos vinculados) **solo** para el adulto autorizante; **"Re-perfilar $12.99"** en naranja; **buyrow arriba** (solo comprador); **"Links de juego"** aparte (solo comprador); saludo por rol (coach/adulto/padre) derivado de los flags; footer minimalista; es/en/pt.
- **Estados reales preservados** (el mockup no los dibuja): informe **"preparando"** (gate/held), puente **en curso** ("Continuar mi puente"), comprador que **aún no jugó** (va a "Links de juego").
- **Preview:** `?demo=coach|adulto|padre|familia|comprador` ahora funciona también en develop + `*.vercel.app` (bloqueado en prod) para verificar las 4 vistas.

### Notas / seguimiento
- **`credits_remaining`** (columna) sigue en la DB por decisión del owner (inerte, inofensiva). Si algún día se quiere borrar: `ALTER TABLE public.tenants DROP COLUMN credits_remaining;` (el auto-mode classifier bloquea los DROP de columnas por seguridad; correr con OK explícito).
- **Verificación humana (owner):** cobro real de Stripe punta a punta, render mobile/pixel-match, deliverability de emails, y el eyeball de informes v4 reales en prod (`report_qc.pass` como tasa de gate).
