# Vigia / Principia v1 - Plan C/4: Principia shell y vistas de lectura (Fase 1)

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax. This is part C of a 4-part series; execute in order A, B, C, D.

**Goal:** Montar el shell de la **Principia** (centro de mando AI-centered en `/admin/principia`) y el lado de **lectura** del cockpit de la cohorte **Producto / Vigia**: el registro `AreaModule` con las interfaces TS del spec (Producto `live` + 4 cohortes `coming_soon`), el shell de navegacion (Zona A transversal + Zona B cohortes), el NAV_ITEMS y las rutas base, y las tres vistas de lectura con sus endpoints admin-gated: **Resumen** (`api/principia-overview.ts`, veredicto de org con degradacion dead-man's-switch), **Registros** (`api/principia-activity.ts`, paginado en servidor + LogFilterBar) e **Incidentes** (`api/principia-incidents.ts`, lista + timeline). Las vistas de escritura (Bandeja, AreaDetail, Consilium) y sus endpoints llegan en la Parte D.

**Architecture:** El registro `src/lib/principia/areas.ts` (un `AreaModule` por cohorte) es el contrato unico desde el cual el shell, las vistas transversales y la pagina de detalle se escriben una sola vez. El frontend es un shell generico (`PrincipiaShell`) que renderiza Zona A (transversal: Resumen, Bandeja, Incidentes, Registros, Consilium) y Zona B (cohortes desde el registro). Cada vista de lectura tiene un endpoint admin-gated (`api/principia-*.ts`) que valida bearer token contra `admin_users.email` (mismo patron que `api/admin-health.ts`). `principia-overview` computa el veredicto de la organizacion y **degrada a `offline` (gris)** cuando el cron de deteccion esta callado: lee el heartbeat (`last_successful_check_at` / `checked_at` de la fila `source_ref='principia-detect'` en `health_checks`) y si esta stale, no miente verde. `principia-activity` pagina `system_activity_log` en ventanas de 100 filas con facetas. `principia-incidents` sirve la lista filtrable y, por `incident_id`, arma el timeline inmutable desde `system_activity_log`.

**Tech Stack:** React + TypeScript + Vite + TailwindCSS + Framer Motion (front). Vercel serverless en `/api` (no importan entre si ni desde `src/lib`: el gate de admin y las formas se inlinean por archivo). Supabase via `SUPABASE_SERVICE_ROLE_KEY` + `VITE_SUPABASE_URL`. Tests con `node:test` + `node:assert/strict` corridos por `tsx --test`. Copy de usuario: espanol latam neutro (tu, sin voseo, sin guiones). Codigo, identificadores y commits en ingles. Branch: `develop`.

**Depends on: Partes A y B.** Parte A entrega `SEVERITY_COLORS` + `type Severity` en `src/lib/designTokens.ts` y los componentes `Stat`/`BarRow` en `src/components/ui`. Parte B entrega las 6 migraciones (`system_activity_log`, `incidents`, `incident_classes`, `health_checks`, `weekly_reviews`, `agent_ordines`) ya aplicadas, el builder `src/lib/principia/activityLog.ts` y la ingesta inline en los handlers existentes. Esta parte asume que `SEVERITY_COLORS` (claves `alto|medio|sano|offline`), las tablas `incidents` / `system_activity_log` / `health_checks` y el componente `Button` + `useToast` de `src/components/ui` ya existen.

---

## File Structure

| Archivo | Responsabilidad unica |
|---|---|
| `src/lib/principia/types.ts` *(create)* | Interfaces TS compartidas del spec (seccion 5): `AreaModule`, `AreaSetpoint`, `ControlLoop`, `SignalSource`, `RuntimeActionCapability`, `AreaId`. |
| `src/lib/principia/areas.ts` *(create)* | Registro `AREA_MODULES`: Producto `'live'` + 4 cohortes `'coming_soon'`. `getArea()`. |
| `src/lib/principia/areas.test.ts` *(create)* | Unit test de la forma del registro (5 cohortes, solo Producto live, capacidades ejecutables). |
| `api/principia-overview.ts` *(create)* | Endpoint admin-gated: veredicto de org + estado por area + actividad reciente + dead-man's-switch (degrada a `offline` si el detector calla). |
| `api/principia-activity.ts` *(create)* | Endpoint admin-gated: ventana paginada de 100 filas de `system_activity_log` + facetas `area`/`severity`/`event_type`/`incident_id`. |
| `api/principia-incidents.ts` *(create)* | Endpoint admin-gated: lista de incidentes filtrable + timeline por `incident_id` (desde `system_activity_log`). |
| `src/pages/dashboard/principia/PrincipiaShell.tsx` *(create)* | Layout con Zona A (transversal) + Zona B (cohortes desde el registro). |
| `src/pages/dashboard/principia/components/ActivityLogTable.tsx` *(create)* | Tabla de log reusada por Registros/Resumen; severidad solo en el punto, via `SEVERITY_COLORS` con fallback. |
| `src/pages/dashboard/principia/components/LogFilterBar.tsx` *(create)* | Barra de facetas compartida (`area`/`severity`/`event_type`). |
| `src/pages/dashboard/principia/Resumen.tsx` *(create)* | Vista home triage-first: veredicto + mosaicos por cohorte + actividad reciente. |
| `src/pages/dashboard/principia/Registros.tsx` *(create)* | `ActivityLogTable` (paginada en servidor) + `LogFilterBar`. |
| `src/pages/dashboard/principia/Incidentes.tsx` *(create)* | Lista de incidentes + `IncidentTimeline`. |
| `src/App.tsx` *(modify)* | Lazy-load + grupo de rutas anidado `/admin/principia/*` con las rutas BASE (index, registros, incidentes). La Parte D anexa bandeja, area, consilium. |
| `src/pages/Dashboard.tsx` *(modify)* | Entrada `Principia` fija arriba de `NAV_ITEMS`. |

---

## Tasks

> Convencion de commits: rama `develop`. Cada task termina con un commit. Mensaje en ingles, terminado con:
> ```
> Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
> ```

---

### Task 1 - `src/lib/principia/types.ts` + `areas.ts` (registro)

**Files**
- Create: `src/lib/principia/types.ts`
- Create: `src/lib/principia/areas.ts`
- Create: `src/lib/principia/areas.test.ts`

1. - [ ] Crear `src/lib/principia/types.ts` con las interfaces exactas del diseno (seccion 5):
```ts
import type { LucideIcon } from 'lucide-react';

export type AreaId = 'producto' | 'marketing' | 'ventas' | 'personas' | 'finanzas';

export interface AreaSetpoint {
    /** El rumbo definido por el humano + escalacion. Editable en el Consilium (fase posterior). */
    signals: Array<{
        signal_key: string;
        label: string;          // user-facing es (tu, sin voseo, sin guiones)
        comparator: '<' | '>' | '<=' | '>=';
        target: number;
        unit: string;
        loop_id: string;
    }>;
    escalation: { alto: string; medio: string };  // a quien/que canal escala
}

export interface ControlLoop {
    id: string;                 // 'tecnica'|'entrega'|'calidad_ia'|'dashboards'
    label: string;
    status: 'live' | 'sensor_pending';
}

export interface SignalSource {
    id: string;
    kind: 'table' | 'cron' | 'webhook' | 'external_mcp';
    ref: string;                // 'client_errors'|'qa-monitor'|...
    shape: 'threshold' | 'entity';
    existsToday: boolean;       // gatea si el loop muestra datos reales o un stub
    loop_id: string;
}

export interface RuntimeActionCapability {
    type: 'retry' | 'resend_email' | 'trigger_report_recovery' | 'open_pr' | 'rollback' | 'feature_flag';
    executable: boolean;        // hoy: retry/resend/trigger = true; open_pr/rollback/feature_flag = false
}

export interface AreaModule {
    id: AreaId;
    label: string;              // p.ej. "Producto / Salud"
    agentName: string;          // el centurion, p.ej. "Vigia"
    icon: LucideIcon;
    status: 'live' | 'coming_soon';
    setpoint: AreaSetpoint;
    loops: ControlLoop[];
    signalSources: SignalSource[];
    capabilities: RuntimeActionCapability[];
    registroFilter: { area: AreaId };  // faceta sobre system_activity_log
    mandatum: string;           // descripcion del Mandatum (Commentarii), user-facing es
}
```

2. - [ ] Escribir el test que falla. Crear `src/lib/principia/areas.test.ts`:
```ts
// Unit tests for the AreaModule registry shape.
// Run: npx tsx --test src/lib/principia/areas.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA_MODULES, getArea } from './areas.ts';

test('registry has all 5 cohorts', () => {
    assert.deepEqual(AREA_MODULES.map(a => a.id).sort(),
        ['finanzas', 'marketing', 'personas', 'producto', 'ventas']);
});

test('only Producto is live; the other four are coming_soon', () => {
    const live = AREA_MODULES.filter(a => a.status === 'live').map(a => a.id);
    assert.deepEqual(live, ['producto']);
    const soon = AREA_MODULES.filter(a => a.status === 'coming_soon').map(a => a.id).sort();
    assert.deepEqual(soon, ['finanzas', 'marketing', 'personas', 'ventas']);
});

test('Producto exposes real signal sources and executable capabilities', () => {
    const producto = getArea('producto');
    assert.ok(producto.signalSources.length >= 3);
    assert.ok(producto.signalSources.some(s => s.ref === 'client_errors' && s.existsToday));
    assert.ok(producto.signalSources.some(s => s.ref === 'sessions' && s.existsToday));
    const executable = producto.capabilities.filter(c => c.executable).map(c => c.type).sort();
    assert.deepEqual(executable, ['resend_email', 'retry', 'trigger_report_recovery']);
    // PR/rollback/feature_flag are proposals only (not executable) in v1.
    assert.ok(producto.capabilities.filter(c => !c.executable)
        .every(c => ['open_pr', 'rollback', 'feature_flag'].includes(c.type)));
});

test('coming_soon cohorts still expose id/label/agentName/icon/status (no 404 surface)', () => {
    for (const id of ['marketing', 'ventas', 'personas', 'finanzas'] as const) {
        const a = getArea(id);
        assert.equal(typeof a.label, 'string');
        assert.equal(typeof a.agentName, 'string');
        assert.ok(a.icon);
        assert.equal(a.status, 'coming_soon');
    }
});
```

3. - [ ] Correr el test y ver el FAIL:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/lib/principia/areas.test.ts
```
Esperado: FAIL - no existe `./areas.ts`.

4. - [ ] Implementar. Crear `src/lib/principia/areas.ts`:
```ts
import { Activity, Megaphone, DollarSign, Users, Wallet } from 'lucide-react';
import type { AreaModule, AreaId } from './types';

/**
 * The Legion registry. ONE contract per cohort; the shell, transversal views and
 * the generic detail page are written once. Adding a cohort = registering a module.
 * v1: only Producto is 'live' with real signal sources; the other four render as
 * calm 'coming_soon' tiles (never 404) and inherit the shell unchanged.
 */
export const AREA_MODULES: AreaModule[] = [
    {
        id: 'producto',
        label: 'Producto / Salud',
        agentName: 'Vigia',
        icon: Activity,
        status: 'live',
        mandatum: 'Vigia cuida que la odisea funcione: que cada nino termine su sesion, reciba su reporte y que las herramientas del panel respondan. Vigila errores de cliente, recuperaciones de audio, entrega de reportes y la salud de los crons.',
        setpoint: {
            signals: [
                { signal_key: 'client_errors_per_day',  label: 'Errores de cliente por dia',     comparator: '<', target: 5,  unit: 'errores/dia',     loop_id: 'tecnica' },
                { signal_key: 'audio_recoveries_per_day', label: 'Recuperaciones de audio por dia', comparator: '<', target: 10, unit: 'recoveries/dia', loop_id: 'tecnica' },
                { signal_key: 'sessions_without_report',  label: 'Sesiones sin reporte (mas de 4 h)', comparator: '<', target: 1, unit: 'sesiones',     loop_id: 'entrega' },
                { signal_key: 'report_email_delivery',    label: 'Entrega de reporte',               comparator: '>', target: 99, unit: '%',            loop_id: 'entrega' },
            ],
            escalation: { alto: 'telegram+email', medio: 'telegram+email' },
        },
        loops: [
            { id: 'tecnica',    label: 'Salud tecnica', status: 'live' },
            { id: 'entrega',    label: 'Entrega',       status: 'live' },
            { id: 'calidad_ia', label: 'Calidad IA',    status: 'sensor_pending' },
            { id: 'dashboards', label: 'Dashboards y herramientas', status: 'live' },
        ],
        signalSources: [
            { id: 'client_errors',  kind: 'table', ref: 'client_errors',  shape: 'threshold', existsToday: true, loop_id: 'tecnica' },
            { id: 'audio_events',   kind: 'table', ref: 'audio_events',   shape: 'threshold', existsToday: true, loop_id: 'tecnica' },
            { id: 'sessions',       kind: 'table', ref: 'sessions',       shape: 'threshold', existsToday: true, loop_id: 'entrega' },
            { id: 'qa_monitor',     kind: 'cron',  ref: 'qa-monitor',     shape: 'threshold', existsToday: true, loop_id: 'dashboards' },
        ],
        capabilities: [
            { type: 'retry',                   executable: true },
            { type: 'resend_email',            executable: true },
            { type: 'trigger_report_recovery', executable: true },
            { type: 'open_pr',                 executable: false },
            { type: 'rollback',                executable: false },
            { type: 'feature_flag',            executable: false },
        ],
        registroFilter: { area: 'producto' },
    },
    comingSoon('marketing', 'Marketing', 'Praeco', Megaphone,
        'Praeco cuida la presencia de Argo: cadencia de contenido, cobertura de los pilares y rendimiento de las campanas. Modulo en construccion.'),
    comingSoon('ventas', 'Ventas', 'Mercator', DollarSign,
        'Mercator cuida el crecimiento: signups, conversion de trial a pago, MRR y churn. Modulo en construccion.'),
    comingSoon('personas', 'Personas', 'Tribunus', Users,
        'Tribunus cuida a los coaches: activacion, onboarding y adopcion del panel. Modulo en construccion.'),
    comingSoon('finanzas', 'Finanzas', 'Quaestor', Wallet,
        'Quaestor cuida la salud financiera: MRR, costo de IA, margenes y runway. Modulo en construccion.'),
];

function comingSoon(id: AreaId, label: string, agentName: string, icon: AreaModule['icon'], mandatum: string): AreaModule {
    return {
        id, label, agentName, icon, status: 'coming_soon', mandatum,
        setpoint: { signals: [], escalation: { alto: '', medio: '' } },
        loops: [],
        signalSources: [],
        capabilities: [],
        registroFilter: { area: id },
    };
}

export function getArea(id: AreaId): AreaModule {
    const m = AREA_MODULES.find(a => a.id === id);
    if (!m) throw new Error(`Unknown area: ${id}`);
    return m;
}
```

5. - [ ] Correr el test y ver el PASS:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/lib/principia/areas.test.ts
```
Esperado: PASS - 4 tests, 0 fail.

6. - [ ] Verificar copy sin voseo ni guiones en el registro:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node scripts/qa/lint-content.mjs src/lib/principia/areas.ts && echo "CONTENT CLEAN"
```
Esperado: `CONTENT CLEAN` (sin findings de voseo/dash).

7. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/lib/principia/types.ts src/lib/principia/areas.ts src/lib/principia/areas.test.ts && git commit -m "feat(principia): add AreaModule registry (Producto live + 4 coming_soon)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2 - `api/principia-overview.ts` (endpoint admin-gated + dead-man's-switch)

**Files**
- Create: `api/principia-overview.ts`

> El gate de admin es identico al de `api/admin-health.ts`: validar bearer token, `sb.auth.getUser`, allowlist `admin_users.email`. Se inlinea (Vercel `/api` no importa de `src`). El veredicto degrada a `offline` (gris) cuando el cron de deteccion esta callado: no miente verde.

1. - [ ] Crear `api/principia-overview.ts`:
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// NOTE: Vercel /api cannot import from /src. Admin gate + activity shape are inlined.

const DEAD_MAN_DETECT_MINUTES = 20; // 2x the detect cron cadence (10 min)

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

    // 1) Open incidents + pending approvals per area.
    const { data: incRows } = await sb.from('incidents')
        .select('id, area, severity, status, title, last_seen_at')
        .neq('status', 'resolved')
        .order('last_seen_at', { ascending: false });
    const incidents = incRows ?? [];
    const awaitingApproval = incidents.filter(i => i.status === 'awaiting_approval').length;
    const openByArea: Record<string, number> = {};
    for (const i of incidents) openByArea[i.area] = (openByArea[i.area] ?? 0) + 1;

    // 2) Dead-man's-switch: is the detect cron silent?
    const detectCutoff = new Date(Date.now() - DEAD_MAN_DETECT_MINUTES * 60 * 1000).toISOString();
    const { data: lastDetect } = await sb.from('health_checks')
        .select('checked_at')
        .eq('area', 'producto').eq('source_ref', 'principia-detect')
        .order('checked_at', { ascending: false }).limit(1).maybeSingle();
    const detectorSilent = !lastDetect || lastDetect.checked_at < detectCutoff;

    // 3) Org verdict. grey if detector silent (no lying green); amber if open incidents; green otherwise.
    const hasAlto = incidents.some(i => i.severity === 'alto');
    const verdict: 'sano' | 'medio' | 'alto' | 'offline' =
        detectorSilent ? 'offline' : hasAlto ? 'alto' : incidents.length ? 'medio' : 'sano';

    // 4) Recent activity (15 rows).
    const { data: activity } = await sb.from('system_activity_log')
        .select('id, recorded_at, area, source_type, event_type, action, resource_id, severity, status, incident_id')
        .order('recorded_at', { ascending: false }).limit(15);

    return res.status(200).json({
        verdict,
        detectorSilent,
        lastDetectAt: lastDetect?.checked_at ?? null,
        awaitingApproval,
        openByArea,
        incidents: incidents.slice(0, 10),
        recentActivity: activity ?? [],
    });
}
```

2. - [ ] Verificacion de gate (no hay unit test de runtime serverless): confirmar que el endpoint replica el patron de admin-health (allowlist + 403) y degrada a `offline`:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "admin_users" api/principia-overview.ts && grep -c "detectorSilent" api/principia-overview.ts && grep -c "Not authorized" api/principia-overview.ts
```
Esperado: `1`, `2` (calculo + payload), `1`.

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-overview" || echo "NO type errors in principia-overview"
```
Esperado: `NO type errors in principia-overview`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-overview.ts && git commit -m "feat(principia): add admin-gated overview endpoint with dead-man's-switch verdict

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3 - `api/principia-activity.ts` (Registros, paginado en servidor)

**Files**
- Create: `api/principia-activity.ts`

1. - [ ] Crear `api/principia-activity.ts` (ventanas de 100 filas, facetas por `area`/`severity`/`event_type`, filtro opcional por `incident_id`):
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 100;

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

    const page = Math.max(0, parseInt((req.query.page as string) ?? '0', 10) || 0);
    const area = req.query.area as string | undefined;
    const severity = req.query.severity as string | undefined;
    const eventType = req.query.event_type as string | undefined;
    const incidentId = req.query.incident_id as string | undefined;

    let q = sb.from('system_activity_log')
        .select('id, recorded_at, area, source_type, event_type, actor, action, resource_type, resource_id, severity, status, incident_id', { count: 'exact' })
        .order('recorded_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (area && area !== 'all') q = q.eq('area', area);
    if (severity && severity !== 'all') q = q.eq('severity', severity);
    if (eventType && eventType !== 'all') q = q.eq('event_type', eventType);
    if (incidentId) q = q.eq('incident_id', parseInt(incidentId, 10));

    const { data, count, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
        rows: data ?? [],
        page,
        pageSize: PAGE_SIZE,
        total: count ?? 0,
        hasMore: (count ?? 0) > (page + 1) * PAGE_SIZE,
    });
}
```

2. - [ ] Verificacion de paginacion:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "PAGE_SIZE = 100" api/principia-activity.ts && grep -c "incident_id" api/principia-activity.ts
```
Esperado: `1` y `2` (filtro query + select column).

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-activity" || echo "NO type errors in principia-activity"
```
Esperado: `NO type errors in principia-activity`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-activity.ts && git commit -m "feat(principia): add server-paginated activity endpoint (Registros)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4 - `api/principia-incidents.ts` (lista + timeline)

**Files**
- Create: `api/principia-incidents.ts`

> El endpoint sirve dos formas: sin `id`, la lista filtrable por `area`/`status`; con `id`, el incidente + su timeline inmutable armado desde `system_activity_log` por `incident_id`.

1. - [ ] Crear `api/principia-incidents.ts`:
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

    const id = req.query.id as string | undefined;
    if (id) {
        // Detail: incident + its immutable timeline from system_activity_log.
        const { data: incident } = await sb.from('incidents').select('*').eq('id', parseInt(id, 10)).maybeSingle();
        if (!incident) return res.status(404).json({ error: 'Incident not found' });
        const { data: timeline } = await sb.from('system_activity_log')
            .select('id, recorded_at, source_type, event_type, actor, action, severity, status, reason, result')
            .eq('incident_id', parseInt(id, 10))
            .order('recorded_at', { ascending: true });
        return res.status(200).json({ incident, timeline: timeline ?? [] });
    }

    // List: filterable by area + status.
    const area = req.query.area as string | undefined;
    const status = req.query.status as string | undefined;
    let q = sb.from('incidents')
        .select('id, area, loop_id, agent, kind, title, severity, status, signal_count, first_seen_at, last_seen_at, resolved_at')
        .order('last_seen_at', { ascending: false }).limit(200);
    if (area && area !== 'all') q = q.eq('area', area);
    if (status && status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ incidents: data ?? [] });
}
```

2. - [ ] Verificacion: el detalle de incidente arma el timeline desde el log por `incident_id`:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "incident_id" api/principia-incidents.ts && grep -c "Incident not found" api/principia-incidents.ts
```
Esperado: `1` y `1`.

3. - [ ] Typecheck:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep "principia-incidents" || echo "NO type errors in principia-incidents"
```
Esperado: `NO type errors in principia-incidents`.

4. - [ ] Commit:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add api/principia-incidents.ts && git commit -m "feat(principia): add incidents list/timeline endpoint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 - `PrincipiaShell` + routing base + NAV_ITEMS

**Files**
- Create: `src/pages/dashboard/principia/PrincipiaShell.tsx`
- Modify: `src/App.tsx` (lazy block: anclar tras `const AdminAuditLog   = lazy(...)`; route group: dentro del `<Route path="admin" ...>`)
- Modify: `src/pages/Dashboard.tsx` (import icon: anclar en el bloque de imports de `lucide-react` que cierra con `} from 'lucide-react';`; NAV_ITEMS: anclar en `const NAV_ITEMS = [`)

> El shell monta Zona A (transversal) con las cinco entradas (Resumen, Bandeja, Incidentes, Registros, Consilium) y Zona B (cohortes desde el registro). Las rutas para Bandeja, Consilium y `area/:areaId` se anexan en la Parte D; aqui solo se registran las rutas BASE (index = Resumen, registros, incidentes) y solo se lazy-cargan esas tres vistas (las otras todavia no existen como archivo, asi que no se importan). Los links de Bandeja/Consilium en el riel quedan visibles desde ya; al hacer click sin la ruta registrada caen en el catch-all del router hasta que la Parte D los conecte.

1. - [ ] Crear `src/pages/dashboard/principia/PrincipiaShell.tsx` con el riel izquierdo (Zona A transversal + Zona B cohortes desde el registro):
```tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, AlertTriangle, ScrollText, CalendarDays } from 'lucide-react';
import { AREA_MODULES } from '../../../lib/principia/areas';
import { SEVERITY_COLORS } from '../../../lib/designTokens';

const ZONE_A = [
    { to: '/admin/principia',            label: 'Resumen',    icon: LayoutDashboard, end: true },
    { to: '/admin/principia/bandeja',    label: 'Bandeja',    icon: Inbox },
    { to: '/admin/principia/incidentes', label: 'Incidentes', icon: AlertTriangle },
    { to: '/admin/principia/registros',  label: 'Registros',  icon: ScrollText },
    { to: '/admin/principia/consilium',  label: 'Consilium',  icon: CalendarDays },
];

export const PrincipiaShell: React.FC = () => {
    return (
        <div className="flex min-h-full">
            <aside className="w-60 shrink-0 border-r border-argo-border bg-white px-3 py-4">
                <p className="px-2 text-xs font-semibold uppercase tracking-widest text-argo-grey">Transversal</p>
                <nav className="mt-2 space-y-0.5">
                    {ZONE_A.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium ${
                                    isActive ? 'bg-argo-bg text-argo-navy' : 'text-argo-secondary hover:bg-argo-bg'
                                }`}>
                            <Icon size={16} /> {label}
                        </NavLink>
                    ))}
                </nav>

                <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-widest text-argo-grey">Cohortes</p>
                <nav className="mt-2 space-y-0.5">
                    {AREA_MODULES.map(({ id, label, agentName, icon: Icon, status }) => {
                        const live = status === 'live';
                        const dot = live ? SEVERITY_COLORS.sano.dot : SEVERITY_COLORS.offline.dot;
                        return (
                            <NavLink key={id} to={`/admin/principia/area/${id}`}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                                        isActive ? 'bg-argo-bg text-argo-navy' : 'text-argo-secondary hover:bg-argo-bg'
                                    }`}>
                                <span className={`h-2 w-2 rounded-full ${dot}`} />
                                <Icon size={15} className="opacity-70" />
                                <span className="flex-1 truncate">{label} - {agentName}</span>
                                <span className="text-xs text-argo-light">{live ? 'EN VIVO' : 'proximamente'}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>
            <section className="flex-1 min-w-0 p-6">
                <Outlet />
            </section>
        </div>
    );
};
```

2. - [ ] `src/App.tsx` - lazy-load. Anclar tras la linea `const AdminAuditLog   = lazy(() => import('./pages/dashboard/AdminAuditLog')...);` (junto a los demas admin lazies). Añadir SOLO los lazies de las vistas que existen en esta parte (Shell, Resumen, Registros, Incidentes):
```tsx
const PrincipiaShell      = lazy(() => import('./pages/dashboard/principia/PrincipiaShell').then(m => ({ default: m.PrincipiaShell })));
const PrincipiaResumen     = lazy(() => import('./pages/dashboard/principia/Resumen').then(m => ({ default: m.Resumen })));
const PrincipiaRegistros   = lazy(() => import('./pages/dashboard/principia/Registros').then(m => ({ default: m.Registros })));
const PrincipiaIncidentes  = lazy(() => import('./pages/dashboard/principia/Incidentes').then(m => ({ default: m.Incidentes })));
```
> Los lazies de `PrincipiaBandeja`, `PrincipiaAreaDetail` y `PrincipiaConsilium` se anaden en la Parte D, cuando esos archivos existan. Anadirlos aqui rompe el build (import a archivo inexistente).

3. - [ ] `src/App.tsx` - grupo de rutas BASE. Dentro del `<Route path="admin" ...>` (anclar por el grupo que contiene `<Route path="sessions" .../>`), anadir como hijo el grupo de Principia con las rutas base (index, registros, incidentes):
```tsx
                    <Route path="principia" element={<PrincipiaShell />}>
                        <Route index             element={<PrincipiaResumen />} />
                        <Route path="registros"  element={<PrincipiaRegistros />} />
                        <Route path="incidentes" element={<PrincipiaIncidentes />} />
                    </Route>
```
> La Parte D anexa, DENTRO de este mismo grupo, las rutas `bandeja`, `area/:areaId` y `consilium`. No anadir aqui stubs que apunten a `PrincipiaResumen`: cada ruta se conecta cuando su vista exista.

4. - [ ] `src/pages/Dashboard.tsx` - NAV_ITEMS. Importar el icono `Compass` (anclar en el bloque de imports de `lucide-react` que cierra con `} from 'lucide-react';`, anadir `Compass` a la lista) y poner Principia **fija arriba de todo** en `NAV_ITEMS` (anclar en `const NAV_ITEMS = [`, insertar como primer item antes de `{ to: '/admin/sessions', ... }`):
```tsx
    { to: '/admin/principia', label: 'Principia', icon: Compass },
    { to: '/admin/sessions',  label: 'Sesiones',  icon: Users },
```

5. - [ ] Verificacion: rutas y nav cableadas (las rutas base, NO bandeja/area/consilium):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "PrincipiaShell" src/App.tsx && grep -c "'/admin/principia'" src/pages/Dashboard.tsx && grep -c "path=\"incidentes\"" src/App.tsx && grep -c "path=\"registros\"" src/App.tsx
```
Esperado: `2` (lazy + route element), `1`, `1`, `1`.

6. - [ ] No commitear todavia: las vistas hijas (`Resumen`, `Registros`, `Incidentes`) aun no existen, asi que `tsc`/build fallaran. Se commitea junto en la Task 7 tras crear todas las vistas. Dejar el shell y el routing base listos.

---

### Task 6 - Vistas: Resumen, Registros (ActivityLogTable + LogFilterBar)

**Files**
- Create: `src/pages/dashboard/principia/components/LogFilterBar.tsx`
- Create: `src/pages/dashboard/principia/components/ActivityLogTable.tsx`
- Create: `src/pages/dashboard/principia/Resumen.tsx`
- Create: `src/pages/dashboard/principia/Registros.tsx`

1. - [ ] Crear `src/pages/dashboard/principia/components/LogFilterBar.tsx` (facetas compartidas):
```tsx
import React from 'react';

export interface LogFilters { area: string; severity: string; eventType: string; }

const AREAS = ['all', 'producto', 'marketing', 'ventas', 'personas', 'finanzas', 'sistema'];
const SEVERITIES = ['all', 'alto', 'medio', 'sano', 'offline'];
const EVENT_TYPES = ['all', 'user_action', 'ai_decision', 'health_check', 'delivery', 'audit'];

export const LogFilterBar: React.FC<{ value: LogFilters; onChange: (f: LogFilters) => void }> = ({ value, onChange }) => {
    const sel = 'rounded-lg border border-argo-border bg-white px-2 py-1 text-sm text-argo-secondary';
    return (
        <div className="flex flex-wrap gap-2">
            <select className={sel} value={value.area} onChange={e => onChange({ ...value, area: e.target.value })}>
                {AREAS.map(a => <option key={a} value={a}>{a === 'all' ? 'Toda area' : a}</option>)}
            </select>
            <select className={sel} value={value.severity} onChange={e => onChange({ ...value, severity: e.target.value })}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s === 'all' ? 'Toda severidad' : s}</option>)}
            </select>
            <select className={sel} value={value.eventType} onChange={e => onChange({ ...value, eventType: e.target.value })}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'Todo tipo' : t}</option>)}
            </select>
        </div>
    );
};
```

2. - [ ] Crear `src/pages/dashboard/principia/components/ActivityLogTable.tsx` (severidad solo en el punto, via `SEVERITY_COLORS` con fallback `?.`; `severity` puede ser `'info'` u otro valor fuera del mapa, por eso el fallback nunca indexa `undefined`):
```tsx
import React from 'react';
import { SEVERITY_COLORS, type Severity } from '../../../../lib/designTokens';

export interface ActivityRow {
    id: number; recorded_at: string; area: string; source_type: string;
    event_type: string; action: string; resource_id: string | null;
    severity: string | null; status: string | null; incident_id?: number | null;
}

export const ActivityLogTable: React.FC<{ rows: ActivityRow[] }> = ({ rows }) => {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-argo-border text-left text-xs uppercase tracking-widest text-argo-grey">
                    <th className="py-2 pr-3">Hora</th><th className="pr-3">Area</th><th className="pr-3">Origen</th>
                    <th className="pr-3">Tipo</th><th className="pr-3">Accion</th><th className="pr-3">Recurso</th><th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(r => {
                    const sev = (r.severity ?? 'sano') as Severity;
                    const dot = SEVERITY_COLORS[sev]?.dot ?? SEVERITY_COLORS.sano.dot;
                    return (
                        <tr key={r.id} className="border-b border-argo-border/60 text-argo-secondary">
                            <td className="py-1.5 pr-3 font-mono text-xs">{new Date(r.recorded_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="pr-3">{r.area}</td>
                            <td className="pr-3">{r.source_type}</td>
                            <td className="pr-3">{r.event_type}</td>
                            <td className="pr-3 text-argo-navy">{r.action}</td>
                            <td className="pr-3 font-mono text-xs truncate max-w-[160px]" title={r.resource_id ?? ''}>{r.resource_id ?? '.'}</td>
                            <td><span className={`inline-block h-2 w-2 rounded-full ${dot}`} title={sev} /> <span className="text-xs">{r.status ?? ''}</span></td>
                        </tr>
                    );
                })}
                {rows.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-argo-grey">Sin registros para estos filtros.</td></tr>
                )}
            </tbody>
        </table>
    );
};
```

3. - [ ] Crear `src/pages/dashboard/principia/Registros.tsx` (paginacion de 100 en servidor):
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ActivityLogTable, type ActivityRow } from './components/ActivityLogTable';
import { LogFilterBar, type LogFilters } from './components/LogFilterBar';
import { Button } from '../../../components/ui';

export const Registros: React.FC = () => {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [filters, setFilters] = useState<LogFilters>({ area: 'all', severity: 'all', eventType: 'all' });
    const [loading, setLoading] = useState(true);

    const fetchPage = useCallback(async (p: number, f: LogFilters) => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        const qs = new URLSearchParams({ page: String(p), area: f.area, severity: f.severity, event_type: f.eventType });
        const res = await fetch(`/api/principia-activity?${qs}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const body = await res.json().catch(() => ({ rows: [], hasMore: false }));
        setRows(body.rows ?? []); setHasMore(!!body.hasMore); setLoading(false);
    }, []);

    useEffect(() => { fetchPage(page, filters); }, [page, filters, fetchPage]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Registros</h1>
            <p className="mt-1 text-sm text-argo-grey">Los registros de todo. Ventanas de 100 filas.</p>
            <div className="mt-4"><LogFilterBar value={filters} onChange={f => { setPage(0); setFilters(f); }} /></div>
            <div className="mt-4 rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                {loading ? <p className="py-6 text-center text-argo-grey">Cargando...</p> : <ActivityLogTable rows={rows} />}
            </div>
            <div className="mt-4 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</Button>
                <span className="text-sm text-argo-grey">Pagina {page + 1}</span>
                <Button variant="secondary" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
        </div>
    );
};
```

4. - [ ] Crear `src/pages/dashboard/principia/Resumen.tsx` (triage-first: veredicto + mosaicos + actividad reciente; `SEVERITY_COLORS` indexado con fallback `?.` por si el veredicto llega fuera del mapa):
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, type Severity } from '../../../lib/designTokens';
import { ActivityLogTable, type ActivityRow } from './components/ActivityLogTable';
import { AREA_MODULES } from '../../../lib/principia/areas';

interface Overview {
    verdict: Severity; detectorSilent: boolean; lastDetectAt: string | null;
    awaitingApproval: number; openByArea: Record<string, number>;
    incidents: Array<{ id: number; area: string; severity: string; status: string; title: string }>;
    recentActivity: ActivityRow[];
}

const VERDICT_COPY: Record<Severity, string> = {
    sano: 'Todo operativo. Vigia esta observando.',
    medio: 'Hay incidentes abiertos. Revisa la Bandeja.',
    alto: 'Atencion: un incidente ALTO requiere tu decision.',
    offline: 'Vigia sin senal. El detector no esta escribiendo. Revisa el cron.',
};

export const Resumen: React.FC = () => {
    const [data, setData] = useState<Overview | null>(null);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/principia-overview', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setData(await res.json());
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    if (!data) return <p className="text-argo-grey">Cargando...</p>;
    const v = SEVERITY_COLORS[data.verdict] ?? SEVERITY_COLORS.sano;

    return (
        <div>
            <div className={`flex items-center gap-3 rounded-[14px] border p-4 ${v.chip}`}>
                <span className={`h-3 w-3 rounded-full ${v.dot}`} />
                <p className="font-semibold">{VERDICT_COPY[data.verdict] ?? VERDICT_COPY.sano}</p>
                {data.awaitingApproval > 0 && <span className="ml-auto text-sm">{data.awaitingApproval} esperan tu aprobacion</span>}
            </div>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-argo-grey">Estado por cohorte</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {AREA_MODULES.map(a => {
                    const open = data.openByArea[a.id] ?? 0;
                    const sev: Severity = a.status !== 'live' ? 'offline' : open ? 'medio' : 'sano';
                    return (
                        <div key={a.id} className="rounded-lg border border-argo-border bg-white px-3 py-2">
                            <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${(SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.sano).dot}`} />
                                <span className="text-sm font-medium text-argo-navy">{a.label}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-argo-grey">{a.status === 'live' ? `${open} abiertos` : 'proximamente'}</p>
                        </div>
                    );
                })}
            </div>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-argo-grey">Actividad reciente</h2>
            <div className="mt-2 rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                <ActivityLogTable rows={data.recentActivity} />
            </div>
        </div>
    );
};
```

5. - [ ] Verificacion de copy (sin voseo/dash en las 4 vistas nuevas):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node scripts/qa/lint-content.mjs src/pages/dashboard/principia/Resumen.tsx src/pages/dashboard/principia/Registros.tsx src/pages/dashboard/principia/components/LogFilterBar.tsx src/pages/dashboard/principia/components/ActivityLogTable.tsx && echo "CONTENT CLEAN"
```
Esperado: `CONTENT CLEAN`.

6. - [ ] No commitear todavia: falta Incidentes (mismo build). Continuar Task 7.

---

### Task 7 - Vista: Incidentes (lista + IncidentTimeline)

**Files**
- Create: `src/pages/dashboard/principia/Incidentes.tsx`

1. - [ ] Crear `src/pages/dashboard/principia/Incidentes.tsx` (lista + timeline desde `system_activity_log`; el punto de severidad indexa `SEVERITY_COLORS` con fallback `?.` porque `severity` puede llegar como `'info'` u otro valor fuera del mapa):
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, type Severity } from '../../../lib/designTokens';

interface IncidentRow { id: number; area: string; loop_id: string; title: string; severity: string; status: string; signal_count: number; first_seen_at: string; last_seen_at: string; }
interface TimelineRow { id: number; recorded_at: string; event_type: string; action: string; severity: string | null; status: string | null; }

export const Incidentes: React.FC = () => {
    const [list, setList] = useState<IncidentRow[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [timeline, setTimeline] = useState<TimelineRow[]>([]);

    const fetchList = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/principia-incidents', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setList(b.incidents ?? []); }
    }, []);
    useEffect(() => { fetchList(); }, [fetchList]);

    const openDetail = useCallback(async (id: number) => {
        setSelected(id);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/principia-incidents?id=${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) { const b = await res.json(); setTimeline(b.timeline ?? []); }
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-argo-navy">Incidentes</h1>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[14px] border border-argo-border bg-white p-2 shadow-argo">
                    {list.map(i => {
                        // severity may be 'info' (observations); guard the index with ?.
                        const sev = (i.severity ?? 'sano') as Severity;
                        const dot = (SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.sano).dot;
                        return (
                            <button key={i.id} onClick={() => openDetail(i.id)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${selected === i.id ? 'bg-argo-bg' : 'hover:bg-argo-bg'}`}>
                                <span className={`h-2 w-2 rounded-full ${dot}`} />
                                <span className="flex-1 text-argo-navy">{i.title}</span>
                                <span className="text-xs text-argo-grey">{i.status}</span>
                            </button>
                        );
                    })}
                    {list.length === 0 && <p className="py-6 text-center text-argo-grey">Sin incidentes.</p>}
                </div>
                <div className="rounded-[14px] border border-argo-border bg-white p-4 shadow-argo">
                    {selected == null ? <p className="text-argo-grey">Elige un incidente para ver su linea de tiempo.</p> : (
                        <ol className="space-y-2">
                            {timeline.map(t => (
                                <li key={t.id} className="flex items-start gap-2 text-sm">
                                    <span className="font-mono text-xs text-argo-grey">{new Date(t.recorded_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                    <span className="text-argo-navy">{t.action}</span>
                                    <span className="text-xs text-argo-grey">{t.status}</span>
                                </li>
                            ))}
                            {timeline.length === 0 && <p className="text-argo-grey">Sin transiciones registradas.</p>}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
};
```

2. - [ ] Verificacion de copy en Incidentes:
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && node scripts/qa/lint-content.mjs src/pages/dashboard/principia/Incidentes.tsx && echo "CONTENT CLEAN"
```
Esperado: `CONTENT CLEAN`.

3. - [ ] Build de tipos del front (shell + routing base + las tres vistas de lectura ya existen):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit 2>&1 | grep -E "principia|PrincipiaShell|App\.tsx|Dashboard\.tsx" || echo "NO type errors in Principia read views"
```
Esperado: `NO type errors in Principia read views`.

4. - [ ] Build de produccion (smoke):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npm run build 2>&1 | tail -5
```
Esperado: build exitoso (`built in ...`), sin errores.

5. - [ ] Commit de todo el frontend de lectura Principia (shell + routing base + nav + las tres vistas de lectura + componentes):
```bash
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/pages/dashboard/principia/ src/App.tsx src/pages/Dashboard.tsx && git commit -m "feat(principia): add cockpit shell, base routing, nav, and read views (Resumen/Registros/Incidentes)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notas de la Parte C

- **Rutas base solo.** Esta parte registra `index` (Resumen), `registros` e `incidentes`. La Parte D anexa, en el mismo grupo `<Route path="principia" ...>`, las rutas `bandeja`, `area/:areaId` y `consilium`, mas sus lazies. El shell ya muestra esos links en el riel; quedan inertes hasta que la Parte D los conecte.
- **`?.` en `SEVERITY_COLORS`.** Las tres vistas y `ActivityLogTable` indexan `SEVERITY_COLORS` con fallback (`SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.sano` / `SEVERITY_COLORS[sev]?.dot ?? ...`). El veredicto del overview es `alto|medio|sano|offline` (siempre en el mapa), pero los incidentes y las filas de actividad pueden traer `severity='info'` (observaciones, fase posterior), fuera del mapa: el fallback evita indexar `undefined`.
- **Gate de admin.** Los tres endpoints replican el patron de `api/admin-health.ts`: bearer token, `sb.auth.getUser`, allowlist `admin_users.email`, `403 Not authorized`. Vercel `/api` no importa de `src`, asi que el gate va inline en cada archivo.
- **Dead-man's-switch.** `principia-overview` no se fia del verde: si no hay heartbeat reciente de `source_ref='principia-detect'` en `health_checks` (cutoff 20 min = 2x la cadencia del cron de 10 min), el veredicto cae a `offline` (gris) y la copy lo dice. El cron que escribe ese heartbeat y el canal out-of-band viven en la Parte D.
