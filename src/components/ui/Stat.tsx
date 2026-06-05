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
