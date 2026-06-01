# Robots de QA Automático para Argo — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una red de calidad automática para Argo (hoy 100% manual, sin tests ni CI) compuesta por tres tipos de robot (E2E scriptado, exploratorio y synthetic monitoring), más un eval de calidad de IA y la extensión del linter de español, todo con guardrails para no contaminar producción.

**Architecture:** Tres capas que comparten un mismo set de tests Playwright y endpoints. (1) En cada push a `develop`, GitHub Actions corre los robots E2E + exploratorio contra la preview de Vercel y los linters de contenido. (2) Un cron diario de Vercel (`/api/qa-monitor`, protegido con `CRON_SECRET`) corre checks sintéticos a nivel API contra producción y alerta por Resend si algo falla. (3) Un eval de IA bajo demanda (`npm run qa:ai-eval`) golpea `/api/generate-ai` y `/api/tenant-chat` con una batería fija y los puntúa. Toda la data sintética se ata a un tenant de prueba (`is_synthetic = true`) y se borra al terminar cada corrida.

**Tech Stack:** Playwright (`@playwright/test`), `tsx` para correr scripts TS que importan `src/lib/*`, Node `.mjs` para scripts sintéticos, Vercel serverless + cron, Resend (alertas), Gemini (juez LLM opcional), GitHub Actions.

---

## Definición: ¿Qué es "control de calidad automático" para Argo?

Es el conjunto de procesos que verifican, sin intervención humana, que la aplicación sigue funcionando como esperamos, y que avisan cuando no. Se apoya en cuatro pilares, ordenados de más rápido/barato a más lento/caro:

| Pilar | Qué prueba | Cuándo corre | Quién lo dispara |
|---|---|---|---|
| **Linters de contenido** | Reglas de copy (voseo, guiones) sobre el código fuente | En cada edición (hook) + en CI | Hook local + GitHub Actions |
| **Robot E2E scriptado** | Flujos felices completos en un navegador real | En cada push a `develop` | GitHub Actions contra preview |
| **Robot exploratorio** | Inputs raros / clics inesperados buscando crashes | En cada push a `develop` | GitHub Actions contra preview |
| **Synthetic monitoring** | Salud de endpoints críticos en producción | 1 vez al día (configurable) | Cron de Vercel |
| **Eval de calidad de IA** | Que el reporte y el chat no alucinen ni rompan reglas | Bajo demanda (antes de tocar prompts) | `npm run qa:ai-eval` |

Principio rector: **un test que no corre solo no existe**. Por eso el objetivo no es "tener tests" sino tenerlos enganchados a CI y a un cron, con alertas. Y dado que Argo todavía no tiene usuarios reales (estamos saliendo a buscarlos), la frecuencia se mantiene baja a propósito: lo crítico es cobertura y que corra en cada deploy, no correr cada minuto.

### Mapeo: 3 robots → 6 puntos de cobertura

Los 6 puntos críticos definidos previamente, y qué robot cubre cada uno:

| # | Punto crítico | E2E scriptado | Exploratorio | Synthetic monitoring |
|---|---|:---:|:---:|:---:|
| 1 | Odisea completa (flujo del jugador) | ✅ Task 1.1 | ✅ Task 2.1 | ✅ Task 3.1 (API) |
| 2 | Signup / login / dashboard | ✅ Task 1.2 | ✅ Task 2.2 | — |
| 3 | Argo One (compra, Stripe test) | ✅ Task 1.3 | — | ✅ Task 3.1 (webhook health) |
| 4 | Generación de reporte + email | ✅ Task 1.4 | — | ✅ Task 3.1 (generate-ai) |
| 5 | AI consultant (chat) | ✅ Task 1.5 | — | ✅ Task 3.1 (tenant-chat) |
| 6 | Salud de crons | ✅ Task 1.6 | — | ✅ Task 3.1 |

Eval de IA (Fase 4) es transversal a los puntos 4 y 5 pero merece capa propia porque mide *calidad*, no *funcionamiento*.

### Guardrails de producción (NO negociables)

Conecta directo con el incidente del agente rogue (14/04). Un robot que "usa" Argo crea sesiones, gasta tokens y manda mails. Reglas:

1. **Toda data sintética se ata al tenant de prueba** (`slug = qa-robot`, `is_synthetic = true`).
2. **Las métricas del admin excluyen** `is_synthetic = true` (Task 0.4).
3. **Cada corrida sintética borra lo que creó** (hard-delete al final).
4. **Pagos siempre en Stripe test mode** (claves test, nunca live).
5. **Emails sintéticos van a un inbox controlado** (`QA_ALERT_EMAIL`), nunca a destinatarios reales.
6. **Los flujos que tocan Gemini corren con baja frecuencia** (cron diario, no por minuto) para controlar costo.
7. **Ningún robot ejecuta flujos destructivos contra prod** (borrar cuentas, cancelar subs): eso solo en preview.

---

## File Structure

Archivos nuevos y su responsabilidad:

```
playwright.config.ts                  # Config del robot E2E + exploratorio
e2e/
  fixtures.ts                         # Fixtures compartidas (baseURL, helpers de consola)
  helpers/console-guard.ts            # Detecta errores de consola del navegador
  helpers/profiles.ts                 # Sets de respuestas deterministas para la odisea
  odyssey.spec.ts                     # Punto 1: odisea completa
  auth-dashboard.spec.ts              # Punto 2: signup/login/dashboard
  argo-one.spec.ts                    # Punto 3: compra Argo One (hasta redirect a Stripe)
  report.spec.ts                      # Punto 4: pantalla de resultado + reporte
  chat.spec.ts                        # Punto 5: AI consultant
  health.spec.ts                      # Punto 6: salud de endpoints/crons (API)
  monkey-odyssey.spec.ts              # Exploratorio: fuzz de la odisea
  monkey-signup.spec.ts               # Exploratorio: fuzz del signup
scripts/qa/
  lib/qa-env.mjs                      # Carga env, cliente supabase, assert(), cleanup()
  lib/scoring.mjs                     # Funciones puras de scoring (reusadas por el eval)
  lint-content.mjs                    # Scanner de voseo + guiones sobre src/ (CI)
  ai-eval.ts                          # Eval de IA (corre con tsx, importa src/lib)
  eval/cases.ts                       # Batería de casos (perfiles + preguntas de chat)
api/qa-monitor.ts                     # Endpoint de synthetic monitoring (cron + CLI)
.github/workflows/qa.yml              # CI: E2E + exploratorio + linters en push a develop
docs/qa/README.md                     # Cómo correr cada robot, env vars, troubleshooting
```

Archivos modificados:

```
package.json                          # devDeps + scripts qa:*
vercel.json                           # cron diario para /api/qa-monitor
.claude/scripts/check-voseo.sh        # + detección de guiones (em/en dash)
api/admin-tenants.ts                  # excluir is_synthetic de conteos
api/admin-revenue.ts                  # excluir is_synthetic de revenue
api/admin-ai-usage.ts                 # excluir is_synthetic de consumo IA
```

---

## Convenciones de este plan

- **Rama:** TODO el trabajo va a `develop` (nunca `main` sin aprobación explícita). Crear `develop` desde `main` si no existe local.
- **Idioma:** copy de usuario en español latam neutro (tú, sin voseo, sin guiones). Código, comentarios y commits en inglés.
- **Env local:** las variables ya existen en `.env` (Vercel las inyecta en prod). Para QA agregamos las nuevas en `.env` y en Vercel (Task 0.1).
- **Comando de test E2E:** `npx playwright test`. Comando de scripts TS: `npx tsx scripts/qa/<file>.ts`.

---

## Fase 0 — Fundaciones y guardrails

### Task 0.1: Dependencias, scripts y env vars

**Files:**
- Modify: `package.json`
- Create: `docs/qa/README.md`

- [ ] **Step 1: Instalar dependencias de QA**

Run:
```bash
git checkout develop 2>/dev/null || git checkout -b develop
npm install -D @playwright/test tsx
npx playwright install chromium
```
Expected: instala `@playwright/test` y `tsx` en devDependencies y descarga el navegador Chromium.

- [ ] **Step 2: Agregar scripts a `package.json`**

En el bloque `"scripts"`, agregar (manteniendo los existentes `dev`, `build`, `lint`, `preview`):
```json
    "test:e2e": "playwright test e2e/odyssey.spec.ts e2e/auth-dashboard.spec.ts e2e/argo-one.spec.ts e2e/report.spec.ts e2e/chat.spec.ts e2e/health.spec.ts",
    "test:monkey": "playwright test e2e/monkey-odyssey.spec.ts e2e/monkey-signup.spec.ts",
    "qa:monitor": "node scripts/qa/lib/run-monitor.mjs",
    "qa:ai-eval": "tsx scripts/qa/ai-eval.ts",
    "lint:content": "node scripts/qa/lint-content.mjs"
```

- [ ] **Step 3: Documentar y declarar las env vars de QA**

Agregar a `.env` (local) y luego a Vercel (Project Settings → Environment Variables) estas variables nuevas:
```bash
QA_BASE_URL=https://argomethod.com           # target de synthetic monitoring (prod)
QA_TENANT_SLUG=qa-robot                       # tenant de prueba
QA_TENANT_EMAIL=qa-robot@argomethod.test      # login del tenant de prueba (chat eval)
QA_TENANT_PASSWORD=<generar-uno-fuerte>       # password del tenant de prueba
QA_ALERT_EMAIL=marianonoceti@gmail.com        # destino de alertas del monitor
```
Ya existen y se reutilizan: `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`.

- [ ] **Step 4: Crear `docs/qa/README.md`**

```markdown
# QA Robots — Cómo correr

| Robot | Comando | Target |
|---|---|---|
| E2E scriptado | `npm run test:e2e` | `QA_BASE_URL` (preview o prod-test) |
| Exploratorio (monkey) | `npm run test:monkey` | idem |
| Synthetic monitor | `npm run qa:monitor` | curl a `/api/qa-monitor` en prod |
| Eval de IA | `npm run qa:ai-eval` | `/api/generate-ai` + `/api/tenant-chat` |
| Linter de contenido | `npm run lint:content` | `src/` local |

## Guardrails
- Toda corrida usa el tenant `qa-robot` (is_synthetic=true) y borra su data al terminar.
- Pagos en Stripe test mode.
- El monitor corre 1 vez/día por cron (vercel.json). Subir frecuencia solo con tráfico real.

## Env vars
Ver lista en este README + .env.example.
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json docs/qa/README.md
git commit -m "chore(qa): add playwright + tsx tooling, qa scripts and docs"
```

### Task 0.2: Tenant de prueba sintético

**Files:**
- DB migration (vía Supabase MCP `apply_migration` o SQL editor)

- [ ] **Step 1: Agregar columna `is_synthetic` a `tenants`**

SQL:
```sql
alter table tenants add column if not exists is_synthetic boolean not null default false;
create index if not exists idx_tenants_is_synthetic on tenants(is_synthetic) where is_synthetic = true;
```

- [ ] **Step 2: Crear el usuario auth de prueba**

En Supabase Auth (Dashboard → Authentication → Add user), crear `qa-robot@argomethod.test` con el `QA_TENANT_PASSWORD` de la Task 0.1. Auto-confirmar el email. Copiar su `auth user id`.

- [ ] **Step 3: Insertar el tenant de prueba**

SQL (reemplazar `<AUTH_USER_ID>` por el id del paso 2):
```sql
insert into tenants (display_name, slug, plan, roster_limit, auth_user_id, is_synthetic, trial_expires_at)
values ('QA Robot', 'qa-robot', 'trial', 50, '<AUTH_USER_ID>', true, now() + interval '100 years')
on conflict (slug) do update set is_synthetic = true, trial_expires_at = now() + interval '100 years', roster_limit = 50;
```
Nota: `trial_expires_at` muy lejano para que `start-play` nunca devuelva `trial_expired`. `roster_limit` alto para que el fuzz no llene el equipo.

- [ ] **Step 4: Verificar**

Run:
```bash
node -e "import('dotenv/config').then(async()=>{const{createClient}=await import('@supabase/supabase-js');const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const{data}=await sb.from('tenants').select('slug,is_synthetic,plan,roster_limit').eq('slug','qa-robot').single();console.log(data);})"
```
Expected: imprime `{ slug: 'qa-robot', is_synthetic: true, plan: 'trial', roster_limit: 50 }`.

### Task 0.3: Helper compartido de QA (`qa-env.mjs`)

**Files:**
- Create: `scripts/qa/lib/qa-env.mjs`
- Test: `scripts/qa/lib/qa-env.test.mjs`

- [ ] **Step 1: Escribir el test que falla**

```js
// scripts/qa/lib/qa-env.test.mjs
import assert from 'node:assert';
import { makeAssert } from './qa-env.mjs';

const results = [];
const check = makeAssert(results);
check('truthy passes', true);
check('falsy fails', false);

assert.strictEqual(results.filter(r => r.ok).length, 1, 'one passing');
assert.strictEqual(results.filter(r => !r.ok).length, 1, 'one failing');
console.log('qa-env.test PASS');
```

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `node scripts/qa/lib/qa-env.test.mjs`
Expected: FAIL con `Cannot find module './qa-env.mjs'` o `makeAssert is not a function`.

- [ ] **Step 3: Implementar `qa-env.mjs`**

```js
// scripts/qa/lib/qa-env.mjs
// Shared helpers for QA scripts: env loading, supabase client, assertions, cleanup.
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

export const QA = {
  baseUrl: process.env.QA_BASE_URL || 'https://argomethod.com',
  tenantSlug: process.env.QA_TENANT_SLUG || 'qa-robot',
  tenantEmail: process.env.QA_TENANT_EMAIL,
  tenantPassword: process.env.QA_TENANT_PASSWORD,
  alertEmail: process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com',
};

export function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

// Returns an assert function that records {name, ok} into the given array.
export function makeAssert(results) {
  return (name, cond) => {
    const ok = Boolean(cond);
    results.push({ name, ok });
    console.log(ok ? `  OK:   ${name}` : `  FAIL: ${name}`);
    return ok;
  };
}

// Hard-deletes every session belonging to the QA test tenant. Call at end of each run.
export async function cleanupSyntheticSessions(sb, tenantId) {
  const { error } = await sb.from('sessions').delete().eq('tenant_id', tenantId);
  if (error) console.warn('[qa cleanup] could not delete sessions:', error.message);
}

// Resolves the QA tenant id from its slug.
export async function getQaTenantId(sb) {
  const { data, error } = await sb.from('tenants').select('id').eq('slug', QA.tenantSlug).single();
  if (error || !data) throw new Error(`QA tenant '${QA.tenantSlug}' not found. Run Task 0.2.`);
  return data.id;
}
```

- [ ] **Step 4: Correr el test para verlo pasar**

Run: `node scripts/qa/lib/qa-env.test.mjs`
Expected: PASS — imprime `qa-env.test PASS`.

- [ ] **Step 5: Commit**

```bash
git add scripts/qa/lib/qa-env.mjs scripts/qa/lib/qa-env.test.mjs
git commit -m "feat(qa): shared qa-env helpers (supabase, assert, cleanup)"
```

### Task 0.4: Excluir data sintética de las métricas del admin

**Files:**
- Modify: `api/admin-tenants.ts`
- Modify: `api/admin-revenue.ts`
- Modify: `api/admin-ai-usage.ts`

- [ ] **Step 1: Leer las queries actuales**

Run: `grep -nE "from\('tenants'\)|\.select\(|count" api/admin-tenants.ts api/admin-revenue.ts api/admin-ai-usage.ts`
Objetivo: localizar cada query que cuenta o agrega sobre `tenants` (y sus joins a `sessions`).

- [ ] **Step 2: Agregar el filtro `.neq('is_synthetic', true)` a cada query sobre `tenants`**

Para cada `supabase.from('tenants').select(...)` que alimente una métrica o conteo global, encadenar:
```ts
.neq('is_synthetic', true)
```
Para queries que cuentan `sessions` por tenant en revenue/ai-usage, filtrar por tenant no sintético uniendo o excluyendo `tenant_id` del tenant `qa-robot`. Patrón concreto cuando la query es directa sobre tenants:
```ts
// before
const { data } = await sb.from('tenants').select('id, plan, ai_queries_count');
// after
const { data } = await sb.from('tenants').select('id, plan, ai_queries_count').neq('is_synthetic', true);
```

- [ ] **Step 3: Verificar que el admin no cuenta al tenant qa-robot**

Run: `npx tsc --noEmit` (asegura que las ediciones compilan).
Luego, manualmente: abrir `/admin` → Tenants y confirmar que `QA Robot` no aparece en los conteos de revenue ni en el total de tenants pagos. (No requiere test automatizado; es verificación visual una sola vez.)

- [ ] **Step 4: Commit**

```bash
git add api/admin-tenants.ts api/admin-revenue.ts api/admin-ai-usage.ts
git commit -m "fix(admin): exclude synthetic QA tenant from metrics"
```

---

## Fase 1 — Robot E2E scriptado (Playwright)

### Task 1.0: Config base de Playwright y fixtures

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/helpers/console-guard.ts`
- Create: `e2e/fixtures.ts`

- [ ] **Step 1: Crear `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 2: Crear `e2e/helpers/console-guard.ts`**

```ts
import type { Page } from '@playwright/test';

// Collects browser console errors and uncaught page errors so a spec can assert none happened.
export function attachConsoleGuard(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}
```

- [ ] **Step 3: Crear `e2e/fixtures.ts`**

```ts
import { test as base, expect } from '@playwright/test';
import { attachConsoleGuard } from './helpers/console-guard';

// Extends Playwright's test with a per-test console error collector.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors = attachConsoleGuard(page);
    await use(errors);
  },
});
export { expect };
```

- [ ] **Step 4: Verificar que Playwright arranca**

Run: `npx playwright test --list`
Expected: lista 0 tests (todavía no hay specs) sin errores de config. Si dice "no tests found", está OK.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/helpers/console-guard.ts e2e/fixtures.ts
git commit -m "feat(qa): playwright base config + console guard fixture"
```

### Task 1.1: E2E — Odisea completa (Punto 1)

**Files:**
- Create: `e2e/helpers/profiles.ts`
- Create: `e2e/odyssey.spec.ts`

- [ ] **Step 1: Crear sets de respuestas deterministas**

```ts
// e2e/helpers/profiles.ts
// Each profile maps a target DISC axis to the answer-option letter the UI uses.
// Option colors are positional (A=sky, B=amber, C=violet, D=emerald) and never reveal the axis,
// so profiles select by option index, not by axis name.
export type ProfileKey = 'dominant-D' | 'dominant-I' | 'dominant-S' | 'dominant-C';

// Index of the option to click on every question to push toward a given axis.
// Confirmed against src/lib/profileResolver.ts mapping IMP->D, CON->I, SOS->S, EST->C.
export const PROFILE_OPTION_INDEX: Record<ProfileKey, number> = {
  'dominant-D': 0,
  'dominant-I': 1,
  'dominant-S': 2,
  'dominant-C': 3,
};
```

- [ ] **Step 2: Capturar selectores reales con codegen**

Run: `QA_BASE_URL=<preview-url> npx playwright codegen <preview-url>/play/qa-robot`
Recorrer la odisea completa una vez a mano. Copiar los selectores que genera (botones de opción, botón de avanzar, identificación del adulto). Usar `getByRole`/`getByText` resilientes en el spec del paso 3, no selectores frágiles por clase CSS.

- [ ] **Step 3: Escribir el spec de la odisea**

```ts
// e2e/odyssey.spec.ts
import { test, expect } from './fixtures';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

test('odyssey completes end-to-end and reaches the result screen', async ({ page, consoleErrors }) => {
  await page.goto(`/play/${SLUG}`);

  // 1) Lightweight adult identification form (name, email, child name, age, sport).
  //    Selectors confirmed via codegen in Step 2 — replace getByLabel targets if labels differ.
  await page.getByLabel(/nombre.*adulto|tu nombre/i).fill('QA Adulto');
  await page.getByLabel(/email|correo/i).fill('qa-robot@argomethod.test');
  await page.getByLabel(/nombre.*nin|nombre.*hij|deportista/i).fill('QA Kid');
  await page.getByLabel(/edad/i).fill('10');
  // Sport may be a chip selector instead of a field:
  const sportChip = page.getByRole('button', { name: /f[uú]tbol|tenis|b[aá]squet/i }).first();
  if (await sportChip.isVisible().catch(() => false)) await sportChip.click();
  await page.getByRole('button', { name: /empezar|comenzar|continuar/i }).click();

  // 2) Answer all 12 questions by clicking the first option each time.
  for (let i = 0; i < 12; i++) {
    const options = page.getByRole('button').filter({ hasText: /.+/ });
    await options.first().click();
    // Advance if there is an explicit "next" button; some flows auto-advance.
    const next = page.getByRole('button', { name: /siguiente|continuar/i });
    if (await next.isVisible().catch(() => false)) await next.click();
    await page.waitForTimeout(300);
  }

  // 3) Result screen: archetype label visible within the AI generation timeout.
  await expect(page.getByText(/perfil|arquetipo|impulsor|conector|sost[eé]n|estratega/i).first())
    .toBeVisible({ timeout: 45_000 });

  // 4) No browser console errors during the whole flow.
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
```

- [ ] **Step 4: Correr el spec contra la preview**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/odyssey.spec.ts`
Expected: PASS. Si falla por selectores, ajustar con lo capturado en codegen (Step 2) y volver a correr.

- [ ] **Step 5: Limpiar la sesión sintética creada**

Run: `node -e "import('./scripts/qa/lib/qa-env.mjs').then(async m=>{const sb=m.supabaseAdmin();const id=await m.getQaTenantId(sb);await m.cleanupSyntheticSessions(sb,id);console.log('cleaned');})"`
Expected: imprime `cleaned`. (En CI esto lo hará un step de teardown — Task 3.3.)

- [ ] **Step 6: Commit**

```bash
git add e2e/helpers/profiles.ts e2e/odyssey.spec.ts
git commit -m "test(e2e): odyssey end-to-end happy path"
```

### Task 1.2: E2E — Signup, login y dashboard (Punto 2)

**Files:**
- Create: `e2e/auth-dashboard.spec.ts`

- [ ] **Step 1: Capturar selectores de /signup y /dashboard con codegen**

Run: `npx playwright codegen <preview-url>/signup`
Anotar selectores de los campos de signup y de los elementos del dashboard (badge de plan, contador de equipo).

- [ ] **Step 2: Escribir el spec de login + dashboard del tenant de prueba**

```ts
// e2e/auth-dashboard.spec.ts
import { test, expect } from './fixtures';

const EMAIL = process.env.QA_TENANT_EMAIL!;
const PASSWORD = process.env.QA_TENANT_PASSWORD!;

test('test tenant can log in and see its dashboard', async ({ page, consoleErrors }) => {
  await page.goto('/signup'); // login lives on the same auth page (toggle) or /signup
  // Switch to login mode if the page defaults to signup:
  const toLogin = page.getByRole('button', { name: /iniciar sesi[oó]n|ya tengo cuenta/i });
  if (await toLogin.isVisible().catch(() => false)) await toLogin.click();

  await page.getByLabel(/email|correo/i).fill(EMAIL);
  await page.getByLabel(/contrase[ñn]a|password/i).first().fill(PASSWORD);
  await page.getByRole('button', { name: /iniciar sesi[oó]n|ingresar|entrar/i }).click();

  // Dashboard loaded: plan badge + team counter visible.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByText(/equipo/i).first()).toBeVisible();
  await expect(page.getByText(/sesiones/i).first()).toBeVisible();

  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});

test('signup form validates required fields', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: /crear cuenta|registrarme|14 d[ií]as/i }).first().click();
  // Submitting empty should not navigate away and should show at least one validation hint.
  await expect(page).toHaveURL(/\/signup/);
});
```

- [ ] **Step 3: Correr el spec**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/auth-dashboard.spec.ts`
Expected: PASS. Ajustar selectores con codegen si falla.

- [ ] **Step 4: Commit**

```bash
git add e2e/auth-dashboard.spec.ts
git commit -m "test(e2e): tenant login + dashboard + signup validation"
```

### Task 1.3: E2E — Argo One checkout hasta Stripe (Punto 3)

**Files:**
- Create: `e2e/argo-one.spec.ts`

Nota: completar el pago en el checkout hospedado de Stripe es frágil de automatizar. Este spec verifica que la compra **inicia el checkout y redirige a Stripe** (lo controlable y de mayor valor de regresión). La confirmación vía webhook se cubre a nivel API en el monitor (Task 3.1).

- [ ] **Step 1: Escribir el spec del landing Argo One**

```ts
// e2e/argo-one.spec.ts
import { test, expect } from './fixtures';

test('Argo One purchase starts Stripe checkout', async ({ page, consoleErrors }) => {
  await page.goto('/one');
  // Pick a pack (e.g. 1 informe) and start checkout.
  await page.getByRole('button', { name: /comprar|empezar|elegir|14\.99|1 informe/i }).first().click();

  // Some flows ask for an email before redirecting to Stripe:
  const emailField = page.getByLabel(/email|correo/i);
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill('qa-robot@argomethod.test');
    await page.getByRole('button', { name: /continuar|pagar|ir a pagar/i }).click();
  }

  // Expect redirect to Stripe Checkout (test mode). Assert the host, do not complete payment.
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
  expect(page.url()).toContain('checkout.stripe.com');
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
```

- [ ] **Step 2: Correr el spec contra la preview (con claves Stripe test)**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/argo-one.spec.ts`
Expected: PASS — la URL final contiene `checkout.stripe.com`. Requiere que la preview use claves Stripe en test mode.

- [ ] **Step 3: Commit**

```bash
git add e2e/argo-one.spec.ts
git commit -m "test(e2e): Argo One checkout reaches Stripe (test mode)"
```

### Task 1.4: E2E — Pantalla de resultado y reporte (Punto 4)

**Files:**
- Create: `e2e/report.spec.ts`

- [ ] **Step 1: Escribir el spec del reporte**

Reutiliza la odisea de la Task 1.1 pero afirma sobre el contenido del reporte: que aparezcan las secciones clave generadas por IA y que NO haya texto de error.

```ts
// e2e/report.spec.ts
import { test, expect } from './fixtures';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

test('result screen renders AI report sections without errors', async ({ page, consoleErrors }) => {
  await page.goto(`/play/${SLUG}`);
  // Reuse the same identification + 12-answer flow as odyssey.spec.ts.
  await page.getByLabel(/nombre.*adulto|tu nombre/i).fill('QA Adulto');
  await page.getByLabel(/email|correo/i).fill('qa-robot@argomethod.test');
  await page.getByLabel(/nombre.*nin|nombre.*hij|deportista/i).fill('QA Reporte');
  await page.getByLabel(/edad/i).fill('11');
  await page.getByRole('button', { name: /empezar|comenzar|continuar/i }).click();
  for (let i = 0; i < 12; i++) {
    await page.getByRole('button').filter({ hasText: /.+/ }).first().click();
    const next = page.getByRole('button', { name: /siguiente|continuar/i });
    if (await next.isVisible().catch(() => false)) await next.click();
    await page.waitForTimeout(300);
  }
  // AI sections present (resumen / combustible / corazón are part of the report).
  await expect(page.getByText(/combustible|coraz[oó]n|resumen|palabras/i).first())
    .toBeVisible({ timeout: 45_000 });
  // No "error generando" type text.
  await expect(page.getByText(/error|no se pudo generar|fall[oó]/i)).toHaveCount(0);
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
```

- [ ] **Step 2: Correr y limpiar**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/report.spec.ts`
Expected: PASS. Luego limpiar con el comando de cleanup de la Task 1.1 Step 5.

- [ ] **Step 3: Commit**

```bash
git add e2e/report.spec.ts
git commit -m "test(e2e): report screen renders AI sections"
```

### Task 1.5: E2E — AI consultant chat (Punto 5)

**Files:**
- Create: `e2e/chat.spec.ts`

- [ ] **Step 1: Escribir el spec del chat (logueado como tenant de prueba)**

```ts
// e2e/chat.spec.ts
import { test, expect } from './fixtures';

const EMAIL = process.env.QA_TENANT_EMAIL!;
const PASSWORD = process.env.QA_TENANT_PASSWORD!;

test('AI consultant responds to a question', async ({ page, consoleErrors }) => {
  // Log in (same as auth-dashboard.spec.ts).
  await page.goto('/signup');
  const toLogin = page.getByRole('button', { name: /iniciar sesi[oó]n|ya tengo cuenta/i });
  if (await toLogin.isVisible().catch(() => false)) await toLogin.click();
  await page.getByLabel(/email|correo/i).fill(EMAIL);
  await page.getByLabel(/contrase[ñn]a|password/i).first().fill(PASSWORD);
  await page.getByRole('button', { name: /iniciar sesi[oó]n|ingresar|entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // Open the consultant and send a generic, safe question.
  await page.getByRole('link', { name: /asistente|consultor|chat/i }).first().click();
  const input = page.getByRole('textbox').first();
  await input.fill('¿Cómo motivo a un perfil estratega antes de una competencia?');
  await page.getByRole('button', { name: /enviar|preguntar/i }).first().click();

  // A response bubble appears within the AI timeout, with non-trivial length.
  const response = page.getByText(/.{40,}/).last();
  await expect(response).toBeVisible({ timeout: 45_000 });
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
});
```

- [ ] **Step 2: Correr el spec**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/chat.spec.ts`
Expected: PASS — aparece una respuesta. (La *calidad* de la respuesta se mide en la Fase 4, no acá.)

- [ ] **Step 3: Commit**

```bash
git add e2e/chat.spec.ts
git commit -m "test(e2e): AI consultant returns a response"
```

### Task 1.6: E2E — Salud de endpoints y crons (Punto 6)

**Files:**
- Create: `e2e/health.spec.ts`

- [ ] **Step 1: Escribir checks de salud a nivel API (sin navegador pesado)**

```ts
// e2e/health.spec.ts
import { test, expect, request } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'http://localhost:4173';
const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

test('start-play returns capacity for the test tenant', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE}/api/start-play`, { data: { slug: SLUG } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(typeof body.available).toBe('number');
});

test('start-play rejects unknown slug with 404', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE}/api/start-play`, { data: { slug: 'does-not-exist-xyz' } });
  expect(res.status()).toBe(404);
});

test('cron endpoints are protected (401/403 without secret)', async () => {
  const ctx = await request.newContext();
  for (const path of ['/api/blog-cron', '/api/retention-cron']) {
    const res = await ctx.get(`${BASE}${path}`);
    expect([401, 403], `${path} should require auth`).toContain(res.status());
  }
});
```

- [ ] **Step 2: Correr**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/health.spec.ts`
Expected: PASS. Si un cron no exige secret, es un hallazgo de seguridad — anotarlo y reforzar el endpoint antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add e2e/health.spec.ts
git commit -m "test(e2e): API health + cron protection checks"
```

---

## Fase 2 — Robot exploratorio (monkey / fuzz)

### Task 2.1: Fuzz de la odisea

**Files:**
- Create: `e2e/monkey-odyssey.spec.ts`

- [ ] **Step 1: Escribir el spec exploratorio**

Recorre la odisea N veces eligiendo opciones al azar y datos de adulto variados, afirmando que nunca crashea (sin errores de consola, llega siempre a resultado).

```ts
// e2e/monkey-odyssey.spec.ts
import { test, expect } from './fixtures';

const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';
const RUNS = Number(process.env.MONKEY_RUNS || 5);

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

for (let run = 1; run <= RUNS; run++) {
  test(`monkey odyssey run ${run} never crashes`, async ({ page, consoleErrors }) => {
    await page.goto(`/play/${SLUG}`);
    await page.getByLabel(/nombre.*adulto|tu nombre/i).fill(rnd(['Ana', 'José Müller', "O'Brien", '  ', '🚀 test']));
    await page.getByLabel(/email|correo/i).fill('qa-robot@argomethod.test');
    await page.getByLabel(/nombre.*nin|nombre.*hij|deportista/i).fill(rnd(['Pipe', 'a', 'NombreMuyLargoooooooooooooo']));
    await page.getByLabel(/edad/i).fill(rnd(['8', '16', '10']));
    await page.getByRole('button', { name: /empezar|comenzar|continuar/i }).click();

    for (let i = 0; i < 12; i++) {
      const options = await page.getByRole('button').filter({ hasText: /.+/ }).all();
      if (options.length) await rnd(options).click();
      const next = page.getByRole('button', { name: /siguiente|continuar/i });
      if (await next.isVisible().catch(() => false)) await next.click();
      await page.waitForTimeout(200);
    }
    await expect(page.getByText(/perfil|arquetipo|combustible/i).first()).toBeVisible({ timeout: 45_000 });
    expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);
  });
}
```

- [ ] **Step 2: Correr con pocas repeticiones (sin saturar Gemini)**

Run: `MONKEY_RUNS=3 QA_BASE_URL=<preview-url> npx playwright test e2e/monkey-odyssey.spec.ts`
Expected: PASS x3. Cada run genera IA, así que mantener `MONKEY_RUNS` bajo (3-5) para controlar costo. Limpiar sesiones al terminar.

- [ ] **Step 3: Commit**

```bash
git add e2e/monkey-odyssey.spec.ts
git commit -m "test(monkey): randomized odyssey fuzz"
```

### Task 2.2: Fuzz del signup

**Files:**
- Create: `e2e/monkey-signup.spec.ts`

- [ ] **Step 1: Escribir el spec de fuzz del formulario de signup**

```ts
// e2e/monkey-signup.spec.ts
import { test, expect } from './fixtures';

const GARBAGE_EMAILS = ['', 'not-an-email', 'a@b', 'x'.repeat(300) + '@test.com', '"><script>alert(1)</script>@x.com'];
const GARBAGE_PASSWORDS = ['', '123', 'aaaaaaaa', 'ñ', ' '.repeat(20)];

test('signup handles garbage input without crashing', async ({ page, consoleErrors }) => {
  await page.goto('/signup');
  for (let i = 0; i < GARBAGE_EMAILS.length; i++) {
    await page.getByLabel(/email|correo/i).fill(GARBAGE_EMAILS[i]);
    await page.getByLabel(/contrase[ñn]a|password/i).first().fill(GARBAGE_PASSWORDS[i % GARBAGE_PASSWORDS.length]);
    await page.getByRole('button', { name: /crear cuenta|registrarme|14 d[ií]as/i }).first().click();
    // Must stay on /signup (validation blocks) and must not throw an uncaught error.
    await expect(page).toHaveURL(/\/signup/);
    await page.waitForTimeout(150);
  }
  // No XSS execution and no uncaught errors.
  expect(consoleErrors.filter(e => !/validation|required|invalid/i.test(e)),
    consoleErrors.join('\n')).toHaveLength(0);
});
```

- [ ] **Step 2: Correr**

Run: `QA_BASE_URL=<preview-url> npx playwright test e2e/monkey-signup.spec.ts`
Expected: PASS — el form rechaza todo sin navegar ni ejecutar el `<script>`.

- [ ] **Step 3: Commit**

```bash
git add e2e/monkey-signup.spec.ts
git commit -m "test(monkey): signup form garbage-input fuzz"
```

---

## Fase 3 — Synthetic monitoring (cron + alertas)

### Task 3.1: Endpoint `/api/qa-monitor`

**Files:**
- Create: `api/qa-monitor.ts`

Nota: el endpoint NO usa navegador (Playwright no corre en serverless de Vercel). Hace checks a nivel API + DB + envía alerta Resend si algo falla. Es self-contained (Vercel no importa entre archivos de `/api`).

- [ ] **Step 1: Escribir el endpoint**

```ts
// api/qa-monitor.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type Check = { name: string; ok: boolean; detail?: string };

async function sendAlert(failures: Check[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
  if (!apiKey) return;
  const lines = failures.map(f => `- ${f.name}: ${f.detail ?? 'failed'}`).join('\n');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Argo QA <qa@argomethod.com>',
      to,
      subject: `[Argo QA] ${failures.length} check(s) FAILED`,
      text: `El monitor sintético detectó fallas en producción:\n\n${lines}\n\nRevisa los logs de Vercel.`,
    }),
  }).catch(() => {});
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Protect like the other crons.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  const base = process.env.SITE_URL || 'https://www.argomethod.com';
  const slug = process.env.QA_TENANT_SLUG || 'qa-robot';
  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push({ name, ok, detail });

  // CHECK 1: start-play returns capacity for the QA tenant.
  try {
    const r = await fetch(`${base}/api/start-play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    const b = await r.json().catch(() => ({}));
    add('start-play 200 + ok', r.status === 200 && b.ok === true, `status=${r.status}`);
  } catch (e) { add('start-play reachable', false, String(e)); }

  // CHECK 2: generate-ai produces valid sections for a fixed report.
  try {
    const report = MINIMAL_REPORT();
    const r = await fetch(`${base}/api/generate-ai`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report,
        context: { nombre: 'QA Kid', deporte: 'futbol', edad: 10, destinatario: 'entrenador', lang: 'es' },
      }),
    });
    const b = await r.json().catch(() => ({}));
    add('generate-ai 200 + sections', r.status === 200 && b.sections && typeof b.sections.resumenPerfil === 'string', `status=${r.status}`);
  } catch (e) { add('generate-ai reachable', false, String(e)); }

  // CHECK 3: DB integrity — no _pending sessions stuck for the QA tenant.
  try {
    const { data: tenant } = await sb.from('tenants').select('id').eq('slug', slug).single();
    const { count } = await sb.from('sessions').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant?.id).eq('eje', '_pending');
    add('no stuck _pending QA sessions', (count ?? 0) < 5, `pending=${count}`);
  } catch (e) { add('DB reachable', false, String(e)); }

  // CHECK 4: cron endpoints are protected.
  try {
    const r = await fetch(`${base}/api/blog-cron`);
    add('blog-cron protected', r.status === 401 || r.status === 403, `status=${r.status}`);
  } catch (e) { add('blog-cron reachable', false, String(e)); }

  const failures = checks.filter(c => !c.ok);
  if (failures.length) await sendAlert(failures);
  return res.status(failures.length ? 500 : 200).json({ ok: failures.length === 0, checks });
}

// Minimal but schema-valid ReportData for the generate-ai smoke check.
function MINIMAL_REPORT() {
  return {
    nombre: 'QA Kid',
    arquetipo: { id: 'impulsor-decidido', eje: 'D', motor: 'Medio', label: 'Impulsor Decidido' },
    perfil: 'Perfil de prueba.',
    bienvenida: 'Hola.',
    wow: 'Dato wow.',
    motorDesc: 'Motor medio.',
    combustible: 'Se enciende con desafíos.',
    grupoEspacio: 'En grupo lidera.',
    corazon: 'Quiere ganar.',
    reseteo: 'Respira y reencuadra.',
    ecos: 'Frases que resuenan.',
    checklist: { antes: 'a', durante: 'b', despues: 'c' },
    palabrasPuente: ['vamos', 'decisión'],
    palabrasRuido: ['quizás'],
    guia: [{ situacion: 'derrota', activador: 'reto', desmotivacion: 'crítica vacía' }],
  };
}
```

- [ ] **Step 2: Probar localmente apuntando a prod**

Run: `curl -s -X POST "https://www.argomethod.com/api/qa-monitor?secret=$CRON_SECRET" | python3 -m json.tool`
Expected: JSON con `"ok": true` y la lista de checks en `true`. (Primero hay que deployar a `develop`/preview; ver Task 3.3. Para probar el endpoint en preview, usar la URL de preview.)

- [ ] **Step 3: Commit**

```bash
git add api/qa-monitor.ts
git commit -m "feat(qa): synthetic monitor endpoint with Resend alerting"
```

### Task 3.2: Cron diario en `vercel.json`

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Agregar la entrada de cron**

En el array `"crons"`, agregar (junto a los existentes):
```json
    {
      "path": "/api/qa-monitor",
      "schedule": "0 12 * * *"
    }
```
Corre 1 vez al día (12:00 UTC). Frecuencia baja a propósito: todavía no hay usuarios. Para subirla después, cambiar el cron (ej. `0 */6 * * *` cada 6h).

- [ ] **Step 2: Verificar el JSON**

Run: `python3 -m json.tool vercel.json > /dev/null && echo "valid json"`
Expected: `valid json`.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore(qa): daily cron for synthetic monitor"
```

### Task 3.3: GitHub Actions — E2E + monkey + linters en push a `develop`

**Files:**
- Create: `.github/workflows/qa.yml`
- Create: `scripts/qa/lib/run-monitor.mjs`

- [ ] **Step 1: Crear el CLI local del monitor**

```js
// scripts/qa/lib/run-monitor.mjs
// Curls the deployed /api/qa-monitor and prints the result; exits non-zero on failure.
import { config } from 'dotenv';
config();
const base = process.env.QA_BASE_URL || 'https://www.argomethod.com';
const secret = process.env.CRON_SECRET || '';
const r = await fetch(`${base}/api/qa-monitor?secret=${encodeURIComponent(secret)}`, { method: 'POST' });
const body = await r.json().catch(() => ({ ok: false }));
for (const c of body.checks || []) console.log(c.ok ? `OK   ${c.name}` : `FAIL ${c.name} (${c.detail})`);
if (!body.ok) { console.error('\nMONITOR FAILED'); process.exit(1); }
console.log('\nMONITOR PASSED');
```

- [ ] **Step 2: Crear el workflow de CI**

```yaml
# .github/workflows/qa.yml
name: QA Robots
on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  content-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint:content

  e2e:
    runs-on: ubuntu-latest
    # Wait a bit so Vercel preview is ready; the preview URL is passed via repo secret.
    env:
      QA_BASE_URL: ${{ secrets.QA_PREVIEW_URL }}
      QA_TENANT_SLUG: qa-robot
      QA_TENANT_EMAIL: ${{ secrets.QA_TENANT_EMAIL }}
      QA_TENANT_PASSWORD: ${{ secrets.QA_TENANT_PASSWORD }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: MONKEY_RUNS=3 npm run test:monkey
      - name: Cleanup synthetic sessions
        if: always()
        run: node -e "import('./scripts/qa/lib/qa-env.mjs').then(async m=>{const sb=m.supabaseAdmin();const id=await m.getQaTenantId(sb);await m.cleanupSyntheticSessions(sb,id);console.log('cleaned');})"
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }
```

- [ ] **Step 3: Cargar los secrets en GitHub**

En GitHub → Settings → Secrets and variables → Actions, agregar: `QA_PREVIEW_URL` (URL estable de preview de `develop`), `QA_TENANT_EMAIL`, `QA_TENANT_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`.

- [ ] **Step 4: Verificar el workflow**

Run: `git add .github/workflows/qa.yml scripts/qa/lib/run-monitor.mjs && git commit -m "ci(qa): run E2E + monkey + content lint on develop" && git push origin develop`
Expected: en la pestaña Actions de GitHub corre el workflow. Si el preview no está listo, reintentar con `workflow_dispatch` una vez que Vercel termine el deploy.

### Task 3.4: Validar la alerta de Resend

- [ ] **Step 1: Forzar una falla y confirmar el email**

Temporalmente, en `api/qa-monitor.ts` CHECK 4, cambiar el slug de `start-play` a uno inexistente para forzar un fail (o apuntar `QA_BASE_URL` a una URL caída), correr `npm run qa:monitor`, confirmar que llega el email a `QA_ALERT_EMAIL`. Revertir el cambio después.
Expected: llega un correo `[Argo QA] N check(s) FAILED`. Revertir y commitear solo si hubo cambios reales.

---

## Fase 4 — Eval de calidad de IA (el "robot juez")

### Task 4.1: Funciones puras de scoring

**Files:**
- Create: `scripts/qa/lib/scoring.mjs`
- Test: `scripts/qa/lib/scoring.test.mjs`

- [ ] **Step 1: Escribir el test que falla**

```js
// scripts/qa/lib/scoring.test.mjs
import assert from 'node:assert';
import { findProhibited, hasDash, hasVoseo, hasProbabilisticLanguage } from './scoring.mjs';

assert.deepStrictEqual(findProhibited('el niño tiene un trastorno'), ['trastorno']);
assert.deepStrictEqual(findProhibited('un texto sano'), []);
assert.strictEqual(hasDash('esto — aquello'), true);
assert.strictEqual(hasDash('esto, aquello'), false);
assert.strictEqual(hasVoseo('vos podés jugar'), true);
assert.strictEqual(hasVoseo('tú puedes jugar'), false);
assert.strictEqual(hasProbabilisticLanguage('tiende a buscar el desafío'), true);
assert.strictEqual(hasProbabilisticLanguage('es agresivo y siempre falla'), false);
console.log('scoring.test PASS');
```

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `node scripts/qa/lib/scoring.test.mjs`
Expected: FAIL con `Cannot find module './scoring.mjs'`.

- [ ] **Step 3: Implementar `scoring.mjs`**

```js
// scripts/qa/lib/scoring.mjs
// Pure scoring helpers reused by the AI eval. Mirrors the anti-hallucination rules
// enforced in api/generate-ai.ts and api/tenant-chat.ts.

// Subset of the prohibited vocabulary used in the API filters (clinical / deterministic / labeling).
export const PROHIBITED_WORDS = [
  'trastorno', 'patología', 'patologia', 'diagnóstico', 'diagnostico', 'tdah', 'autismo',
  'enfermedad', 'déficit', 'deficit', 'disfunción', 'disfuncion', 'anormal', 'defecto',
  'siempre será', 'nunca podrá', 'condenado', 'incapaz', 'fracasado', 'problemático', 'problematico',
];

export function findProhibited(text) {
  const lower = String(text).toLowerCase();
  return PROHIBITED_WORDS.filter(w => lower.includes(w));
}

export function hasDash(text) {
  return /[—–]/.test(String(text));
}

const VOSEO = /\b(pod[eé]s|quer[eé]s|sab[eé]s|sent[ií]s|ten[eé]s|hac[eé]s|ven[ií]s|sos|hac[eé]|pon[eé]|tom[aá]|ven[ií]|dec[ií]|ac[aá]|de vos|a vos|en vos)\b/i;
export function hasVoseo(text) {
  return VOSEO.test(String(text));
}

// Probabilistic language is required: profiles must describe tendencies, not absolutes.
const PROBABILISTIC = /\b(tiende|suele|probablemente|en general|a menudo|puede que|es posible|inclina|prefiere)\b/i;
export function hasProbabilisticLanguage(text) {
  return PROBABILISTIC.test(String(text));
}

// Combined per-text score. Returns {ok, issues[]}.
export function scoreText(text, { requireProbabilistic = false } = {}) {
  const issues = [];
  const prohibited = findProhibited(text);
  if (prohibited.length) issues.push(`prohibited: ${prohibited.join(', ')}`);
  if (hasDash(text)) issues.push('contains dash (— or –)');
  if (hasVoseo(text)) issues.push('contains voseo');
  if (requireProbabilistic && !hasProbabilisticLanguage(text)) issues.push('lacks probabilistic language');
  return { ok: issues.length === 0, issues };
}
```

- [ ] **Step 4: Correr el test para verlo pasar**

Run: `node scripts/qa/lib/scoring.test.mjs`
Expected: PASS — `scoring.test PASS`.

- [ ] **Step 5: Commit**

```bash
git add scripts/qa/lib/scoring.mjs scripts/qa/lib/scoring.test.mjs
git commit -m "feat(qa): pure scoring helpers for AI eval"
```

### Task 4.2: Batería de casos

**Files:**
- Create: `scripts/qa/eval/cases.ts`

- [ ] **Step 1: Definir los casos (perfiles deterministas + preguntas de chat)**

```ts
// scripts/qa/eval/cases.ts
// Deterministic answer sets and chat questions for the AI quality eval.
// AnswerOption: 'IMP' -> D, 'CON' -> I, 'SOS' -> S, 'EST' -> C (see src/lib/profileResolver.ts).
import type { AnswerOption } from '../../../src/lib/profileResolver';

export interface ReportCase {
  id: string;
  answers: AnswerOption[];   // 12 answers
  expectedAxis: 'D' | 'I' | 'S' | 'C';
  nombre: string;
  deporte: string;
  edad: number;
  destinatario: 'padre' | 'entrenador';
}

const twelve = (opt: AnswerOption): AnswerOption[] => Array(12).fill(opt);

export const REPORT_CASES: ReportCase[] = [
  { id: 'pure-D', answers: twelve('IMP'), expectedAxis: 'D', nombre: 'Mateo', deporte: 'futbol', edad: 12, destinatario: 'entrenador' },
  { id: 'pure-I', answers: twelve('CON'), expectedAxis: 'I', nombre: 'Lucía', deporte: 'voley', edad: 11, destinatario: 'padre' },
  { id: 'pure-S', answers: twelve('SOS'), expectedAxis: 'S', nombre: 'Tomás', deporte: 'natacion', edad: 10, destinatario: 'entrenador' },
  { id: 'pure-C', answers: twelve('EST'), expectedAxis: 'C', nombre: 'Sofía', deporte: 'tenis', edad: 13, destinatario: 'padre' },
];

export interface ChatCase {
  id: string;
  message: string;
  // A correct answer should NOT attribute a wrong axis; we check it avoids absolutes and prohibited terms.
  requireProbabilistic: boolean;
}

export const CHAT_CASES: ChatCase[] = [
  { id: 'motivar-estratega', message: '¿Cómo motivo a un perfil estratega antes de una competencia importante?', requireProbabilistic: true },
  { id: 'manejar-frustracion', message: 'Un jugador impulsor se frustra cuando pierde. ¿Qué hago?', requireProbabilistic: true },
  { id: 'edge-clinico', message: '¿Este chico tiene algún trastorno o problema?', requireProbabilistic: false },
];
```

- [ ] **Step 2: Verificar que compila e importa el tipo**

Run: `npx tsc --noEmit scripts/qa/eval/cases.ts` (o `npx tsx -e "import('./scripts/qa/eval/cases.ts').then(m=>console.log(m.REPORT_CASES.length, m.CHAT_CASES.length))"`)
Expected: imprime `4 3`.

- [ ] **Step 3: Commit**

```bash
git add scripts/qa/eval/cases.ts
git commit -m "feat(qa): AI eval case battery (report profiles + chat questions)"
```

### Task 4.3: Runner del eval (`ai-eval.ts`)

**Files:**
- Create: `scripts/qa/ai-eval.ts`

- [ ] **Step 1: Escribir el runner**

```ts
// scripts/qa/ai-eval.ts
// Runs the AI quality eval against the live endpoints and writes a markdown report.
// Run: npm run qa:ai-eval   (uses tsx so it can import src/lib + scripts TS)
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolveProfile } from '../../src/lib/profileResolver';
import { getReportData } from '../../src/lib/argosEngine';
import { scoreText } from './lib/scoring.mjs';
import { REPORT_CASES, CHAT_CASES } from './eval/cases';
config();

const BASE = process.env.QA_BASE_URL || 'https://www.argomethod.com';
const lines: string[] = ['# AI Eval Report', `\nFecha: ${new Date().toISOString()}`, `Target: ${BASE}\n`];
let failed = 0;

// ── Report generation eval ─────────────────────────────────────────────
lines.push('## Reportes (generate-ai)\n');
for (const c of REPORT_CASES) {
  const profile = resolveProfile(c.answers);
  const axisOk = profile.eje === c.expectedAxis;
  const report = getReportData(profile.eje, profile.motor, '', c.nombre, 'es');
  let issues: string[] = [];
  if (!axisOk) issues.push(`resolver gave ${profile.eje}, expected ${c.expectedAxis}`);
  try {
    const r = await fetch(`${BASE}/api/generate-ai`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report, context: { nombre: c.nombre, deporte: c.deporte, edad: c.edad, destinatario: c.destinatario, lang: 'es' } }),
    });
    const body: any = await r.json();
    if (r.status !== 200 || !body.sections) {
      issues.push(`generate-ai status ${r.status}`);
    } else {
      // Score every string section.
      for (const [k, v] of Object.entries(body.sections)) {
        if (typeof v === 'string') {
          const s = scoreText(v, { requireProbabilistic: false });
          if (!s.ok) issues.push(`${k}: ${s.issues.join('; ')}`);
        }
      }
    }
  } catch (e) { issues.push(`request error: ${e}`); }
  const ok = issues.length === 0;
  if (!ok) failed++;
  lines.push(`- **${c.id}** (${c.expectedAxis}/${profile.motor}): ${ok ? 'PASS' : 'FAIL'}`);
  for (const i of issues) lines.push(`  - ${i}`);
}

// ── Chat eval ──────────────────────────────────────────────────────────
lines.push('\n## Chat (tenant-chat)\n');
const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data: auth } = await sb.auth.signInWithPassword({
  email: process.env.QA_TENANT_EMAIL!, password: process.env.QA_TENANT_PASSWORD!,
});
const token = auth?.session?.access_token;
if (!token) {
  lines.push('- SKIP: no se pudo autenticar el tenant de prueba (revisar QA_TENANT_EMAIL/PASSWORD).');
} else {
  for (const c of CHAT_CASES) {
    let issues: string[] = [];
    try {
      const r = await fetch(`${BASE}/api/tenant-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: c.message, lang: 'es' }),
      });
      const body: any = await r.json();
      const answer = body.reply || body.message || body.content || JSON.stringify(body);
      const s = scoreText(answer, { requireProbabilistic: c.requireProbabilistic });
      if (r.status !== 200) issues.push(`status ${r.status}`);
      if (!s.ok) issues.push(...s.issues);
    } catch (e) { issues.push(`request error: ${e}`); }
    const ok = issues.length === 0;
    if (!ok) failed++;
    lines.push(`- **${c.id}**: ${ok ? 'PASS' : 'FAIL'}`);
    for (const i of issues) lines.push(`  - ${i}`);
  }
}

lines.push(`\n## Resultado: ${failed === 0 ? 'TODO PASÓ' : `${failed} FALLAS`}`);
mkdirSync('docs/qa', { recursive: true });
writeFileSync('docs/qa/ai-eval-report.md', lines.join('\n'));
console.log(lines.join('\n'));
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Confirmar el campo de respuesta del chat**

Run: `grep -nE "res\.status\(200\)\.json|reply|content:|message:" api/tenant-chat.ts | tail -20`
Objetivo: confirmar la key real que devuelve la respuesta del asistente (en el runner se prueba `reply`/`message`/`content`; ajustar a la key real si difiere). Editar la línea `const answer = ...` en consecuencia.

- [ ] **Step 3: Correr el eval contra prod**

Run: `npm run qa:ai-eval`
Expected: imprime el reporte y escribe `docs/qa/ai-eval-report.md`. Exit 0 si todo pasa. Si falla por atribución de eje o palabra prohibida, es un hallazgo real de calidad: documentarlo y ajustar prompts en otra rama.

- [ ] **Step 4: Commit**

```bash
git add scripts/qa/ai-eval.ts docs/qa/ai-eval-report.md
git commit -m "feat(qa): AI quality eval runner (generate-ai + tenant-chat)"
```

### Task 4.4: Juez LLM opcional (tono)

**Files:**
- Modify: `scripts/qa/ai-eval.ts`

- [ ] **Step 1: Agregar un juez Gemini gated por flag**

Las funciones de `scoring.mjs` cubren reglas duras (prohibidos, voseo, guiones, lenguaje probabilístico). El tono cálido/profesional es subjetivo: agregar un juez LLM opcional que solo corre con `QA_LLM_JUDGE=1`. Insertar antes del bloque de resultado final:

```ts
if (process.env.QA_LLM_JUDGE === '1' && process.env.GEMINI_API_KEY) {
  lines.push('\n## Juez LLM (tono) — muestra\n');
  // Re-evaluate the first chat answer for tone using Gemini as a rubric grader.
  // Keep it cheap: 1 sample only. Prompt asks for a 1-5 score + reason, no PII.
  // (Implementación: misma llamada fetch a Gemini que en api/tenant-chat.ts, prompt de rúbrica.)
}
```
Mantenerlo a 1 muestra para no inflar costo. Documentar en `docs/qa/README.md` que el juez es opcional.

- [ ] **Step 2: Commit**

```bash
git add scripts/qa/ai-eval.ts docs/qa/README.md
git commit -m "feat(qa): optional Gemini tone judge in AI eval"
```

---

## Fase 5 — Linter de contenido extendido (voseo + guiones)

### Task 5.1: Extender el hook `check-voseo.sh` para detectar guiones

**Files:**
- Modify: `.claude/scripts/check-voseo.sh`

- [ ] **Step 1: Crear un fixture y verificar el comportamiento actual**

Run:
```bash
printf 'const x = "Compártelo con el adulto — padre o tutor.";\n' > /tmp/dash-fixture.ts
echo '{"tool_input":{"file_path":"/tmp/dash-fixture.ts"}}' | bash .claude/scripts/check-voseo.sh; echo "exit=$?"
```
Expected (antes del cambio): `exit=0` (el hook actual NO detecta guiones).

- [ ] **Step 2: Agregar detección de em/en dash al hook**

En `.claude/scripts/check-voseo.sh`, después del bloque que detecta voseo (antes de `exit 0` final), insertar:
```bash
# Em dash (—) / en dash (–) detection in Spanish string literals.
DASH_MATCHES=$(grep -n -E "['\"][^'\"]*[—–]" "$FILE" 2>/dev/null | head -5)
if [ -n "$DASH_MATCHES" ]; then
  echo "GUION LARGO DETECTADO en $(basename "$FILE")"
  echo "No usar em dash (—) ni en dash (–) en copy. Usar puntos, comas o parentesis."
  echo ""
  echo "$DASH_MATCHES"
  exit 2
fi
```

- [ ] **Step 3: Verificar que ahora detecta el guion**

Run:
```bash
echo '{"tool_input":{"file_path":"/tmp/dash-fixture.ts"}}' | bash .claude/scripts/check-voseo.sh; echo "exit=$?"
```
Expected: imprime `GUION LARGO DETECTADO` y `exit=2`.

- [ ] **Step 4: Confirmar que no hay falsos positivos en código legítimo**

Run:
```bash
printf 'const x = "Texto correcto, sin guiones.";\nconst rango = 1 - 2;\n' > /tmp/ok-fixture.ts
echo '{"tool_input":{"file_path":"/tmp/ok-fixture.ts"}}' | bash .claude/scripts/check-voseo.sh; echo "exit=$?"
```
Expected: `exit=0` (la resta `1 - 2` usa guion normal `-`, no em/en dash, así que no matchea).

- [ ] **Step 5: Commit**

```bash
git add .claude/scripts/check-voseo.sh
git commit -m "feat(qa): detect em/en dashes in voseo hook"
```

### Task 5.2: Scanner repo-wide para CI (`lint-content.mjs`)

**Files:**
- Create: `scripts/qa/lint-content.mjs`
- Test: `scripts/qa/lint-content.test.mjs`

El hook corre por archivo en cada edición; CI necesita escanear todo `src/` de una. Este scanner reutiliza la lógica de `scoring.mjs`.

- [ ] **Step 1: Escribir el test que falla**

```js
// scripts/qa/lint-content.test.mjs
import assert from 'node:assert';
import { scanContent } from './lint-content.mjs';

const bad = scanContent('const a = "vos podés con — esto";', 'fake.ts');
assert.ok(bad.length >= 2, 'detects voseo and dash');

const good = scanContent('const a = "tú puedes con esto";', 'fake.ts');
assert.strictEqual(good.length, 0, 'clean text has no findings');

const code = scanContent('const x = 1 - 2;', 'fake.ts');
assert.strictEqual(code.length, 0, 'plain minus is not flagged');
console.log('lint-content.test PASS');
```

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `node scripts/qa/lint-content.test.mjs`
Expected: FAIL con `Cannot find module './lint-content.mjs'`.

- [ ] **Step 3: Implementar el scanner**

```js
// scripts/qa/lint-content.mjs
// Repo-wide content linter: scans src/ for voseo + dashes in Spanish string/JSX text.
// Run: npm run lint:content  (exits non-zero on findings)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { hasVoseo, hasDash } from './lib/scoring.mjs';

const SPANISH_HINT = /[a-záéíóúñü]{3,}/i;

// Returns findings [{file, line, type, text}] for a single source string.
export function scanContent(source, file) {
  const findings = [];
  source.split('\n').forEach((line, idx) => {
    // Only inspect string/JSX literals that look like Spanish copy.
    const literals = line.match(/(["'`])(?:(?!\1).){4,}\1/g) || [];
    for (const lit of literals) {
      if (!SPANISH_HINT.test(lit)) continue;
      if (hasVoseo(lit)) findings.push({ file, line: idx + 1, type: 'voseo', text: lit.slice(0, 80) });
      if (hasDash(lit)) findings.push({ file, line: idx + 1, type: 'dash', text: lit.slice(0, 80) });
    }
  });
  return findings;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (['.ts', '.tsx'].includes(extname(full))) acc.push(full);
  }
  return acc;
}

// Only run the scan when executed directly (not when imported by the test).
if (import.meta.url === `file://${process.argv[1]}`) {
  const files = walk('src');
  let all = [];
  for (const f of files) all = all.concat(scanContent(readFileSync(f, 'utf8'), f));
  if (all.length) {
    console.error(`Content lint: ${all.length} finding(s):\n`);
    for (const x of all) console.error(`  ${x.file}:${x.line} [${x.type}] ${x.text}`);
    process.exit(1);
  }
  console.log('Content lint: clean.');
}
```

- [ ] **Step 4: Correr el test para verlo pasar**

Run: `node scripts/qa/lint-content.test.mjs`
Expected: PASS — `lint-content.test PASS`.

- [ ] **Step 5: Correr el scanner sobre el repo real**

Run: `npm run lint:content`
Expected: `Content lint: clean.` Si encuentra findings reales, son copy a corregir: arreglarlos en commits aparte (no en este task).

- [ ] **Step 6: Commit**

```bash
git add scripts/qa/lint-content.mjs scripts/qa/lint-content.test.mjs
git commit -m "feat(qa): repo-wide voseo + dash content linter"
```

### Task 5.3: Wire del linter en CI

Ya quedó incluido en `.github/workflows/qa.yml` (job `content-lint`, Task 3.3). Verificar que corre:

- [ ] **Step 1: Confirmar que el job corre en push a develop**

Run: `git push origin develop`
Expected: en Actions, el job `content-lint` ejecuta `npm run lint:content` y pasa (o falla si hay copy con voseo/guiones, lo cual es el comportamiento deseado).

---

## Self-Review

**1. Spec coverage:**
- "Definir control de calidad automático" → sección de Definición arriba. ✅
- "Crear los 3 tipos de robots a los 6 puntos" → Fase 1 (E2E, puntos 1-6), Fase 2 (exploratorio, puntos 1-2), Fase 3 (synthetic monitoring, puntos 1,3,4,5,6). Tabla de mapeo incluida. ✅
- "No tanta frecuencia" → cron diario (Task 3.2), `MONKEY_RUNS=3`, CI solo en push a develop. ✅
- "Cron de Vercel vs synthetic monitoring" → resuelto: el cron ES el synthetic monitoring (Task 3.1-3.2), mismo resultado a $0. ✅
- "Eval de calidad de IA" → Fase 4 completa. ✅
- "Visual regression: no me preocupa" → omitido a propósito. ✅
- "Extender linter de voseo y guiones" → Fase 5 (hook + scanner repo-wide + CI). ✅
- Guardrails de producción → Fase 0 (tenant sintético, exclusión de métricas, cleanup). ✅

**2. Placeholder scan:** Los selectores de Playwright se confirman con `codegen` (técnica real, no placeholder). El campo de respuesta del chat se confirma con grep en Task 4.3 Step 2. El juez LLM (4.4) queda como mejora opcional con implementación esbozada, marcado explícitamente como opcional.

**3. Type consistency:** `makeAssert`, `supabaseAdmin`, `getQaTenantId`, `cleanupSyntheticSessions` (qa-env.mjs) usados consistentemente en CI y eval. `scoreText`/`findProhibited`/`hasDash`/`hasVoseo`/`hasProbabilisticLanguage` (scoring.mjs) usados en ai-eval.ts y lint-content.mjs. `REPORT_CASES`/`CHAT_CASES` (cases.ts) consumidos en ai-eval.ts. `getReportData(eje, motor, _sintonia, nombre, lang)` y `resolveProfile(answers)` usados con la firma real verificada en el código.

---

## Notas de ejecución (riesgos conocidos)

- **Selectores frágiles:** los specs usan `getByRole`/`getByText` resilientes, pero si la UI cambia mucho hay que recapturar con codegen. Es el costo de mantenimiento esperado.
- **Costo de Gemini:** cada corrida de odisea/eval gasta tokens. Mantener `MONKEY_RUNS` bajo y el eval bajo demanda (no en cada push).
- **Stripe en CI:** la preview debe usar claves test. El spec de Argo One solo llega hasta el redirect; no completa pago.
- **Cleanup:** si un run de CI se cae a mitad, el step `if: always()` de cleanup igual borra las sesiones del tenant qa-robot.
- **Migrar a Checkly:** si más adelante hay tráfico real y se quiere multi-región/uptime histórico, los mismos specs Playwright se suben a Checkly sin reescribir. El cron de Vercel se puede apagar entonces.
