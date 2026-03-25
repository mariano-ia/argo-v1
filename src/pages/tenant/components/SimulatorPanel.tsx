import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemberProfile } from '../../../lib/groupBalance';
import { simulateRemoval } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';
import { InfoTip } from '../../../components/ui/Tooltip';

/* ── Impact & recommendation content ──────────────────────────────────────── */

const AXIS_LOSS_IMPACT: Record<string, string> = {
    D: 'nadie va a tomar la iniciativa de forma natural en situaciones competitivas. El adulto va a necesitar asumir un rol más activo de impulso.',
    I: 'el grupo pierde su conector social natural. Las dinámicas de integración y motivación grupal van a depender más del adulto.',
    S: 'el grupo pierde su ancla de estabilidad. Puede volverse más reactivo y menos predecible en momentos de presión.',
    C: 'el grupo pierde capacidad de observación y análisis táctico. Las decisiones van a ser más impulsivas y menos reflexionadas.',
};

const AXIS_LOSS_RECO: Record<string, string> = {
    D: 'Si lo mueves, busca compensar proponiendo desafíos claros al grupo y asignando roles de liderazgo rotativo.',
    I: 'Si lo mueves, refuerza los rituales de equipo (saludos, celebraciones, rondas de cierre) para mantener la conexión social.',
    S: 'Si lo mueves, mantén las rutinas del grupo lo más estables posible y anticipa los cambios con tiempo.',
    C: 'Si lo mueves, incorpora pausas breves de observación en los ejercicios para mantener la reflexión activa.',
};

const AXIS_PARTIAL_RECO = 'El impacto es moderado porque el grupo mantiene otros jugadores con ese estilo. Observa si la dinámica cambia en los primeros entrenamientos.';

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
            paragraph = `${selectedMember.child_name} es el único ${axisName} del grupo. Sin esta energía, ${AXIS_LOSS_IMPACT[memberEje] ?? 'el grupo pierde un estilo sin sustituto.'}`;
            recommendation = AXIS_LOSS_RECO[memberEje] ?? 'Observa de cerca cómo responde el grupo en las primeras sesiones.';
        } else {
            const remaining = sameAxisCount - 1;
            paragraph = `El grupo mantiene ${remaining} jugador${remaining > 1 ? 'es' : ''} con estilo ${axisName}. El impacto es contenido.`;
            recommendation = AXIS_PARTIAL_RECO;
        }

        if (delta.diversity >= 10) {
            paragraph += ` La diversidad mejora: el grupo de ${remainingAfter} quedaría más equilibrado.`;
        } else if (delta.diversity <= -10) {
            paragraph += ` Atención: la diversidad baja significativamente. El grupo quedaría concentrado en pocos estilos.`;
        }

        return { paragraph, recommendation };
    }, [selectedMember, delta, members, dt]);

    if (members.length < 2) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                    {lang === 'en' ? 'Simulate a move' : lang === 'pt' ? 'Simular uma mudança' : 'Simular un movimiento'}
                </h4>
                <InfoTip text={lang === 'en' ? 'See how the group balance changes if a player moves to another team.' : lang === 'pt' ? 'Veja como o equilíbrio do grupo muda se um jogador vai para outro time.' : 'Visualiza cómo cambia el equilibrio del grupo si un jugador se mueve a otro equipo.'} />
            </div>

            {/* Player list — clean, minimal */}
            <div className="flex flex-wrap gap-1.5">
                {members.map(m => {
                    const isSelected = selectedId === m.session_id;
                    const cfg = AXIS_CONFIG[m.eje];
                    return (
                        <button
                            key={m.session_id}
                            onClick={() => setSelectedId(isSelected ? null : m.session_id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                isSelected
                                    ? 'border-argo-navy bg-argo-navy text-white'
                                    : 'border-argo-border text-argo-secondary hover:border-argo-navy/30'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : cfg?.color }} />
                            {m.child_name}
                        </button>
                    );
                })}
            </div>

            {/* Result */}
            <AnimatePresence>
                {impact && selectedMember && (
                    <motion.div
                        key={selectedId}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="bg-argo-bg rounded-xl p-4 space-y-3"
                    >
                        <p className="text-xs text-argo-secondary leading-relaxed">
                            {impact.paragraph}
                        </p>
                        <p className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-border italic">
                            {impact.recommendation}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
