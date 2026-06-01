# Go-To-Market Hardening — Bitácora

Trabajo de preparación para comercialización (junio 2026). Producción =
`argomethod.com` (Vercel project `v0-argo-v1`, Supabase project **"Argo"**
`luutdozbhinfiogugjbv`). Branches: `develop` (staging/preview) → `main` (prod).

---

## 1. El problema más grande: los informes nunca se enviaban

**Síntoma:** un usuario completaba la odisea y no recibía el email del informe.
**Investigación (con datos de prod):** 78 de 78 sesiones con perfil resuelto
tenían `email_sent_at = NULL` y casi todas `ai_sections = NULL`. O sea, la
entrega de informes **nunca funcionó de forma confiable**.

**Causa raíz (la bala de plata):** `api/send-email.ts` tenía una variable
`copy` **declarada dos veces** en `buildHtml` → `SyntaxError: Identifier 'copy'
has already been declared`. Eso hace que la función **crashee en cada
invocación** (`FUNCTION_INVOCATION_FAILED` → 500). Confirmado con esbuild: la
versión vieja falla, la corregida pasa. Renombrada a `puentesCopy`.

**Por qué se nos escapó:** el `build` y el `tsc` del proyecto **no type-checkean
la carpeta `api/`**, así que un error de sintaxis en una función serverless
llega a producción sin que nada lo detecte. → **Acción pendiente recomendada:
agregar un gate de sintaxis de `api/` al CI** (p.ej. `esbuild` sobre cada
`api/*.ts`).

### Garantía de entrega: el cron de recuperación
Aunque `send-email` ya funciona, la generación de IA en vivo (en el navegador,
al final de la odisea) es frágil: tarda ~20s y depende de que no se cierre la
pestaña. **La pantalla del niño es determinística y NO depende de la IA** — la
IA es solo para el informe del adulto que va por email.

`api/report-recovery-cron.ts` (cron cada 5 min) garantiza la entrega:
- Busca sesiones con perfil resuelto y `email_sent_at = NULL`.
- Si falta `ai_sections`, las regenera (Gemini→OpenAI) y persiste.
- Manda el email vía `/api/send-email` (idempotente por `email_sent_at`).
- Reintenta en cada corrida hasta lograrlo.
- **Scope: solo de "ahora en adelante"** — piso duro `2026-06-01T22:35:00Z` +
  ventana de 6h. NUNCA re-emaila el lote histórico.

**Lote histórico (NO se toca):** ~53 emails, casi todos del 13-27 de marzo
(demo/beta) + cuentas internas (yacare, vixon, noceti). Son pruebas; decisión
explícita de no backfillear.

---

## 2. Seguridad

- **IDOR de sesiones** (`api/session.ts`): `start-play` emite un `play_token`
  firmado (HMAC); atar una sesión a un tenant exige ese token (no se confía en
  el `tenant_id` del body), y modificar una sesión exige su `share_token`.
- **RLS de tablas expuestas (aplicado en prod):** `puentes_purchases`,
  `puentes_sessions` (datos de niños), `credit_transactions` tenían RLS apagado
  → cualquiera con la anon key podía leerlas. Migración
  `20260601_enable_rls_exposed_tables.sql` activó RLS (+ política admin-read para
  `puentes_purchases`). Las 23 tablas ahora con RLS.
- **Firma de webhook MercadoPago** (`api/one-webhook.ts`): verifica `x-signature`
  cuando `MERCADOPAGO_WEBHOOK_SECRET` está seteado.
- **Rate limiting** (Vercel KV / Upstash): 80/min por IP en `start-play` y
  `generate-ai`. Umbral alto para no bloquear clubes detrás de NAT. Acepta
  nombres `KV_REST_API_*` o `UPSTASH_REDIS_REST_*`.

## 3. Pagos
- **Idempotencia de webhooks Stripe** por `event.id` (tabla `webhook_events`,
  migración `20260601_webhook_events.sql`). Maneja `invoice.payment_failed`.

## 4. IA
- **Fallback OpenAI (gpt-4o)** en `api/generate-ai.ts` si Gemini falla.
  `maxDuration=60` para no cortar por timeout.
- **Nunca informe sin IA**: si la IA falla, no se manda email degradado; el cron
  lo reintenta.

## 5. Email — fix del link de calificar
Los links de "¿fue claro?" generaban `${reportUrl}?feedback=...` y `reportUrl`
ya tenía `?token=...` → **doble `?`** corrompía el token → `/report` daba 403
("Informe no encontrado"). Arreglado con separador correcto (`&`).

## 6. Informe de Argo Puentes — alineación de estilo
`PuentesReport.tsx` ahora matchea el informe del niño (sin cambiar contenido):
- Barras de composición de ejes con el estilo del niño (rótulo "Composición del
  perfil", separador, nombres en gris, barras píldora, dominante a color pleno y
  resto atenuado, sin dots ni %).
- Sacado el "Carta de Navegación".
- Topbar (logo Argo Method + Imprimir).
- Encabezado con el nombre del adulto (`recipient_name`).
- `PuentesFlow` renderiza el informe como página completa.

## 7. Analytics
- **PostHog** (`src/lib/analytics.ts`): funnel de conversión, COPPA-safe (excluye
  rutas de juego), no-op sin `VITE_POSTHOG_KEY`. **Opcional**, no bloquea nada.

---

## Provisioning (estado)
| Qué | Estado |
|---|---|
| Migración `webhook_events` | ✅ aplicada en prod |
| Migración `enable_rls_exposed_tables` | ✅ aplicada en prod |
| `MERCADOPAGO_WEBHOOK_SECRET` | ✅ cargado en Vercel |
| Vercel KV (`upstash-kv-carmine-brush`) | ✅ creado + conectado (KV_REST_API_*) |
| `VITE_POSTHOG_KEY` | ⬜ opcional, sin configurar |

## Gaps / acciones pendientes
- **`api/` no entra en el type-check** → agregar gate de sintaxis al CI (esto
  dejó pasar el crash de `send-email`). **Prioridad alta de proceso.**
- Backfill del lote histórico de marzo: decisión abierta (son pruebas; no urgente).
- `ELEVENLABS_API_KEY` local se borró de `.env.local` (env-pull del `vercel
  install`); restaurar desde elevenlabs.io si se usan scripts locales.
- PostHog cuando se quiera medir conversión.
- Smoke en EN/PT (no bloqueante; los fixes fueron estructurales).
- Legal: scope US+Latam (sin Brasil/EU). COPPA cubierto. GDPR/LGPD fuera de scope.

## Verificación end-to-end
- Jugar una odisea de tenant nueva → el informe llega por email (en vivo, o vía
  el cron de recuperación en ≤5 min si el vivo falla).
- Comprar/abrir Argo Puentes → informe con el nuevo estilo (topbar, nombre del
  adulto, composición de ejes).
- Dashboard superadmin → la columna de Puentes carga (valida la política RLS).
</content>
