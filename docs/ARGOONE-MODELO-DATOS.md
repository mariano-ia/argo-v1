# ArgoOne — Fase B: Modelo de datos objetivo

> Fase B del roadmap (`ARGOONE-MODELO-NUEVO.md` §9). Aterriza el modelo sobre las tablas reales.
> Draft para validar. Aún NO tocado en código. Migración de datos = trivial (no hubo compradores
> reales), así que esto es **rework de esquema + código**, no migración.

## Principio ordenador

**Todo es una entidad datada que vence a los 6 meses** (`computed_at` + `expires_at`; si venció →
"retrasado"). Hay dos perfiles base y un cruce:
- **Odisea del niño** = perfil del niño (el "informe individual").
- **Puente-DISC del adulto** = perfil del adulto, **reusable por email**.
- **Puente (informe)** = el **cruce** (adulto × niño), un snapshot datado.

## Esquema actual (lo relevante)

- `children` — entidad niño persistente. Para ArgoOne, `tenant_id` NULL. Ya tiene `reprofile_token`,
  `deleted_at`, `merged_into`.
- `perfilamientos` — la odisea (informe individual del niño). **Ya tiene todo lo v4**: `report_v4`,
  `report_status`, `share_token`, `last_profiled_at`, `eje/motor/eje_secundario`, `child_id`, etc.
- `puentes_sessions` — hoy guarda `adult_profile` (JSON del DISC del adulto) **embebido**, atado a
  `purchase_id` + `source_session_id` (un niño). **No reusable.** También tiene `ai_sections` (los 4
  puentes).
- `puentes_purchases` — compra del puente: `recipient_email` (adulto), `source_session_id` (niño),
  `amount_cents`, `currency`, `provider`, `status`, `magic_token`.
- `one_links` — link de juego ArgoOne: `slug`, `session_id` (→ perfilamiento), `recipient_email`.
- `one_purchases` — compra ArgoOne: `email`, `amount_cents`, `includes_puente` (bool), `access_token`.

## Esquema objetivo

### 1. `adult_profiles` (NUEVO — el corazón del cambio)
El perfil DISC del adulto, **reusable, por email**. Hoy vive embebido en `puentes_sessions`; se extrae.
- `id`, `email` (identidad estable del adulto), `adult_name`, `lang`
- `disc` (jsonb: `eje_primary`, `eje_secondary`, `motor`, `pressure_style`, `axis_counts`, `history`,
  `dominant_emotion` — lo que hoy es `puentes_sessions.adult_profile`)
- `answers` (jsonb, el cuestionario genérico del adulto)
- `computed_at`, `expires_at` (= `computed_at` + 6 meses), `created_at`
- Regla: **una fila por email**, se **pisa** siempre (CERRADO — no se versiona). Re-perfilar sobre-escribe.
  "retrasado" = `now > expires_at`. El histórico fiel lo guarda cada `bridge` con su propio snapshot del
  DISC usado, así un informe puente viejo sigue siendo fiel aunque el adulto se re-perfile.

### 2. `children` (existe, ajustes chicos)
- Add: `responsible_adult_email` (el que autorizó = dueño del consentimiento) y `deletion_id` (el ID
  que va en el email de autorización; sirve para borrar/revocar). Borrar = **cascade**
  (perfilamientos + bridges del niño).
- Sin dedup ni colisión (D14): pueden existir mil Juancitos.

### 3. `perfilamientos` (existe, sin cambios grandes)
- Es la odisea/informe individual, ya datada (`last_profiled_at`). `expires_at` = `last_profiled_at`
  + 6 meses; "retrasado" prompt de re-juego ($12.99).
- **G2 se resuelve acá:** con "checkout = 2 links, el registro del niño nace cuando juega", la jugada
  crea `children` + `perfilamientos` **una sola vez**; `one_links.session_id` apunta a esa fila.
  `one-complete` deja de crear una 2ª fila legacy. Un perfilamiento por jugada → panel y email ven
  la misma fila v4.

### 4. `bridges` (REDISEÑO de `puentes_sessions`)
El **cruce** (adult_profile × child perfilamiento), snapshot datado.
- `id`, `adult_profile_id` (→ `adult_profiles`), `child_perfilamiento_id` (→ `perfilamientos`)
- `ai_sections` (los 4 puentes), `status`, `lang`
- `computed_at`, `expires_at` (+6 meses), `created_at`
- Snapshot: se genera de los perfiles al momento; cuando el perfil base vence, el bridge queda
  "retrasado" → refresco explícito (pagando). **Nada muta en silencio** (D15).
- Entitlement (D13): tener un bridge le da al adulto acceso al `perfilamiento` del niño (informe
  individual completo).

### 5. Compras / SKU (simplificar `one_purchases` + `puentes_purchases`)
- **Un producto:** ArgoOne **$12.99** = un child-play-link + el puente del comprador. Add-on **$4.99**
  = un bridge extra (adulto × niño ya jugado).
- Purchase: `id`, `email` (comprador), `sku` (`argoone` 1299 | `puente_addon` 499), `amount_cents`,
  `currency` = `'USD'`, `provider` = `'stripe'`, `status`, `created_at`, `paid_at`.
- **Currency (D10):** USD/Stripe únicamente (`STRIPE_ONLY`); se apaga MercadoPago/ARS. Display peso
  opcional con dólar BNA (= lo que se paga; ya no hay dólar tarjeta).
- Muere el SKU `one` $9.99-sin-puente. "Individual sin puente" sigue como **estado** (el autorizador
  que recibió el informe gratis), no como producto → recibe el upsell $4.99.

## Cómo entran las decisiones (mapa D → esquema)

| Decisión | En el esquema |
|---|---|
| Perfil de adulto reusable | `adult_profiles` por email |
| G2 (dos perfilamientos) | la jugada crea 1 fila; `one-complete` no duplica |
| D8/D9 borrado/revocar | `children.deletion_id` + `responsible_adult_email`, cascade |
| D13 entitlement $4.99 | un `bridge` da acceso al `perfilamiento` del niño |
| D14 sin colisión | sin dedup en `children` |
| D15 snapshot + vencimiento | `computed_at`/`expires_at` en profiles, perfilamientos, bridges |
| D10 moneda | `currency='USD'`, `provider='stripe'`, `STRIPE_ONLY` |
| D16 COPPA self-attestation | `responsible_adult_email` = quien autorizó (se hace cargo) |
| Panel universal | entrada por email → magic-link → panel que lee todo lo del email |

## Abierto para Fase C (flujos)
- Cómo exactamente el checkout entrega los 2 links y cómo se representa un niño que todavía no jugó
  (link-first: el `one_link` existe antes que el `perfilamiento`).
- El estado "retrasado" en la UI del panel.
- El cuestionario genérico del adulto (reescritura de `puentesQuestions` sin `{nombre}`).
- ~~Versionado del perfil del adulto~~ → CERRADO: una fila que se pisa; el bridge guarda su snapshot.
