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

## Estado de activación (pendiente de infraestructura)

Estas tareas requieren acción humana (tocan prod / servicios externos):

1. **Migración Supabase**: agregar columna `is_synthetic` a `tenants` + crear tenant `qa-robot` + usuario auth de prueba (Task 0.2).
2. **Task 0.4**: filtrar `is_synthetic` en `admin-tenants.ts`, `admin-revenue.ts`, `admin-ai-usage.ts`. NO deployar antes de la migración (rompería el admin por columna faltante).
3. **Vercel env vars**: cargar las `QA_*` en el proyecto.
4. **GitHub secrets**: `QA_PREVIEW_URL`, `QA_TENANT_EMAIL`, `QA_TENANT_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`.
5. **Selectores E2E**: confirmar con `npx playwright codegen <preview>/play/qa-robot` y ajustar los `getByLabel`/`getByRole` de los specs.

## Linter de contenido: backlog conocido

`npm run lint:content` reporta hoy **8 hallazgos reales** (em dash en copy en español). El job de CI `content-lint` está en `continue-on-error: true` hasta limpiar ese backlog. El hook por-edición (`.claude/scripts/check-voseo.sh`) es el gate duro para código nuevo (voseo + guiones).
