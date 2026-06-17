import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { X } from 'lucide-react';
import type { ActiveContext } from '../../pages/TenantDashboard';

interface Ctx {
    effectiveTeamId?: string | null;
    activeContext?: ActiveContext | null;
    setActiveContext?: (ctx: ActiveContext) => void;
    role?: string;
    teams?: { id: string; name: string; slug: string }[];
}

/**
 * A passive reminder of the active plantel, shown only when focused on one
 * (plantel hat). For an admin it doubles as an "exit to Administración"
 * shortcut; a coach (no admin hat) just sees the label. The switcher in the
 * sidebar remains the primary control.
 */
export const ContextChip: React.FC = () => {
    const { effectiveTeamId, activeContext, setActiveContext, role, teams } = useOutletContext<Ctx>();
    if (!effectiveTeamId || !activeContext) return null;
    const name = (teams ?? []).find(t => t.id === effectiveTeamId)?.name ?? '';
    if (!name) return null;
    const isCoach = (role ?? 'owner') === 'coach';

    return (
        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-argo-violet-50 border border-argo-violet-100 text-[12px] font-semibold text-argo-violet-600 align-middle">
            <span className="w-1.5 h-1.5 rounded-full bg-argo-violet-400" />
            {name}
            {!isCoach && setActiveContext && (
                <button
                    type="button"
                    onClick={() => setActiveContext({ tenantId: activeContext.tenantId, hat: 'admin' })}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-argo-violet-100 text-argo-violet-400 hover:text-argo-violet-600 transition-colors"
                    aria-label="Salir del plantel"
                >
                    <X size={12} />
                </button>
            )}
        </span>
    );
};
