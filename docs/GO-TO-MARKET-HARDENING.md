# Go-To-Market Hardening — Estado

Trabajo de preparación para comercialización (rama `develop`). Generado a partir
de la auditoría profunda de readiness comercial.

> **TODO LO DE ABAJO DEBE PROBARSE EN EL PREVIEW DE VERCEL** antes de ir a
> producción. En desarrollo local el modo DEV "simula" guardados de sesión y
> webhooks, así que los tokens, firmas y flujos reales no se ejercitan en local.

## Alcance de mercado (decidido)
US + Latam (sin Brasil, sin Europa por ahora). Se mantiene COPPA (US). No se
invierte en GDPR-K ni LGPD en esta etapa.

---

## Hecho (código en `develop`, sin commitear aún)

### 1. Fallback de IA (Gemini → OpenAI)
- `api/generate-ai.ts`: Gemini primario; si falla (API o JSON inválido), reintenta
  con OpenAI (gpt-4o). Si ambos fallan tras el reintento → 502 (no entrega nada
  degradado).
- `src/lib/openaiService.ts`: comentario corregido (era engañoso, decía "OpenAI";
  el endpoint es multi-proveedor). No se renombró el archivo (lo importan 5 sitios).

### 2. Nunca enviar informe sin IA
- `OnboardingFlowV2.tsx`: si la IA falla tras reintentos, NO se envía el email.
  La sesión queda con `ai_sections=null` (señal de regeneración del admin).
  Cubre flujo de tenant y de Argo One.

### 3. IDOR de sesiones (seguridad — bloqueador #1)
- `api/start-play.ts`: emite un `play_token` firmado (HMAC, 1h) tras validar cupo.
- `api/session.ts`: para atar sesión a un tenant exige `play_token` válido y usa
  el tenant del token, no el del body. Para modificar una sesión exige su
  `share_token`. Cierra la creación/modificación cruzada entre tenants.
- Clientes actualizados: `TenantPlay.tsx`, `OnboardingFlowV2.tsx`, `sessionStore.ts`
  (incluye recovery de localStorage).
- Argo One y auto-play autenticado no afectados (no usan tenant).

### 4. Firma de webhook de MercadoPago
- `api/one-webhook.ts`: verifica `x-signature` cuando `MERCADOPAGO_WEBHOOK_SECRET`
  está configurado. Sin el secreto: procesa pero loguea advertencia (no rompe).

### 5. Idempotencia de webhooks + pago fallido
- `api/one-webhook.ts`: deduplica eventos de Stripe por `event.id` (tabla
  `webhook_events`). Maneja `invoice.payment_failed` (log para visibilidad; el
  downgrade real lo hace `customer.subscription.deleted` tras el dunning de Stripe).
- **Requiere aplicar migración**: `supabase/migrations/20260601_webhook_events.sql`.
  El código falla-abierto si la tabla no existe (sigue funcionando sin idempotencia
  hasta aplicarla).

### 6. Analytics de conversión (PostHog)
- `src/lib/analytics.ts` + `src/App.tsx`: pageviews del funnel (landing → pricing →
  signup → dashboard). COPPA-safe (excluye rutas de juego). No-op sin
  `VITE_POSTHOG_KEY`. Autocapture y pageview automático desactivados.
- Follow-up: eventos explícitos (signup_completed, subscription_upgraded).

---

## Pendiente

### Rate limiting (Vercel KV) — con matiz a decidir
Frenar abuso/costos de IA en endpoints públicos. **Tensión real**: limitar por IP
puede bloquear a un club que corre 30 niños detrás de una misma IP (NAT). Hay que
elegir umbrales generosos. Requiere provisionar Vercel KV.

### Alerting de pagos / IA fallida
Extender `api/qa-monitor.ts` para detectar sesiones con `ai_sections=null` y
anomalías de pago, y correrlo en cron real con alerta por email/Slack.

---

## QUÉ NECESITO QUE HAGAS VOS (provisioning) — para el informe final

Yo dejo el código y la configuración lista; estos pasos requieren tus cuentas/paneles:

| # | Acción | Dónde / cómo | Activa |
|---|---|---|---|
| A | **Crear `MERCADOPAGO_WEBHOOK_SECRET`** | Panel de MercadoPago → tu integración → Webhooks → copiar la "clave secreta" → pegarla como env var en Vercel | Verificación de firma del webhook MP |
| B | **Crear `VITE_POSTHOG_KEY`** (+ opcional `VITE_POSTHOG_HOST`) | Crear cuenta en posthog.com → Project Settings → Project API Key → pegarla en Vercel | Analytics de conversión (funnel) |
| C | **Crear el store Vercel KV** | Vercel → tu proyecto → Storage → Create → KV. Genera solo `KV_REST_API_URL` y `KV_REST_API_TOKEN` (se inyectan automáticamente) | Rate limiting (anti-abuso/costos IA) |
| D | **Probar TODO en el preview de Vercel** | Push a `develop` → abrir el preview → jugar una odisea de tenant completa + un Argo One | Validar tokens/firmas/flujos reales (en local el modo DEV los simula) |

Notas:
- Ya está en Vercel: `OPENAI_API_KEY` (el fallback de IA funciona al desplegar), `MERCADOPAGO_ACCESS_TOKEN`, Stripe, Gemini, Resend, Supabase.
- Hasta que A/B/C estén configuradas, esas funciones **no rompen nada**: simplemente quedan inactivas (la firma MP se saltea con warning, PostHog no envía, el rate limit no cuenta).

## Estado de migraciones (yo las puedo aplicar con tu OK)
- `20260601_webhook_events.sql` — **APLICADA en prod** ("Argo", `luutdozbhinfiogugjbv`). Idempotencia lista al desplegar.
- `20260601_enable_rls_exposed_tables.sql` — **PENDIENTE de tu OK.** Cierra exposición de datos de menores (ver abajo).

## 🔴 Hallazgo crítico: RLS apagado en 3 tablas (prod)
`puentes_sessions` (datos de niños), `puentes_purchases` (emails + pagos) y
`credit_transactions` estaban abiertas a cualquiera con la anon key (que viaja
en el frontend). Fix preparado en `20260601_enable_rls_exposed_tables.sql`:
activa RLS (service-role la bypassa, los `/api` siguen igual) + política de
lectura admin para `puentes_purchases` (el dashboard la usa). Reversible.
