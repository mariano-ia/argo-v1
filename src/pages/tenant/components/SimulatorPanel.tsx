import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemberProfile } from '../../../lib/groupBalance';
import { simulateRemoval } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';
import { InfoTip } from '../../../components/ui/Tooltip';

/* ── Impact & recommendation content ──────────────────────────────────────── */

// Impact descriptions when removing the LAST player of a given axis
const AXIS_LOSS_IMPACT: Record<string, string> = {
    D: 'nadie va a tomar la iniciativa de forma natural en situaciones competitivas. El adulto va a necesitar asumir un rol más activo de impulso.',
    I: 'el grupo pierde su conector social natural. Las dinámicas de integración y motivación grupal van a depender más del adulto.',
    S: 'el grupo pierde su ancla de estabilidad. Puede volverse más reactivo y menos predecible en momentos de presión.',
    C: 'el grupo pierde capacidad de observación y análisis táctico. Las decisiones van a ser más impulsivas y menos reflexionadas.',
};

// Recommendations when removing the LAST player of a given axis
const AXIS_LOSS_RECO: Record<string, string> = {
    D: 'Si lo mueves, busca compensar proponiendo desafíos claros al grupo y asignando roles de liderazgo rotativo.',
    I: 'Si lo mueves, refuerza los rituales de equipo (saludos, celebraciones, rondas de cierre) para mantener la conexión social.',
    S: 'Si lo mueves, mantén las rutinas del grupo lo más estables posible y anticipa los cambios con tiempo.',
    C: 'Si lo mueves, incorpora pausas breves de observación en los ejercicios ("¿qué vieron?") para mantener la reflexión activa.',
};

// Recommendation when it's NOT the last player of that axis
const AXIS_PARTIAL_RECO = 'El impacto es moderado porque el grupo mantiene otros jugadores con ese estilo. Observa si la dinámica cambia en los primeros entrenamientos.';

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

export const SimulatorPanel: React.FC<{ members: MemberProfile[] }> = ({ members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const delta = useMemo(() => {
        if (!selectedId) return null;
        return simulateRemoval(members, selectedId);
    }, [selectedId, members]);

    const selectedMember = members.find(m => m.session_id === selectedId);

    /* ── Impact computation ─────────────────────────────────────────────────── */
    const impact = useMemo(() => {
        if (!selectedMember || !delta) return null;

        const memberEje = selectedMember.eje;
        const axisName = dt.profile.axisNames[memberEje] ?? AXIS_CONFIG[memberEje]?.name ?? memberEje;
        const sameAxisCount = members.filter(m => m.eje === memberEje).length;
        const isLast = sameAxisCount === 1;
        const remainingAfter = members.length - 1;

        let paragraph: string;
        let recommendation: string;

        if (isLast) {
            // Losing the only representative of this axis
            paragraph = `El grupo pierde por completo la energía de ${axisName}. Esto significa que ${AXIS_LOSS_IMPACT[memberEje] ?? 'el grupo pierde un estilo que no tiene sustituto.'}`;
            recommendation = AXIS_LOSS_RECO[memberEje] ?? 'Observa de cerca cómo responde el grupo en las primeras sesiones sin este jugador.';
        } else {
            // There are others with the same axis
            const remaining = sameAxisCount - 1;
            paragraph = `El grupo mantiene presencia de ${axisName} con ${remaining} jugador${remaining > 1 ? 'es' : ''}. El impacto directo es menor, pero el equilibrio general se ajusta.`;
            recommendation = AXIS_PARTIAL_RECO;
        }

        // Diversity-based framing overlay
        if (delta.diversity >= 10) {
            paragraph += ` La diversidad de estilos del grupo mejora — quedaría un equipo más equilibrado con ${remainingAfter} jugadores.`;
        } else if (delta.diversity <= -10) {
            paragraph += ` Atención: la diversidad de estilos baja significativamente. El grupo de ${remainingAfter} jugadores quedaría más concentrado en pocos estilos.`;
        }

        return { paragraph, recommendation };
    }, [selectedMember, delta, members, dt]);

    if (members.length < 2) return null;

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-argo-navy">{dt.groupBalance.simTitulo}</h3>
                    <InfoTip
                        text="Simula cómo cambiaría el equilibrio de tu grupo si un jugador se mueve a otro equipo. Te ayuda a anticipar ajustes."
                        position="bottom"
                    />
                </div>
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
                            className={`flex items-center gap-2 pl-0 pr-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all focus:outline-none focus:ring-2 focus:ring-argo-violet-500/30 overflow-hidden ${
                                isSelected
                                    ? 'border-argo-navy bg-argo-navy text-white shadow-md'
                                    : 'border-argo-border bg-white hover:border-argo-navy/30 text-argo-navy hover:shadow-argo'
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
                        className="bg-argo-bg/60 rounded-[14px] p-4 space-y-3 border border-argo-border"
                    >
                        <p className="text-xs font-bold text-argo-navy">
                            {dt.groupBalance.simSiSeMueve(selectedMember.child_name)}
                        </p>

                        {/* Diversity */}
                        <div className="bg-white rounded-xl px-4 py-3 shadow-argo flex items-start gap-3">
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
                                    Diversidad de estilos: {delta.diversity > 0 ? '+' : ''}{delta.diversity} pts
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
                                            className="bg-white rounded-xl px-3 py-2.5 shadow-argo flex items-center gap-2"
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

                        {/* Impact & recommendation */}
                        {impact && (
                            <div className="bg-argo-bg rounded-xl p-4 space-y-3">
                                <p className="text-xs font-bold text-argo-navy">Impacto en el grupo</p>
                                <p className="text-xs text-argo-navy/80 leading-relaxed">
                                    {impact.paragraph}
                                </p>
                                <div className="border-l-[3px] border-argo-violet-400 pl-3">
                                    <p className="text-xs text-argo-navy/70 leading-relaxed italic">
                                        {impact.recommendation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
