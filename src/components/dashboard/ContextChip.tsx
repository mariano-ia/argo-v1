import React from 'react';
import { useOutletContext } from 'react-router-dom';

interface Ctx {
    effectiveTeamId?: string | null;
    teams?: { id: string; name: string; slug: string }[];
}

/**
 * A passive indicator of the active plantel, shown only when focused on one
 * (plantel hat). It is read-only and cannot be dismissed: the context switcher
 * in the sidebar is the single control for changing or exiting the context.
 */
export const ContextChip: React.FC = () => {
    const { effectiveTeamId, teams } = useOutletContext<Ctx>();
    if (!effectiveTeamId) return null;
    const name = (teams ?? []).find(t => t.id === effectiveTeamId)?.name ?? '';
    if (!name) return null;

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-argo-violet-50 border border-argo-violet-100 text-[12px] font-semibold text-argo-violet-600 align-middle">
            <span className="w-1.5 h-1.5 rounded-full bg-argo-violet-400" />
            {name}
        </span>
    );
};
