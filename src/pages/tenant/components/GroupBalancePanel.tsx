import React from 'react';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MemberProfile } from '../../../lib/groupBalance';
import {
    calcAxisDistribution, calcMotorDistribution, calcDiversity,
    getGroupTypes, getIndicatorLevel, getDiversityLevel, getMotorGroupType,
    getNotablePairs,
} from '../../../lib/groupBalance';
import {
    getCompositeKey, AXIS_CONFIG,
    getGroupProfileText, getCompositeText, getIndicatorText, getDiversityText, getMotorText,
} from '../../../lib/groupBalanceRules';
import { IndicatorBar } from './IndicatorBar';
import { PairSuggestions } from './PairSuggestions';
import { SimulatorPanel } from './SimulatorPanel';
import { CollapsibleSection } from './CollapsibleSection';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';
import { InfoTip } from '../../../components/ui/Tooltip';
import { LockedSection } from '../../../components/dashboard/LockedSection';

interface Props {
    members: MemberProfile[];
    locked?: boolean;
}

/* ── Main panel ─────────────────────────────────────────────────────────────── */

export const GroupBalancePanel: React.FC<Props> = ({ members, locked = false }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (members.length < 2) {
        return (
            <div className="bg-white rounded-[14px] shadow-argo p-8 flex flex-col items-center text-center gap-3">
                <Users size={28} className="text-argo-light" />
                <div className="space-y-1.5">
                    <p className="text-sm font-medium text-argo-navy">
                        {dt.groupBalance.minJugadores(members.length)}
                    </p>
                    <p className="text-xs text-argo-grey">
                        {dt.groupBalance.minRecomendado}
                    </p>
                </div>
            </div>
        );
    }

    const axisDist = calcAxisDistribution(members);
    const motorDist = calcMotorDistribution(members);
    const diversity = calcDiversity(axisDist);
    const diversityLevel = getDiversityLevel(diversity);
    const groupTypes = getGroupTypes(axisDist);
    const motorType = getMotorGroupType(motorDist);
    const pairs = getNotablePairs(members, 3);

    const compositeKey = groupTypes.length === 2 ? getCompositeKey(groupTypes) : null;
    const compositeText = getCompositeText(compositeKey, lang);

    const primaryText = compositeText ?? (
        groupTypes.length > 0 ? getGroupProfileText(groupTypes[0], lang) : null
    );

    const duplasCount = pairs.complementarias.length + pairs.afinidades.length;

    const strengths = !compositeText && groupTypes.length > 0
        ? getGroupProfileText(groupTypes[0], lang)?.strengths
        : null;

    return (
        <div className="space-y-4">
            {/* Precision notice for small groups */}
            {members.length < 4 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-800 leading-relaxed">
                        {dt.groupBalance.precisionNota(members.length)}
                    </p>
                </div>
            )}

            {/* ── Hero card: identity + characteristics + tools ─────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-[14px] shadow-argo p-6 space-y-4"
            >
                {/* Group type badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {groupTypes.map(type => (
                        <span
                            key={type}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-argo-navy text-white"
                        >
                            {dt.groupBalance.equipo} {type}
                        </span>
                    ))}
                    <span className="text-[11px] text-argo-grey/60">{dt.groupBalance.jugadoresEnGrupo(members.length)}</span>
                </div>

                {/* Identity paragraph */}
                {primaryText && (
                    <p className="text-sm text-argo-secondary leading-relaxed">{primaryText.identity}</p>
                )}

                {/* Characteristics — inline bullets, no header */}
                {strengths && (
                    <ul className="space-y-1.5">
                        {strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-argo-grey leading-relaxed">
                                <span className="mt-2 w-1 h-1 rounded-full bg-argo-violet-400 flex-shrink-0" />
                                {s}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Diversity + motor summary */}
                <div className="flex items-center gap-4 flex-wrap pt-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-argo-grey">{lang === 'en' ? 'Diversity:' : lang === 'pt' ? 'Diversidade:' : 'Diversidad:'}</span>
                        <span className="text-[11px] font-bold" style={{ color: '#7c5cfc' }}>{getDiversityText(diversityLevel, lang).label}</span>
                        <InfoTip text={getDiversityText(diversityLevel, lang).description} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-argo-grey">{lang === 'en' ? 'Pace:' : lang === 'pt' ? 'Ritmo:' : 'Ritmo:'}</span>
                        <span className="text-[11px] font-bold text-argo-navy">{getMotorText(motorType, lang).identity.split('.')[0]}</span>
                        <InfoTip text={getMotorText(motorType, lang).tools} />
                    </div>
                </div>

                {/* Tools */}
                {primaryText?.tools && (
                    locked ? (
                        <div className="pt-3 border-t border-argo-border">
                            <LockedSection
                                label={dt.groupBalance.secHerramientas}
                                cta={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}
                                tooltip={lang === 'en' ? 'Concrete coaching recommendations based on the group\'s behavioral composition. How to lead this specific combination of profiles.' : lang === 'pt' ? 'Recomendações concretas de treinamento baseadas na composição comportamental do grupo. Como liderar esta combinação de perfis.' : 'Recomendaciones concretas de acompañamiento basadas en la composición conductual del grupo. Cómo liderar esta combinación de perfiles.'}
                            >
                                <div className="space-y-3">
                                    {primaryText.tools.map((t, i) => (
                                        <p key={i} className="text-sm text-argo-secondary leading-relaxed pl-3 border-l-2 border-argo-violet-500/25">{t}</p>
                                    ))}
                                </div>
                            </LockedSection>
                        </div>
                    ) : (
                        <div className="pt-3 border-t border-argo-border">
                            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest mb-3">
                                {dt.groupBalance.secHerramientas}
                            </h3>
                            <div className="space-y-3">
                                {primaryText.tools.map((t, i) => (
                                    <p key={i} className="text-sm text-argo-secondary leading-relaxed pl-3 border-l-2 border-argo-violet-500/25">{t}</p>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </motion.div>

            {/* ── Single "Análisis detallado" accordion ─────────────────── */}
            <div className="bg-white rounded-[14px] shadow-argo px-6 py-2">
                {locked ? (
                    <LockedSection
                        label={lang === 'en' ? 'Detailed analysis' : lang === 'pt' ? 'Análise detalhada' : 'Análisis detallado'}
                        cta={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}
                        tooltip={lang === 'en' ? 'Style and motor distribution, behavioral indicators, and pair suggestions to maximize team complementarity.' : lang === 'pt' ? 'Distribuição de estilos e motores, indicadores comportamentais e sugestões de duplas para maximizar a complementaridade da equipe.' : 'Distribución de estilos y motores, indicadores conductuales y sugerencias de duplas para maximizar la complementariedad del equipo.'}
                    >
                        <div className="py-3 space-y-3">
                            {[0,1,2].map(i => (
                                <div key={i} className="h-3 bg-argo-bg rounded-lg" style={{ width: `${75 - i * 12}%` }} />
                            ))}
                        </div>
                    </LockedSection>
                ) : (
                <CollapsibleSection
                    title={lang === 'en' ? 'Detailed analysis' : lang === 'pt' ? 'Análise detalhada' : 'Análisis detallado'}
                    defaultOpen={false}
                >
                    <div className="space-y-8">

                        {/* Equilibrio del grupo (indicators) */}
                        <div>
                            <h4 className="text-xs font-bold text-argo-navy uppercase tracking-widest mb-1">
                                {dt.groupBalance.secIndicadores}
                            </h4>
                            <p className="text-xs text-argo-grey leading-relaxed mb-3">
                                {lang === 'en' ? 'How present each behavioral style is in your group.' : lang === 'pt' ? 'Quanto cada estilo comportamental está presente no seu grupo.' : 'Qué tan presente está cada estilo de comportamiento en tu grupo.'}
                            </p>
                            <div className="space-y-2.5">
                                <IndicatorBar
                                    label={lang === 'en' ? 'Style diversity' : lang === 'pt' ? 'Diversidade de estilos' : 'Diversidad de estilos'}
                                    percentage={diversity}
                                    color="#7c5cfc"
                                    bgColor="#f0ecff"
                                    levelLabel={getDiversityText(diversityLevel, lang).label}
                                    description={getDiversityText(diversityLevel, lang).description}
                                />
                                {(['D', 'I', 'S', 'C'] as const).map(axis => {
                                    const pct = axisDist[axis];
                                    const level = getIndicatorLevel(pct);
                                    const text = getIndicatorText(axis, level, lang);
                                    const cfg = AXIS_CONFIG[axis];
                                    return (
                                        <IndicatorBar
                                            key={axis}
                                            label={dt.profile.indicatorLabels[axis] ?? cfg.indicatorLabel}
                                            percentage={pct}
                                            color={cfg.color}
                                            bgColor={cfg.bgColor}
                                            levelLabel={text.label}
                                            description={text.description}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Ritmo de procesamiento (motor) */}
                        <div className="pt-2 border-t border-argo-border/50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <h4 className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                                    {dt.groupBalance.secMotor}
                                </h4>
                                <InfoTip text={lang === 'en' ? "How the group tends to react to stimuli and make decisions." : lang === 'pt' ? "Como o grupo tende a reagir a estímulos e tomar decisões." : "Cómo tiende el grupo a reaccionar ante estímulos y tomar decisiones."} />
                            </div>
                            <p className="text-sm text-argo-secondary leading-relaxed">
                                {getMotorText(motorType, lang).identity}
                            </p>
                            <p className="text-xs text-argo-grey leading-relaxed mt-2 pl-3 border-l-2 border-argo-border">
                                {getMotorText(motorType, lang).tools}
                            </p>
                        </div>

                        {/* Duplas que se potencian */}
                        {members.length >= 4 && duplasCount > 0 && (
                            <div className="pt-2 border-t border-argo-border/50">
                                <h4 className="text-xs font-bold text-argo-navy uppercase tracking-widest mb-1">
                                    {dt.groupBalance.secDuplas}
                                </h4>
                                <p className="text-xs text-argo-grey leading-relaxed mb-3">
                                    {lang === 'en' ? 'Pairs of players that can boost each other in exercises and team dynamics.' : lang === 'pt' ? 'Duplas de jogadores que podem se potencializar em exercícios e dinâmicas de equipe.' : 'Duplas de jugadores que pueden potenciarse en ejercicios y dinámicas de equipo.'}
                                </p>
                                <PairSuggestions
                                    complementarias={pairs.complementarias}
                                    afinidades={pairs.afinidades}
                                />
                            </div>
                        )}

                        {/* Simulator */}
                        <div className="pt-2 border-t border-argo-border/50">
                            <SimulatorPanel members={members} />
                        </div>
                    </div>
                </CollapsibleSection>
                )}
            </div>
        </div>
    );
};
