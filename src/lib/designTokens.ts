/**
 * Argo Design System — Single source of truth for shared tokens.
 *
 * RULE: Never hardcode axis colors, motor colors, or chip styles inline.
 * Import from here instead. Tailwind config references these same hex values.
 */

/* ── Axis (DISC) Colors ────────────────────────────────────────────────────── */

export const AXIS_COLORS: Record<string, string> = {
    D: '#f97316',   // Impulsor — orange
    I: '#f59e0b',   // Conector — amber
    S: '#22c55e',   // Sostén — green
    C: '#6366f1',   // Estratega — indigo
};

export const AXIS_BG_COLORS: Record<string, string> = {
    D: '#fff7ed',
    I: '#fffbeb',
    S: '#f0fdf4',
    C: '#eef2ff',
};

export const AXIS_LABELS: Record<string, string> = {
    D: 'Impulsor',
    I: 'Conector',
    S: 'Sostén',
    C: 'Estratega',
};

/* ── Axis Tailwind class combos (for badges, chips) ────────────────────────── */

export const AXIS_CHIP: Record<string, string> = {
    D: 'bg-orange-50 text-orange-700 border-orange-200',
    I: 'bg-amber-50 text-amber-700 border-amber-200',
    S: 'bg-green-50 text-green-700 border-green-200',
    C: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

/* ── Axis/Motor inline style variants (for style={{}} usage) ────────────────── */

export const AXIS_CHIP_STYLE: Record<string, { border: string; text: string }> = {
    D: { border: 'rgba(249,115,22,0.35)', text: 'rgba(249,115,22,0.75)' },
    I: { border: 'rgba(245,158,11,0.35)', text: 'rgba(180,120,14,0.75)' },
    S: { border: 'rgba(34,197,94,0.35)',  text: 'rgba(22,101,52,0.75)' },
    C: { border: 'rgba(99,102,241,0.35)', text: 'rgba(99,102,241,0.75)' },
};

export const MOTOR_CHIP_STYLE: Record<string, { bg: string; text: string }> = {
    'Rápido': { bg: '#fffbeb', text: '#b45309' },
    'Medio':  { bg: '#eef2ff', text: '#4338ca' },
    'Lento':  { bg: '#ecfeff', text: '#0e7490' },
};

/* ── Motor tokens ──────────────────────────────────────────────────────────── */

export const MOTOR_CHIP: Record<string, string> = {
    Rápido:  'bg-sky-50 text-sky-700 border-sky-200',
    Medio:   'bg-violet-50 text-violet-700 border-violet-200',
    Lento:   'bg-rose-50 text-rose-700 border-rose-200',
};

/* ── Status colors ─────────────────────────────────────────────────────────── */

export const STATUS_COLORS = {
    success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    error:   { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    info:    { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' },
} as const;
