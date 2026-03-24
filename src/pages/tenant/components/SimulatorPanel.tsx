import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemberProfile } from '../../../lib/groupBalance';
import { simulateRemoval } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';

interface Props {
    members: MemberProfile[];
}

/* ── Delta label helpers ────────────────────────────────────────────────────── */

function diversityLabel(delta: number, dt: ReturnType<typeof getDashboardT>): { text: string; color: string } {
    if (delta === 0) return { text: dt.groupBalance.simDiversidadIgual, color: '#6b7280' };
    if (delta >= 10) return { text: dt.groupBalance.simDiversidadSubeMucho, color: '#059669' };
    if (delta > 0) return { text: dt.groupBalance.simDiversidadSube, color: '#059669' };
    if (delta <= -10) return { text: dt.groupBalance.simDiversidadBajaMucho, color: '#dc2626' };
    return { text: dt.groupBalance.simDiversidadBaja, color: '#dc2626' };
}

function axisLabel(delta: number, axisName: string, dt: ReturnType<typeof getDashboardT>): { text: string; color: string } {
    if (delta === 0) return { text: dt.groupBalance.simSinCambio(axisName), color: '#6b7280' };
    if (delta > 0) return { text: dt.groupBalance.simGanaPresencia(axisName), color: '#059669' };
    return { text: dt.groupBalance.simPierdePresencia(axisName), color: '#dc2626' };
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export const SimulatorPanel: React.FC<Props> = ({ members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const delta = useMemo(() => {
        if (!selectedId) return null;
        return simulateRemoval(members, selectedId);
    }, [selectedId, members]);

    const selectedMember = members.find(m => m.session_id === selectedId);

    if (members.length < 2) return null;

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-argo-navy">{dt.groupBalance.simTitulo}</h3>
                <p className="text-xs text-argo-grey leading-relaxed">
                    {dt.groupBalance.simDesc}
                </p>
            </div>

            {/* Player chips */}
            <div className="flex flex-wrap gap-2">
                {members.map(m => {
                    const cfg = AXIS_CONFIG[m.eje];
                    const isSelected = selectedId === m.session_id;
                    return (
                        <button
                            key={m.session_id}
                            onClick={() => setSelectedId(isSelected ? null : m.session_id)}
                            className={`flex items-center gap-2 pl-0 pr-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 overflow-hidden ${
                                isSelected
                                    ? 'border-argo-navy bg-argo-navy text-white shadow-md'
                                    : 'border-argo-border bg-white hover:border-argo-navy/30 text-argo-navy hover:shadow-sm'
                            }`}
                        >
                            {/* Axis color left strip */}
                            <span
                                className="w-1.5 self-stretch flex-shrink-0"
                                style={{ backgroundColor: cfg?.color ?? '#666' }}
                            />
                            <span
                                className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : (cfg?.color ?? '#666') }}
                            >
                                {m.eje}
                            </span>
                            <span className="text-xs">{m.child_name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Delta results */}
            <AnimatePresence>
                {delta && selectedMember && (
                    <motion.div
                        key={selectedId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="bg-argo-neutral/60 rounded-2xl p-4 space-y-3 border border-argo-border"
                    >
                        <p className="text-xs font-bold text-argo-navy">
                            {dt.groupBalance.simSiSeMueve(selectedMember.child_name)}
                        </p>

                        {/* Diversity */}
                        <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={diversityLabel(delta.diversity, dt).color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                {delta.diversity === 0
                                    ? <path d="M5 12h14" />
                                    : delta.diversity > 0
                                        ? <path d="M12 19V5M5 12l7-7 7 7" />
                                        : <path d="M12 5v14M5 12l7 7 7-7" />}
                            </svg>
                            <div>
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: diversityLabel(delta.diversity, dt).color }}
                                >
                                    {diversityLabel(delta.diversity, dt).text}
                                </p>
                                <p className="text-[11px] text-argo-grey mt-0.5">
                                    Diversidad DISC: {delta.diversity > 0 ? '+' : ''}{delta.diversity} pts
                                </p>
                            </div>
                        </div>

                        {/* Axis deltas — only show axes with change */}
                        <div className="grid grid-cols-2 gap-2">
                            {(['D', 'I', 'S', 'C'] as const)
                                .filter(axis => delta.axisDelta[axis] !== 0)
                                .map(axis => {
                                    const cfg = AXIS_CONFIG[axis];
                                    const name = dt.profile.axisNames[axis] ?? cfg?.name ?? axis;
                                    const info = axisLabel(delta.axisDelta[axis], name, dt);
                                    return (
                                        <div
                                            key={axis}
                                            className="bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-2"
                                        >
                                            <span
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                                                style={{ backgroundColor: cfg?.color ?? '#666' }}
                                            >
                                                {axis}
                                            </span>
                                            <p className="text-[11px] leading-tight" style={{ color: info.color }}>
                                                {info.text}
                                            </p>
                                        </div>
                                    );
                                })}
                            {(['D', 'I', 'S', 'C'] as const).every(a => delta.axisDelta[a] === 0) && (
                                <p className="text-xs text-argo-grey col-span-2 text-center py-1">
                                    {dt.groupBalance.simDistribucionNoCambia}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
