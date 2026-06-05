# Vigia / Principia v1 - Plan B/4: Columna vertebral de datos (Fase 1)

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax. This is part B of a 4-part series; execute in order A, B, C, D.

**Goal:** Build the persistent data spine for Principia (the admin command center at `/admin/principia`) and wire real product events into it. Six area-tagged Supabase tables become the single source of truth for the timeline, incidents, sensors, weekly snapshots, and the centurion backlog. Then six real serverless handlers start emitting `system_activity_log` rows (and, at payment time, area=ventas events) without changing any existing API behavior. This part ships zero UI; it is the foundation Parts C and D read from.

**Architecture:** Append-only event log (`system_activity_log`, partitioned by month) plus a single mutable state table (`incidents`) whose `status=awaiting_approval` rows are the Bandeja. A lean `incident_classes` catalog (id/area/loop_id/key/label/autonomy_mode) seeds the 4 Producto classes. `health_checks` stores sensor-vs-setpoint readings with `last_successful_check_at` for the dead-man's-switch. `weekly_reviews` holds the read-only Consilium snapshot (table only here; the view is Part D). `agent_ordines` is the Vigia centurion backlog. All six tables carry an `area` column (`producto|marketing|ventas|personas|finanzas|sistema`). A pure builder (`activityLog.ts`) constructs rows; six handlers call its writer inline, best-effort, never blocking the user path.

**Tech Stack:** Supabase (PostgreSQL) migrations with RLS-on/no-policies (service-role only). TypeScript serverless handlers on Vercel (`@supabase/supabase-js`, `createClient` with `SUPABASE_SERVICE_ROLE_KEY`). Pure logic unit-tested with `node:test` via `tsx --test` (the repo's existing runner). Code/comments/commits in English; user-facing copy (none in this part) would be spanish tu.

**Depends on: Parte A** (design-system tokens: `SEVERITY_COLORS`, extracted `Stat`/`BarRow`). Part B does not import them, but the series executes A first.

## File Structure

Created:
- `supabase/migrations/20260605_principia_activity_log.sql` - append-only timeline, partitioned by month, area-tagged.
- `supabase/migrations/20260605_principia_incidents.sql` - single mutable incident state table; lifecycle + partial-unique idempotency index; `class_id BIGINT` with NO hard FK.
- `supabase/migrations/20260605_principia_incident_classes.sql` - lean class catalog (id/area/loop_id/key/label/autonomy_mode) + seed of 4 Producto classes.
- `supabase/migrations/20260605_principia_health_checks.sql` - sensor-vs-setpoint readings with `last_successful_check_at`.
- `supabase/migrations/20260605_principia_weekly_reviews.sql` - read-only Consilium snapshot store (table only).
- `supabase/migrations/20260605_principia_agent_ordines.sql` - Vigia centurion backlog.
- `src/lib/principia/activityLog.ts` - pure `buildActivityRow()` + best-effort `logActivity()` writer. Single responsibility: one canonical activity-row shape.
- `src/lib/principia/activityLog.test.ts` - `node:test` coverage of `buildActivityRow()`.

Modified:
- `api/admin-tenants.ts` - inside the real `auditLog()` function (line 99), also emit one area=sistema `system_activity_log` row per admin action (governance double-write).
- `api/one-webhook.ts` - emit area=ventas `payment_received` at BOTH paid-confirmation sites: Stripe (after the `payment_status: 'paid'` update near `payment_id: session.id`) AND MercadoPago (after the update near `payment_id: String(resourceId)`).
- `api/send-email.ts` - emit area=producto `report_email_sent` after the success stamp; emit `report_email_failed` (severity medio) in the error branch.
- `api/report-recovery-cron.ts` - emit area=producto `report_recovered` after the successful `send-email` POST, in the `r.emailed = true` branch.
- `api/session.ts` - emit area=producto `session_completed` after the successful `:save` insert (using `saveData.id`), just before the success return.

NOT touched in this part (owned elsewhere): `api/qa-monitor.ts` (Part D owns its emission + dead-man's-switch). No UI, no endpoints, no cron creation here.

## Tasks

### Task 1: Migration - system_activity_log (append-only, partitioned by month)

**Files:**
- Create: `supabase/migrations/20260605_principia_activity_log.sql`

Append-only timeline. Every other part reads from it. Partitioned by month so the table stays prunable; one current + one next-month partition is created now (a future cron or manual step adds more, out of scope here). RLS on, no policies: service role only, same as `webhook_events`/`ai_events`.

- [ ] Write the complete migration:

```sql
-- Principia / Vigia v1 — append-only activity timeline.
-- Every product/marketing/ventas/etc. event of interest lands here as one
-- immutable row. Parts C/D render it (Registros tab) and the detect cron reads
-- it to derive sensor readings. Partitioned by month so old months can be
-- pruned/detached cheaply. Service-role only (RLS on, no policies) — same
-- pattern as webhook_events / ai_events.
CREATE TABLE IF NOT EXISTS system_activity_log (
    id            BIGSERIAL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    area          TEXT         NOT NULL,            -- producto|marketing|ventas|personas|finanzas|sistema
    source_type   TEXT         NOT NULL DEFAULT 'system', -- system|human|agent
    action        TEXT         NOT NULL,            -- e.g. session_completed, payment_received, report_email_failed
    severity      TEXT         NOT NULL DEFAULT 'info',   -- info|sano|medio|alto|offline
    entity_type   TEXT,                             -- design-for-5: e.g. 'session','one_purchase','tenant'
    entity_ref    TEXT,                             -- opaque id of the entity above
    summary       TEXT,                             -- short human-readable line
    detail        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    related_logs  TEXT[]       NOT NULL DEFAULT '{}',
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Current + next month partitions. Add more ahead of time before they are
-- needed (manual or future cron — out of scope for v1).
CREATE TABLE IF NOT EXISTS system_activity_log_2026_06
    PARTITION OF system_activity_log
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS system_activity_log_2026_07
    PARTITION OF system_activity_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX IF NOT EXISTS system_activity_log_area_created_idx
    ON system_activity_log (area, created_at DESC);
CREATE INDEX IF NOT EXISTS system_activity_log_action_created_idx
    ON system_activity_log (action, created_at DESC);

-- Service role only.
ALTER TABLE system_activity_log ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
```

- [ ] Verify the SQL parses and the partition syntax is valid (manual check; this repo applies migrations through the Supabase MCP/dashboard, not a local stack):
  - Confirm the parent is `PARTITION BY RANGE (created_at)` and the PK is composite `(id, created_at)` (Postgres requires the partition key in the PK).
  - Confirm both child partitions name unique ranges that do not overlap.
- [ ] Commit:

```
git add supabase/migrations/20260605_principia_activity_log.sql
git commit -m "feat(principia): system_activity_log append-only timeline, partitioned by month

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 2: Migration - incidents (single mutable state source)

**Files:**
- Create: `supabase/migrations/20260605_principia_incidents.sql`

The single mutable state source. The Bandeja queries `status = 'awaiting_approval'`. Idempotency uses a PARTIAL UNIQUE index on `(area, action_key)` for not-yet-closed incidents (fix 6) — a unique index on `(id, action_key)` would be a no-op because `id` is already the PK. `class_id` is `BIGINT` and intentionally drops the hard `REFERENCES incident_classes(id)` foreign key (see note), so this migration can run before the classes table exists and partition/order concerns never block it.

- [ ] Write the complete migration:

```sql
-- Principia / Vigia v1 — incidents: the single mutable state source.
-- One row per open issue/observation. The Bandeja (approval inbox) is exactly
-- `SELECT ... WHERE status = 'awaiting_approval'`. The detect cron upserts here;
-- the actuator + verify-loop mutate status forward.
--
-- NOTE: class_id is a *logical* reference to incident_classes(id). We
-- deliberately DROP the hard `REFERENCES incident_classes(id)` foreign key:
-- it lets this migration run independently of table-creation order and keeps
-- the classes catalog editable without FK churn. Integrity is enforced in app
-- code (the detect cron only writes known class ids). Diverges intentionally
-- from the spec SQL, which shows a hard FK.
CREATE TABLE IF NOT EXISTS incidents (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area            TEXT        NOT NULL,            -- producto|marketing|ventas|personas|finanzas|sistema
    class_id        BIGINT,                          -- logical FK to incident_classes(id); NO hard REFERENCES
    action_key      TEXT        NOT NULL,            -- dedupe key, e.g. 'report_email_unsent'
    status          TEXT        NOT NULL DEFAULT 'open',
        -- open|diagnosing|proposed|awaiting_approval|acting|verifying|resolved|snoozed
    severity        TEXT        NOT NULL DEFAULT 'medio', -- alto|medio|sano|offline|info
    title           TEXT        NOT NULL,
    summary         TEXT,
    proposed_action JSONB,                           -- { type, label, params } or null
    entity_type     TEXT,                            -- design-for-5 (e.g. 'session')
    entity_ref      TEXT,
    signal_count    INTEGER     NOT NULL DEFAULT 1,  -- collapsed duplicate signals
    last_signal_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snoozed_until   TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    related_logs    TEXT[]      NOT NULL DEFAULT '{}',
    detail          JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Idempotency (fix 6): at most ONE not-yet-closed incident per (area, action_key).
-- The detect cron RELIES on this partial unique index for dedupe (insert; on
-- conflict, bump signal_count instead of creating a twin). A plain unique on
-- (id, action_key) would be a no-op since id is the PK.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_incident_open_per_action
    ON incidents (area, action_key)
    WHERE status NOT IN ('resolved', 'snoozed');

-- The Bandeja query (status = 'awaiting_approval') gets its own index.
CREATE INDEX IF NOT EXISTS incidents_inbox_idx
    ON incidents (status, severity, last_signal_at DESC)
    WHERE status = 'awaiting_approval';

CREATE INDEX IF NOT EXISTS incidents_area_status_idx
    ON incidents (area, status, last_signal_at DESC);

-- Service role only.
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
```

- [ ] Verify (manual check):
  - The partial unique index predicate is `WHERE status NOT IN ('resolved','snoozed')` — confirm this matches the dedupe story the detect cron (Part D) relies on.
  - Confirm `class_id` has NO `REFERENCES` clause and the comment documents that this is intentional.
  - Confirm `severity` allows `info` (observations) in addition to `alto|medio|sano|offline`.
- [ ] Commit:

```
git add supabase/migrations/20260605_principia_incidents.sql
git commit -m "feat(principia): incidents state table with partial-unique idempotency index

class_id is a logical FK (no hard REFERENCES); dedupe via partial unique on
(area, action_key) for not-yet-closed incidents.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 3: Migration - incident_classes (lean) + seed 4 Producto classes

**Files:**
- Create: `supabase/migrations/20260605_principia_incident_classes.sql`

LEAN catalog: exactly `id/area/loop_id/key/label/autonomy_mode`. No counters, no thresholds (those are Fase 2+). Seed the 4 Producto classes the fast clock cares about.

- [ ] Write the complete migration:

```sql
-- Principia / Vigia v1 — incident_classes: the LEAN catalog of known issue
-- types. Exactly id/area/loop_id/key/label/autonomy_mode — no counters, no
-- thresholds (those are Fase 2+). incidents.class_id points here logically.
CREATE TABLE IF NOT EXISTS incident_classes (
    id            BIGSERIAL PRIMARY KEY,
    area          TEXT NOT NULL,                     -- producto|marketing|ventas|personas|finanzas|sistema
    loop_id       TEXT NOT NULL,                     -- which control loop owns this class
    key           TEXT NOT NULL UNIQUE,              -- stable machine key (also used as action_key seed)
    label         TEXT NOT NULL,                     -- human label (es)
    autonomy_mode TEXT NOT NULL DEFAULT 'propose'    -- observe|propose|act_with_approval
);

-- Seed the 4 Producto classes the Producto fast clock watches in v1.
INSERT INTO incident_classes (area, loop_id, key, label, autonomy_mode) VALUES
    ('producto', 'report_delivery', 'report_email_unsent',  'Reporte sin enviar',           'act_with_approval'),
    ('producto', 'report_delivery', 'report_ai_missing',    'Reporte sin generar (IA)',     'act_with_approval'),
    ('producto', 'report_delivery', 'report_email_failed',  'Fallo al enviar el reporte',   'act_with_approval'),
    ('producto', 'session_health',  'session_save_failed',  'Sesion no guardada',           'propose')
ON CONFLICT (key) DO NOTHING;

-- Service role only.
ALTER TABLE incident_classes ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
```

- [ ] Verify (manual check):
  - Exactly 6 columns: `id, area, loop_id, key, label, autonomy_mode`. No `count_*`, no `threshold`, no `created_at` clutter beyond the catalog shape.
  - Exactly 4 seed rows, all `area='producto'`.
  - `key` is UNIQUE and `ON CONFLICT (key) DO NOTHING` keeps the seed idempotent on re-run.
- [ ] Commit:

```
git add supabase/migrations/20260605_principia_incident_classes.sql
git commit -m "feat(principia): lean incident_classes catalog + seed 4 Producto classes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 4: Migration - health_checks (sensor vs setpoint)

**Files:**
- Create: `supabase/migrations/20260605_principia_health_checks.sql`

Stores each sensor reading against its setpoint. `last_successful_check_at` powers the dead-man's-switch (a sensor that stops reporting is itself an incident, evaluated out-of-band in Part D).

- [ ] Write the complete migration:

```sql
-- Principia / Vigia v1 — health_checks: one row per sensor reading.
-- Each control loop's signal source writes its measured value vs. its setpoint.
-- last_successful_check_at lets the out-of-band dead-man's-switch detect a
-- sensor that simply stopped reporting (silence is itself a signal).
CREATE TABLE IF NOT EXISTS health_checks (
    id                       BIGSERIAL PRIMARY KEY,
    checked_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area                     TEXT        NOT NULL,   -- producto|marketing|ventas|personas|finanzas|sistema
    loop_id                  TEXT        NOT NULL,   -- which control loop this sensor belongs to
    check_key                TEXT        NOT NULL,   -- stable sensor id, e.g. 'report_delivery_lag'
    value                    NUMERIC,                -- measured value
    setpoint                 NUMERIC,                -- target/threshold
    status                   TEXT        NOT NULL DEFAULT 'sano', -- sano|medio|alto|offline
    detail                   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    last_successful_check_at TIMESTAMPTZ             -- last time this sensor produced a non-offline reading
);

CREATE INDEX IF NOT EXISTS health_checks_key_checked_idx
    ON health_checks (check_key, checked_at DESC);
CREATE INDEX IF NOT EXISTS health_checks_area_checked_idx
    ON health_checks (area, checked_at DESC);

-- Service role only.
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
```

- [ ] Verify (manual check): `last_successful_check_at` column exists; `check_key` indexed for "latest reading per sensor" lookups; RLS on with no policies.
- [ ] Commit:

```
git add supabase/migrations/20260605_principia_health_checks.sql
git commit -m "feat(principia): health_checks sensor-vs-setpoint table with last_successful_check_at

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 5: Migration - weekly_reviews (read-only Consilium snapshot)

**Files:**
- Create: `supabase/migrations/20260605_principia_weekly_reviews.sql`

Table only. Part D builds the Consilium view that UPSERTs `summary`. One row per (area, week_start).

- [ ] Write the complete migration:

```sql
-- Principia / Vigia v1 — weekly_reviews: read-only Consilium snapshot store.
-- The Consilium view (Part D) computes a 7-day summary per area and UPSERTs
-- the `summary` JSONB here. v1 is read-only: no setpoint edits, no graduation.
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area        TEXT        NOT NULL,                -- producto|marketing|ventas|personas|finanzas|sistema
    week_start  DATE        NOT NULL,                -- Monday of the reviewed week
    summary     JSONB       NOT NULL DEFAULT '{}'::jsonb, -- computed 7-day rollup
    UNIQUE (area, week_start)
);

CREATE INDEX IF NOT EXISTS weekly_reviews_area_week_idx
    ON weekly_reviews (area, week_start DESC);

-- Service role only.
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
```

- [ ] Verify (manual check): `UNIQUE (area, week_start)` so Part D can `ON CONFLICT (area, week_start) DO UPDATE` the snapshot; `summary` is JSONB.
- [ ] Commit:

```
git add supabase/migrations/20260605_principia_weekly_reviews.sql
git commit -m "feat(principia): weekly_reviews read-only Consilium snapshot table

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 6: Migration - agent_ordines (centurion backlog)

**Files:**
- Create: `supabase/migrations/20260605_principia_agent_ordines.sql`

The Vigia centurion's backlog of ordines (orders/tasks it derived from incidents). Area-tagged like the rest.

- [ ] Write the complete migration:

```sql
-- Principia / Vigia v1 — agent_ordines: the centurion (Vigia) backlog.
-- Each row is one ordo (a derived task/order, e.g. "draft a PR proposal for
-- incident #N"). v1 writes these but execution stays human-in-the-loop.
CREATE TABLE IF NOT EXISTS agent_ordines (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area         TEXT        NOT NULL,               -- producto|marketing|ventas|personas|finanzas|sistema
    incident_id  BIGINT,                             -- logical link to incidents(id); NO hard REFERENCES
    kind         TEXT        NOT NULL,               -- e.g. 'draft_pr', 'investigate', 'notify'
    status       TEXT        NOT NULL DEFAULT 'pending', -- pending|in_progress|done|cancelled
    title        TEXT        NOT NULL,
    detail       JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS agent_ordines_status_created_idx
    ON agent_ordines (status, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_ordines_incident_idx
    ON agent_ordines (incident_id);

-- Service role only.
ALTER TABLE agent_ordines ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
```

- [ ] Verify (manual check): `incident_id` is a logical link with no hard `REFERENCES` (consistent with the `incidents.class_id` decision); RLS on with no policies.
- [ ] Commit:

```
git add supabase/migrations/20260605_principia_agent_ordines.sql
git commit -m "feat(principia): agent_ordines centurion backlog table

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 7: Pure activity-row builder + best-effort writer (TDD)

**Files:**
- Create: `src/lib/principia/activityLog.ts`
- Create: `src/lib/principia/activityLog.test.ts`

`buildActivityRow()` is a pure function: takes a typed input, returns the canonical row object that matches `system_activity_log`'s columns exactly. `logActivity()` is a thin best-effort writer that builds the row and inserts it with a passed-in service-role client, swallowing any error (it must NEVER break the caller's product path). We TDD the pure builder; the writer is a trivial wrapper exercised in real handlers.

- [ ] Write the failing test first:

```ts
// src/lib/principia/activityLog.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildActivityRow } from './activityLog';

test('buildActivityRow fills required fields and sensible defaults', () => {
    const row = buildActivityRow({
        area: 'producto',
        action: 'session_completed',
        entityType: 'session',
        entityRef: 'sess-123',
        summary: 'Sesion completada',
    });

    assert.equal(row.area, 'producto');
    assert.equal(row.action, 'session_completed');
    assert.equal(row.source_type, 'system');       // default
    assert.equal(row.severity, 'info');            // default
    assert.equal(row.entity_type, 'session');
    assert.equal(row.entity_ref, 'sess-123');
    assert.equal(row.summary, 'Sesion completada');
    assert.deepEqual(row.detail, {});              // default empty object
    assert.deepEqual(row.related_logs, []);        // default empty array
    // builder must NOT set created_at (DB default owns the timestamp)
    assert.equal('created_at' in row, false);
});

test('buildActivityRow honors explicit overrides', () => {
    const row = buildActivityRow({
        area: 'ventas',
        action: 'payment_received',
        sourceType: 'system',
        severity: 'sano',
        entityType: 'one_purchase',
        entityRef: 'pur-9',
        summary: 'Pago recibido',
        detail: { provider: 'stripe', pack_size: 3 },
        relatedLogs: ['webhook_events.evt_1'],
    });

    assert.equal(row.area, 'ventas');
    assert.equal(row.severity, 'sano');
    assert.deepEqual(row.detail, { provider: 'stripe', pack_size: 3 });
    assert.deepEqual(row.related_logs, ['webhook_events.evt_1']);
});

test('buildActivityRow throws on missing area or action', () => {
    // @ts-expect-error intentionally missing area
    assert.throws(() => buildActivityRow({ action: 'x' }), /area/);
    // @ts-expect-error intentionally missing action
    assert.throws(() => buildActivityRow({ area: 'producto' }), /action/);
});
```

- [ ] Run the test, expect FAIL (module does not exist yet):

```
npx tsx --test src/lib/principia/activityLog.test.ts
```
Expected: FAIL with `Cannot find module './activityLog'` (or all assertions error because `buildActivityRow` is undefined).

- [ ] Write the complete implementation:

```ts
// src/lib/principia/activityLog.ts
// Principia / Vigia v1 — canonical activity-row builder + best-effort writer.
// buildActivityRow() is PURE (unit-tested). logActivity() is a thin wrapper
// that must NEVER throw into the caller's product path — every emission is
// best-effort and swallows errors.

export type Area =
    | 'producto'
    | 'marketing'
    | 'ventas'
    | 'personas'
    | 'finanzas'
    | 'sistema';

export type SourceType = 'system' | 'human' | 'agent';

// Note: includes 'info' (observations), unlike the SEVERITY_COLORS keys which
// are alto|medio|sano|offline. Views must index SEVERITY_COLORS defensively.
export type Severity = 'info' | 'sano' | 'medio' | 'alto' | 'offline';

export interface ActivityInput {
    area: Area;
    action: string;
    sourceType?: SourceType;
    severity?: Severity;
    entityType?: string;
    entityRef?: string;
    summary?: string;
    detail?: Record<string, unknown>;
    relatedLogs?: string[];
}

// The shape of a row to INSERT into system_activity_log. created_at is omitted
// on purpose — the DB default owns the timestamp.
export interface ActivityRow {
    area: Area;
    source_type: SourceType;
    action: string;
    severity: Severity;
    entity_type: string | null;
    entity_ref: string | null;
    summary: string | null;
    detail: Record<string, unknown>;
    related_logs: string[];
}

export function buildActivityRow(input: ActivityInput): ActivityRow {
    if (!input || !input.area) throw new Error('buildActivityRow: area is required');
    if (!input.action) throw new Error('buildActivityRow: action is required');

    return {
        area: input.area,
        source_type: input.sourceType ?? 'system',
        action: input.action,
        severity: input.severity ?? 'info',
        entity_type: input.entityType ?? null,
        entity_ref: input.entityRef ?? null,
        summary: input.summary ?? null,
        detail: input.detail ?? {},
        related_logs: input.relatedLogs ?? [],
    };
}

// Minimal structural type so we don't depend on @supabase/supabase-js here.
// Callers pass their existing service-role client.
interface MinimalSupabase {
    from(table: string): {
        insert(values: unknown): Promise<{ error: unknown } | unknown>;
    };
}

/**
 * Best-effort write of one activity row. NEVER throws into the caller.
 * Pass the handler's existing service-role client (created with
 * SUPABASE_SERVICE_ROLE_KEY). Safe to await or fire-and-forget.
 */
export async function logActivity(
    sb: MinimalSupabase,
    input: ActivityInput,
): Promise<void> {
    try {
        const row = buildActivityRow(input);
        await sb.from('system_activity_log').insert(row);
    } catch (err) {
        // Swallow — observability must never break the product path.
        console.warn('[principia:logActivity] non-blocking write failed:', err);
    }
}
```

- [ ] Run the test, expect PASS:

```
npx tsx --test src/lib/principia/activityLog.test.ts
```
Expected: PASS, all 3 tests green.

- [ ] Commit:

```
git add src/lib/principia/activityLog.ts src/lib/principia/activityLog.test.ts
git commit -m "feat(principia): pure activity-row builder + best-effort writer with node:test coverage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 8: Ingestion - admin-tenants auditLog double-write (area=sistema)

**Files:**
- Modify: `api/admin-tenants.ts` (the real function is `auditLog`, around `async function auditLog(sb, adminEmail, action, targetType, targetId, details?)` near line 99 — NOT `logAdminAction`, which does not exist; fix 5)

Every superadmin action already calls `auditLog(...)`. We add a governance double-write: the same action also lands in `system_activity_log` as `area='sistema'`, `source_type='human'`. The `sb` client and all args are already in scope inside `auditLog`.

- [ ] Add the import at the top of `api/admin-tenants.ts` (after the existing imports):

```ts
import { logActivity } from '../src/lib/principia/activityLog';
```

- [ ] Inside the real `auditLog` function, locate the existing audit insert (the body of the function that begins `async function auditLog(sb: ReturnType<typeof createClient<any, any>>, adminEmail: string, action: string, targetType: string, targetId: string, details?: Record<string, unknown>) {`). After its existing `.from('admin_audit_log').insert(...)` (or the existing write the function performs), append the Principia double-write:

```ts
    // Principia governance double-write: every admin action is also an
    // area=sistema, source_type=human row on the activity timeline.
    await logActivity(sb, {
        area: 'sistema',
        action: `admin:${action}`,
        sourceType: 'human',
        severity: 'info',
        entityType: targetType,
        entityRef: targetId,
        summary: `${adminEmail} ${action} ${targetType} ${targetId}`,
        detail: { admin_email: adminEmail, ...(details ?? {}) },
    });
```

- [ ] Verify the patch landed inside the right function and references real names:

```
grep -n "function auditLog" api/admin-tenants.ts
grep -n "logActivity(sb, {" api/admin-tenants.ts
grep -n "logAdminAction" api/admin-tenants.ts   # expect: NO matches (proves we used the real name)
```
Expected: `auditLog` exists; one `logActivity(sb, {` inside it; zero `logAdminAction`.

- [ ] Typecheck the file builds clean:

```
npx tsc --noEmit 2>&1 | grep "admin-tenants" || echo "OK: no admin-tenants type errors"
```
Expected: `OK: no admin-tenants type errors`.

- [ ] Commit:

```
git add api/admin-tenants.ts
git commit -m "feat(principia): governance double-write in admin-tenants auditLog (area=sistema)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 9: Ingestion - one-webhook payment_received at BOTH paid sites (area=ventas)

**Files:**
- Modify: `api/one-webhook.ts` at TWO anchors: the Stripe paid update (quoted anchor `payment_id: session.id,`) AND the MercadoPago paid update (quoted anchor `payment_id: String(resourceId),`)

There are two paid-confirmation sites; instrumenting only Stripe would silently drop every MercadoPago (Latam) payment (fix 3). At the Stripe site, `event.id` is OUT of scope inside the helper (the helper receives `session`, not `event`); use `session.id` (fix 2). At the MercadoPago site use `String(resourceId)`.

- [ ] Add the import at the top of `api/one-webhook.ts` (after the existing imports):

```ts
import { logActivity } from '../src/lib/principia/activityLog';
```

- [ ] STRIPE site. Locate the Stripe paid update block (quoted anchor — the `update` whose body contains `payment_id: session.id,`):

```ts
    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: session.id,
        paid_at: new Date().toISOString(),
    }).eq('id', purchaseId);
```
Immediately after that `.eq('id', purchaseId);` line (and before `await sendConfirmationEmail(...)`), insert:

```ts
    // Principia ingestion (area=ventas). event.id is NOT in scope inside this
    // helper — it receives `session`, not the outer Stripe `event`. Use session.id.
    await logActivity(sb, {
        area: 'ventas',
        action: 'payment_received',
        severity: 'sano',
        entityType: 'one_purchase',
        entityRef: String(purchaseId),
        summary: `Pago Argo One recibido (Stripe, ${existing.pack_size} pack)`,
        detail: { provider: 'stripe', pack_size: existing.pack_size, payment_id: session.id },
        relatedLogs: [`one_purchases.${purchaseId}`],
    });
```

- [ ] MERCADOPAGO site. Locate the MercadoPago paid update block (quoted anchor — the `update` whose body contains `payment_id: String(resourceId),`):

```ts
    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: String(resourceId),
        paid_at: new Date().toISOString(),
    }).eq('id', purchaseId);
```
Immediately after that `.eq('id', purchaseId);` line (and before `await sendConfirmationEmail(...)`), insert:

```ts
    // Principia ingestion (area=ventas). Latam path — without this, MercadoPago
    // payments are never logged. resourceId is the MP payment id in scope here.
    await logActivity(sb, {
        area: 'ventas',
        action: 'payment_received',
        severity: 'sano',
        entityType: 'one_purchase',
        entityRef: String(purchaseId),
        summary: `Pago Argo One recibido (MercadoPago, ${existing.pack_size} pack)`,
        detail: { provider: 'mercadopago', pack_size: existing.pack_size, payment_id: String(resourceId) },
        relatedLogs: [`one_purchases.${purchaseId}`],
    });
```

- [ ] Verify BOTH sites are instrumented and `event.id` was NOT used:

```
grep -c "action: 'payment_received'" api/one-webhook.ts   # expect: 2
grep -n "provider: 'stripe'" api/one-webhook.ts            # Stripe emission present
grep -n "provider: 'mercadopago'" api/one-webhook.ts       # MP emission present
grep -n "related_logs:.*event.id\|relatedLogs:.*event.id" api/one-webhook.ts || echo "OK: no event.id misuse"
```
Expected: count is `2`; both providers present; `OK: no event.id misuse`.

- [ ] Typecheck the file builds clean (no out-of-scope `event` reference):

```
npx tsc --noEmit 2>&1 | grep "one-webhook" || echo "OK: no one-webhook type errors"
```
Expected: `OK: no one-webhook type errors`.

- [ ] Commit:

```
git add api/one-webhook.ts
git commit -m "feat(principia): emit area=ventas payment_received at Stripe AND MercadoPago paid sites

Stripe uses session.id (event.id out of scope in helper); MP uses resourceId.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 10: Ingestion - send-email report_email_sent / report_email_failed (area=producto)

**Files:**
- Modify: `api/send-email.ts` at TWO anchors: the success stamp (quoted anchor `await sb.from('sessions').update({ email_sent_at: new Date().toISOString() }).eq('id', sessionId);`) and the error branch before its `return res.status(...)`

After the report email is actually sent and `email_sent_at` is stamped, emit `report_email_sent` (severity info). In the error branch, emit `report_email_failed` (severity medio) so the detect cron (Part D) can open an incident. `createClient` is already imported in this file; `sessionId` is in scope.

- [ ] Add the import at the top of `api/send-email.ts` (after the existing imports):

```ts
import { logActivity } from '../src/lib/principia/activityLog';
```

- [ ] SUCCESS site. Locate the success stamp (quoted anchor — the line that stamps `email_sent_at`):

```ts
                try { await sb.from('sessions').update({ email_sent_at: new Date().toISOString() }).eq('id', sessionId); } catch { /* non-blocking */ }
```
Immediately after that line, add the Principia emission (reuse the same `sb` client already in that block):

```ts
                // Principia ingestion (area=producto): the report email reached the adult.
                await logActivity(sb, {
                    area: 'producto',
                    action: 'report_email_sent',
                    severity: 'info',
                    entityType: 'session',
                    entityRef: String(sessionId),
                    summary: 'Reporte enviado por email',
                    detail: { session_id: sessionId },
                    relatedLogs: [`sessions.${sessionId}`],
                });
```

- [ ] ERROR site. Locate the Resend error branch (the block that logs the failed Resend response and then does `return res.status(...).json(...)`). Just before that `return`, build a service-role client and emit the failure (severity medio):

```ts
                // Principia ingestion (area=producto): report email failed to send.
                try {
                    const supabaseUrl = process.env.VITE_SUPABASE_URL;
                    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    if (supabaseUrl && serviceKey) {
                        const sbErr = createClient(supabaseUrl, serviceKey);
                        await logActivity(sbErr, {
                            area: 'producto',
                            action: 'report_email_failed',
                            severity: 'medio',
                            entityType: 'session',
                            entityRef: String(sessionId),
                            summary: 'Fallo al enviar el reporte por email',
                            detail: { session_id: sessionId },
                            relatedLogs: [`sessions.${sessionId}`],
                        });
                    }
                } catch { /* non-blocking */ }
```

- [ ] Verify both emissions present:

```
grep -c "action: 'report_email_sent'" api/send-email.ts   # expect: 1
grep -c "action: 'report_email_failed'" api/send-email.ts  # expect: 1
```
Expected: both `1`.

- [ ] Typecheck:

```
npx tsc --noEmit 2>&1 | grep "send-email" || echo "OK: no send-email type errors"
```
Expected: `OK: no send-email type errors`.

- [ ] Commit:

```
git add api/send-email.ts
git commit -m "feat(principia): emit area=producto report_email_sent / report_email_failed

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 11: Ingestion - report-recovery-cron report_recovered (area=producto)

**Files:**
- Modify: `api/report-recovery-cron.ts` at the quoted anchor `r.emailed = true;` (the success branch, after the `send-email` POST succeeds)

After a previously-stuck session is recovered (AI regenerated if needed, then email sent), emit `report_recovered`. This must go in the `r.emailed = true` branch (after the successful `send-email` POST), NOT in either retry `continue` branch. `sb`, `s` (the session), and `origin` are in scope.

- [ ] Add the import at the top of `api/report-recovery-cron.ts` (after the existing imports):

```ts
import { logActivity } from '../src/lib/principia/activityLog';
```

- [ ] Locate the success branch (quoted anchor):

```ts
            r.emailed = true;
```
Immediately after that line, insert:

```ts
            // Principia ingestion (area=producto): a stuck report was auto-recovered.
            await logActivity(sb, {
                area: 'producto',
                action: 'report_recovered',
                severity: 'sano',
                entityType: 'session',
                entityRef: String(s.id),
                summary: 'Reporte recuperado automaticamente (regen IA + email)',
                detail: { session_id: s.id, ai_generated: r.aiGenerated },
                relatedLogs: [`sessions.${s.id}`],
            });
```

- [ ] Verify it landed in the success branch:

```
grep -n "r.emailed = true;" api/report-recovery-cron.ts
grep -n "action: 'report_recovered'" api/report-recovery-cron.ts
```
Expected: the `logActivity` line is immediately after `r.emailed = true;` (same indentation block), not near a `continue`.

- [ ] Typecheck:

```
npx tsc --noEmit 2>&1 | grep "report-recovery-cron" || echo "OK: no report-recovery-cron type errors"
```
Expected: `OK: no report-recovery-cron type errors`.

- [ ] Commit:

```
git add api/report-recovery-cron.ts
git commit -m "feat(principia): emit area=producto report_recovered in the success branch

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 12: Ingestion - session.ts session_completed (area=producto)

**Files:**
- Modify: `api/session.ts` in the `action === 'save'` block, at the quoted anchor `return res.status(200).json({ ok: true, id: saveData.id, share_token: saveData.share_token });` (use `saveData.id`, NOT an absolute line number)

After a play is saved with a real profile, emit `session_completed`. `saveData` (the inserted row), `eje`, and `motor` are all in scope in this block.

- [ ] Confirm `logActivity` is imported in `api/session.ts` (add it after the existing imports if not present):

```ts
import { logActivity } from '../src/lib/principia/activityLog';
```

- [ ] Locate the `:save` success return (quoted anchor):

```ts
            return res.status(200).json({ ok: true, id: saveData.id, share_token: saveData.share_token });
```
Immediately BEFORE that `return`, insert the emission:

```ts
            // Principia ingestion (area=producto): a play finished with a real profile.
            await logActivity(sb, {
                area: 'producto',
                action: 'session_completed',
                severity: 'info',
                entityType: 'session',
                entityRef: String(saveData.id),
                summary: `Sesion completada (${eje} / ${motor})`,
                detail: { session_id: saveData.id, eje, motor, tenant_id: saveTenantId },
                relatedLogs: [`sessions.${saveData.id}`],
            });

```

- [ ] Verify it sits inside the `:save` block before the success return:

```
grep -n "action: 'session_completed'" api/session.ts
grep -n "id: saveData.id, share_token: saveData.share_token" api/session.ts
```
Expected: the emission appears immediately before the `saveData.id`/`saveData.share_token` return.

- [ ] Typecheck:

```
npx tsc --noEmit 2>&1 | grep "api/session" || echo "OK: no session type errors"
```
Expected: `OK: no session type errors`.

- [ ] Commit:

```
git add api/session.ts
git commit -m "feat(principia): emit area=producto session_completed after :save insert

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 13: Regression gate - full unit suite + build smoke

**Files:**
- No new files. Runs the repo's existing gates over everything Part B touched.

- [ ] Run the new pure-logic test plus the existing unit suite (proves nothing regressed):

```
npx tsx --test src/lib/principia/activityLog.test.ts
npm run qa:unit
```
Expected: activityLog test PASS; `qa:unit` PASS (scoring, qa-env, lint-content, coach-helpers all green).

- [ ] Full typecheck across the repo (proves all six ingestion edits + the new lib compile):

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] Build smoke (catches any import-path break from the new `src/lib/principia/activityLog` import inside `api/*`):

```
npm run build
```
Expected: build succeeds.

- [ ] If everything is green, this part is complete. The data spine exists, the six real handlers emit activity rows (and area=ventas payments at both Stripe and MercadoPago), and Parts C/D can read from `system_activity_log`, `incidents`, `incident_classes`, `health_checks`, `weekly_reviews`, and `agent_ordines`.
