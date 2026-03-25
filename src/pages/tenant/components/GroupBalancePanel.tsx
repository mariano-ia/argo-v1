import React from 'react';
import { motion } from 'framer-motion';
import type { MemberProfile } from '../../../lib/groupBalance';
import {
    calcAxisDistribution, calcMotorDistribution, calcDiversity,
    getGroupTypes, getIndicatorLevel, getDiversityLevel, getMotorGroupType,
    getNotablePairs,
} from '../../../lib/groupBalance';
import {
    GROUP_PROFILE_TEXTS, COMPOSITE_TEXTS, getCompositeKey,
    INDICATOR_TEXTS, DIVERSITY_TEXTS, MOTOR_TEXTS, AXIS_CONFIG,
} from '../../../lib/groupBalanceRules';
import { IndicatorBar } from './IndicatorBar';
import { PairSuggestions } from './PairSuggestions';
import { SimulatorPanel } from './SimulatorPanel';
import { CollapsibleSection } from './CollapsibleSection';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';
import { InfoTip } from '../../../components/ui/Tooltip';

interface Props {
    members: MemberProfile[];
}

/* ── Axis mini-dots (hero) — shows names, not D/I/S/C letters ─────────────── */

const AXIS_INFOTIPS: Record<string, string> = {
    D: 'Energía de liderazgo y desafío. Jugadores que proponen, compiten y toman la iniciativa.',
    I: 'Energía de conexión social. Jugadores que motivan, integran y contagian entusiasmo al grupo.',
    S: 'Energía de estabilidad. Jugadores leales y consistentes que sostienen al grupo en momentos difíciles.',
    C: 'Energía de observación y análisis. Jugadores que leen el juego, cuidan los detalles y buscan precisión.',
};

const AxisDots: React.FC<{ members: MemberProfile[]; lang: string }> = ({ members, lang }) => {
    const dt = getDashboardT(lang);
    const axes = (['D', 'I', 'S', 'C'] as const);
    return (
        <div className="flex items-center gap-4 flex-wrap">
            {axes.map(axis => {
                const players = members.filter(m => m.eje === axis);
                if (players.length === 0) return null;
                const cfg = AXIS_CONFIG[axis];
                const axisName = dt.profile.axisNames[axis] ?? cfg.name;
                return (
                    <div key={axis} className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                            {players.slice(0, 4).map((p, i) => {
                                const initials = p.child_name
                                    .split(' ')
                                    .map((w: string) => w[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase();
                                return (
                                    <motion.div
                                        key={p.session_id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.06, duration: 0.25 }}
                                        title={p.child_name}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white"
                                        style={{ backgroundColor: cfg.color }}
                                    >
                                        {initials}
                                    </motion.div>
                                );
                            })}
                            {players.length > 4 && (
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white"
                                    style={{ backgroundColor: cfg.color + 'aa' }}
                                >
                                    +{players.length - 4}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
                            {axisName}
                        </span>
                        <InfoTip text={AXIS_INFOTIPS[axis]} />
                    </div>
                );
            })}
        </div>
    );
};

/* ── Main panel ─────────────────────────────────────────────────────────────── */

export const GroupBalancePanel: React.FC<Props> = ({ members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (members.length < 2) {
        return (
            <div className="bg-white rounded-[14px] shadow-argo p-6 text-center space-y-1">
                <p className="text-sm text-argo-grey">
                    {dt.groupBalance.minJugadores(2)}
                </p>
                {members.length === 1 && (
                    <p className="text-xs text-argo-grey/50">
                        {dt.groupBalance.minRecomendado}
                    </p>
                )}
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
    const compositeText = compositeKey ? COMPOSITE_TEXTS[compositeKey] : null;

    const primaryText = compositeText ?? (
        groupTypes.length > 0 ? GROUP_PROFILE_TEXTS[groupTypes[0]] : null
    );

    const duplasCount = pairs.complementarias.length + pairs.afinidades.length;

    // Strengths come from single-type groups only (composite groups don't have separate strengths)
    const strengths = !compositeText && groupTypes.length > 0
        ? GROUP_PROFILE_TEXTS[groupTypes[0]]?.strengths
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

            {/* ── Hero card: identity + strengths + tools ──────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-[14px] shadow-argo p-6 space-y-5"
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
                </div>

                {/* Identity paragraph */}
                {primaryText && (
                    <p className="text-sm text-argo-secondary leading-relaxed">{primaryText.identity}</p>
                )}

                {/* Diversity + motor summary */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-argo-grey">{lang === 'en' ? 'Diversity:' : lang === 'pt' ? 'Diversidade:' : 'Diversidad:'}</span>
                        <span className="text-[11px] font-bold" style={{ color: '#7c5cfc' }}>{DIVERSITY_TEXTS[diversityLevel].label}</span>
                        <InfoTip text={DIVERSITY_TEXTS[diversityLevel].description} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-argo-grey">{lang === 'en' ? 'Pace:' : lang === 'pt' ? 'Ritmo:' : 'Ritmo:'}</span>
                        <span className="text-[11px] font-bold text-argo-navy">{MOTOR_TEXTS[motorType].identity.split('.')[0]}</span>
                        <InfoTip text={MOTOR_TEXTS[motorType].tools} />
                    </div>
                </div>

                {/* Axis mini visual */}
                <AxisDots members={members} lang={lang} />

                <p className="text-[11px] text-argo-grey/60">
                    {dt.groupBalance.jugadoresEnGrupo(members.length)}
                </p>

                {/* ── Strengths (inline, not collapsible) ──────────────── */}
                {strengths && (
                    <div className="pt-2 border-t border-argo-border">
                        <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest mb-3">
                            {dt.groupBalance.secFortalezas}
                        </h3>
                        <ul className="space-y-2">
                            {strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-argo-grey leading-relaxed">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-argo-violet-500 flex-shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ── Tools (inline, not collapsible) ──────────────────── */}
                {primaryText?.tools && (
                    <div className="pt-2 border-t border-argo-border">
                        <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest mb-3">
                            {dt.groupBalance.secHerramientas}
                        </h3>
                        <div className="space-y-3">
                            {primaryText.tools.map((t, i) => (
                                <p
                                    key={i}
                                    className="text-sm text-argo-secondary leading-relaxed pl-3 border-l-2 border-argo-violet-500/25"
                                >
                                    {t}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Single "Análisis detallado" accordion ─────────────────── */}
            <div className="bg-white rounded-[14px] shadow-argo px-6 py-2">
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
                            <div className="space-y-3">
                                <IndicatorBar
                                    label={lang === 'en' ? 'Style diversity' : lang === 'pt' ? 'Diversidade de estilos' : 'Diversidad de estilos'}
                                    percentage={diversity}
                                    color="#7c5cfc"
                                    bgColor="#f0ecff"
                                    levelLabel={DIVERSITY_TEXTS[diversityLevel].label}
                                    description={DIVERSITY_TEXTS[diversityLevel].description}
                                />
                                <div className="pt-1 space-y-3">
                                    {(['D', 'I', 'S', 'C'] as const).map(axis => {
                                        const pct = axisDist[axis];
                                        const level = getIndicatorLevel(pct);
                                        const text = INDICATOR_TEXTS[axis][level];
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
                        </div>

                        {/* Ritmo de procesamiento (motor) */}
                        <div className="pt-2 border-t border-argo-border/50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <h4 className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                                    {dt.groupBalance.secMotor}
                                </h4>
                                <InfoTip text={lang === 'en' ? "How the group tends to react to stimuli and make decisions — their processing speed." : lang === 'pt' ? "Como o grupo tende a reagir a estímulos e tomar decisões — sua velocidade de processamento." : "Cómo tiende el grupo a reaccionar ante estímulos y tomar decisiones — su velocidad de procesamiento."} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-argo-navy leading-relaxed">
                                    {MOTOR_TEXTS[motorType].identity}
                                </p>
                                <p className="text-xs text-argo-secondary leading-relaxed pl-3 border-l-2 border-argo-violet-500/20">
                                    {MOTOR_TEXTS[motorType].tools}
                                </p>
                            </div>
                        </div>

                        {/* Duplas que se potencian */}
                        {members.length >= 4 && duplasCount > 0 && (
                            <div className="pt-2 border-t border-argo-border/50">
                                <h4 className="text-xs font-bold text-argo-navy uppercase tracking-widest mb-1">
                                    {dt.groupBalance.secDuplas}
                                </h4>
                                <p className="text-xs text-argo-grey leading-relaxed mb-3">
                                    {lang === 'en' ? 'Pairs of players that can boost each other in exercises and team dynamics.' : lang === 'pt' ? 'Duplas de jogadores que podem se potencializar em exercícios e dinâmicas de equipe.' : 'Duplas de jugadores que pueden potenciarse mutuamente en ejercicios y dinámicas de equipo.'}
                                </p>
                                <PairSuggestions
                                    complementarias={pairs.complementarias}
                                    afinidades={pairs.afinidades}
                                />
                            </div>
                        )}

                        {/* ¿Qué pasa si...? (simulator) */}
                        <div className="pt-2 border-t border-argo-border/50">
                            <SimulatorPanel members={members} />
                        </div>
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};
