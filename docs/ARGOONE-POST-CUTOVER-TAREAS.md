# ArgoOne fusión — Tareas post-cutover (handoff para sesión nueva)

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
