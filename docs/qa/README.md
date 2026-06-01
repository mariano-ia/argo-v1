# QA Robots — Cómo correr

Red de calidad automática para Argo. Cuatro capas: linters de contenido, robot E2E, robot exploratorio, synthetic monitoring, y eval de calidad de IA. Plan completo: `docs/superpowers/plans/2026-05-26-automated-qa-robots.md`.

## Comandos

| Robot | Comando | Target | Necesita |
|---|---|---|---|
| Linter de contenido (repo-wide) | `npm run lint:content` | `src/` local | nada |
| E2E scriptado | `npm run test:e2e` | `QA_BASE_URL` | preview + tenant `qa-robot` |
| Exploratorio (monkey) | `npm run test:monkey` | `QA_BASE_URL` | idem (usar `MONKEY_RUNS=3`) |
| Synthetic monitor | `npm run qa:monitor` | curl a `/api/qa-monitor` | endpoint deployado + `CRON_SECRET` |
| Eval de IA | `npm run qa:ai-eval` | `/api/generate-ai` + `/api/tenant-chat` | tenant `qa-robot` + login |

Tests unitarios de los helpers (corren sin red):

```bash
node scripts/qa/lib/scoring.test.mjs
node scripts/qa/lib/qa-env.test.mjs
node scripts/qa/lint-content.test.mjs
```

## Guardrails (NO negociables)

- Toda corrida usa el tenant `qa-robot` (`is_synthetic=true`) y borra su data al terminar.
- Pagos en Stripe test mode.
- Emails sintéticos van a `QA_ALERT_EMAIL`, nunca a destinatarios reales.
- El monitor corre 1 vez/día por cron (`vercel.json`). Subir frecuencia solo con tráfico real.
- Las métricas del admin deben excluir `is_synthetic=true` (Task 0.4 del plan, pendiente).

## Env vars

```bash
QA_BASE_URL=https://www.argomethod.com   # target de monitor / E2E (o URL de preview)
QA_TENANT_SLUG=qa-robot
QA_TENANT_EMAIL=qa-robot@argomethod.test
QA_TENANT_PASSWORD=<fuerte>
QA_ALERT_EMAIL=marianonoceti@gmail.com
```
Reutiliza: `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`.

## Estado de activación

**Hecho:**
- ✅ Migración Supabase: columna `is_synthetic` + tenant `qa-robot` (is_synthetic=true, plan pro, roster 50) + usuario auth `qa-robot@argomethod.test` (credenciales en `.env`).
- ✅ Task 0.4: `qa-robot` excluido de métricas del admin (tenants/revenue/ai-usage).
- ✅ AI eval contra prod: 7/7 PASS. Health checks: 3/3 PASS.
- ✅ E2E validado contra prod: 10 passed / 3 skipped / 0 failed.
- ✅ Linter de contenido limpio (0 hallazgos). Hook + CI bloqueantes.
- ✅ CI de GitHub Actions configurado para correr **verde sin ningún secreto** (los tests con login se saltean solos hasta cargar credenciales).

**Opcional (mejora la cobertura, no es bloqueante):**
1. **Secretos en GitHub** (Settings → Secrets and variables → Actions → New repository secret) para activar el test de login del tenant: `QA_TENANT_EMAIL` y `QA_TENANT_PASSWORD` (ambos en `.env`). Sin ellos, ese test aparece como "skipped" y el resto corre igual.
2. **Variable en GitHub** `QA_BASE_URL` (pestaña Variables, no Secrets) apuntando a la preview de develop (`https://v0-argo-v1-git-develop-marianonoceti-gmailcoms-projects.vercel.app`) para testear el código pusheado en vez de prod. Requiere que la protección de preview de Vercel esté off o un bypass.
3. **Vercel**: confirmar que el plan permite el 5º cron (`qa-monitor`). Las env vars `QA_*` ya están cargadas en Vercel.
4. **Ganchos de test** para automatizar la odisea completa + chat por navegador: un `data-testid` en el checkbox de consentimiento y un modo demo que saltee los mini-juegos.

## Linter de contenido

`npm run lint:content` está **limpio** (0 hallazgos). El job de CI `content-lint` es **bloqueante**. El hook por-edición (`.claude/scripts/check-voseo.sh`) delega en `scripts/qa/lint-content.mjs` (misma lógica), así que es language-aware: bloquea voseo y em/en dash en copy **español**, pero ignora EN/PT y strings de debug.
