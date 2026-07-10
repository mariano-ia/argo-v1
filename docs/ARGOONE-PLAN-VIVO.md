# ArgoOne — Plan para vivo + mapa de emails (2026-07-10)

> Sale de un barrido multi-agente sobre el código real de develop (29 templates HTML +
> 6 alertas, con el markup de cada encabezado citado) + verificación del gap contra el
> modelo congelado. **El modelo que manda: `ARGOONE-DECISIONES.md`.** Este doc es el
> plan de ejecución: qué falta, qué muere, y la unificación de emails.

# 1. MAPA DE EMAILS

## 1.1 Inventario completo (29 templates HTML + 6 alertas de texto plano)

| # | Archivo · builder | Trigger | Destinatario | Asunto (es) | Encabezado | Idiomas | Footer |
|---|---|---|---|---|---|---|---|
| 1 | `one-webhook.ts` · sendConfirmationEmail | Compra pack pagada (flag `ONE_UNIFIED_SKU` OFF) | Comprador | "Tu informe ArgoOne® está listo para usar" | Banda oscura, **ArgoOne®** (One® w300) | es/en/pt completo | Strip localizado "ArgoMethod® · Perfilamiento…" |
| 2 | `one-webhook.ts` · sendHubEmail | Compra unificada $12.99 pagada (flag ON) | Comprador | "Tu ArgoOne® está listo. Dos pasos…" | Banda oscura, **ArgoOne®** (w300) | es/en/pt completo | Strip localizado |
| 3 | `one-webhook.ts` · sendUpgradeEmail | Suscripción PRO/Academy activada | Comprador (tenant) | "Tu plan {plan} en ArgoMethod® está activo" | Banda oscura, **ArgoMethod®** (Method® w100) | es/en/pt (footer es hardcodeado) | Strip es-only (bug línea 427) |
| 4 | `one-webhook.ts` · sendPuentesMagicEmail | ArgoPuente® $4.99 pagado | Adulto pagador | "Tu ArgoPuente® está listo. Vínculo con {niño}" | Banda oscura, **ArgoMethod® + chip violeta PUENTE** | es/en/pt | Strip "ArgoMethod® · ArgoPuente®" |
| 5 | `one-webhook.ts` · paymentFailedEmail | Pago de suscripción fallido (Stripe/MP) | Comprador | "No pudimos procesar tu pago" | lifecycleShell, **ArgoMethod®** (w100) | es/en/pt (footer es-only) | Strip es hardcodeado |
| 6 | `one-webhook.ts` · subscriptionEndedEmail | Suscripción cancelada | Comprador | "Tu suscripción a Argo finalizó" (dice "Argo" pelado) | lifecycleShell, **ArgoMethod®** (w100) | es/en/pt (footer es-only) | Strip es hardcodeado |
| 7 | `send-email.ts` · buildHtml (legacy) | Informe del niño listo (report no sellado v4) | Adulto | "El informe de {niño} en ArgoMethod® está listo" | Banda oscura, **ArgoMethod®** (w100) | es/en/pt | El más rico: tagline + disclaimer + Privacidad/Términos |
| 8 | `send-email.ts` · buildHtmlV4 | Informe v4 sellado | Adulto | Igual al 7 | **ÚNICO header claro** sobre blanco, ArgoMethod® 800/**300 gris, 17px** | es/en/pt | Mini wordmark + disclaimer, SIN links legales |
| 9 | `one-panel.ts` · sendAccessLinkEmail | request-access (magic link del panel) | Comprador | "Tu link de acceso a ArgoOne®" | Banda oscura, **ArgoOne®** (w300) | es/en/pt | **SIN footer** |
| 10 | `one-panel.ts` · sendPlayLinkEmail | resend-play-link (hub v2) | Adulto | "ArgoMethod®: la experiencia de {niño} está lista" | **ArgoOne®** en header, ArgoMethod® en asunto | es/en/pt | **SIN footer** (su gemelo v1 sí tiene) |
| 11 | `one-panel.ts` · sendBridgeInviteEmail | invite-adult (bridge_invites) | Familia | "Te invitaron a crear tu ArgoPuente® con {niño}" | Banda oscura, **ArgoPuente®** (único email con este wordmark en header) | es/en/pt | SIN footer. Bug de género: "tu propia ArgoPuente®" |
| 12 | `one-panel.ts` · inline generate-link (v1) | Panel pack v1 asigna slot | Adulto | "ArgoMethod®: la experiencia de {niño} está lista" | **ArgoOne®** (w300) | es/en/pt | Strip es hardcodeado |
| 13 | `puentes-reminder-cron.ts` · buildReminderHtml | Cron legacy: upsell puente a los 3 días | Adulto | "Una idea más para acompañar a {niños}" | **ArgoMethod® + chip PUENTE** | es/en/pt | Strip "ArgoMethod® · ArgoPuente®" |
| 14 | `puentes-reminder-cron.ts` · buildRenewalHtml | Cron B16 (flag ON): perfil venció 6 meses | Adulto (responsable o satélite) | "El perfil Argo de {niño} cumplió 6 meses" | **ArgoOne®** (w300) | es/en/pt | Strip "ArgoMethod® · ArgoOne®" |
| 15 | `puentes-sync-cron.ts` · buildCombinedEmail | Puente regenerado por re-perfil | Comprador puente | "{niños} está(n) creciendo…" | **ArgoMethod® + chip PUENTE** | es/en/pt | Strip. Bug copy: "Los chicos evolucionan" |
| 16 | `send-puentes-email.ts` · buildHtml | Informe ArgoPuente® generado | Comprador puente / familia | "Tu ArgoPuente®: vínculo con {niño}" | **ArgoMethod® + chip PUENTE** | es/en/pt | Strip + nota de borrado + disclaimer no-clínico |
| 17 | `create-tenant.ts` · sendWelcomeEmail | Signup trial | Comprador | "Bienvenido a ArgoMethod®" | **"Argo Method" ESPACIADO, sin ®** (drift) | es/en/pt | Strip |
| 18-19 | `invite-user.ts` · buildInviteEmail / buildAddedEmail | Invitación a gestionar tenant | Adulto | "Te invitaron a gestionar {institución}…" | **ESPACIADO sin ®** (drift) | es/en/pt | "ArgoMethod® · Dashboard" |
| 20 | `resend-invite.ts` · buildInviteEmail | Reenvío de invite (copia duplicada del 18) | Adulto | Igual al 18 | **ESPACIADO sin ®** (drift) | es/en/pt | Ídem |
| 21-22 | `trial-lifecycle-cron.ts` · trialExpiring / trialExpired | Trial vence en 3/1 días, venció | Comprador | "Tu prueba de Argo vence…" / "…terminó" | lifecycleShell copia VIEJA: **ESPACIADO sin ®** (la copia de one-webhook sí está brandificada) | es/en/pt | Strip es hardcodeado |
| 23 | `request-delete.ts` | Doble opt-in de borrado de datos | Adulto | "Confirma la eliminación de tus datos…" | Brand por clase CSS sobre blanco, **ESPACIADO sin ®** | es/en/pt | "ArgoMethod® · hola@" |
| 24 | `request-consent.ts` | Consentimiento parental | Familia | "Confirma que eres el adulto responsable de {niño}" | Ídem 23, **ESPACIADO sin ®** | es/en/pt | Con Privacidad/Términos |
| 25 | `admin-tenants.ts` · Enterprise welcome | Superadmin crea Enterprise | Comprador | "Bienvenido a ArgoMethod® Enterprise…" | **ESPACIADO sin ®** + badge verde ENTERPRISE | es/en/pt | Strip |
| 26 | `admin-grant-access.ts` · inline | Admin otorga full_access | Adulto | "Acceso exclusivo: el informe completo de {niño}…" | **ESPACIADO sin ®** (drift) | es/en/pt | Strip |
| 27 | `admin-grant-puentes-free.ts` | Admin regala puente comp | Adulto | "Una invitación a ArgoPuente® para ti, sin costo" | **ArgoMethod® joined + chip PUENTE** | es/en/pt | Strip "ArgoMethod® · ArgoPuente®" |
| 28 | `admin-send-puentes-invite.ts` | Admin manda upsell manual | Adulto | "Una idea más para acompañar a {niño}" | **ArgoMethod® joined + chip PUENTE** | es/en/pt | Strip |
| 29 | Alertas texto plano (6): `one-webhook` alertOwner, `report-recovery-cron`, `qa-monitor`, `journey-canary`, `security-canary`, `principia-detect` | Eventos ops | Admin | "[Argo Ventas]…", "[Argo QA]…", etc. | Ninguno (texto plano) | es (canary en) | Ninguno |

## 1.2 Los encabezados distintos (5 patrones HTML + drift interno)

1. **Banda oscura + ArgoMethod® joined** (~10 emails): pero con **Method® a veces w100, a veces w300**, y 4 de ellos con el chip violeta PUENTE pegado.
2. **Banda oscura + ArgoOne® joined** (6 emails: confirmación, hub, access-link, play-link x2, renewal): One® siempre w300. Dos de estos dicen **ArgoMethod® en el asunto pero ArgoOne® en el header** (incoherencia asunto/header).
3. **Banda oscura + ArgoPuente® joined** (1 email, el invite que MUERE): irónicamente el único que usa el wordmark correcto del producto; los otros 6 emails de puente usan ArgoMethod® + chip.
4. **"Argo Method" ESPACIADO sin ®** (10 emails: create-tenant, invite-user x2, resend-invite, trial x2, admin-tenants, admin-grant-access sobre banda oscura + request-delete/consent por clase CSS sobre blanco). Es el drift que `docs/BRAND-NAMING.md` dejó anotado como "api/ pendiente".
5. **Header claro sobre blanco** (1 email, buildHtmlV4): ArgoMethod® 800/300 gris a 17px, sin banda. Único de su especie.

Footers: 4 regímenes (strip localizado / strip español hardcodeado para en+pt / footer rico con links legales / sin footer). Solo el informe legacy lleva Privacidad y Términos; el v4 los perdió.

## 1.3 Lo que el modelo congelado exige y HOY NO EXISTE o cambia

| Email | Estado | Fundamento (DECISIONES.md) |
|---|---|---|
| **Autorización de re-perfilamiento al adulto de siempre** | **NO EXISTE.** Nada en one-checkout/one-webhook lo dispara; one-checkout ni siquiera lee `child_id` | §5: pagador compra replay → "email de autorización al adulto de siempre (el de la base), el niño juega" |
| **Foto fresca sin re-jugar** | **NO EXISTE.** No hay camino que entregue el informe vigente a un segundo pagador + su link de puente propio | §5: "si la foto es fresca → recibe esa foto sin que el niño juegue, más su link de puente propio" |
| **Recordatorio 6 meses a comprador Y adulto, desacoplados** | **PARCIAL.** buildRenewalHtml (B16) solo cubre adulto responsable + satélites con puente pago; **no hay variante comprador** (coach) con CTA $12.99, y la copy es por-informe, no "ambos informes tienen más de 6 meses" como el mockup | §5: "alerta al comprador y al adulto, cada uno en su panel, desacoplados" |
| **Puente permanente a la familia** | **EXISTE y se conserva** (send-puentes-email + magic link), pero el trigger cambia: llega vía **link de puentes del niño**, nunca vía invite por email ni checkout standalone | §2 Familia: "un email con el link permanente a su puente. Un informe = un email" |
| **Entrada al panel del adulto no-comprador** | **NO EXISTE.** request-access busca solo en `one_purchases`; un adulto que solo autorizó no puede pedir su magic link | §2: "el adulto entra con su email, sin contraseña" |
| **Informe nuevo al pagador además del adulto** | **PARCIAL.** send-email va a un solo destinatario; §5 exige "el informe nuevo va al adulto (siempre) y al pagador" | §5 |

**Mueren:**
- **#11 sendBridgeInviteEmail** (y toda la cadena bridge_invites + PuenteInvite): §8 mata la invitación por email tipeado. Es la muerte más clara.
- **#1 sendConfirmationEmail** (pack legacy): muere al cutover de `ONE_UNIFIED_SKU` (queda solo el hub email #2).
- **#13 buildReminderHtml** (rama legacy del cron): la reemplaza el renewal B16; además su CTA apunta a `/puentes/checkout` standalone, que §8 elimina.
- **#10/#12 play-link a recipient almacenado**: §4 prohíbe "enviado a tal email, esperando que juegue"; el concepto de recipient del slot muere, el link se copia y comparte. El reenvío queda como mucho "enviármelo a mí mismo".
- **Variantes dormidas del sync-cron** (new-sibling, hardcodeadas en isNewSibling=false): copy muerto, barrer.
- **CTAs a /puentes/checkout** en #27/#28 (admin comp y upsell manual): deben re-apuntar al link de puentes del niño o retirarse.

# 2. ESTÁNDAR DE ENCABEZADO PROPUESTO

## 2.1 Un solo header canónico

Banda oscura `#1D1D1F`, padding `24px 28px`, wordmark joined, **Argo a 800 + resto a 300** (se mata la variante 100: la regla de marca dice web 300) + **® fino, chico, superíndice, siempre al final**:

```html
<td style="background:#1D1D1F;padding:24px 28px;">
  <span style="font-size:18px;letter-spacing:-0.02em;color:#ffffff;font-weight:800;">Argo</span><!--
  --><span style="font-size:18px;letter-spacing:-0.02em;color:#ffffff;font-weight:300;">{Producto}</span><!--
  --><span style="font-size:10px;color:#ffffff;font-weight:300;vertical-align:super;line-height:1;">&reg;</span>
  <!-- opcional: headline 22-24px w300 debajo -->
</td>
```

Reglas:
- **Muere el chip violeta PUENTE**: el producto se dice con su wordmark (**ArgoPuente®** en el header), no con ArgoMethod® + badge. El único email que hoy lo hace bien es justo el que muere.
- **Muere el header claro** de buildHtmlV4 como excepción, o se formaliza como "variante informe" con el mismo wordmark y pesos (decisión menor de diseño; recomiendo unificar a banda oscura).
- **Asunto y header nombran el mismo wordmark** (hoy #10/#12 dicen ArgoMethod® en asunto y ArgoOne® en header).
- **Footer canónico localizado** (es/en/pt): `ArgoMethod® · {tagline}` + Privacidad y Términos en todo email a usuario final (el v4 los recuperó de vuelta). El From queda `'Argo Method <hola@argomethod.com>'` (excepción documentada: display-name sin ®).
- **Mecanismo**: como serverless no importa entre archivos api/, el header/footer se estampan con regiones GENERATED fenced + script (`scripts/gen-email-shell.mjs`) + check en `qa:unit`, mismo patrón que `gen:coach`/`check:coach-gen` y los scripts brandify.

## 2.2 Qué wordmark corresponde a cada email

| Wordmark en header | Emails |
|---|---|
| **ArgoOne®** | #1 (mientras viva), #2 hub, #9 access-link, #12 play-link, #14 renewal 6 meses, **nuevo:** autorización de re-perfilamiento, **nuevo:** foto fresca al pagador |
| **ArgoPuente®** | #4 magic-link cuestionario, #16 informe puente, #15 sync (puente actualizado), #27 comp gratis, #28 upsell manual, y el **nuevo** email de la familia vía link de puentes |
| **ArgoMethod®** (empresa) | #3 upgrade, #5/#6 lifecycle de pago, #7/#8 informe del niño (surface compartida tenant + One; si se quiere afinar, dinámico por origen con default ArgoMethod®), #17 welcome, #18-20 invites, #21/#22 trial, #23 delete, #24 consent, #25 Enterprise (+badge), #26 grant-access |
| **Sin header** (texto plano, OK así) | Las 6 alertas ops (#29) |

Los 10 emails con "Argo Method" espaciado sin ® pasan todos a ArgoMethod® joined: es exactamente el barrido api/ que BRAND-NAMING.md dejó pendiente.

# 3. PLAN PARA VIVO

Estado real de partida: backend shadow completo y **develop ya está vivo con flags ON en Preview** (RESUME 2026-07-10, E2E de plata sintético verificado). Pero DECISIONES.md (congelado 2026-07-10) **mata cosas recién construidas** (bridge_invites, PuenteInvite, checkout standalone, la superficie invited_adult con informe, D13) y **agrega** lo que el gap marca como MISSING estructural. El plan es un delta sobre L0-L9, no una reescritura.

**Fase 0 — Corte de entitlement (primero, es fuga viva en develop)**
- Se toca: `api/one-panel.ts` (no armar `hc.report` ni exponer `share_token` para niños alcanzados solo por bridge; matar rol/greeting `invited_adult` con informe), `src/pages/OnePanel.tsx` (retirar "Ver el informe" y roleNote del invitado), `api/bridge-invite-accept.ts` (no devolver child_name/edad/arquetipo pre-pago), `api/puentes-start.ts` (recortar `child_profile` al mínimo y el shape multi-niño legacy).
- Muere: el acceso del $4.99 al informe individual (revert de D13, §8).
- Flags: mismo `VITE_BRIDGES_V2`; sin migración.
- Hard-stop: ninguno (es cierre de fuga; commit local y push con OK).

**Fase 1 — Link de puentes por niño (el concepto nuevo central, §4)**
- Se toca: migración aditiva (token de link de puentes por niño, MCP apply_migration + NOTIFY pgrst), `api/puentes-checkout.ts` (gate por token del link, no por invite ni por email tipeado; conserva dedupe email × niño y pay-first), página nueva de onboarding `/puente/:token` (nombre + email + términos → Stripe email precargado → cuestionario), `api/one-panel.ts` sub-acciones share-bridge-link / linked-adults / revoke.
- Muere: `bridge_invites` (write-side), acción invite-adult + su email (#11), `PuenteInvite.tsx`, `PuentesCheckout.tsx` standalone. El DROP de la tabla es posterior y se surfacea.
- Hard-stop: ninguno técnico; el DROP sí.

**Fase 2 — Rol adulto + entrada al panel + hub fiel al mockup (§2, §7)**
- Se toca: `api/one-panel.ts` (request-access busca también `children.responsible_adult_email` y `adult_profiles`; rol "adulto autorizante" diferenciado; matriz de capacidades §7: coach no comparte puentes, no ve vinculados, no borra; adulto sí), `src/pages/OnePanel.tsx` (dos niveles acts/subacts, modal Adultos vinculados con revocar, toast de copy-link, alerta "Ambos informes tienen más de 6 meses" con botón naranja + tooltip, subtítulos por rol del mockup `argoone-roles.html`).
- Muere: estados "enviado a {email}" e "invitaste a X · pendiente" (§8), el recipient almacenado del slot.

**Fase 3 — Ciclo de 6 meses completo (§5, el hueco más grande)**
- Se toca: `api/one-checkout.ts` (dejar de ignorar `child_id`: compra ligada al niño), `api/one-webhook.ts` (bifurcación: foto fresca → entregar informe vigente + link de puente propio sin jugada; foto vencida → disparar email de autorización al adulto de la base, patrón request-consent), `api/one-start-play.ts` (jugada solo con autorización consumida; gate duro 6 meses para ArgoOne, hoy solo existe en tenant), entrega del informe nuevo a adulto Y pagador.
- Consentimiento en cada jugada con el texto explícito de §6.
- Hard-stop: ninguno hasta el push.

**Fase 4 — Emails: unificación + los nuevos**
- Se toca: los 29 templates vía `scripts/gen-email-shell.mjs` + regiones GENERATED (header canónico §2, footers localizados, barrido espaciado→joined ® en los 10 con drift, fixes de copy: "chicos"→"niños", género de ArgoPuente®, asunto/header coherentes).
- Nuevos: autorización de re-perfilamiento (ArgoOne®), foto fresca al pagador (ArgoOne®), renewal con variante comprador y copy "ambos informes" (ArgoOne®), email de la familia vía link de puentes (ArgoPuente®, reusa send-puentes-email).
- Muere: #11 ya murió en Fase 1; #1 y #13 quedan detrás de flag hasta el cutover y se barren después.

**Fase 5 — Cutover (L9)**
- Pasada manual del owner en develop.argomethod.com (email hub → panel → jugar → puente → link de puentes). M7 + M8 a prod (transaccional, caveat security_invoker). Merge develop→main + flags en Production en orden (`ONE_UNIFIED_SKU` → `ONE_V2_COMPLETE` → `PUENTES_BRIDGES` → `PUENTES_ADDON_V2` → `RENEWAL_CRON_V2` → `VITE_BRIDGES_V2`), verificando entre cada uno. Rollback = apagar flags.
- Hard-stops del owner (todos acá o antes): cada `git push`, el merge develop→main, prender flags en Production, `CHILD_DELETE_ENABLED`, el DROP posterior de `bridge_invites`/`puentes_*`, marcar refunded la compra sintética `04119d6e`, y el money-in test real de PAYMENTS-READINESS.

**Resumen ejecutivo (5 líneas):**
El backend shadow y el hub están construidos y vivos en develop, pero el modelo congelado del 2026-07-10 invalida tres piezas recién hechas (invitación por email, checkout standalone, informe para el $4.99) y el hub hoy regala el informe del niño a bridge-only: eso se corta primero. Falta construir el concepto central nuevo: el link de puentes por niño con vinculados y revocación, la entrada al panel del adulto no-comprador, y el ciclo de 6 meses completo (compra atada a child_id, email de autorización, foto fresca, gate duro ArgoOne). Los emails necesitan una fase propia: 5 patrones de header distintos, 10 templates con la marca vieja espaciada, 3 emails nuevos obligatorios y 4 que mueren. Nada de esto requiere migración destructiva: todo es aditivo detrás de los flags existentes más un token nuevo por niño. Hard-stops del owner: push, merge a main, flags en Production, CHILD_DELETE_ENABLED y los DROPs posteriores.
