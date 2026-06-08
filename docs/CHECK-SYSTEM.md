# Sistema de Checks y Monitoreo — Argo

> Fuente única de verdad del sistema de "cómo sabemos si algo se rompe y cómo lo recuperamos".
> Última actualización: 2026-06-08. Docs relacionados: [ARGO-COACH-EXPLAINED.md](ARGO-COACH-EXPLAINED.md) (cómo funciona el Coach), [ARGO-COACH-AUDIT.md](ARGO-COACH-AUDIT.md), [CLI-ACCESS.md](CLI-ACCESS.md), [GO-TO-MARKET-HARDENING.md](GO-TO-MARKET-HARDENING.md).

## Filosofía: defensa en profundidad (3 anillos)

1. **Prevenir** — tests que corren antes de mergear (unit, E2E, linter de contenido, eval de IA).
2. **Detectar** — telemetría en producción + un monitor sintético diario que alerta por email.
3. **Recuperar** — crons que se auto-curan (ej. re-entregan reportes que fallaron) sin intervención.

La idea es que ninguna falla quede invisible: o la atrapa un test antes de salir, o la detecta la telemetría/monitor en prod, o la repara un cron.

---

## Mapa rápido

| Capa | Componente | Dónde | Cuándo | Alerta |
|------|-----------|-------|--------|--------|
| Prevenir | Tests E2E (Playwright) | `e2e/`, `npm run test:e2e` | Manual / CI | Falla el comando |
| Prevenir | Monkey tests | `e2e/monkey-*`, `npm run test:monkey` | Manual / CI | Falla el comando |
| Prevenir | Unit tests | `npm run qa:unit` | Manual / CI | Falla el comando |
| Prevenir | Linter de contenido (voseo/guiones) | `npm run lint:content` + hook post-edit | En cada edición + manual | Exit ≠ 0 / hook |
| Prevenir | Eval de IA (calidad de reportes y chat) | `npm run qa:ai-eval` | Manual | Reporte markdown |
| Detectar | **Monitor sintético** (`qa-monitor`) | `/api/qa-monitor` | Cron horario (`0 * * * *`) | **Email (Resend)** |
| Detectar | Telemetría del Coach (`ai_events`) | tabla + `/api/qa-monitor` CHECK 6 | Por cada respuesta + chequeo diario | Email vía monitor |
| Detectar | Errores de cliente (`client_errors`) | tabla + `/admin/health` | En cada error de browser | Dashboard (pull) |
| Detectar | Telemetría de audio (`audio_events`) | tabla + `/admin/health` | En cada evento de audio | Dashboard (pull) |
| Recuperar | Recuperación de reportes | `/api/report-recovery-cron` | Cron cada 5 min | Self-heal (sin alerta) |

---

## 1) Crons (Vercel — `vercel.json`)

| Path | Schedule (UTC) | Propósito |
|------|---------------|-----------|
| `/api/qa-monitor` | `0 * * * *` (cada hora) | **Monitor sintético.** ~33 checks de salud; manda email si algo NUEVO falla. |
| `/api/report-recovery-cron` | `*/5 * * * *` (cada 5 min) | Red de seguridad de entrega de reportes (self-heal). |
| `/api/principia-detect` | `*/10 * * * *` (cada 10 min) | Detector de Vigía/Principia + heartbeat del cockpit. |
| `/api/journey-canary` | `0 9 * * *` (diario 09:00) | **Canary de viaje completo:** corre play→generate-ai→guardar sesión→enviar email como tenant QA, autolimpiante (borra su sesión `is_demo`). Alerta por email+Telegram si algún eslabón falla. Es el único check que verifica la cadena entera (sobre todo que el email se envía). |
| `/api/blog-cron` | `0 10 * * 1,4` (Lun/Jue 10:00) | Publicación autónoma del blog. |
| `/api/retention-cron` | `0 3 * * *` (diario 03:00) | Retención/limpieza de datos. Ver `api/retention-cron.ts`. |
| `/api/trial-lifecycle-cron` | `0 11 * * *` (diario 11:00) | Emails de ciclo de vida del trial (por vencer/vencido). |
| `/api/puentes-reminder-cron` | `0 14 * * *` (diario 14:00) | Recordatorios de la feature Puentes. |
| `/api/puentes-sync-cron` | `30 8 * * *` (diario 08:30) | Sincronización de Puentes. |

Todos los crons están protegidos por `CRON_SECRET` (header `Authorization: Bearer` o `?secret=`). El CHECK 4 del monitor verifica que esa protección sigue activa.

---

## 2) El monitor sintético — `/api/qa-monitor` (el corazón del sistema)

Cron horario (`0 * * * *`). Corre ~33 checks contra producción y, si el conjunto de fallas **cambia** (algo NUEVO falla vs. la corrida anterior), manda un email vía Resend a `QA_ALERT_EMAIL` (default `marianonoceti@gmail.com`). Si todo pasa: silencio. Devuelve 500 si hubo fallas, 200 si todo OK.

| # | Check | Qué valida | Falla si |
|---|-------|-----------|----------|
| 1 | `start-play 200 + ok` | El flujo de inicio de juego del tenant QA responde con capacidad | status ≠ 200 o `ok ≠ true` |
| 2 | `generate-ai 200 + sections` | Generación de reporte de IA produce secciones válidas | no devuelve `sections.resumenPerfil`. Reintenta 1 vez ante un 5xx/error transitorio (la llamada IA tarda 15-27s y un sample lento puede 5xx): sólo un fallo **sostenido** (ambos intentos) alerta |
| 3 | `no stuck _pending QA sessions` | No hay sesiones del tenant QA atascadas en `_pending` | ≥ 5 sesiones pending |
| 4 | `blog-cron protected` | Los crons siguen protegidos por secret | `/api/blog-cron` no devuelve 401/403 |
| 5 | `no AI-failed reports (24h)` | No hay sesiones con perfil pero sin reporte entregado | ≥ 1 sesión con `eje` real + `ai_sections` null en 24h |
| 6 | **Telemetría del Coach** | Salud agregada del Coach (lee `ai_events`, 24h) | ver thresholds abajo |
| 7 | **Canary del Coach** | Prueba end-to-end del Coach (login + pregunta canónica) | ver abajo |

### CHECK 6 — Telemetría del Coach (thresholds de alerta)
Lee `ai_events` de las últimas 24h. Si no hay tráfico, pasa con nota. Si hay:
- `no forbidden-label served` → falla si **cualquier** respuesta sirvió un label viejo prohibido (bug #2).
- `no prohibited copy served` → falla si una palabra prohibida llegó al usuario pese al reintento.
- `ground-truth violation rate < 2%` → falla si > 2% de respuestas atribuyeron el eje equivocado.
- `OpenAI fallback share < 10%` → falla si > 10% salió por OpenAI (señal de caída de Gemini).
- `p95 latency < 15s` → falla si la latencia p95 supera 15s.

Si la tabla `ai_events` no existiera, el check se **salta** (no paga) en vez de romper.

### CHECK 7 — Canary del Coach (end-to-end)
Se loguea al vuelo como el usuario QA (`QA_COACH_EMAIL`/`QA_COACH_PASSWORD` → password grant contra Supabase, token fresco porque los JWT expiran en ~1h), hace un POST real a `/api/tenant-chat` preguntando "¿cómo se llama el perfil de eje S con motor Medio?" y verifica:
- responde 200 con contenido,
- usa el nombre **canónico** ("Sostenedor Rítmico", acento-insensible),
- **no** aparece ningún label viejo prohibido (El Tanque, Sostén Confiable, etc.).

Es la única señal que ejercita el camino completo (login → prompt → modelo → naming) cada día, aunque no haya tráfico real. Se salta solo si faltan las credenciales QA.

### Correr el monitor a mano
```bash
npm run qa:monitor   # curl a la /api/qa-monitor desplegada; necesita CRON_SECRET en .env
```

---

## 3) Telemetría en producción (tablas)

| Tabla | Qué guarda | Quién la escribe | Dónde se ve | PII |
|-------|-----------|------------------|-------------|-----|
| `ai_events` | 1 fila por respuesta del Coach: provider, latencia, tokens/costo, flags de calidad | `api/tenant-chat.ts` (best-effort) | qa-monitor CHECK 6 | No (solo flags/placeholders) |
| `client_errors` | `window.error` + `unhandledrejection` del browser | `src/main.tsx` (sendBeacon) | `/admin/health` | UA/URL |
| `audio_events` | Eventos del watchdog/self-heal de audio | flujo de juego | `/admin/health` | No |
| `audit_log` | Acciones de superadmin | endpoints admin | tabla / dashboard | Acción + admin |
| `webhook_events` | Idempotencia de webhooks de pago | `api/one-webhook.ts` | tabla | No |

Todas las tablas de telemetría tienen **RLS on sin policies** → los clientes no leen/escriben; solo el service role (que bypassa RLS). Definiciones en `supabase/migrations/`.

### `ai_events` — esquema de calidad del Coach
Columnas clave (además de tenant/thread/provider/model/lang/tokens/cost/latency):
`mentioned_player`, `groundtruth_violation`, `label_violation`, `prohibited_hit`, `prohibited_after_retry`, `context_miss`, `fair_use_exceeded`.
**Nunca guarda el nombre real del niño** — solo flags. Migración: `supabase/migrations/20260604_ai_events.sql`.

---

## 4) Dashboard de salud — `/admin/health`

Backend: `api/admin-health.ts` (gated por allowlist `admin_users.email`). Agrega 30 días de `audio_events` y `client_errors` (por día/tipo/pantalla/device/browser) + las 50 filas más recientes de cada uno. Es **pull** (hay que abrirlo), no alerta solo.

Consumo de IA por tenant: `/api/admin-ai-usage` (costos + soft caps del chat). También pull.

---

## 5) Tests (capa "prevenir")

| Comando | Qué corre | Notas |
|---------|-----------|-------|
| `npm run test:e2e` | Playwright: odyssey, auth-dashboard, argo-one, report, chat, health, audio-health | Camino crítico de usuario |
| `npm run test:monkey` | Playwright monkey: odyssey, signup | Fuzzing de UI |
| `npm run qa:unit` | scoring + qa-env + lint-content + **coach-helpers** (naming/matcher) | Unit, rápido, sin red |
| `npm run lint:content` | Linter de voseo + guiones en `src/` | También como hook post-edit (`.claude/scripts/check-voseo.sh`) |
| `npm run qa:ai-eval` | Eval de calidad de reportes + chat contra endpoints en vivo | Escribe reporte markdown |
| `npm run lint` | ESLint (`--max-warnings 0`) | |

`qa:unit` incluye los tests de los helpers puros del Coach (`scripts/qa/coach-helpers.test.ts`): naming canónico, matcher acento/case-insensible, anti-falsos-positivos.

---

## 6) Monitoreo del Coach (las 3 capas, en detalle)

El Coach (consultor IA, `api/tenant-chat.ts`) es la pieza con más superficie de fallo silencioso, así que tiene su propio triple anillo. Cómo funciona (teoría DISC, datos, flujo): [ARGO-COACH-EXPLAINED.md](ARGO-COACH-EXPLAINED.md). Auditoría y fixes: [ARGO-COACH-AUDIT.md](ARGO-COACH-AUDIT.md).

1. **Telemetría** (`ai_events`): cada respuesta deja una fila con flags de calidad. Mide tasa de alucinación, palabras prohibidas, provider, latencia, costo.
2. **Checks de tasa** (qa-monitor CHECK 6): lee la telemetría diaria y alerta si una tasa cruza el umbral.
3. **Canary end-to-end** (qa-monitor CHECK 7): prueba activa diaria con un jugador/pregunta de control.

Anti-alucinación dentro del propio endpoint (no es monitoreo, es prevención en runtime): 5 capas (base de conocimiento, inyección del perfil, filtro de palabras prohibidas con fallback seguro, few-shot, validación ground-truth). Ver el audit.

---

## 7) El tenant QA sintético

- Tenant: slug `qa-robot` (plan pro). Usuario: `qa-robot@argomethod.test`.
- Provisionado originalmente por `scripts/qa/setup-test-tenant.mjs` (signUp con anon key + SQL privilegiado para confirmar email y crear tenant/member).
- Lo usan: CHECK 1/2/3 del monitor (por slug) y el CHECK 7 (por login).

> ⚠️ **Gotcha (2026-06-04):** se rotó el password de `qa-robot@argomethod.test` para armar el canary. El valor canónico vive ahora en **Vercel → `QA_COACH_PASSWORD`** (Production). Si algún flujo local usa `QA_TENANT_PASSWORD` del `.env` para loguearse como el tenant QA, ese valor quedó **desactualizado**: actualízalo al mismo password (o vuelve a rotarlo y actualiza ambos). El password de prod es el de Vercel.

---

## 8) Variables de entorno relevantes a los checks

| Var | Dónde | Para qué |
|-----|-------|----------|
| `CRON_SECRET` | Vercel + `.env` local | Protege todos los crons; `qa:monitor` lo necesita |
| `QA_ALERT_EMAIL` | Vercel | Destinatario de las alertas del monitor (default marianonoceti@gmail.com) |
| `RESEND_API_KEY` | Vercel | Envío de las alertas por email |
| `QA_TENANT_SLUG` | Vercel (opcional) | Slug del tenant QA (default `qa-robot`) |
| `QA_COACH_EMAIL` / `QA_COACH_PASSWORD` | Vercel (Production) | Login del canary del Coach (CHECK 7) |
| `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_URL` | Vercel | El canary los usa para el password grant |
| `QA_BASE_URL` | `.env` local (opcional) | Target de los runners locales (default www.argomethod.com) |
| `OPENAI_API_KEY` | Vercel (todas) | Fallback del Coach (confirmado presente 2026-06-04) |

---

## 9) Runbook — qué hacer ante una alerta

El email del monitor lista los checks que fallaron con su `detail`. Por check:

- **start-play / generate-ai / DB** (1-3): problema de capacidad, del endpoint, o de datos del tenant QA. Revisar logs de Vercel del endpoint (`vercel logs`).
- **blog-cron protected** (4): el secret de cron dejó de aplicar → revisar `CRON_SECRET` y la lógica de auth de los crons (riesgo de seguridad).
- **AI-failed reports** (5): hay un usuario sin su reporte. El `report-recovery-cron` debería recuperarlo en ≤5 min; si persiste, revisar `generate-ai` / `send-email`.
- **Coach: forbidden-label / prohibited copy** (6): regresión grave del Coach (sirvió un nombre viejo o copy prohibido). Revisar `api/tenant-chat.ts` y los `ai_events` con esos flags. P0.
- **Coach: ground-truth rate / OpenAI share / latency** (6): deriva del modelo, caída de Gemini, o lentitud. Revisar provider y `GEMINI_API_KEY`.
- **Coach canary** (7): el Coach respondió mal el naming canónico, o el login QA falló. Si es el login, revisar `QA_COACH_PASSWORD`; si es el naming, hay regresión del fix de naming.

Acceso operativo (logs, env, deploys) vía CLI: ver [CLI-ACCESS.md](CLI-ACCESS.md).

---

## 10) Huecos conocidos / próximos pasos

- Las tablas de telemetría son **pull** salvo `ai_events` (que el monitor sí lee y alerta). `client_errors`/`audio_events` solo se ven en `/admin/health`: si quieres alertas sobre picos de errores de cliente, hay que agregar un check al monitor que los lea (mismo patrón que CHECK 6).
- No hay alertas de costo de IA automáticas (admin-ai-usage es pull). Candidato a un CHECK futuro.
- PostHog está en el stack pero es client-side; no hay analítica server-side del chat más allá de `ai_events`.
- El canary QA mete tráfico sintético en `ai_events` (1 fila/día). Es limpio (sin violations), no afecta las tasas de forma significativa.

---

## 11) Incidente 2026-06-05 (ERR_MODULE_NOT_FOUND) y capas agregadas

**Qué pasó:** 7 funciones serverless (`create-tenant`, `session`, `one-webhook`, `send-email`, `report-recovery-cron`, `admin-tenants`, `trial-lifecycle-cron`) importaban de `../src/lib`. Vercel transpila (no bundlea) `api/`, así que esos imports pasaban `tsc` pero tiraban `ERR_MODULE_NOT_FOUND` en runtime. `report-recovery-cron` estuvo en 500 cada 5 min ~24h en prod sin alerta. Nadie lo detectó: ningún check invocaba esas funciones, el CI apuntaba a prod (no al código pusheado), el build no type-checkea `api/`, y un crash de import no deja filas en la base (los checks pasivos no ven nada).

**Capas nuevas (incrementales, sin tocar los checks 1–7):**
- **Prevención — `check:api-imports`** (`scripts/qa/check-api-imports.mjs`, gate de CI en el job `static-checks`): falla si cualquier `api/*.ts` importa de `../src`. Es la red real, porque `tsc` no puede atrapar esto. Regla en `CLAUDE.md` (Serverless endpoints): **inline el helper, no importes de `src/`**.
- **Detección — qa-monitor CHECK 8** (`api/qa-monitor.ts`): le pega a cada endpoint con payload inerte y **falla ante cualquier 5xx** (distingue 401/403 = protegido OK, de 500 = roto en boot). Es el check que hubiera cazado este incidente.
- **Latencia — qa-monitor pasó de diario a horario** (`vercel.json`): de hasta 24h a ≤1h de detección.
- **Defensa en profundidad — `typecheck:api`** (`tsc -p tsconfig.api.json`, gate de CI): type-checkea `api/**` (el build solo cubría `src/`).

**Próximos pasos (P1/P2, no implementados aún):** heartbeat por corrida de cada cron + dead-man's-switch en qa-monitor; apuntar el e2e del CI al preview de develop con un test que haga submit real; watcher out-of-band de logs 5xx de Vercel.
