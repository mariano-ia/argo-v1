# Vigia / Principia v1 - Plan D/4: Reloj rapido, Commentarii y Consilium (Fase 1)

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax. This is part D of a 4-part series; execute in order A, B, C, D.

**Goal:** Cerrar el reloj rapido humano-en-el-loop de Producto / Vigia y el reloj lento read-only. El cron Legatus (`api/principia-detect.ts`) detecta los 4 breaches reales, deduplica via el indice parcial unico, escribe `health_checks` + `last_successful_check_at`, empuja ALTO y MEDIO por incidente Y un digest cuando cambia el conteo de Bandeja, y corre el verify-loop. La Bandeja (`api/principia-inbox.ts` + vista) presenta decisiones; el actuador (`api/principia-act.ts`) ejecuta con guard de idempotencia `(incident_id, action_key)` y doble escritura de gobernanza, ruteando `retry` por `/api/generate-ai` primero (no por `/api/send-email`, que ignora `resend` y hace early-return). El Commentarii de cada cohorte (`AreaDetail.tsx` + `api/principia-area.ts`) muestra Mandatum/Acta/Ordines y escribe Ordines. El Consilium (`api/principia-consilium.ts` + vista) computa el resumen de 7 dias read-only y lo upserta en `weekly_reviews.summary`. `api/qa-monitor.ts` gana el check out-of-band del dead-man's-switch. Las rutas de App.tsx para bandeja, area y consilium quedan cableadas.

**Architecture:** Vercel serverless en `/api` (no importan entre si ni desde `/src`; la logica compartida se inlinea por archivo y la fuente canonica testeada vive en `src/lib/principia/detectLogic.ts`). El cron unico itera los `signalSources` de Producto inlineados, evalua breaches con funciones puras (`buildActionKey`/`severityForCount`/`shouldResolveVerifying`), deduplica en `incidents` apoyandose en el indice parcial unico `(area, action_key) WHERE status NOT IN (resolved, snoozed)`, escribe `health_checks` + heartbeat y filas de `system_activity_log`, empuja alertas (Resend piso + Telegram opcional). El actuador ancla idempotencia en una fila `system_activity_log` con `action='actuator:<type>'` y mueve el incidente a `verifying`; el cron cierra el verify-loop a `resolved` solo cuando la senal vuelve bajo el rumbo. El frontend reusa `PrincipiaShell` (Part C) y monta Bandeja/AreaDetail/Consilium bajo `/admin/principia/*`.

**Tech Stack:** React + TypeScript + Vite + TailwindCSS (front). Vercel serverless en `/api`. Supabase via `SUPABASE_SERVICE_ROLE_KEY` + `VITE_SUPABASE_URL`. Alertas via Resend (`https://api.resend.com/emails`) como piso + Telegram opcional (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`). Tests con `node:test` + `node:assert/strict` corridos por `tsx --test`. Copy de usuario: espanol latam neutro (tu, sin voseo, sin guiones). Codigo, identificadores y commits en ingles. Branch: `develop`.

**Depends on: Partes A, B y C.** Parte A: design system (`SEVERITY_COLORS` en `designTokens.ts`, `Stat`/`BarRow`). Parte B: las 6 migraciones (`system_activity_log`, `incidents` con su indice parcial unico, `incident_classes`, `health_checks`, `weekly_reviews`, `agent_ordines`), el helper `activityLog.ts`, la ingesta en handlers existentes (`one-webhook.ts`, `send-email.ts`, `report-recovery-cron.ts`, `session.ts`, `admin-tenants.ts`). Parte C: `src/lib/principia/types.ts` + `areas.ts` (registro `AreaModule`), `PrincipiaShell.tsx`, las rutas base `/admin/principia/*` con Resumen/Incidentes/Registros, los endpoints `principia-overview`/`principia-activity`/`principia-incidents`, y el NAV_ITEMS. Esta parte asume que esas piezas existen y solo agrega lo que le pertenece.

---

## File Structure

| Archivo | Responsabilidad unica |
|---|---|
| `src/lib/principia/detectLogic.ts` *(create)* | Funciones puras testeables: `buildActionKey`, `severityForCount`, `shouldResolveVerifying`. El cron las inlinea; esta es la fuente canonica. |
| `src/lib/principia/detectLogic.test.ts` *(create)* | Cobertura `node:test` del dedupe, la severidad por conteo y la decision del verify-loop. |
| `api/principia-detect.ts` *(create)* | Cron Legatus: itera signalSources de Producto, abre/dedup incidentes, escribe health_checks + heartbeat, empuja ALTO/MEDIO por incidente + digest de conteo de Bandeja, corre el verify-loop, escribe Ordines al abrir. |
| `api/principia-inbox.ts` *(create)* | Endpoint admin-gated: `incidents WHERE status='awaiting_approval'` (la Bandeja consulta esta tabla, no el log). |
| `api/principia-act.ts` *(create)* | Endpoint actuador: approve/reject/snooze con guard de idempotencia `(incident_id, action_key)` + verify-loop + doble escritura de gobernanza. `retry` rutea por `/api/generate-ai`. |
| `api/principia-area.ts` *(create)* | Endpoint admin-gated: Commentarii de una cohorte (Mandatum del cliente + Acta del log + Ordines de `agent_ordines`) + writer POST de Ordines. |
| `api/principia-consilium.ts` *(create)* | Endpoint admin-gated read-only: computa el resumen de 7 dias (incidentes, MTTR, tasa de aprobacion, clases top) y lo upserta en `weekly_reviews.summary`. |
| `api/qa-monitor.ts` *(modify)* | Anadir el check out-of-band del heartbeat del detector (dead-man's-switch independiente) + emitir una fila `health_check` resumen de la corrida sintetica. |
| `src/pages/dashboard/principia/Bandeja.tsx` *(create)* | Bandeja de aprobacion: tarjetas + botones gateados por `executable`; usa `useToast()` -> `{ toast }`. |
| `src/pages/dashboard/principia/AreaDetail.tsx` *(create)* | Pagina generica de detalle de cohorte: Commentarii (Mandatum/Acta/Ordines). |
| `src/pages/dashboard/principia/Consilium.tsx` *(create)* | Vista read-only del Consilium (reloj lento): resumen de la semana. |
| `src/App.tsx` *(modify)* | Anadir rutas `bandeja`, `area/:areaId`, `consilium` (y sus lazies) dentro del grupo `/admin/principia/*`. |
| `vercel.json` *(modify)* | Registrar el cron `/api/principia-detect` (`*/10 * * * *`). |

---

## Tasks

> Convencion de commits: rama `develop`. Cada task termina con un commit. Mensaje en ingles, terminado con:
> ```
> Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
> ```

> Notas de la revision adversarial que aplican a esta parte (ya incorporadas en el codigo de abajo):
> - **Fix 1 (Toast):** `useToast()` devuelve `{ toast }`. Se usa `const { toast } = useToast();` y `toast('info', '...')`, nunca `toast.show(...)`.
> - **Fix 4 (retry actuator):** `/api/send-email` ignora un param `resend` y hace early-return cuando `email_sent_at` esta seteado, y no regenera `ai_sections`. Por eso `retry` (sesiones con `ai_sections` null) rutea por `/api/generate-ai` PRIMERO (que regenera y auto-envia el email, como hace report-recovery-cron), no por send-email. `resend_email` (email_sent_at null, ai_sections presente) si va por send-email.
> - **Fix 6 (idempotencia):** el dedupe del incidente lo enforcea el indice parcial unico `(area, action_key) WHERE status NOT IN (resolved, snoozed)` (creado en Parte B); el cron se apoya en el. La idempotencia del ACTUADOR es un mecanismo aparte y alineado: el actuador chequea/ancla una fila `system_activity_log` con `action='actuator:<type>'` para ese `incident_id`, disciplina `(incident_id, action_key)`.
> - **Fix 7 (Consilium):** es in-scope Fase 1 (spec seccion 6: "v1 (se construye): vista read-only"). Se construye el endpoint + la vista y se upserta `weekly_reviews.summary`. Read-only: no edita setpoints ni gradua.
> - **Fix 8 (push de conteo de Bandeja):** ademas del push por-incidente ALTO/MEDIO, el cron empuja un digest cuando la ronda abrio al menos un incidente, reportando el total `awaiting_approval`.
> - **Should-fix:** funciones puras `evaluateBreaches`/`shouldResolve` extraidas y cubiertas con `node:test`; el detector abre el incidente directo en `awaiting_approval` (camino truncado documentado: omite open/diagnosing/proposed, reservados para cuando el diagnostico de IA se separe de la deteccion); `incidents.class_id` no lleva hard FK (divergencia deliberada del SQL del spec); en cualquier vista se usa `?.` con fallback al indexar `SEVERITY_COLORS` porque `info` no esta en el mapa.

---

### Task 1 - `api/principia-inbox.ts` (la Bandeja consulta `incidents`)

**Files**
- Create: `api/principia-inbox.ts`

> El gate de admin es identico al de `api/admin-health.ts`: validar bearer token, `sb.auth.getUser`, allowlist `admin_users.email`. Se inlinea. La Bandeja consulta `incidents WHERE status='awaiting_approval'`, NUNCA una proyeccion del log.

1. - [ ] Crear `api/principia-inbox.ts`:
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'Invalid token' });
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', userData.user.email).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    const { data, error } = await sb.from('incidents')
        .select('id, area, loop_id, agent, kind, title, summary, severity, status, signal_count, last_seen_at, diagnosis, proposed_action, action_key')
        .eq('status', 'awaiting_approval')
        .order('severity', { ascending: true })  // 'alto' < 'medio' alphabetically; refined client-side
        .order('last_seen_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ items: data ?? [] });
}
```

2. - [ ] Verificacion: la Bandeja consulta `incidents` (no el log):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "awaiting_approval" api/principia-inbox.ts && grep -c "admin_users" api/principia-inbox.ts && grep -c "Not authorized" api/principia-inbox.ts
```
Esperado: `1`, `1`, `1`.

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-inbox" || echo "NO type errors in principia-inbox"
```
Esperado: `NO type errors in principia-inbox`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-inbox.ts && git commit -m "feat(principia): add inbox endpoint (incidents awaiting_approval)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2 - `api/principia-area.ts` (Commentarii: Mandatum + Acta + Ordines writer)

**Files**
- Create: `api/principia-area.ts`

> El Mandatum viene del cliente (registro `areas.ts`, Parte C); este endpoint sirve Acta (filas del log donde `actor=<agente>`) + Ordines (`agent_ordines`). Soporta `POST` para anexar una orden (el writer de Ordines).

1. - [ ] Crear `api/principia-area.ts`:
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Maps area -> agent for the Acta filter (actor column in system_activity_log).
const AREA_AGENT: Record<string, string> = {
    producto: 'vigia', marketing: 'praeco', ventas: 'mercator', personas: 'tribunus', finanzas: 'quaestor',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'Invalid token' });
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', userData.user.email).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    const area = (req.query.area as string) || (req.body?.area as string);
    if (!area || !AREA_AGENT[area]) return res.status(400).json({ error: 'Unknown area' });
    const agent = AREA_AGENT[area];

    // POST: append an Ordo (the centurion's backlog writer).
    if (req.method === 'POST') {
        const { kind, description, scheduled_for, origin } = req.body ?? {};
        if (!kind || !description) return res.status(400).json({ error: 'kind and description are required' });
        const { data, error } = await sb.from('agent_ordines')
            .insert({ area, agent, kind, description, scheduled_for: scheduled_for ?? null, origin: origin ?? 'self' })
            .select('id').single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ ok: true, id: data.id });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Acta: the rows this centurion wrote (actor = agent), most recent first.
    const { data: acta } = await sb.from('system_activity_log')
        .select('id, recorded_at, event_type, action, resource_type, resource_id, severity, status')
        .eq('actor', agent).order('recorded_at', { ascending: false }).limit(50);

    // Ordines: open backlog.
    const { data: ordines } = await sb.from('agent_ordines')
        .select('id, kind, description, status, scheduled_for, origin, created_at')
        .eq('area', area).eq('agent', agent).neq('status', 'dropped')
        .order('created_at', { ascending: false }).limit(50);

    return res.status(200).json({ area, agent, acta: acta ?? [], ordines: ordines ?? [] });
}
```

2. - [ ] Verificacion del writer de Ordines + filtro de Acta:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "agent_ordines" api/principia-area.ts && grep -c "actor', agent" api/principia-area.ts
```
Esperado: `2` (insert + select) y `1`.

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-area" || echo "NO type errors in principia-area"
```
Esperado: `NO type errors in principia-area`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-area.ts && git commit -m "feat(principia): add area Commentarii endpoint (Acta + Ordines writer)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3 - `api/principia-detect.ts` (cron Legatus de deteccion) + funciones puras

**Files**
- Create: `src/lib/principia/detectLogic.ts` (funciones puras: severidad, action_key, verify)
- Create: `src/lib/principia/detectLogic.test.ts` (cobertura node:test del dedupe/verify)
- Create: `api/principia-detect.ts`
- Modify: `vercel.json` (crons array)

> El cron itera los `signalSources` de Producto (inlineados, no importados), evalua breaches, deduplica en `incidents` (incrementa `signal_count` si ya hay uno abierto de esa clase; el indice parcial unico de Parte B enforcea un solo incidente vivo por `(area, action_key)`), escribe `health_checks` (con `last_successful_check_at`) + filas de `system_activity_log`, y empuja alertas (Resend + Telegram). Dos disparadores de push (spec seccion 5): (1) por-incidente al abrir un ALTO/MEDIO, y (2) un digest del conteo de Bandeja (total `awaiting_approval`) cuando la ronda abrio al menos un incidente nuevo. CRON_SECRET auth. El detector abre el incidente directo en `awaiting_approval` (camino truncado: omite open/diagnosing/proposed).

1. - [ ] Escribir el test que falla para la logica pura mas riesgosa (dedupe action_key, severidad por conteo, decision del verify-loop). Crear `src/lib/principia/detectLogic.test.ts`:
```ts
// Pure-logic tests for the riskiest detect paths (action_key dedupe, severity,
// verify-loop resolution). The cron inlines copies of these; THIS is the tested source.
// Run: npx tsx --test src/lib/principia/detectLogic.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildActionKey, severityForCount, shouldResolveVerifying } from './detectLogic.ts';

test('buildActionKey is deterministic and order-independent for entity sets', () => {
    const a = buildActionKey('report_email_unsent', ['s2', 's1']);
    const b = buildActionKey('report_email_unsent', ['s1', 's2']);
    assert.equal(a, b);  // same set, same key -> dedupes to one open incident
    assert.notEqual(a, buildActionKey('report_email_unsent', ['s1']));
});

test('buildActionKey uses the day bucket when no entities (threshold signals)', () => {
    const k = buildActionKey('client_error_spike', [], '2026-06-05');
    assert.equal(k, 'client_error_spike:2026-06-05');
});

test('severityForCount escalates alto past the high watermark, else medio', () => {
    assert.equal(severityForCount(14, 14), 'alto');
    assert.equal(severityForCount(6, 14), 'medio');
    assert.equal(severityForCount(3, 3), 'alto');   // session stall: alto at >=3
    assert.equal(severityForCount(1, 3), 'medio');
});

test('shouldResolveVerifying only resolves when nothing is still broken', () => {
    assert.equal(shouldResolveVerifying(0, 2), true);    // all recovered
    assert.equal(shouldResolveVerifying(1, 2), false);   // one still broken -> no false-resolve
    assert.equal(shouldResolveVerifying(0, 0), false);   // no entities checked -> cannot assert recovery
});
```

2. - [ ] Correr el test y ver el FAIL:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/lib/principia/detectLogic.test.ts
```
Esperado: FAIL - no existe `./detectLogic.ts`.

3. - [ ] Implementar las funciones puras. Crear `src/lib/principia/detectLogic.ts`:
```ts
/**
 * Pure detection logic for Vigia. Vercel /api cannot import from /src, so the cron
 * inlines copies of these helpers; THIS is the canonical, unit-tested source. Keep in sync.
 */

/** Deterministic, order-independent dedupe key. Entity signals key off the sorted id set;
 *  threshold signals key off the day bucket. */
export function buildActionKey(classKey: string, entityRefs: string[] = [], dayBucket?: string): string {
    if (entityRefs.length > 0) return `${classKey}:${[...entityRefs].sort().join(',')}`;
    return `${classKey}:${dayBucket ?? new Date().toISOString().slice(0, 10)}`;
}

/** Severity from a measured count vs. its high watermark. At/above watermark -> 'alto'. */
export function severityForCount(measured: number, altoWatermark: number): 'alto' | 'medio' {
    return measured >= altoWatermark ? 'alto' : 'medio';
}

/** Verify-loop decision: resolve ONLY when entities were checked AND none remain broken.
 *  A zero-entity check cannot assert recovery, so it never false-resolves. */
export function shouldResolveVerifying(stillBroken: number, totalChecked: number): boolean {
    return totalChecked > 0 && stillBroken === 0;
}
```

4. - [ ] Correr el test y ver el PASS:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/lib/principia/detectLogic.test.ts
```
Esperado: PASS - 4 tests, 0 fail.

5. - [ ] Crear `api/principia-detect.ts` (inlinea `buildActionKey`/`severityForCount`/`shouldResolveVerifying` - mantener sincronizado con `detectLogic.ts`). Incluye los 4 signals, el dedupe, el push por-incidente, el digest de conteo de Bandeja y el heartbeat:
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60;

// Inlined Producto signal definitions (Vercel /api cannot import src/lib/principia/areas).
// Keep in sync with the registry's Producto signalSources + setpoint.
type Breach = {
    classKey: string; loopId: string; signalKey: string; sourceRef: string;
    measured: number; setpoint: number; comparator: '>' | '<';
    severity: 'alto' | 'medio'; title: string; summary: string;
    diagnosis: Record<string, unknown>;
    proposed: { type: string; executable: boolean; confidence: number; blast_radius?: string };
    actionKey: string; entityRefs?: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (iso: string) => iso.slice(0, 10);

// Inlined copy of detectLogic.buildActionKey (keep in sync).
function buildActionKey(classKey: string, entityRefs: string[] = [], dayBucket?: string): string {
    if (entityRefs.length > 0) return `${classKey}:${[...entityRefs].sort().join(',')}`;
    return `${classKey}:${dayBucket ?? new Date().toISOString().slice(0, 10)}`;
}

async function alert(severity: 'alto' | 'medio', title: string, detail: string) {
    // Resend floor (mandatory) + Telegram (optional enhancement).
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
    if (apiKey) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'Argo Vigia <qa@argomethod.com>', to,
                subject: `[Argo Vigia] ${severity.toUpperCase()} - ${title}`,
                text: `${detail}\n\nRevisa la Bandeja: https://www.argomethod.com/admin/principia/bandeja`,
            }),
        }).catch(() => {});
    }
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: tgChat, text: `[Vigia ${severity.toUpperCase()}] ${title}\n${detail}` }),
        }).catch(() => {});
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.authorization || '';
    const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
    if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    const sb = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - DAY_MS).toISOString();
    const breaches: Breach[] = [];

    // SIGNAL 1: client_errors > 5/day (technical loop).
    {
        const { data } = await sb.from('client_errors').select('created_at').gte('created_at', since);
        const today = (data ?? []).filter(r => dayKey(r.created_at) === dayKey(new Date().toISOString())).length;
        await writeHealthCheck(sb, 'tecnica', 'client_errors_per_day', 'client_errors', today, 5, '<', today >= 5);
        if (today > 5) breaches.push({
            classKey: 'client_error_spike', loopId: 'tecnica', signalKey: 'client_errors_per_day', sourceRef: 'client_errors',
            measured: today, setpoint: 5, comparator: '>', severity: today >= 14 ? 'alto' : 'medio',
            title: 'Pico de errores de cliente', summary: `${today} errores de cliente hoy (umbral 5).`,
            diagnosis: { likely: 'revisar client_errors.by_msg en /admin/health', metric: 'client_errors_per_day', current: today },
            proposed: { type: 'open_pr', executable: false, confidence: 0.6 },
            actionKey: buildActionKey('client_error_spike', [], dayKey(new Date().toISOString())),
        });
    }

    // SIGNAL 2: audio_events > 10/day (technical loop).
    {
        const { data } = await sb.from('audio_events').select('created_at').gte('created_at', since);
        const today = (data ?? []).filter(r => dayKey(r.created_at) === dayKey(new Date().toISOString())).length;
        await writeHealthCheck(sb, 'tecnica', 'audio_recoveries_per_day', 'audio_events', today, 10, '<', today >= 10);
        if (today > 10) breaches.push({
            classKey: 'audio_recovery_surge', loopId: 'tecnica', signalKey: 'audio_recoveries_per_day', sourceRef: 'audio_events',
            measured: today, setpoint: 10, comparator: '>', severity: 'medio',
            title: 'Surge de recuperacion de audio', summary: `${today} recuperaciones de audio hoy (umbral 10).`,
            diagnosis: { likely: 'investigar codec / EffectPlayer', metric: 'audio_recoveries_per_day', current: today },
            proposed: { type: 'open_pr', executable: false, confidence: 0.5 },
            actionKey: buildActionKey('audio_recovery_surge', [], dayKey(new Date().toISOString())),
        });
    }

    // SIGNAL 3: sessions with ai_sections null > 4h (delivery loop).
    {
        const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const { data } = await sb.from('sessions')
            .select('id, created_at').is('ai_sections', null).neq('eje', '_pending')
            .lt('created_at', cutoff).is('deleted_at', null).limit(50);
        const stalled = data ?? [];
        await writeHealthCheck(sb, 'entrega', 'sessions_without_report', 'sessions', stalled.length, 1, '<', stalled.length > 0);
        if (stalled.length > 0) breaches.push({
            classKey: 'session_delivery_stall', loopId: 'entrega', signalKey: 'sessions_without_report', sourceRef: 'sessions',
            measured: stalled.length, setpoint: 1, comparator: '>', severity: stalled.length >= 3 ? 'alto' : 'medio',
            title: 'Sesiones sin reporte', summary: `${stalled.length} sesiones sin reporte hace mas de 4 h.`,
            diagnosis: { likely: 'ai_sections null tras generacion', session_ids: stalled.map(s => s.id) },
            proposed: { type: 'trigger_report_recovery', executable: true, confidence: 0.91, blast_radius: `${stalled.length} sesiones` },
            actionKey: buildActionKey('session_delivery_stall', stalled.map(s => s.id)),
            entityRefs: stalled.map(s => s.id),
        });
    }

    // SIGNAL 4: report email unsent after generation (delivery loop).
    {
        const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const { data } = await sb.from('sessions')
            .select('id').not('ai_sections', 'is', null).is('email_sent_at', null)
            .lt('created_at', cutoff).is('deleted_at', null).limit(50);
        const unsent = data ?? [];
        await writeHealthCheck(sb, 'entrega', 'report_email_unsent', 'sessions', unsent.length, 1, '<', unsent.length > 0);
        if (unsent.length > 0) breaches.push({
            classKey: 'report_email_unsent', loopId: 'entrega', signalKey: 'report_email_unsent', sourceRef: 'sessions',
            measured: unsent.length, setpoint: 1, comparator: '>', severity: 'medio',
            title: 'Email de reporte no enviado', summary: `${unsent.length} reportes generados sin email enviado.`,
            diagnosis: { likely: 'email_sent_at null con ai_sections presente', session_ids: unsent.map(s => s.id) },
            proposed: { type: 'resend_email', executable: true, confidence: 0.9, blast_radius: `${unsent.length} sesiones` },
            actionKey: buildActionKey('report_email_unsent', unsent.map(s => s.id)),
            entityRefs: unsent.map(s => s.id),
        });
    }

    // Dedupe into incidents + emit activity rows + alert. The partial unique index
    // uniq_inc_open_action_key (area, action_key) WHERE status NOT IN (resolved, snoozed)
    // is the real guard: an INSERT of an already-open breach collides instead of relying
    // only on the SELECT-then-INSERT below. The SELECT increments signal_count when present.
    let opened = 0;
    for (const b of breaches) {
        const { data: cls } = await sb.from('incident_classes').select('id').eq('area', 'producto').eq('key', b.classKey).maybeSingle();
        const { data: existing } = await sb.from('incidents')
            .select('id, signal_count').eq('area', 'producto').eq('action_key', b.actionKey)
            .not('status', 'in', '(resolved,snoozed)').maybeSingle();

        let incidentId: number;
        if (existing) {
            await sb.from('incidents').update({ signal_count: existing.signal_count + 1, last_seen_at: new Date().toISOString() }).eq('id', existing.id);
            incidentId = existing.id;
        } else {
            // Truncated lifecycle (v1): open the incident directly at 'awaiting_approval'
            // (skips open/diagnosing/proposed, reserved for when AI diagnosis splits from detection).
            const { data: ins } = await sb.from('incidents').insert({
                area: 'producto', loop_id: b.loopId, class_id: cls?.id ?? null, agent: 'vigia', kind: 'incident',
                title: b.title, summary: b.summary, severity: b.severity, status: 'awaiting_approval',
                diagnosis: b.diagnosis, proposed_action: b.proposed, action_key: b.actionKey,
                entity_type: b.entityRefs ? 'session' : null,
                entity_ref: b.entityRefs ? b.entityRefs.join(',') : null,
            }).select('id').single();
            incidentId = ins!.id;
            opened++;
            await sb.from('system_activity_log').insert({
                area: 'producto', source_type: 'sensor', event_type: 'health_check',
                actor: 'vigia', action: 'incident_detected', severity: b.severity, status: 'pending_review',
                reason: { metric: b.signalKey, threshold: b.setpoint, current_value: b.measured },
                incident_id: incidentId, occurred_at: new Date().toISOString(),
            });
            // Per-incident push (spec seccion 5, trigger 1): ALTO and MEDIO both page.
            await alert(b.severity, b.title, b.summary);
            // Ordines writer: Vigia schedules itself to watch the signal back under setpoint.
            await sb.from('agent_ordines').insert({
                area: 'producto', agent: 'vigia', kind: 'watch',
                description: `Vigilar ${b.signalKey} hasta que vuelva bajo ${b.setpoint}.`,
                status: 'open', origin: 'self',
                metadata: { incident_id: incidentId, signal_key: b.signalKey },
            }).then(() => {}, () => {});
        }
    }

    // SECOND TRIGGER (spec seccion 5): the Bandeja count itself pushes Telegram + email.
    // Per-incident alerts above fire on open; this digest fires whenever this run opened at
    // least one new incident, reporting the TOTAL awaiting-approval backlog so the operator
    // sees the queue size (the count change), not just the latest item.
    if (opened > 0) {
        const { count: pendingCount } = await sb.from('incidents')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'awaiting_approval');
        const pending = pendingCount ?? 0;
        if (pending > 0) {
            await alert(
                'medio',
                `Bandeja: ${pending} ${pending === 1 ? 'decision espera' : 'decisiones esperan'} aprobacion`,
                `Vigia abrio ${opened} ${opened === 1 ? 'incidente' : 'incidentes'} en esta ronda. Hay ${pending} en total esperando tu decision.`,
            );
        }
    }

    // VERIFY-LOOP: re-check incidents in 'verifying'. Resolve only when the breached signal
    // is back under setpoint. A silently-failed fix cannot false-resolve (mirrors
    // detectLogic.shouldResolveVerifying: resolve ONLY when entities checked AND none broken).
    {
        const { data: verifying } = await sb.from('incidents')
            .select('id, action_key, entity_ref, proposed_action, summary')
            .eq('area', 'producto').eq('status', 'verifying').limit(50);
        for (const inc of verifying ?? []) {
            const actionType = (inc.proposed_action as { type?: string })?.type;
            let backUnder = false;
            let recheck: Record<string, unknown> = {};
            if (actionType === 'trigger_report_recovery' || actionType === 'resend_email' || actionType === 'retry') {
                const ids = String(inc.entity_ref ?? '').split(',').filter(Boolean);
                if (ids.length) {
                    const { data: still } = await sb.from('sessions')
                        .select('id, ai_sections, email_sent_at').in('id', ids);
                    const stillBroken = (still ?? []).filter(s =>
                        actionType === 'trigger_report_recovery' || actionType === 'retry'
                            ? s.ai_sections == null
                            : s.email_sent_at == null,
                    ).length;
                    backUnder = ids.length > 0 && stillBroken === 0;
                    recheck = { still_broken: stillBroken, total: ids.length };
                }
            }
            if (backUnder) {
                await sb.from('incidents').update({
                    status: 'resolved', resolved_at: new Date().toISOString(),
                    verified_at: new Date().toISOString(),
                    verification_result: { signal_back_under_setpoint: true, ...recheck },
                }).eq('id', inc.id);
                await sb.from('system_activity_log').insert({
                    area: 'producto', source_type: 'controller', event_type: 'health_check',
                    actor: 'vigia', action: 'incident_resolved', severity: 'sano', status: 'success',
                    result: { signal_back_under_setpoint: true, ...recheck },
                    incident_id: inc.id, occurred_at: new Date().toISOString(),
                });
            }
        }
    }

    // Heartbeat: mark the detector itself alive (dead-man's-switch source).
    await sb.from('health_checks').insert({
        area: 'producto', loop_id: 'dashboards', signal_key: 'principia_detect_heartbeat',
        source_type: 'cron', source_ref: 'principia-detect', shape: 'threshold',
        measured_value: breaches.length, setpoint_value: 0, comparator: '>=', unit: 'breaches',
        breached: false, severity: 'sano', checked_at: new Date().toISOString(),
        last_successful_check_at: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, breaches: breaches.length, opened });
}

async function writeHealthCheck(
    sb: SupabaseClient, loopId: string, signalKey: string, sourceRef: string,
    measured: number, setpoint: number, comparator: '<' | '>', breached: boolean,
) {
    await sb.from('health_checks').insert({
        area: 'producto', loop_id: loopId, signal_key: signalKey,
        source_type: 'table', source_ref: sourceRef, shape: 'threshold',
        measured_value: measured, setpoint_value: setpoint, comparator, unit: 'count',
        breached, severity: breached ? 'medio' : 'sano',
        checked_at: new Date().toISOString(), last_successful_check_at: new Date().toISOString(),
    });
}
```

6. - [ ] `vercel.json` - registrar el cron. Anadir al array `"crons"` (cadencia de 10 min; honestidad de cadencia: "casi en tiempo real, cadencia = 10 min"):
```json
    {
      "path": "/api/principia-detect",
      "schedule": "*/10 * * * *"
    }
```

7. - [ ] Verificacion: el cron evalua los 4 signals, deduplica por `action_key`, empuja el digest de Bandeja, escribe heartbeat, corre el verify-loop, escribe Ordines, y esta auth-gated:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "CRON_SECRET" api/principia-detect.ts && grep -c "action_key" api/principia-detect.ts && grep -c "awaiting_approval" api/principia-detect.ts && grep -c "principia_detect_heartbeat" api/principia-detect.ts && grep -c "signal_back_under_setpoint" api/principia-detect.ts && grep -c "agent_ordines" api/principia-detect.ts && grep -c "principia-detect" vercel.json
```
Esperado: `1`, `>=2`, `2` (el digest count + el verify-loop select), `1`, `1`, `1`, `1`.

8. - [ ] Verificar JSON de vercel valido:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json OK')"
```
Esperado: `vercel.json OK`.

9. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-detect" || echo "NO type errors in principia-detect"
```
Esperado: `NO type errors in principia-detect`.

10. - [ ] Commit (incluye el modulo puro + su test + cron + verify-loop + Ordines writer):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/lib/principia/detectLogic.ts src/lib/principia/detectLogic.test.ts api/principia-detect.ts vercel.json && git commit -m "feat(principia): add Legatus detection cron (dedupe + push + verify-loop + Ordines) + pure detect-logic tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4 - `api/principia-act.ts` (actuador + idempotencia + verify-loop + doble escritura)

**Files**
- Create: `api/principia-act.ts`

> Maneja approve / reject / snooze. `approve` de retry/resend/trigger ejecuta de verdad y entra a verify-loop; `approve` de open_pr/rollback/feature_flag NO ejecuta (devuelve 409 "manual"). Routing real de actuadores (Fix 4, groundeado contra `api/send-email.ts`): `retry` (ai_sections null) va por `/api/generate-ai` (que regenera y auto-envia el email), `resend_email` (email_sent_at null, ai_sections presente) va por `/api/send-email`, `trigger_report_recovery` dispara `/api/report-recovery-cron`. NO se usa el param `resend` de send-email (send-email lo ignora y hace early-return si `email_sent_at` ya esta seteado; tampoco regenera ai_sections). Idempotencia (Fix 6) via guard `(incident_id, action_key)` chequeando si ya hay una fila `auto_executed`/`success` en `system_activity_log` con `action='actuator:<type>'` para ese incidente (mecanismo distinto y complementario al indice parcial de dedupe de incidentes). Toda accion escribe ambas tablas (`admin_audit_log` + `system_activity_log`), cruzadas por `related_logs`.

1. - [ ] Crear `api/principia-act.ts`:
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const EXECUTABLE = new Set(['retry', 'resend_email', 'trigger_report_recovery']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'Invalid token' });
    const adminEmail = userData.user.email;
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', adminEmail).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    const { incident_id, decision } = req.body ?? {};
    if (!incident_id || !['approve', 'reject', 'snooze'].includes(decision)) {
        return res.status(400).json({ error: 'incident_id and a valid decision are required' });
    }

    const { data: incident } = await sb.from('incidents').select('*').eq('id', incident_id).maybeSingle();
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // reject / snooze: governance double-write, no actuator.
    if (decision === 'reject' || decision === 'snooze') {
        const newStatus = decision === 'reject' ? 'resolved' : 'snoozed';
        await sb.from('incidents').update({
            status: newStatus,
            resolved_at: decision === 'reject' ? new Date().toISOString() : null,
            resolution: { decision, by: adminEmail },
        }).eq('id', incident_id);
        await governanceDoubleWrite(sb, adminEmail, decision, incident, 'success', { newStatus });
        return res.status(200).json({ ok: true, status: newStatus });
    }

    // approve: PR/rollback/feature_flag are proposals only.
    const actionType = incident.proposed_action?.type as string;
    if (!EXECUTABLE.has(actionType)) {
        return res.status(409).json({ error: 'manual', message: 'Esta propuesta se ejecuta de forma manual.', actionType });
    }

    // Idempotency guard (Fix 6): has this (incident_id, action_key) already executed?
    const { data: prior } = await sb.from('system_activity_log')
        .select('id').eq('incident_id', incident_id).eq('action', `actuator:${actionType}`)
        .in('status', ['success', 'auto_executed']).limit(1).maybeSingle();
    if (prior) return res.status(200).json({ ok: true, idempotent: true, note: 'already executed' });

    // Move to acting.
    await sb.from('incidents').update({ status: 'acting' }).eq('id', incident_id);

    // Execute the actuator.
    // BACKEND REALITY (grounded against api/send-email.ts):
    //   - send-email does NOT accept/parse a `resend` body param, and it early-returns
    //     { already_sent:true } whenever email_sent_at is set. It also does NOT regenerate
    //     ai_sections; it needs ai_sections present to build the email.
    //   Therefore:
    //   - resend_email  (email_sent_at null, ai_sections present) -> POST /api/send-email
    //     works as-is (no `resend` flag needed; we don't send one).
    //   - retry / trigger_report_recovery (ai_sections null) -> regenerate AI FIRST via
    //     /api/generate-ai (which auto-sends the email on completion, like report-recovery-cron),
    //     NOT send-email (which would no-op on a null-ai_sections session).
    const base = process.env.SITE_URL || 'https://www.argomethod.com';
    let execResult: Record<string, unknown> = {};
    let execOk = false;
    try {
        if (actionType === 'trigger_report_recovery') {
            const r = await fetch(`${base}/api/report-recovery-cron?secret=${process.env.CRON_SECRET ?? ''}`);
            execOk = r.ok; execResult = { triggered: 'report-recovery-cron', status: r.status };
        } else if (actionType === 'retry') {
            // ai_sections null: regenerate the report (generate-ai auto-sends the email).
            const ids = String(incident.entity_ref ?? '').split(',').filter(Boolean);
            const outcomes: Array<{ id: string; ok: boolean }> = [];
            for (const id of ids) {
                const r = await fetch(`${base}/api/generate-ai`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: id }),
                });
                outcomes.push({ id, ok: r.ok });
            }
            execOk = outcomes.length > 0 && outcomes.every(o => o.ok);
            execResult = { regenerated: outcomes };
        } else if (actionType === 'resend_email') {
            // email_sent_at null with ai_sections present: send-email builds + delivers.
            const ids = String(incident.entity_ref ?? '').split(',').filter(Boolean);
            const outcomes: Array<{ id: string; ok: boolean }> = [];
            for (const id of ids) {
                const r = await fetch(`${base}/api/send-email`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: id }),
                });
                outcomes.push({ id, ok: r.ok });
            }
            execOk = outcomes.length > 0 && outcomes.every(o => o.ok);
            execResult = { resent: outcomes };
        }
    } catch (e) {
        execResult = { error: e instanceof Error ? e.message : String(e) };
    }

    // Record execution (idempotency anchor) + move to verifying.
    await sb.from('incidents').update({ status: 'verifying' }).eq('id', incident_id);
    await sb.from('system_activity_log').insert({
        area: incident.area, source_type: 'actuator', event_type: 'ai_decision',
        actor: adminEmail, action: `actuator:${actionType}`,
        severity: execOk ? 'sano' : 'medio', status: execOk ? 'success' : 'failed',
        result: execResult, incident_id, occurred_at: new Date().toISOString(),
    });
    await governanceDoubleWrite(sb, adminEmail, 'approve', incident, execOk ? 'success' : 'failed', { actionType, ...execResult });

    return res.status(200).json({ ok: execOk, status: 'verifying', result: execResult });
}

/**
 * Governance double-write: every human Approve/Reject/Snooze writes BOTH
 * admin_audit_log (authoritative) AND system_activity_log (navigable timeline),
 * cross-linked via related_logs.
 */
async function governanceDoubleWrite(
    sb: SupabaseClient, adminEmail: string, decision: string,
    incident: { id: number; area: string; title?: string },
    status: 'success' | 'failed', details: Record<string, unknown>,
) {
    let auditId: string | null = null;
    try {
        const { data } = await sb.from('admin_audit_log').insert({
            admin_email: adminEmail, action: `principia-${decision}`,
            target_type: 'incident', target_id: String(incident.id),
            details: { title: incident.title, ...details },
        }).select('id').single();
        auditId = data?.id ?? null;
    } catch { /* non-blocking */ }
    try {
        await sb.from('system_activity_log').insert({
            area: incident.area, source_type: 'human', event_type: 'user_action',
            actor: adminEmail, action: `principia_${decision}`,
            resource_type: 'incident', resource_id: String(incident.id),
            severity: 'sano', status,
            related_logs: auditId ? [`admin_audit_log.${auditId}`] : null,
            incident_id: incident.id, occurred_at: new Date().toISOString(),
        });
    } catch { /* non-blocking */ }
}
```

2. - [ ] Verificacion: idempotencia, verify-loop (status `verifying`), gate de propuestas no ejecutables, ruteo de `retry` por generate-ai, doble escritura:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "idempotent" api/principia-act.ts && grep -c "'verifying'" api/principia-act.ts && grep -c "governanceDoubleWrite" api/principia-act.ts && grep -c "EXECUTABLE.has" api/principia-act.ts && grep -c "api/generate-ai" api/principia-act.ts
```
Esperado: `1`, `>=2`, `>=3` (def + 3 call sites), `1`, `1`.

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-act" || echo "NO type errors in principia-act"
```
Esperado: `NO type errors in principia-act`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-act.ts && git commit -m "feat(principia): add actuator endpoint (idempotency + verify-loop + governance double-write)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 - `api/qa-monitor.ts` (out-of-band dead-man's-switch + health_check emit)

**Files**
- Modify: `api/qa-monitor.ts` (add CHECK: detector silence, anchored before the `const failures = checks.filter(...)` block; add the health_check emit before the final `return res.status(...)`)

> El veredicto de `principia-overview` (Parte C) degrada a gris si el detector esta callado, pero un cockpit muerto no se mira solo. qa-monitor (cron independiente, distinto endpoint) chequea que `principia-detect` haya escrito su heartbeat recientemente y, si no, dispara `sendAlert` (que ya manda Resend). Es el canal out-of-band. Ademas emite una fila `health_check` resumen de la corrida sintetica a `system_activity_log`.

> Nota de anclaje: anclar cada parche a la cadena citada (el `const failures = checks.filter`, el `return res.status` final), no a un numero de linea absoluto, que pudo driftear.

1. - [ ] En `api/qa-monitor.ts`, justo antes del bloque `const failures = checks.filter(c => !c.ok);`, anadir el check del relevo de guardia (out-of-band). `sb`, `checks` y la helper `add` estan en scope:
```ts
  // CHECK: Principia detector dead-man's-switch (out-of-band). If principia-detect
  // hasn't written its heartbeat in 25 min (2.5x its 10-min cadence), the cockpit
  // may show lying-green; page via the independent qa-monitor channel.
  try {
    const hbCutoff = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    const { data: hb } = await sb.from('health_checks')
      .select('checked_at').eq('source_ref', 'principia-detect')
      .order('checked_at', { ascending: false }).limit(1).maybeSingle();
    add('principia detector alive', !!hb && hb.checked_at >= hbCutoff,
        hb ? `last heartbeat ${hb.checked_at}` : 'no heartbeat row');
  } catch (e) { add('principia detector reachable', false, String(e)); }
```

2. - [ ] En `api/qa-monitor.ts`, justo antes del `return res.status(...)` final (`sb`, `checks` y `failures` estan en scope), anadir la fila resumen del check sintetico:
```ts
  // Principia ingestion: record the synthetic monitor run as a health_check row.
  try {
    await sb.from('system_activity_log').insert({
      area: 'producto', source_type: 'cron', event_type: 'health_check',
      actor: 'system', action: 'synthetic_monitor_run',
      severity: failures.length ? 'medio' : 'sano',
      status: failures.length ? 'failed' : 'success',
      result: { total: checks.length, failed: failures.length, failing: failures.map(f => f.name) },
      occurred_at: new Date().toISOString(),
    });
  } catch { /* non-blocking */ }
```

3. - [ ] Verificacion: el check out-of-band existe, usa el canal independiente, y se emite la fila de health_check:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "principia detector alive" api/qa-monitor.ts && grep -c "principia-detect" api/qa-monitor.ts && grep -c "synthetic_monitor_run" api/qa-monitor.ts
```
Esperado: `1`, `1`, `1`.

4. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "qa-monitor" || echo "NO type errors in qa-monitor"
```
Esperado: `NO type errors in qa-monitor`.

5. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/qa-monitor.ts && git commit -m "feat(principia): out-of-band dead-man's-switch + health_check emit in qa-monitor

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6 - `api/principia-consilium.ts` (Consilium read-only + persistencia de `weekly_reviews.summary`)

**Files**
- Create: `api/principia-consilium.ts`

> In-scope v1 por el diseno (Fix 7, spec seccion 6: "v1 (se construye): vista read-only"). El Consilium es el reloj lento: read-only, NO editable (editar setpoints/graduar es fase posterior). El endpoint computa el resumen de la ventana de 7 dias (incidentes abiertos/resueltos, MTTR, tasa de aprobacion, clases top) y lo upserta en `weekly_reviews.summary` (el spec manda escribir ahi, via `uniq_weekly_review_period` de Parte B). NUNCA muta incidentes.

1. - [ ] Crear `api/principia-consilium.ts` (admin-gated, mismo patron que los demas; computa el snapshot y lo persiste):
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'Invalid token' });
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', userData.user.email).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    // 7-day window (org-wide). Read-only: this never mutates incidents.
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const periodStart = start.toISOString().slice(0, 10);
    const periodEnd = end.toISOString().slice(0, 10);

    const { data: opened } = await sb.from('incidents')
        .select('id, area, class_id, severity, status, first_seen_at, resolved_at')
        .gte('first_seen_at', start.toISOString());
    const rows = opened ?? [];

    const resolved = rows.filter(r => r.status === 'resolved' && r.resolved_at);
    // MTTR (minutes), only over incidents that actually resolved in-window.
    const mttrMin = resolved.length
        ? Math.round(resolved.reduce((acc, r) =>
            acc + (new Date(r.resolved_at as string).getTime() - new Date(r.first_seen_at).getTime()) / 60000, 0) / resolved.length)
        : null;

    // Approval rate from governance rows in system_activity_log over the same window.
    const { data: decisions } = await sb.from('system_activity_log')
        .select('action').in('action', ['principia_approve', 'principia_reject', 'principia_snooze'])
        .gte('recorded_at', start.toISOString());
    const approvals = (decisions ?? []).filter(d => d.action === 'principia_approve').length;
    const totalDecisions = (decisions ?? []).length;
    const approvalRate = totalDecisions ? Math.round((approvals / totalDecisions) * 100) : null;

    // Top classes by incident count.
    const byClass: Record<string, number> = {};
    for (const r of rows) { const k = String(r.class_id ?? 'sin_clase'); byClass[k] = (byClass[k] ?? 0) + 1; }
    const topClasses = Object.entries(byClass).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([class_id, count]) => ({ class_id, count }));

    const summary = {
        incidents_opened: rows.length,
        incidents_resolved: resolved.length,
        mttr_minutes: mttrMin,
        approval_rate: approvalRate,
        decisions: totalDecisions,
        top_classes: topClasses,
    };

    // Persist the read-only snapshot (spec mandates writing weekly_reviews.summary).
    // Idempotent per (area-null, period): rely on uniq_weekly_review_period.
    try {
        await sb.from('weekly_reviews').upsert(
            { area: null, period_start: periodStart, period_end: periodEnd, summary, reviewed_by: 'consilium', closed_at: new Date().toISOString() },
            { onConflict: 'area,period_start,period_end' },
        );
    } catch { /* non-blocking: the view still renders the freshly-computed summary */ }

    return res.status(200).json({ periodStart, periodEnd, summary });
}
```

2. - [ ] Verificacion: el endpoint escribe `weekly_reviews.summary` y es read-only (no muta incidentes):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "weekly_reviews" api/principia-consilium.ts && grep -c "summary" api/principia-consilium.ts && grep -c "update\|delete\|insert" api/principia-consilium.ts | grep -v "0" && echo "uses upsert only" || echo "check writes"
```
Esperado: `1`, `>=2`, y que el unico write sea el `upsert` (sin `update`/`delete`/`insert` sobre incidents).

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-consilium" || echo "NO type errors in principia-consilium"
```
Esperado: `NO type errors in principia-consilium`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-consilium.ts && git commit -m "feat(principia): add read-only Consilium endpoint (weekly_reviews snapshot upsert)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7 - Vista `Bandeja.tsx` (ApprovalCard gateado por executable, Toast correcto)

**Files**
- Create: `src/pages/dashboard/principia/Bandeja.tsx`

> Los botones se gatean por `executable` (de `proposed_action`): retry/resend/trigger ejecutan; el resto se renderiza como "propuesta (ejecucion manual)". Fix 1: `useToast()` devuelve `{ toast }`; se usa `toast('info', '...')`. Should-fix: `severity` puede ser `info` (observations), por lo que se usa `?.` con fallback al indexar `SEVERITY_COLORS`.

1. - [ ] Crear `src/pages/dashboard/principia/Bandeja.tsx`:
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, type Severity } from '../../../lib/designTokens';
import { Button, useToast } from '../../../components/ui';

interface InboxItem {
    id: number; area: string; loop_id: string; agent: string; title: string; summary: string;
    severity: string; signal_count: number; last_seen_at: string;
    diagnosis: Record<string, unknown> | null;
    proposed_action: { type: string; executable: boolean; confidence?: number; blast_radius?: string } | null;
}

export const Bandeja: React.FC = () => {
    const [items, setItems] = useState<InboxItem[]>([]);
    const [busy, setBusy] = useState<number | null>(null);
    const { toast } = useToast();  // useToast() returns { toast: (type, text) => void }

    const fetchItems = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/principia-inbox', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setItems(b.items ?? []); }
    }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const act = useCallback(async (id: number, decision: 'approve' | 'reject' | 'snooze') => {
        setBusy(id);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setBusy(null); return; }
        const res = await fetch('/api/principia-act', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ incident_id: id, decision }),
        });
        await res.json().catch(() => ({}));  // drain body; outcome is read from res.status/res.ok
        if (res.status === 409) toast('info', 'Esta propuesta se ejecuta de forma manual.');
        else if (res.ok) toast('success', decision === 'approve' ? 'Accion en verificacion.' : 'Decision registrada.');
        else toast('error', 'No se pudo completar. Intenta de nuevo.');
        setBusy(null);
        fetchItems();
    }, [toast, fetchItems]);

    if (items.length === 0) {
        return (
            <div className="rounded-[14px] border border-argo-border bg-white p-6 text-center shadow-argo">
                <p className="font-semibold text-argo-navy">Nada requiere tu atencion. Vigia esta observando.</p>
                <p className="mt-1 text-sm text-argo-grey">Las decisiones pendientes aparecen aqui.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Bandeja</h1>
            <p className="mt-1 text-sm text-argo-grey">{items.length} decisiones esperan tu aprobacion.</p>
            <div className="mt-4 space-y-3">
                {items.map(it => {
                    // severity may be 'info' (observations); fall back so we never index undefined.
                    const rawSev = (it.severity ?? 'medio') as Severity;
                    const sevColors = SEVERITY_COLORS[rawSev] ?? SEVERITY_COLORS.medio;
                    const sev: Severity = SEVERITY_COLORS[rawSev] ? rawSev : 'medio';
                    const exec = it.proposed_action?.executable === true;
                    return (
                        <div key={it.id} className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${sevColors.dot}`} />
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${sevColors.chip}`}>{sev.toUpperCase()}</span>
                                <span className="text-sm text-argo-secondary">{it.area} - {it.agent}</span>
                                {it.signal_count > 1 && <span className="text-xs text-argo-grey">x{it.signal_count}</span>}
                            </div>
                            <p className="mt-2 font-semibold text-argo-navy">{it.title}</p>
                            <p className="text-sm text-argo-secondary">{it.summary}</p>
                            {it.proposed_action && (
                                <p className="mt-2 text-sm text-argo-secondary">
                                    Propone: <span className="font-medium">{it.proposed_action.type}</span>
                                    {!exec && <span className="ml-2 rounded bg-argo-bg px-1.5 py-0.5 text-xs text-argo-grey">propuesta (ejecucion manual)</span>}
                                    {it.proposed_action.confidence != null && <span className="ml-2 text-xs text-argo-grey">confianza {(it.proposed_action.confidence * 100).toFixed(0)}%</span>}
                                    {it.proposed_action.blast_radius && <span className="ml-2 text-xs text-argo-grey">alcance: {it.proposed_action.blast_radius}</span>}
                                </p>
                            )}
                            <div className="mt-3 flex gap-2">
                                {exec
                                    ? <Button size="sm" variant="primary" disabled={busy === it.id} onClick={() => act(it.id, 'approve')}>Aprobar</Button>
                                    : <Button size="sm" variant="secondary" disabled title="Ejecucion manual">Aprobar (manual)</Button>}
                                <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => act(it.id, 'reject')}>Rechazar</Button>
                                <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => act(it.id, 'snooze')}>Posponer</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
```

2. - [ ] Verificacion del Toast correcto + gateo por executable + fallback de severity:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "const { toast } = useToast" src/pages/dashboard/principia/Bandeja.tsx && grep -c "toast.show" src/pages/dashboard/principia/Bandeja.tsx; grep -c "SEVERITY_COLORS\[rawSev\] ??" src/pages/dashboard/principia/Bandeja.tsx
```
Esperado: `1` (uso correcto), `0` (sin `toast.show`), `1` (fallback de severity).

3. - [ ] Verificacion de copy (sin voseo/dash):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node scripts/qa/lint-content.mjs src/pages/dashboard/principia/Bandeja.tsx && echo "CONTENT CLEAN"
```
Esperado: `CONTENT CLEAN`.

4. - [ ] No commitear todavia: la ruta `bandeja` se cablea en la Task 10 (junto con area y consilium) y el build conjunto se valida ahi. Continuar.

---

### Task 8 - Vista `AreaDetail.tsx` (Commentarii: Mandatum/Acta/Ordines)

**Files**
- Create: `src/pages/dashboard/principia/AreaDetail.tsx`

> Mandatum del registro `areas.ts` (Parte C) + Acta + Ordines del endpoint `principia-area`. Cohortes `coming_soon` muestran solo el Mandatum y un panel "en construccion" (nunca 404).

1. - [ ] Crear `src/pages/dashboard/principia/AreaDetail.tsx`:
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { getArea } from '../../../lib/principia/areas';
import type { AreaId } from '../../../lib/principia/types';

interface ActaRow { id: number; recorded_at: string; event_type: string; action: string; status: string | null; }
interface OrdoRow { id: number; kind: string; description: string; status: string; origin: string | null; }

export const AreaDetail: React.FC = () => {
    const { areaId } = useParams<{ areaId: string }>();
    const area = getArea((areaId as AreaId) ?? 'producto');
    const [acta, setActa] = useState<ActaRow[]>([]);
    const [ordines, setOrdines] = useState<OrdoRow[]>([]);

    const fetchCommentarii = useCallback(async () => {
        if (area.status !== 'live') return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/principia-area?area=${area.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setActa(b.acta ?? []); setOrdines(b.ordines ?? []); }
    }, [area]);
    useEffect(() => { fetchCommentarii(); }, [fetchCommentarii]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">{area.label} - {area.agentName}</h1>
            <span className="mt-1 inline-block text-xs uppercase tracking-widest text-argo-grey">{area.status === 'live' ? 'EN VIVO' : 'proximamente'}</span>

            <section className="mt-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-argo-grey">Mandatum</h2>
                <p className="mt-2 text-sm text-argo-secondary">{area.mandatum}</p>
                {area.setpoint.signals.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-argo-secondary">
                        {area.setpoint.signals.map(s => (
                            <li key={s.signal_key}>- {s.label}: {s.comparator} {s.target} {s.unit}</li>
                        ))}
                    </ul>
                )}
            </section>

            {area.status !== 'live' ? (
                <div className="mt-6 rounded-[14px] border border-argo-border bg-argo-bg p-6 text-center">
                    <p className="font-semibold text-argo-navy">Modulo en construccion.</p>
                    <p className="mt-1 text-sm text-argo-grey">Esta cohorte heredara Bandeja, Incidentes y Registros cuando entre en vivo.</p>
                </div>
            ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <section className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-argo-grey">Acta (lo que hizo)</h2>
                        <ul className="mt-2 space-y-1 text-sm">
                            {acta.map(a => (
                                <li key={a.id} className="flex gap-2 text-argo-secondary">
                                    <span className="font-mono text-xs text-argo-grey">{new Date(a.recorded_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                    <span className="text-argo-navy">{a.action}</span>
                                </li>
                            ))}
                            {acta.length === 0 && <li className="text-argo-grey">Sin actividad aun.</li>}
                        </ul>
                    </section>
                    <section className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-argo-grey">Ordines (lo que tiene pendiente)</h2>
                        <ul className="mt-2 space-y-1 text-sm">
                            {ordines.map(o => (
                                <li key={o.id} className="text-argo-secondary">- [{o.kind}] {o.description} <span className="text-xs text-argo-grey">({o.status})</span></li>
                            ))}
                            {ordines.length === 0 && <li className="text-argo-grey">Sin ordenes abiertas.</li>}
                        </ul>
                    </section>
                </div>
            )}
        </div>
    );
};
```

2. - [ ] Verificacion de copy (sin voseo/dash):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node scripts/qa/lint-content.mjs src/pages/dashboard/principia/AreaDetail.tsx && echo "CONTENT CLEAN"
```
Esperado: `CONTENT CLEAN`.

3. - [ ] No commitear todavia: la ruta `area/:areaId` se cablea en la Task 10. Continuar.

---

### Task 9 - Vista `Consilium.tsx` (read-only del reloj lento)

**Files**
- Create: `src/pages/dashboard/principia/Consilium.tsx`

> Read-only; muestra el snapshot de la semana que computa `api/principia-consilium`. Una nota explicita aclara que ajustar el rumbo y graduar la autonomia llega despues.

1. - [ ] Crear `src/pages/dashboard/principia/Consilium.tsx`:
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface ConsiliumSummary {
    incidents_opened: number; incidents_resolved: number;
    mttr_minutes: number | null; approval_rate: number | null;
    decisions: number; top_classes: Array<{ class_id: string; count: number }>;
}
interface ConsiliumData { periodStart: string; periodEnd: string; summary: ConsiliumSummary; }

export const Consilium: React.FC = () => {
    const [data, setData] = useState<ConsiliumData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        const res = await fetch('/api/principia-consilium', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setData(await res.json());
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <p className="text-argo-grey">Cargando...</p>;
    if (!data) return <p className="text-argo-grey">Sin datos del Consilium.</p>;
    const s = data.summary;
    const fmt = (n: number | null, suffix = '') => (n == null ? '-' : `${n}${suffix}`);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Consilium</h1>
            <p className="mt-1 text-sm text-argo-grey">
                El reloj lento. Resumen de la semana (solo lectura). {data.periodStart} a {data.periodEnd}.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                    { label: 'Incidentes abiertos', value: fmt(s.incidents_opened) },
                    { label: 'Resueltos', value: fmt(s.incidents_resolved) },
                    { label: 'MTTR (min)', value: fmt(s.mttr_minutes) },
                    { label: 'Tasa de aprobacion', value: fmt(s.approval_rate, '%') },
                ].map(k => (
                    <div key={k.label} className="rounded-lg border border-argo-border bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-argo-grey">{k.label}</p>
                        <p className="text-lg font-bold text-argo-navy">{k.value}</p>
                    </div>
                ))}
            </div>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-argo-grey">Clases mas frecuentes</h2>
            <div className="mt-2 rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                {s.top_classes.length === 0
                    ? <p className="text-argo-grey">Sin incidentes esta semana.</p>
                    : (
                        <ul className="space-y-1 text-sm text-argo-secondary">
                            {s.top_classes.map(c => (
                                <li key={c.class_id} className="flex justify-between">
                                    <span>Clase {c.class_id}</span>
                                    <span className="font-mono text-argo-navy">{c.count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
            </div>

            <p className="mt-4 text-xs text-argo-light">
                El Consilium es de solo lectura en v1. Ajustar el rumbo y graduar la autonomia llega despues.
            </p>
        </div>
    );
};
```

2. - [ ] Verificacion de copy (sin voseo/dash):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node scripts/qa/lint-content.mjs src/pages/dashboard/principia/Consilium.tsx && echo "CONTENT CLEAN"
```
Esperado: `CONTENT CLEAN`.

3. - [ ] No commitear todavia: la ruta `consilium` se cablea en la Task 10. Continuar.

---

### Task 10 - Rutas en `src/App.tsx` (bandeja, area, consilium) + build conjunto

**Files**
- Modify: `src/App.tsx` (lazy block junto a los demas lazies de principia; rutas dentro del grupo `<Route path="principia" ...>`)

> Parte C ya monto `PrincipiaShell` y las rutas `index`/`registros`/`incidentes` con sus lazies. Esta task agrega los lazies y las rutas que pertenecen a Parte D: `bandeja`, `area/:areaId` y `consilium`. Anclar por la cadena citada (el lazy de `PrincipiaShell`, el `<Route path="principia" element={<PrincipiaShell />}>`), no por numero de linea.

1. - [ ] `src/App.tsx` - lazies. Junto al bloque de lazies de principia (donde Parte C definio `PrincipiaShell`/`PrincipiaResumen`/etc.), anadir los tres lazies de Parte D:
```tsx
const PrincipiaBandeja     = lazy(() => import('./pages/dashboard/principia/Bandeja').then(m => ({ default: m.Bandeja })));
const PrincipiaAreaDetail  = lazy(() => import('./pages/dashboard/principia/AreaDetail').then(m => ({ default: m.AreaDetail })));
const PrincipiaConsilium   = lazy(() => import('./pages/dashboard/principia/Consilium').then(m => ({ default: m.Consilium })));
```

2. - [ ] `src/App.tsx` - rutas. Dentro del grupo `<Route path="principia" element={<PrincipiaShell />}>` (montado por Parte C), anadir como hijos las tres rutas de Parte D:
```tsx
                        <Route path="bandeja"    element={<PrincipiaBandeja />} />
                        <Route path="consilium"  element={<PrincipiaConsilium />} />
                        <Route path="area/:areaId" element={<PrincipiaAreaDetail />} />
```
(Si Parte C dejo un stub `<Route path="consilium" element={<PrincipiaResumen />} />` para evitar 404, reemplazarlo por la linea de arriba que apunta a `<PrincipiaConsilium />`. El Consilium read-only es in-scope v1, no diferido.)

3. - [ ] Verificacion: rutas y lazies de Parte D cableados:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "PrincipiaBandeja" src/App.tsx && grep -c "PrincipiaConsilium" src/App.tsx && grep -c "path=\"area/:areaId\"" src/App.tsx && grep -c "path=\"bandeja\"" src/App.tsx
```
Esperado: `2` (lazy + route element) cada `Princip*`, `1`, `1`.

4. - [ ] Build de tipos del front completo (Bandeja, AreaDetail, Consilium + shell + routing de Partes C/D):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep -E "principia|Bandeja|AreaDetail|Consilium|App\.tsx" || echo "NO type errors in Principia frontend"
```
Esperado: `NO type errors in Principia frontend`.

5. - [ ] Build de produccion (smoke):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npm run build 2>&1 | tail -5
```
Esperado: build exitoso (`built in ...`), sin errores.

6. - [ ] Correr la suite de funciones puras de esta parte + la suite unit del proyecto para confirmar que nada se rompio:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/lib/principia/detectLogic.test.ts && npm run qa:unit
```
Esperado: todos los tests PASS.

7. - [ ] Commit del frontend de Parte D (Bandeja + AreaDetail + Consilium + rutas):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/pages/dashboard/principia/Bandeja.tsx src/pages/dashboard/principia/AreaDetail.tsx src/pages/dashboard/principia/Consilium.tsx src/App.tsx && git commit -m "feat(principia): add Bandeja, AreaDetail, Consilium views + routes (bandeja/area/consilium)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fuera de alcance de esta parte (D)

- **Migraciones, ingesta y helper `activityLog.ts`:** son de Parte B. Esta parte asume que `system_activity_log`, `incidents` (con `uniq_inc_open_action_key`), `incident_classes`, `health_checks`, `weekly_reviews` y `agent_ordines` ya existen y estan aplicadas.
- **Registro `AreaModule` (`types.ts`/`areas.ts`), `PrincipiaShell`, NAV_ITEMS, endpoints overview/activity/incidents y vistas Resumen/Incidentes/Registros:** son de Parte C. Esta parte solo agrega las rutas `bandeja`/`area`/`consilium` al grupo ya montado.
- **Promotio, Consilium editable, `SetpointEditor`, `GraduationPanel`, auto-ejecucion, RBAC multi-rol, agente de PR y actuadores de runtime (`open_pr`/`rollback`/`feature_flag` ejecutables):** Fases 2-4 del diseno, fuera de v1. En v1 nada se auto-ejecuta y esas capabilities se renderizan como "propuesta (ejecucion manual)".
