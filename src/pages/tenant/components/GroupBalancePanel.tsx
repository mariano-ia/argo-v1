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
import { AxisChart, MotorChart } from './DistributionChart';
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

/* ── Axis mini-dots (hero) ────────────────────────────────────────────────── */

const DiscDots: React.FC<{ members: MemberProfile[] }> = ({ members }) => {
    const axes = (['D', 'I', 'S', 'C'] as const);
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {axes.map(axis => {
                const players = members.filter(m => m.eje === axis);
                if (players.length === 0) return null;
                const cfg = AXIS_CONFIG[axis];
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
                            {axis}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

/* ── Group type InfoTip descriptions ──────────────────────────────────────── */

const GROUP_TYPE_INFOTIPS: Record<string, string> = {
    Competitivo: 'Este grupo se enciende con los desafíos. La energía competitiva es su combustible natural.',
    Social: 'La conexión humana es protagonista. La energía viene del vínculo entre los jugadores.',
    Cohesivo: 'La consistencia y la lealtad son el tejido que une a los jugadores.',
    'Metódico': 'Observa antes de actuar. La precisión es su manera natural de abordar desafíos.',
    Balanceado: 'Conviven diferentes estilos. La variedad permite adaptarse a múltiples situaciones.',
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

    // Resolve identity sentence and tools/strengths for the hero section
    const primaryText = compositeText ?? (
        groupTypes.length > 0 ? GROUP_PROFILE_TEXTS[groupTypes[0]] : null
    );

    // Human-friendly group name
    const groupName = groupTypes.map(t => `${dt.groupBalance.equipo} ${t}`).join(' + ');

    // Build InfoTip text for the active group types
    const groupTypeInfoText = groupTypes
        .map(t => GROUP_TYPE_INFOTIPS[t])
        .filter(Boolean)
        .join(' ');

    // Duplas count
    const duplasCount = pairs.complementarias.length + pairs.afinidades.length;

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

            {/* ── Hero card ──────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-[14px] shadow-argo p-6 space-y-4"
            >
                {/* Group type badges + InfoTip */}
                <div className="flex items-center gap-2 flex-wrap">
                    {groupTypes.map(type => (
                        <span
                            key={type}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-argo-navy text-white"
                        >
                            {dt.groupBalance.equipo} {type}
                        </span>
                    ))}
                    {groupTypeInfoText && (
                        <InfoTip text={groupTypeInfoText} />
                    )}
                </div>

                {/* Large heading */}
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-argo-navy leading-tight">{groupName}</h2>
                    {primaryText && (
                        <p className="text-sm text-argo-grey leading-relaxed">{primaryText.identity}</p>
                    )}
                </div>

                {/* Axis mini visual */}
                <DiscDots members={members} />

                {/* Diversity + motor summary metrics */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-argo-grey">Diversidad:</span>
                        <span className="text-[11px] font-bold" style={{ color: '#7c5cfc' }}>{DIVERSITY_TEXTS[diversityLevel].label}</span>
                        <InfoTip text={DIVERSITY_TEXTS[diversityLevel].description} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-argo-grey">Ritmo:</span>
                        <span className="text-[11px] font-bold text-argo-navy">{MOTOR_TEXTS[motorType].identity.split('.')[0]}</span>
                        <InfoTip text={MOTOR_TEXTS[motorType].tools} />
                    </div>
                </div>

                <p className="text-[11px] text-argo-grey/60">
                    {dt.groupBalance.jugadoresEnGrupo(members.length)}
                </p>
            </motion.div>

            {/* ── Collapsible sections ────────────────────────────────── */}
            <div className="bg-white rounded-[14px] shadow-argo px-6 py-2">

                {/* Fortalezas */}
                {!compositeText && groupTypes.length > 0 && GROUP_PROFILE_TEXTS[groupTypes[0]]?.strengths && (
                    <CollapsibleSection title={dt.groupBalance.secFortalezas} defaultOpen>
                        <ul className="space-y-2">
                            {GROUP_PROFILE_TEXTS[groupTypes[0]].strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-argo-grey leading-relaxed">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-argo-violet-500 flex-shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </CollapsibleSection>
                )}

                {/* Herramientas para el adulto */}
                {primaryText?.tools && (
                    <CollapsibleSection title={dt.groupBalance.secHerramientas} defaultOpen>
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
                    </CollapsibleSection>
                )}

                {/* Distribución detallada */}
                <CollapsibleSection
                    title={dt.groupBalance.secDistribucion}
                    defaultOpen={false}
                    badge={`${members.length} ${members.length === 1 ? dt.common.jugador : dt.common.jugadores}`}
                >
                    <p className="text-xs text-argo-grey leading-relaxed mb-4">Así se distribuyen los estilos de comportamiento y los ritmos de procesamiento en tu grupo.</p>
                    <div className="space-y-6">
                        <AxisChart dist={axisDist} memberCount={members.length} members={members} />
                        <div className="border-t border-argo-border pt-5">
                            <MotorChart dist={motorDist} memberCount={members.length} members={members} />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Indicadores */}
                <CollapsibleSection title={dt.groupBalance.secIndicadores} defaultOpen={false}>
                    <p className="text-xs text-argo-grey leading-relaxed mb-3">Cada indicador muestra qué tan presente está cada estilo en tu grupo. Expande "¿Qué significa esto?" para ver cómo usarlo.</p>
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
                </CollapsibleSection>

                {/* Motor del grupo */}
                <CollapsibleSection title={dt.groupBalance.secMotor} defaultOpen={false}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <InfoTip text="El motor indica la velocidad de procesamiento del grupo: cómo tienden a reaccionar ante estímulos y tomar decisiones." />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-argo-navy leading-relaxed">
                            {MOTOR_TEXTS[motorType].identity}
                        </p>
                        <p className="text-xs text-argo-secondary leading-relaxed pl-3 border-l-2 border-argo-violet-500/20">
                            {MOTOR_TEXTS[motorType].tools}
                        </p>
                    </div>
                </CollapsibleSection>

                {/* Guía de duplas — only 4+ members */}
                {members.length >= 4 && (
                    <CollapsibleSection
                        title={dt.groupBalance.secDuplas}
                        defaultOpen={false}
                        badge={`${duplasCount}`}
                    >
                        <p className="text-xs text-argo-grey leading-relaxed mb-3">Duplas de jugadores que pueden potenciarse mutuamente en ejercicios, tareas o dinámicas de equipo.</p>
                        <PairSuggestions
                            complementarias={pairs.complementarias}
                            afinidades={pairs.afinidades}
                        />
                    </CollapsibleSection>
                )}

                {/* Simulador */}
                <CollapsibleSection title={dt.groupBalance.secSimulador} defaultOpen={false}>
                    <SimulatorPanel members={members} />
                </CollapsibleSection>

            </div>
        </div>
    );
};
