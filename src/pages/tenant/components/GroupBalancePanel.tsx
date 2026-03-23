import React from 'react';
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
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';

interface Props {
    members: MemberProfile[];
}

export const GroupBalancePanel: React.FC<Props> = ({ members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (members.length < 2) {
        return (
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 text-center">
                <p className="text-sm text-argo-grey">
                    {dt.groupBalance.minJugadores(2)}
                </p>
                {members.length === 1 && (
                    <p className="text-xs text-argo-grey/50 mt-1">
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

    // Get composite profile key if applicable
    const compositeKey = groupTypes.length === 2 ? getCompositeKey(groupTypes) : null;
    const compositeText = compositeKey ? COMPOSITE_TEXTS[compositeKey] : null;

    return (
        <div className="space-y-6">
            {/* Precision notice for small groups */}
            {members.length < 4 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-800">
                        {dt.groupBalance.precisionNota(members.length)}
                    </p>
                </div>
            )}

            {/* -- Group Identity ------------------------------------------------- */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 space-y-4">
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

                {/* Show composite text if 2 types, otherwise show primary type */}
                {compositeText ? (
                    <div className="space-y-3">
                        <p className="text-sm text-argo-navy leading-relaxed">{compositeText.identity}</p>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-argo-navy uppercase tracking-widest">{dt.groupBalance.herramientasAdulto}</p>
                            {compositeText.tools.map((t, i) => (
                                <p key={i} className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-indigo/20">
                                    {t}
                                </p>
                            ))}
                        </div>
                    </div>
                ) : (
                    groupTypes.map(type => {
                        const text = GROUP_PROFILE_TEXTS[type];
                        if (!text) return null;
                        return (
                            <div key={type} className="space-y-3">
                                <p className="text-sm text-argo-navy leading-relaxed">{text.identity}</p>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-argo-navy uppercase tracking-widest">{dt.groupBalance.fortalezas}</p>
                                    <ul className="space-y-1">
                                        {text.strengths.map((s, i) => (
                                            <li key={i} className="text-xs text-argo-grey leading-relaxed flex items-start gap-2">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-argo-indigo flex-shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-argo-navy uppercase tracking-widest">{dt.groupBalance.herramientasAdulto}</p>
                                    {text.tools.map((t, i) => (
                                        <p key={i} className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-indigo/20">
                                            {t}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* -- Distribution Charts -------------------------------------------- */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 space-y-6">
                <AxisChart dist={axisDist} memberCount={members.length} />
                <div className="border-t border-argo-border pt-6">
                    <MotorChart dist={motorDist} memberCount={members.length} />
                </div>
            </div>

            {/* -- Indicators ----------------------------------------------------- */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 space-y-5">
                <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">{dt.groupBalance.indicadoresGrupo}</h3>

                {/* Diversity */}
                <IndicatorBar
                    label={dt.groupBalance.diversidadDISC}
                    percentage={diversity}
                    color="#6366f1"
                    bgColor="#eef2ff"
                    levelLabel={DIVERSITY_TEXTS[diversityLevel].label}
                    description={DIVERSITY_TEXTS[diversityLevel].description}
                />

                <div className="border-t border-argo-border pt-4 space-y-4">
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

            {/* -- Motor profile -------------------------------------------------- */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6 space-y-3">
                <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">{dt.groupBalance.perfilMotorGrupo}</h3>
                <p className="text-sm text-argo-navy leading-relaxed">{MOTOR_TEXTS[motorType].identity}</p>
                <p className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-indigo/20">
                    {MOTOR_TEXTS[motorType].tools}
                </p>
            </div>

            {/* -- Pair Suggestions ----------------------------------------------- */}
            {members.length >= 4 && (
                <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6">
                    <PairSuggestions
                        complementarias={pairs.complementarias}
                        afinidades={pairs.afinidades}
                    />
                </div>
            )}

            {/* -- Simulator ------------------------------------------------------ */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-6">
                <SimulatorPanel members={members} />
            </div>
        </div>
    );
};
