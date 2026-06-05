# Vigia / Principia v1 - Plan A/4: Design System (Fase 0)

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax. This is part A of a 4-part series; execute in order A, B, C, D.

**Goal:** Establish the Fase 0 design-system prerequisites that every later Principia/Vigia view depends on: a single `SEVERITY_COLORS` token map (with an `info` key so downstream `?.` indexing is always safe), and two extracted shared UI primitives (`Stat`, `BarRow`) currently inlined inside `AdminHealth.tsx`. After this part, Parts B/C/D can import `SEVERITY_COLORS` and `<Stat>`/`<BarRow>` instead of re-defining them or hardcoding hex/Tailwind values.

**Architecture:** Tokens live in `src/lib/designTokens.ts` (the project's single source of truth for non-status colors). Shared UI primitives live in `src/components/ui/*` and are re-exported from `src/components/ui/index.ts`. `AdminHealth.tsx` (the existing telemetry dashboard) is refactored to import the now-shared `Stat`/`BarRow` instead of its local copies, proving the extraction is behavior-preserving. No new tables, endpoints, crons, or routes in this part.

**Tech Stack:** React + TypeScript + Vite + TailwindCSS. Tests via `tsx --test` (`node:test`), matching the existing `coach-helpers.test.ts` pattern wired into `npm run qa:unit`. Build smoke via `npm run build`.

**Depends on: nada** (this is the first part of the series; B/C/D depend on the `SEVERITY_COLORS` token and the `Stat`/`BarRow` exports produced here).

## File Structure

- `src/lib/designTokens.ts` (MODIFY) — append `SEVERITY_COLORS` map with keys `alto | medio | sano | offline | info` (each `{ dot, bg, text, border, label }`). Single source of truth for incident severity styling across all Principia views.
- `src/components/ui/Stat.tsx` (NEW) — extracted `Stat` primitive (label / value / sub / accent). Replaces the inline copy in `AdminHealth.tsx`; tokenizes the `green` accent (was hardcoded `bg-emerald-50`) and uses design-system type sizes instead of `text-[11px]`/`text-[10px]`.
- `src/components/ui/BarRow.tsx` (NEW) — extracted horizontal-bar primitive (label / count / max / tint). Replaces the inline copy in `AdminHealth.tsx`; keeps the `tint` prop (dynamic per-bar color is a legitimate inline style value).
- `src/components/ui/index.ts` (MODIFY) — add `export { Stat } from './Stat';` and `export { BarRow } from './BarRow';` so consumers import from the barrel.
- `src/components/ui/Stat.test.ts` (NEW) — `node:test` coverage for `statAccentClass()` pure helper (the accent → class mapping), proving the token swap is correct.
- `src/pages/dashboard/AdminHealth.tsx` (MODIFY) — delete the two local `const Stat` / `const BarRow` definitions and import them from `../../components/ui` instead. Behavior-preserving refactor.

## Tasks

### Task 1: Add `SEVERITY_COLORS` to designTokens (with `info` key)

**Files:**
- `src/lib/designTokens.ts` (MODIFY — append after the quoted anchor `export const STATUS_COLORS = {`)

The `SEVERITY_COLORS` map is the single source of truth for incident severity styling. It MUST contain a key for `info` (observations) in addition to `alto`, `medio`, `sano`, and `offline`, so that any downstream view doing `SEVERITY_COLORS[severity]?.dot` (where `severity` may be `'info'`) never resolves to `undefined.dot` and crashes. The `should-fix` from the adversarial review (the info-key gap that made Bandeja's `SEVERITY_COLORS[sev].dot` a latent crash) is resolved at the token level here: `info` is a real entry, and every consumer is still expected to use `?.` defensively.

Severity-to-color mapping (semantic, using standard Tailwind status palette per the design system's "Status colors" rule):
- `alto` → red (critical breach)
- `medio` → amber (warning breach)
- `sano` → green (healthy / within setpoint)
- `offline` → grey (sensor offline / no recent successful check)
- `info` → blue (observation, non-actionable)

- [ ] Read the current end of `src/lib/designTokens.ts` to confirm the `STATUS_COLORS` block is the final export (anchor: `export const STATUS_COLORS = {`).
- [ ] Append the following COMPLETE block to the end of `src/lib/designTokens.ts` (after the closing `} as const;` of `STATUS_COLORS`):

```ts

/* ── Severity colors (Principia / Vigia incidents) ─────────────────────────── */

export type Severity = 'alto' | 'medio' | 'sano' | 'offline' | 'info';

/**
 * Single source of truth for incident severity styling.
 * Keys map to the incidents.severity lifecycle values plus `info` (observations).
 * Always index defensively: `SEVERITY_COLORS[sev]?.dot` — an unknown/legacy value
 * must never resolve to `undefined.dot`.
 */
export const SEVERITY_COLORS: Record<Severity, {
    dot: string;
    bg: string;
    text: string;
    border: string;
    label: string;
}> = {
    alto:    { dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: 'Alto' },
    medio:   { dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: 'Medio' },
    sano:    { dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'Sano' },
    offline: { dot: 'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   label: 'Offline' },
    info:    { dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   label: 'Info' },
};
```

- [ ] Verify the map compiles and exposes all five keys. Run:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx -e "import('./src/lib/designTokens.ts').then(m => { const k = Object.keys(m.SEVERITY_COLORS).sort().join(','); if (k !== 'alto,info,medio,offline,sano') throw new Error('bad keys: ' + k); if (!m.SEVERITY_COLORS.info?.dot) throw new Error('info.dot missing'); console.log('OK', k); })"
```

Expected output: `OK alto,info,medio,offline,sano`

- [ ] Commit:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/lib/designTokens.ts && git commit -m "feat(tokens): add SEVERITY_COLORS map for Principia incidents

Single source of truth for incident severity styling. Includes an
info key (observations) so downstream SEVERITY_COLORS[sev]?.dot
indexing is always safe. Keys: alto/medio/sano/offline/info, mapped
to the standard Tailwind status palette per design-system rules.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 2: Extract `Stat` primitive with TDD on its accent helper

**Files:**
- `src/components/ui/Stat.test.ts` (NEW)
- `src/components/ui/Stat.tsx` (NEW)

The current `Stat` inside `AdminHealth.tsx` hardcodes the green accent as `bg-emerald-50 border-emerald-200 text-emerald-700` and uses `text-[11px]`/`text-[10px]` (forbidden arbitrary sizes). The extracted version moves the accent → class decision into a PURE function `statAccentClass(accent)` (so it can be unit-tested), switches `emerald` to the `green-*` design-system status palette, and replaces arbitrary type sizes with `text-xs`/`text-[10px]`→`text-xs`. We keep the exact accent semantics (green/amber/red plus a neutral default), only swapping the green family to match the rest of the design system's success color.

- [ ] Write the failing test `src/components/ui/Stat.test.ts` with COMPLETE content:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statAccentClass } from './Stat';

test('green accent uses the green status palette (not emerald)', () => {
    const cls = statAccentClass('green');
    assert.ok(cls.includes('bg-green-50'), 'expected bg-green-50');
    assert.ok(cls.includes('text-green-700'), 'expected text-green-700');
    assert.ok(!cls.includes('emerald'), 'must not use emerald');
});

test('amber accent uses the amber status palette', () => {
    const cls = statAccentClass('amber');
    assert.ok(cls.includes('bg-amber-50'), 'expected bg-amber-50');
    assert.ok(cls.includes('text-amber-700'), 'expected text-amber-700');
});

test('red accent uses the red status palette', () => {
    const cls = statAccentClass('red');
    assert.ok(cls.includes('bg-red-50'), 'expected bg-red-50');
    assert.ok(cls.includes('text-red-700'), 'expected text-red-700');
});

test('no accent falls back to the neutral card style', () => {
    const cls = statAccentClass(undefined);
    assert.ok(cls.includes('bg-white'), 'expected bg-white');
    assert.ok(cls.includes('text-argo-navy'), 'expected text-argo-navy');
});
```

- [ ] Run the test and confirm it FAILS (module `./Stat` does not exist yet):

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/components/ui/Stat.test.ts
```

Expected: FAIL — `Cannot find module './Stat'` (or equivalent import-resolution error).

- [ ] Create `src/components/ui/Stat.tsx` with COMPLETE content:

```tsx
import React from 'react';

/* ── Stat ──────────────────────────────────────────────────────────────────── */

export type StatAccent = 'green' | 'amber' | 'red';

/**
 * Pure accent → Tailwind class resolver. Extracted so it can be unit-tested
 * and so the green accent uses the design-system green status palette
 * (not the legacy emerald-* hardcode from AdminHealth).
 */
export function statAccentClass(accent?: StatAccent): string {
    switch (accent) {
        case 'green':
            return 'bg-green-50 border-green-200 text-green-700';
        case 'amber':
            return 'bg-amber-50 border-amber-200 text-amber-700';
        case 'red':
            return 'bg-red-50 border-red-200 text-red-700';
        default:
            return 'bg-white border-argo-border text-argo-navy';
    }
}

interface StatProps {
    label: string;
    value: string | number;
    sub?: string;
    accent?: StatAccent;
    className?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, sub, accent, className = '' }) => (
    <div className={`rounded-lg border px-4 py-3 ${statAccentClass(accent)} ${className}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
);
```

- [ ] Run the test again and confirm it PASSES:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/components/ui/Stat.test.ts
```

Expected: PASS — 4 tests, 0 failures.

- [ ] Commit:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/components/ui/Stat.tsx src/components/ui/Stat.test.ts && git commit -m "feat(ui): extract Stat primitive with tested accent helper

Moves the inline Stat from AdminHealth into a shared component.
statAccentClass() is a pure, unit-tested accent->class resolver;
green now uses the green-* status palette instead of the legacy
emerald-* hardcode, and arbitrary text-[11px]/[10px] sizes are
replaced with design-system text-xs.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 3: Extract `BarRow` primitive

**Files:**
- `src/components/ui/BarRow.tsx` (NEW)

`BarRow` is a presentational horizontal bar. Its `tint` is a genuinely dynamic per-bar color (callers pass different hexes per data series), so it legitimately stays as an inline `style` value — this is the one design-system-approved use of inline styles (dynamic values). The text sizes (`text-xs`) are already design-system tokens, so the extraction is a straight move with no value changes other than the default tint, which we keep as the original `#955FB5` to preserve existing AdminHealth visuals exactly.

- [ ] Create `src/components/ui/BarRow.tsx` with COMPLETE content:

```tsx
import React from 'react';

/* ── BarRow ────────────────────────────────────────────────────────────────── */

interface BarRowProps {
    label: string;
    count: number;
    max: number;
    /** Dynamic per-bar color (inline style is intentional here). */
    tint?: string;
    className?: string;
}

export const BarRow: React.FC<BarRowProps> = ({ label, count, max, tint = '#955FB5', className = '' }) => {
    const pct = max > 0 ? (count / max) * 100 : 0;
    return (
        <div className={`flex items-center gap-3 mb-1.5 ${className}`}>
            <span className="text-xs text-argo-secondary w-44 truncate" title={label}>{label}</span>
            <div className="flex-1 h-3 bg-argo-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tint }} />
            </div>
            <span className="text-xs font-mono text-argo-secondary w-12 text-right">{count}</span>
        </div>
    );
};
```

- [ ] Verify the file type-checks in isolation (no test framework needed for a pure presentational component). Run:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsc --noEmit --jsx react-jsx --esModuleInterop --skipLibCheck src/components/ui/BarRow.tsx 2>&1 | head -20
```

Expected: no output (clean type-check). If any error mentions `BarRow.tsx`, fix it before continuing.

- [ ] Commit:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/components/ui/BarRow.tsx && git commit -m "feat(ui): extract BarRow primitive

Shared horizontal-bar component. The tint prop stays as an inline
style value (genuinely dynamic per-bar color, the design-system
approved case for inline styles). Tailwind grays swapped for
argo-* tokens; default tint preserved at #955FB5.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 4: Re-export `Stat` and `BarRow` from the UI barrel

**Files:**
- `src/components/ui/index.ts` (MODIFY — append after the quoted anchor `export { ToastProvider, useToast } from './Toast';`)

- [ ] Read `src/components/ui/index.ts` to confirm the current exports (anchor lines include `export { Card } from './Card';` and `export { ToastProvider, useToast } from './Toast';`).
- [ ] Add the two new exports. Insert after the `export { Card } from './Card';` line, so the top of the barrel reads exactly:

```ts
export { Button } from './Button';
export { Input } from './Input';
export { Badge, AxisBadge, MotorBadge } from './Badge';
export { Card } from './Card';
export { Stat } from './Stat';
export { BarRow } from './BarRow';
export { Tooltip, InfoTip } from './Tooltip';
export { ToastProvider, useToast } from './Toast';
```

- [ ] Verify both names are exported from the barrel. Run:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "export { Stat } from './Stat';" src/components/ui/index.ts && grep -c "export { BarRow } from './BarRow';" src/components/ui/index.ts
```

Expected: prints `1` then `1`.

- [ ] Commit:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/components/ui/index.ts && git commit -m "feat(ui): export Stat and BarRow from the ui barrel

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 5: Refactor `AdminHealth.tsx` to import the shared `Stat` / `BarRow`

**Files:**
- `src/pages/dashboard/AdminHealth.tsx` (MODIFY — replace the local definitions anchored at `const Stat: React.FC<{ label: string; value: string | number; sub?: string; accent?: 'green' | 'amber' | 'red' }>` and `const BarRow: React.FC<{ label: string; count: number; max: number; tint?: string }>`)

This proves the extraction is behavior-preserving: `AdminHealth` keeps rendering identical stats and bars, now sourced from the shared components. The accent prop values (`green`/`amber`/`red`) match the extracted `StatAccent` type exactly, and the `tint` props passed to `BarRow` (`#955FB5`, `#f97316`, `#6366f1`, `#22c55e`, `#dc2626`, `#9333ea`, `#ef4444`, `#0891b2`) are unchanged.

- [ ] Add the barrel import. After the existing line `import { supabase } from '../../lib/supabase';` (and the lucide import on the next line), add:

```tsx
import { Stat, BarRow } from '../../components/ui';
```

- [ ] Delete the entire local `Stat` definition. Remove this exact block from `AdminHealth.tsx`:

```tsx
const Stat: React.FC<{ label: string; value: string | number; sub?: string; accent?: 'green' | 'amber' | 'red' }> = ({ label, value, sub, accent }) => {
    const colorMap = {
        green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        amber: 'bg-amber-50  border-amber-200  text-amber-700',
        red:   'bg-red-50    border-red-200    text-red-700',
    } as const;
    const cls = accent ? colorMap[accent] : 'bg-white border-gray-200 text-gray-900';
    return (
        <div className={`rounded-lg border px-4 py-3 ${cls}`}>
            <p className="text-[11px] font-semibold uppercase opacity-70">{label}</p>
            <p className="text-lg font-bold">{value}</p>
            {sub && <p className="text-[10px] opacity-60">{sub}</p>}
        </div>
    );
};
```

- [ ] Delete the entire local `BarRow` definition. Remove this exact block from `AdminHealth.tsx`:

```tsx
const BarRow: React.FC<{ label: string; count: number; max: number; tint?: string }> = ({ label, count, max, tint = '#955FB5' }) => {
    const pct = max > 0 ? (count / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3 mb-1.5">
            <span className="text-xs text-gray-600 w-44 truncate" title={label}>{label}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tint }} />
            </div>
            <span className="text-xs font-mono text-gray-700 w-12 text-right">{count}</span>
        </div>
    );
};
```

- [ ] Confirm the local definitions are gone and the import is present. Run:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && grep -c "const Stat: React.FC" src/pages/dashboard/AdminHealth.tsx; grep -c "const BarRow: React.FC" src/pages/dashboard/AdminHealth.tsx; grep -c "import { Stat, BarRow } from '../../components/ui';" src/pages/dashboard/AdminHealth.tsx
```

Expected: prints `0` (no local Stat), then `0` (no local BarRow), then `1` (import present).

- [ ] Run the full build smoke gate to confirm `AdminHealth` still type-checks and bundles with the shared components:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npm run build 2>&1 | tail -20
```

Expected: build completes without TypeScript errors referencing `AdminHealth.tsx`, `Stat`, or `BarRow`.

- [ ] Run the unit suite to confirm no regression in the existing pure-logic tests plus the new `Stat` test:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && npx tsx --test src/components/ui/Stat.test.ts && npm run qa:unit
```

Expected: `Stat.test.ts` PASS (4 tests), then `qa:unit` PASS with no new failures.

- [ ] Commit:

```
cd "/Users/marianonoceti/Desktop/Antigravity/Argo Project" && git add src/pages/dashboard/AdminHealth.tsx && git commit -m "refactor(admin-health): use shared Stat and BarRow primitives

Removes the inline Stat/BarRow copies and imports them from the
ui barrel. Behavior-preserving: same accents (green/amber/red),
same per-bar tints. Drops the legacy emerald-* and arbitrary
text-[11px]/[10px] from AdminHealth via the shared components.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Out of scope for this part (handled in B/C/D)

- All migrations, endpoints, crons, routes, the `AreaModule` registry, the actuator, the detect cron, the Bandeja/Resumen/Incidentes/Registros/Consilium views, and `activityLog.ts` live in Parts B, C, and D.
- This part only ships the `SEVERITY_COLORS` token (with the `info` key) and the `Stat`/`BarRow` primitives those later views import. Consumers of `SEVERITY_COLORS` MUST still index with `?.` (e.g. `SEVERITY_COLORS[sev]?.dot`) per the should-fix; this part guarantees the `info` key exists so that fallback is the only remaining safety net needed.