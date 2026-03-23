import React from 'react';

/**
 * Reusable skeleton loading primitives for the tenant dashboard.
 * Pulse animation via Tailwind `animate-pulse`.
 */

const Bone: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-argo-border/60 rounded animate-pulse ${className}`} />
);

/* ── Session/Player row skeleton ───────────────────────────────────────────── */

export const SkeletonSessionRow: React.FC = () => (
    <div className="px-6 py-4 flex items-center gap-4">
        <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-32" />
            <Bone className="h-2.5 w-48" />
        </div>
        <Bone className="h-5 w-20 rounded-full" />
    </div>
);

/* ── Player card skeleton (expanded look) ──────────────────────────────────── */

export const SkeletonPlayerCard: React.FC = () => (
    <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-start gap-3">
            <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Bone className="h-4 w-36" />
                <div className="flex gap-2">
                    <Bone className="h-5 w-24 rounded-full" />
                    <Bone className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-1.5">
                    <Bone className="h-4 w-14 rounded" />
                    <Bone className="h-4 w-14 rounded" />
                    <Bone className="h-4 w-14 rounded" />
                </div>
            </div>
            <Bone className="h-5 w-16 rounded-full" />
        </div>
    </div>
);

/* ── Group row skeleton ────────────────────────────────────────────────────── */

export const SkeletonGroupRow: React.FC = () => (
    <div className="px-6 py-4 flex items-center gap-4">
        <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-2.5 w-20" />
        </div>
        <Bone className="h-5 w-20 rounded-full" />
    </div>
);

/* ── Situation card skeleton ───────────────────────────────────────────────── */

export const SkeletonSituationCard: React.FC = () => (
    <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-5">
        <div className="flex items-start gap-3">
            <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                    <Bone className="h-3.5 w-40" />
                    <Bone className="h-4 w-16 rounded-full" />
                </div>
                <Bone className="h-2.5 w-full" />
                <Bone className="h-2.5 w-3/4" />
            </div>
        </div>
    </div>
);

/* ── Chat thread skeleton ──────────────────────────────────────────────────── */

export const SkeletonThreadRow: React.FC = () => (
    <div className="px-6 py-4 flex items-center gap-4">
        <Bone className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Bone className="h-3 w-48" />
            <Bone className="h-2 w-20" />
        </div>
    </div>
);

/* ── Generic list skeleton ─────────────────────────────────────────────────── */

export const SkeletonList: React.FC<{
    rows?: number;
    RowComponent?: React.FC;
}> = ({ rows = 4, RowComponent = SkeletonSessionRow }) => (
    <div className="divide-y divide-argo-border">
        {Array.from({ length: rows }).map((_, i) => (
            <RowComponent key={i} />
        ))}
    </div>
);

/* ── Stats card skeleton ───────────────────────────────────────────────────── */

export const SkeletonStatsCard: React.FC = () => (
    <div className="bg-white border border-argo-border rounded-2xl p-4 space-y-2">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-6 w-12" />
    </div>
);
