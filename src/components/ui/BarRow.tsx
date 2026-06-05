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
