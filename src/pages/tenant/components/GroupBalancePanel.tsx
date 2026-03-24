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

interface Props {
    members: MemberProfile[];
}

/* ── DISC mini-dots (hero) ──────────────────────────────────────────────────── */

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

/* ── Main panel ─────────────────────────────────────────────────────────────── */

export const GroupBalancePanel: React.FC<Props> = ({ members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (members.length < 2) {
        return (
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 text-center space-y-1">
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
    const groupName = groupTypes.map(t => `Equipo ${t}`).join(' + ');

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
                className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 space-y-4"
            >
                {/* Group type badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {groupTypes.map(type => (
                        <span
                            key={type}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-argo-navy text-white"
                        >
                            Equipo {type}
                        </span>
                    ))}
                </div>

                {/* Large heading */}
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-argo-navy leading-tight">{groupName}</h2>
                    {primaryText && (
                        <p className="text-sm text-argo-grey leading-relaxed">{primaryText.identity}</p>
                    )}
                </div>

                {/* DISC mini visual */}
                <DiscDots members={members} />

                <p className="text-[11px] text-argo-grey/60">
                    {dt.groupBalance.jugadoresEnGrupo(members.length)}
                </p>
            </motion.div>

            {/* ── Collapsible sections ────────────────────────────────── */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm px-6 py-2">

                {/* Fortalezas */}
                {!compositeText && groupTypes.length > 0 && GROUP_PROFILE_TEXTS[groupTypes[0]]?.strengths && (
                    <CollapsibleSection title={dt.groupBalance.secFortalezas} defaultOpen>
                        <ul className="space-y-2">
                            {GROUP_PROFILE_TEXTS[groupTypes[0]].strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-argo-grey leading-relaxed">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-argo-indigo flex-shrink-0" />
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
                                    className="text-sm text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-indigo/25"
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
                    badge={`${members.length} jugadores`}
                >
                    <div className="space-y-6">
                        <AxisChart dist={axisDist} memberCount={members.length} members={members} />
                        <div className="border-t border-argo-border pt-5">
                            <MotorChart dist={motorDist} memberCount={members.length} members={members} />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Indicadores */}
                <CollapsibleSection title={dt.groupBalance.secIndicadores} defaultOpen={false}>
                    <div className="space-y-3">
                        <IndicatorBar
                            label={dt.groupBalance.diversidadDISC}
                            percentage={diversity}
                            color="#6366f1"
                            bgColor="#eef2ff"
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
                    <div className="space-y-2">
                        <p className="text-sm text-argo-navy leading-relaxed">
                            {MOTOR_TEXTS[motorType].identity}
                        </p>
                        <p className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-indigo/20">
                            {MOTOR_TEXTS[motorType].tools}
                        </p>
                    </div>
                </CollapsibleSection>

                {/* Guía de duplas — only 4+ members */}
                {members.length >= 4 && (
                    <CollapsibleSection
                        title={dt.groupBalance.secDuplas}
                        defaultOpen={false}
                        badge={`${pairs.complementarias.length + pairs.afinidades.length} duplas`}
                    >
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
