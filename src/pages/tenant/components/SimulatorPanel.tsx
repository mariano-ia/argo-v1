import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemberProfile } from '../../../lib/groupBalance';
import { simulateRemoval } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';
import { InfoTip } from '../../../components/ui/Tooltip';

/* ── Impact & recommendation content ──────────────────────────────────────── */

const AXIS_LOSS_IMPACT: Record<string, Record<string, string>> = {
    D: {
        es: 'nadie va a tomar la iniciativa de forma natural en situaciones competitivas. El adulto va a necesitar asumir un rol más activo de impulso.',
        en: 'no one will naturally take initiative in competitive situations. The adult will need to take a more active driving role.',
        pt: 'ninguém vai tomar a iniciativa de forma natural em situações competitivas. O adulto vai precisar assumir um papel mais ativo de impulso.',
    },
    I: {
        es: 'el grupo pierde su conector social natural. Las dinámicas de integración y motivación grupal van a depender más del adulto.',
        en: 'the group loses its natural social connector. Group integration and motivation dynamics will depend more on the adult.',
        pt: 'o grupo perde seu conector social natural. As dinâmicas de integração e motivação grupal vão depender mais do adulto.',
    },
    S: {
        es: 'el grupo pierde su ancla de estabilidad. Puede volverse más reactivo y menos predecible en momentos de presión.',
        en: 'the group loses its stability anchor. It may become more reactive and less predictable in moments of pressure.',
        pt: 'o grupo perde sua âncora de estabilidade. Pode se tornar mais reativo e menos previsível em momentos de pressão.',
    },
    C: {
        es: 'el grupo pierde capacidad de observación y análisis táctico. Las decisiones van a ser más impulsivas y menos reflexionadas.',
        en: 'the group loses its capacity for observation and tactical analysis. Decisions will be more impulsive and less reflective.',
        pt: 'o grupo perde capacidade de observação e análise tática. As decisões vão ser mais impulsivas e menos reflexivas.',
    },
};

const AXIS_LOSS_RECO: Record<string, Record<string, string>> = {
    D: {
        es: 'Si lo mueves, busca compensar proponiendo desafíos claros al grupo y asignando roles de liderazgo rotativo.',
        en: 'If you move them, compensate by proposing clear challenges to the group and assigning rotating leadership roles.',
        pt: 'Se você movê-lo, busque compensar propondo desafios claros ao grupo e atribuindo papéis de liderança rotativa.',
    },
    I: {
        es: 'Si lo mueves, refuerza los rituales de equipo (saludos, celebraciones, rondas de cierre) para mantener la conexión social.',
        en: 'If you move them, reinforce team rituals (greetings, celebrations, closing rounds) to maintain social connection.',
        pt: 'Se você movê-lo, reforce os rituais de equipe (saudações, celebrações, rodadas de encerramento) para manter a conexão social.',
    },
    S: {
        es: 'Si lo mueves, mantén las rutinas del grupo lo más estables posible y anticipa los cambios con tiempo.',
        en: 'If you move them, keep the group\'s routines as stable as possible and anticipate changes in advance.',
        pt: 'Se você movê-lo, mantenha as rotinas do grupo o mais estáveis possível e antecipe as mudanças com tempo.',
    },
    C: {
        es: 'Si lo mueves, incorpora pausas breves de observación en los ejercicios para mantener la reflexión activa.',
        en: 'If you move them, incorporate brief observation pauses in exercises to keep active reflection going.',
        pt: 'Se você movê-lo, incorpore pausas breves de observação nos exercícios para manter a reflexão ativa.',
    },
};

const AXIS_PARTIAL_RECO: Record<string, string> = {
    es: 'El impacto es moderado porque el grupo mantiene otros jugadores con ese estilo. Observa si la dinámica cambia en los primeros entrenamientos.',
    en: 'The impact is moderate because the group retains other players with that style. Observe whether the dynamic changes in the first few training sessions.',
    pt: 'O impacto é moderado porque o grupo mantém outros jogadores com esse estilo. Observe se a dinâmica muda nos primeiros treinos.',
};

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

        const lossImpact = AXIS_LOSS_IMPACT[memberEje]?.[lang] ?? AXIS_LOSS_IMPACT[memberEje]?.es ?? '';
        const lossReco = AXIS_LOSS_RECO[memberEje]?.[lang] ?? AXIS_LOSS_RECO[memberEje]?.es ?? '';

        if (isLast) {
            const onlyPhrase = lang === 'en'
                ? `${selectedMember.child_name} is the only ${axisName} in the group. Without this energy, ${lossImpact}`
                : lang === 'pt'
                ? `${selectedMember.child_name} é o único ${axisName} do grupo. Sem essa energia, ${lossImpact}`
                : `${selectedMember.child_name} es el único ${axisName} del grupo. Sin esta energía, ${lossImpact}`;
            paragraph = onlyPhrase;
            recommendation = lossReco;
        } else {
            const remaining = sameAxisCount - 1;
            if (lang === 'en') {
                paragraph = `The group retains ${remaining} player${remaining > 1 ? 's' : ''} with the ${axisName} style. The impact is contained.`;
            } else if (lang === 'pt') {
                paragraph = `O grupo mantém ${remaining} jogador${remaining > 1 ? 'es' : ''} com estilo ${axisName}. O impacto é contido.`;
            } else {
                paragraph = `El grupo mantiene ${remaining} jugador${remaining > 1 ? 'es' : ''} con estilo ${axisName}. El impacto es contenido.`;
            }
            recommendation = AXIS_PARTIAL_RECO[lang] ?? AXIS_PARTIAL_RECO.es;
        }

        if (delta.diversity >= 10) {
            if (lang === 'en') {
                paragraph += ` Diversity improves: the group of ${remainingAfter} would be more balanced.`;
            } else if (lang === 'pt') {
                paragraph += ` A diversidade melhora: o grupo de ${remainingAfter} ficaria mais equilibrado.`;
            } else {
                paragraph += ` La diversidad mejora: el grupo de ${remainingAfter} quedaría más equilibrado.`;
            }
        } else if (delta.diversity <= -10) {
            if (lang === 'en') {
                paragraph += ` Warning: diversity drops significantly. The group would become concentrated in fewer styles.`;
            } else if (lang === 'pt') {
                paragraph += ` Atenção: a diversidade cai significativamente. O grupo ficaria concentrado em poucos estilos.`;
            } else {
                paragraph += ` Atención: la diversidad baja significativamente. El grupo quedaría concentrado en pocos estilos.`;
            }
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
