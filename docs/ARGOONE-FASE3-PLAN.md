# ArgoOne — Fase 3: ciclo de 6 meses / re-perfilado (plan de ejecución)

> Sale de un mapeo multi-agente del re-perfilamiento actual (4 lectores) contra el
> modelo congelado §5/§6. **Hallazgo clave: el motor completo ya existe (gate 6m,
> reprofile_token, append-only, consentimiento) cableado solo al mundo tenant;
> Fase 3 lo conecta al checkout pago de ArgoOne.** Nada se reinventa.
> Estado: plan aprobado en dirección; 2 decisiones de money-path pendientes del owner.

Ya tengo todo lo que necesito (el mapa de 4 lectores + los dos docs congelados; DECISIONES 2026-07-10 manda sobre MODELO-NUEVO en cualquier choque). Acá va.

---

# ArgoOne Fase 3 — Ciclo de 6 meses / re-perfilado

## 1. LO QUE YA EXISTE Y SE REUSA

La máquina del re-perfilamiento **ya está construida entera**, pero cableada solo para el mundo tenant. Todo lo de abajo sirve tal cual; lo único que falta es dejarla entrar por la puerta ArgoOne.

- **Gate duro de 6 meses (server-side, real).** RPC `check_reprofile_cooldown(p_child_id)` (migración `20260629_child_perfilamiento_split.sql:219-235`, SECURITY DEFINER). Está clavado en el **niño**, no en el tenant: lee `max(created_at)` de las perfilamientos `resolved` no borradas y devuelve `allowed / months_remaining / available_at`. Para un niño ArgoOne (perfilamientos resueltas con `tenant_id` null) devuelve `allowed=true` sin tocar nada. **No necesita un solo cambio** para gatear a un niño One.
- **`reprofile_token` por niño.** Se mintea por DEFAULT en CADA fila de `children` (`:47`, índice único `:57`). Los niños ArgoOne ya lo tienen. Hoy no se usa para nada del lado One, pero está.
- **Append-only, nunca overwrite.** `signReprofileToken` (`start-reprofile.ts:10-15`) firma `{cid, m:'r', exp}`; `verifyPlayToken` (`session.ts:108-128`) valida HMAC + exp y saca el `childId` **solo del token firmado, nunca del body** (comment `:215-218`). En `action=start/save` (`session.ts:287-336`, `:471-543`) se appendea una perfilamiento NUEVA al niño existente. Esta mecánica es **flow-agnostic**: funciona con `tenant_id` null si se relaja el guard tenant.
- **`/play/r/:token` + wrapper.** Ruta `App.tsx:249` → `TenantReprofilePlay.tsx`. Es un wrapper delgado (valida, pre-carga adulto, entra al onboarding saltando intros vía `reprofileStartIndex`). Se puede espejar para One casi 1:1.
- **Consentimiento en cada jugada, single-use, ya se re-pide.** Toda la cadena `requestConsent → parental_consents.reprofile_token → confirm-consent → ConsentLanding redirect → gate COPPA en session start` existe y es flow-aware. El token es de un solo uso (`consumed_at` lo quema, `session.ts:256`), no hay flag persistente de "este niño ya está autorizado", así que **cada jugada y cada re-perfilado de un <13 pide consentimiento fresco** — exactamente lo que pide DECISIONES §6. `ConsentLanding.tsx:57-58` ya tiene rama `'one'`.
- **`request-consent.ts` como plantilla del email de autorización.** Crea fila `parental_consents` (token, TTL 24h), manda mail es/en/pt, redirige a `/consent/{token}`. Ya acepta `reprofile_token`, `one_link_id`, `lang`. Es literalmente el patrón que pide §5c.
- **Substrate de datos L1 ya aplicado a prod** (`20260709_argoone_fusion_l1.sql`): `perfilamientos.expires_at` (+6mo), `renewal_reminder_sent_at`, `one_links.child_id`, `children.responsible_adult_email` (el ancla inmutable del §2/§5c, ya backfilleado). Es shadow schema, pero está.
- **Backstop de completion.** `report-recovery-cron.ts:150-195` ya sabe terminar jugadas que murieron: sella `completed + expires_at + responsible_adult_email + comp bridge`. Plantilla lista para el cron.

**Traducción llana:** el motor de re-jugar-sin-pisar-el-perfil-viejo, el candado de 6 meses y el pedido de permiso al adulto ya están hechos y probados en el dashboard. Fase 3 no los inventa: los conecta al checkout pago de ArgoOne.

---

## 2. EL PLAN DE FASE 3, EN PASOS CONCRETOS

Todo aditivo y detrás de los flags existentes (`ONE_V2_COMPLETE`, `ONE_UNIFIED_SKU`) más uno nuevo `ONE_REPROFILE`. Con flags off, cero cambio de comportamiento. Orden de construcción:

### Paso 0 — Schema (aditivo, una migración)
`one_purchases.child_id uuid null` + `one_purchases.kind text` (para distinguir `one` / `one_puente` / **`reprofile`**). El resto ya lo puso L1. Nada destructivo, todo nullable. Backfill innecesario.

### Paso 1 — `one-checkout` acepta y ata el `child_id` *(aditivo, tras `ONE_REPROFILE`)*
`api/one-checkout.ts` — `handler`
- Leer `child_id` del body (hoy se descarta en `:68`).
- Si viene `child_id`: validar que el niño existe, no está archivado, y que el **email pagador es comprador o el `responsible_adult_email`** del niño (defensa anti-redirección, §2). Setear `kind='reprofile'`, precio $12.99 (`includes_puente=true`).
- Persistir `child_id` en la fila `one_purchases` (`:98-111`) **y** meterlo en `createStripeCheckout` metadata (`:41-42`, el canal ya existe, solo falta el campo).
- **No** decidir acá si el niño juega o no: eso es del webhook (evita doble-cobro y carreras).

### Paso 2 — Gate duro 6m server-side en el play ArgoOne *(aditivo)*
`api/one-start-play.ts` — validador de link
- Antes de emitir play token para un re-perfilado, llamar `check_reprofile_cooldown(child_id)` (el mismo RPC que usa `start-reprofile.ts:101-113`). Si `allowed=false` → 403 `reprofile_too_soon` con `months_remaining/available_at`.
- Esto materializa la **"regla dura: el niño no puede volver a jugar antes de los 6 meses. Sin excepciones"** (DECISIONES §5) como candado de servidor, no de UI. Mismo comportamiento que el tenant, otra puerta.

### Paso 3 — Webhook: bifurcación foto-fresca vs foto-vencida *(el corazón, tras `ONE_REPROFILE`)*
`api/one-webhook.ts` — rama Stripe `source='argo_one'` (`:757-799`) y espejo MP (`:952-991`)
- Si `purchase.kind='reprofile'`: leer `child_id`, computar frescura con `check_reprofile_cooldown` (fuente de verdad única; **no** mezclar con `expires_at` todavía — ver Riesgo 5).
  - **Foto VENCIDA (≥6m, `allowed=true`) → jugada nueva:** disparar el email de autorización (Paso 4). El niño NO juega hasta que el adulto autoriza. El pagador NO recibe informe todavía.
  - **Foto FRESCA (`allowed=false`, el otro ya re-perfiló hace poco):** NO se juega. Entregar al pagador **la foto vigente actual** (informe individual de `current_perfilamiento`) + su **link propio para re-jugar su puente**. Marcar la compra `paid` y cerrar.
- Idempotencia: reusar el esqueleto que ya existe (`webhook_events` dedupe `:659-670`, guard de compra existente `:769-770`).

### Paso 4 — Email de autorización al `responsible_adult_email` inmutable *(aditivo)*
Nuevo `api/one-request-reprofile-auth.ts` (o rama en `request-consent.ts`), invocado desde el webhook
- Manda al **`responsible_adult_email` de la base** (el adulto de siempre; §2/§5c), NUNCA a un email tipeado por el pagador. Si el pagador ≠ ese adulto, el pagador no elige destinatario.
- Cuerpo con el texto **exacto** de §6: *"quien pagó este perfilamiento recibirá el informe individual del niño y generará su informe puente basado en ese perfil"*.
- Crea fila `parental_consents` (reusa el patrón), redirige a `/consent/{token}` → `/play/r/{reprofile_token}?consent=...`.
- Para <13, este email **es también** el consentimiento COPPA (mismo token single-use). Para ≥13 sigue siendo la autorización-de-uso (sin COPPA).

### Paso 5 — El niño juega, append al niño existente *(reusa mecánica tenant)*
`api/one-start-play.ts` + `api/session.ts`
- Al consumir la autorización, emitir play token con `signReprofileToken(child_id, m:'r')`.
- `session.ts` ya appendea al niño existente cuando ve `cid` firmado. **Único ajuste:** relajar el guard tenant en la rama reprofile para aceptar `tenant_id` null (hoy `start-reprofile.ts:84-87` corta con `reprofile_not_supported`; ese corte queda para la entrada tenant, la entrada One va por `one-start-play`).

### Paso 6 — Completion: informe al adulto Y al pagador, ciclo reinicia *(aditivo)*
`api/one-complete.ts` + `api/send-email.ts` + `src/lib/emailService.ts`
- Al resolver la nueva perfilamiento: sellar `expires_at = now+6mo` (helper ya existe `one-complete.ts:78-84`) → reinicia el ciclo (§5).
- **Fan-out del informe individual** (hoy `send-email.ts` es single-recipient, `:575/:876`):
  1. **Siempre y gratis** al `responsible_adult_email` (el adulto autoriza cada jugada, §5e).
  2. Al **pagador** (si pagador ≠ adulto).
  3. Si pagador == adulto: una sola persona, un solo envío.
- Al pagador, **además**, su link propio para re-jugar su puente (reusar `send-puentes-email` magic-link).
- El puente se re-genera contra la foto nueva (el $12.99 incluye el puente refrescado, §6). El comp `$0` bridge del combo ya tiene plantilla en `one-complete.ts:194-236` — repuntar de `puentes_purchases` a los objetos nuevos cuando L2+ aterrice; hasta entonces sigue el legacy.

### Paso 7 — Consentimiento con el texto §6 en cada jugada *(aditivo)*
`src/components/onboarding/screens/AdultRegistration.tsx` + `consentStore.ts`
- Inyectar el texto explícito §6 en el paso de consentimiento/autorización de **cada** jugada (primera y re-perfilados), es/en/pt. La familia (adulto extra) solo acepta términos por sí misma, nunca por el niño (§6).

### Paso 8 — Superficie de alerta 6m en ambos paneles, desacoplada *(aditivo)*
`OnePanel` (+ variante comprador)
- Alerta de re-perfilar **al comprador y al adulto, cada uno en su panel, sin que uno dependa del otro** (§5). Reusar `buildRenewalHtml`/la alerta de renovación de Fase 2; agregar variante comprador y copy "ambos informes tienen más de 6 meses". El botón dispara el checkout del Paso 1 con `child_id`.

---

## 3. DECISIONES QUE NECESITAN AL OWNER

Primero lo que **NO** es decisión (ya resuelto por el doc que manda):

- **Precio de la rama foto-fresca:** el lector 4 lo marcó como conflicto, pero **DECISIONES §5 lo resuelve**: ambos bullets (jugada nueva y foto-fresca) viven bajo *"Quien paga los $12.99"*. O sea el re-perfilado del comprador/adulto es **$12.99 juegue o no juegue el niño**; la rama fresca solo se saltea el re-juego pero igual entrega informe individual + puente propio. No choca con §8 (que revierte D13) porque §8 restringe **solo** al $4.99. El "el precio depende de si un niño juega" de MODELO-NUEVO §5 es el framing viejo, superado. **Construir directo a $12.99.**
- **Umbral de frescura:** es 6 meses, el mismo del gate. No es decisión.
- **Carrera comprador/adulto (ambos pagan casi a la vez):** lo resuelvo por ingeniería sin molestar al owner — la primera compra que encuentra la foto vencida dispara autorización+re-juego; la segunda encuentra un re-juego in-flight/fresco y cae a la rama foto-fresca. Idempotencia sobre `webhook_events` + estado de la última perfilamiento. **Lo construyo así salvo que digas lo contrario.**

Lo que **sí** necesita al owner (dos edges de money-path, genuinamente sin resolver en ningún doc):

1. **Email autorizante muerto / adulto que nunca autoriza.** §2 dice "si ese email muere, el niño no puede re-perfilarse", pero no dice **qué ve el pagador ni qué pasa con los $12.99** cuando el mail rebota o el adulto no clickea. Opciones: (a) retener y reintentar N días luego reembolso auto, (b) crédito en panel, (c) reembolso inmediato al detectar bounce. **Necesito la política.**

2. **TTL de la autorización de re-perfilado + niño que no juega.** `request-consent` usa 24h, pero un re-perfilado pago no debería expirar la plata en 24h. ¿La autorización vive 7/14/30 días? Y si el adulto autoriza pero el niño nunca juega, ¿los $12.99 se retienen, se reembolsan, o quedan como crédito? **Necesito TTL + política de no-juego.**

(Ambas son la misma familia: "pagué, pero la jugada no se concreta". Con una regla para las dos alcanza.)

---

## 4. RIESGOS

**Doble-cobro / doble-jugada (alto).** Dos alertas desacopladas + webhook que decide juego = ventana de carrera donde ambos pagan y se dispara doble re-juego, o el pagador paga $12.99 y el niño juega dos veces.
- *Mitigación:* decisión de juego **solo en el webhook** bajo lock de idempotencia (`webhook_events` + chequeo de perfilamiento in-flight para ese `child_id`). El segundo pago cae determinísticamente a foto-fresca. El gate 6m de `one-start-play` (Paso 2) es el segundo cinturón: aunque se cuelen dos tokens, el segundo play choca contra el cooldown.

**Consentimiento de menores redirigido (crítico).** El agujero que §2 quiere tapar: un coach pagador redirigiendo la autorización a "cualquier adulto".
- *Mitigación:* el email de autorización sale **siempre** a `responsible_adult_email` leído de la base, nunca de input del pagador (Paso 4). El pagador no elige destinatario. `responsible_adult_email` es inmutable (nadie lo edita por API). Para <13, además, corre el gate COPPA existente single-use.

**Fuga de PII del niño al $4.99 (alto — regresión de §8).** §8 revierte D13: el $4.99 NUNCA recibe el informe individual. Si el fan-out del Paso 6 se generaliza mal, un adulto-familia podría terminar recibiendo el informe del niño.
- *Mitigación:* el fan-out del informe individual se dispara **solo** en `kind='reprofile'` ($12.99) hacia `{responsible_adult_email, pagador}`. La rama $4.99 (familia) queda intocada, sigue entregando solo el puente. Test explícito: compra $4.99 no debe generar ningún envío de informe individual.

**Romper el flujo tenant existente (medio).** El dashboard tenant comparte `session.ts`, `check_reprofile_cooldown`, `parental_consents`.
- *Mitigación:* todo aditivo y detrás de `ONE_REPROFILE`/`ONE_V2_COMPLETE`. El único cambio compartido riesgoso es relajar el guard tenant en la rama reprofile de `session.ts` (Paso 5): hacerlo como **branch por presencia de `one_link`/`tenant_id` null**, no borrando el guard tenant. `start-reprofile.ts:84-87` sigue cortando la entrada tenant; la entrada One va por `one-start-play`. QA: la suite tenant de re-perfilado (gt=0) debe seguir verde antes de push.

**Dos relojes de 6 meses divergentes (medio).** El gate vivo computa 6m sobre `max(created_at)` de perfilamientos resueltas; L1 metió `expires_at` (+6mo) como reloj paralelo. Si Fase 3 lee `expires_at` en un lado y el RPC en otro, un niño podría quedar gateado por un reloj y liberado por el otro.
- *Mitigación:* **una sola fuente de verdad** = `check_reprofile_cooldown` para toda decisión de juego. `expires_at` se usa solo para copy de UI ("vence el ...") y para el cron de recordatorio, nunca para autorizar el juego, hasta que se reconcilien (M7 diferido). No exponer `expires_at` en `current_perfilamiento` todavía.

**bridge_invites zombie (bajo).** L1 dejó `bridge_invites` como shadow schema, pero DECISIONES §8 lo **mata** ("la invitación por email tipeado desaparece"). Riesgo de construir Fase 3 sobre una tabla condenada.
- *Mitigación:* Fase 3 usa **`parental_consents` + `request-consent`** para autorización, NO `bridge_invites`. No leer ni escribir esa tabla en este trabajo.

---

**Docs de referencia:** `/Users/marianonoceti/Desktop/Antigravity/Argo Project/docs/ARGOONE-DECISIONES.md` (manda), `docs/ARGOONE-MODELO-NUEVO.md` §5/§6, `docs/ARGOONE-PLAN-VIVO.md`.
**Archivos núcleo de Fase 3:** `api/one-checkout.ts`, `api/one-webhook.ts`, `api/one-start-play.ts`, `api/session.ts`, `api/one-complete.ts`, `api/request-consent.ts`, `api/send-email.ts`, `supabase/migrations/20260629_child_perfilamiento_split.sql` (RPC `check_reprofile_cooldown`), `supabase/migrations/20260709_argoone_fusion_l1.sql` (substrate).
