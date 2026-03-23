import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { MemberProfile } from '../../../lib/groupBalance';
import { simulateRemoval } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';

interface Props {
    members: MemberProfile[];
}

const DeltaBadge: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '%' }) => {
    if (value === 0) return <span className="text-[10px] text-argo-grey flex items-center gap-0.5"><Minus size={10} /> 0{suffix}</span>;
    if (value > 0) return <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><ArrowUp size={10} /> +{value}{suffix}</span>;
    return <span className="text-[10px] text-red-500 flex items-center gap-0.5"><ArrowDown size={10} /> {value}{suffix}</span>;
};

export const SimulatorPanel: React.FC<Props> = ({ members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const delta = useMemo(() => {
        if (!selectedId) return null;
        return simulateRemoval(members, selectedId);
    }, [selectedId, members]);

    if (members.length < 2) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">{dt.groupBalance.simulador}</h3>
            <p className="text-xs text-argo-grey">
                {dt.groupBalance.simuladorDesc}
            </p>

            <div className="flex flex-wrap gap-2">
                {members.map(m => {
                    const cfg = AXIS_CONFIG[m.eje];
                    const isSelected = selectedId === m.session_id;
                    return (
                        <button
                            key={m.session_id}
                            onClick={() => setSelectedId(isSelected ? null : m.session_id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 ${
                                isSelected
                                    ? 'border-argo-navy bg-argo-navy text-white'
                                    : 'border-argo-border hover:border-argo-navy/30 text-argo-navy'
                            }`}
                        >
                            <span
                                className="inline-block w-3.5 h-3.5 rounded text-[8px] font-bold text-white text-center leading-[14px] mr-1.5"
                                style={{ background: cfg?.color ?? '#666' }}
                            >
                                {m.eje}
                            </span>
                            {m.child_name}
                        </button>
                    );
                })}
            </div>

            {/* Delta results */}
            {delta && selectedId && (
                <div className="bg-argo-neutral/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-argo-navy">
                        {dt.groupBalance.siSale(members.find(m => m.session_id === selectedId)?.child_name ?? '')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                            <span className="text-[11px] text-argo-grey">{dt.groupBalance.diversidad}</span>
                            <DeltaBadge value={delta.diversity} suffix=" pts" />
                        </div>
                        {(['D', 'I', 'S', 'C'] as const).map(axis => (
                            <div key={axis} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                                <span className="text-[11px] text-argo-grey">{dt.profile.axisNames[axis] ?? AXIS_CONFIG[axis]?.name ?? axis}</span>
                                <DeltaBadge value={delta.axisDelta[axis]} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
