import React from 'react';
import { motion } from 'framer-motion';
import type { AxisDistribution, MotorDistribution, MemberProfile } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';
import { InfoTip } from '../../../components/ui/Tooltip';

const AXIS_INFOTIPS: Record<string, string> = {
    D: 'Energía de liderazgo y desafío. Jugadores que proponen, compiten y toman la iniciativa.',
    I: 'Energía de conexión social. Jugadores que motivan, integran y contagian entusiasmo al grupo.',
    S: 'Energía de estabilidad. Jugadores leales y consistentes que sostienen al grupo en momentos difíciles.',
    C: 'Energía de observación y análisis. Jugadores que leen el juego, cuidan los detalles y buscan precisión.',
};

/* ── Shared: Avatar dot ─────────────────────────────────────────────────────── */

const PlayerDot: React.FC<{
    name: string;
    color: string;
    size?: 'sm' | 'md';
}> = ({ name, color, size = 'md' }) => {
    const initials = name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const sizeClass = size === 'sm'
        ? 'w-7 h-7 text-[9px]'
        : 'w-8 h-8 text-[10px]';

    return (
        <div
            title={name}
            className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white shadow-argo`}
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
};

/* ── Axis Distribution ─────────────────────────────────────────────────────── */

export const AxisChart: React.FC<{
    dist: AxisDistribution;
    memberCount: number;
    members?: MemberProfile[];
}> = ({ dist, memberCount, members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const axes = (['D', 'I', 'S', 'C'] as const).map(axis => ({
        axis,
        pct: dist[axis],
        count: Math.round((dist[axis] / 100) * memberCount),
        ...AXIS_CONFIG[axis],
        players: members?.filter(m => m.eje === axis) ?? [],
    }));

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                {dt.groupBalance.distribucionDISC}
            </h3>

            {/* Avatar scatter by axis */}
            {members && members.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {axes.map(a => (
                        <div key={a.axis} className="space-y-2">
                            <div
                                className="rounded-xl p-2.5 min-h-[60px] flex flex-wrap gap-1.5 items-start content-start"
                                style={{ backgroundColor: a.bgColor }}
                            >
                                {a.players.length > 0 ? (
                                    a.players.map(p => (
                                        <PlayerDot
                                            key={p.session_id}
                                            name={p.child_name}
                                            color={a.color}
                                            size="sm"
                                        />
                                    ))
                                ) : (
                                    <span className="text-[10px] text-argo-grey/50 italic">—</span>
                                )}
                            </div>
                            <div className="text-center">
                                <span
                                    className="text-[10px] font-bold"
                                    style={{ color: a.color }}
                                >
                                    {dt.profile.axisNames[a.axis] ?? a.name}
                                </span>
                                <p className="text-[10px] text-argo-grey">
                                    {a.count} {a.count === 1 ? dt.common.jugador : dt.common.jugadores}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bar chart */}
            <div className="space-y-2.5">
                {axes.map((a, i) => (
                    <div key={a.axis} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ background: a.color }}
                                />
                                <span className="text-xs font-medium text-argo-navy">
                                    {dt.profile.axisNames[a.axis] ?? a.name}
                                </span>
                                <InfoTip text={AXIS_INFOTIPS[a.axis] ?? ''} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: a.color }}>
                                {a.pct}%
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-argo-bg overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: a.color, opacity: 0.85 }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, a.pct)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.08 }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── Motor Distribution ─────────────────────────────────────────────────────── */

const MOTOR_COLORS: Record<string, string> = {
    Rápido: '#f59e0b',
    Medio:  '#6366f1',
    Lento:  '#06b6d4',
};

const MOTOR_BG: Record<string, string> = {
    Rápido: '#fffbeb',
    Medio:  '#eef2ff',
    Lento:  '#ecfeff',
};

export const MotorChart: React.FC<{
    dist: MotorDistribution;
    memberCount: number;
    members?: MemberProfile[];
}> = ({ dist, memberCount, members }) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const motors = (['Rápido', 'Medio', 'Lento'] as const).map(motor => ({
        motor,
        pct: dist[motor],
        count: Math.round((dist[motor] / 100) * memberCount),
        label: dt.profile.motorNames[motor] ?? motor,
        color: MOTOR_COLORS[motor] ?? '#999',
        bg: MOTOR_BG[motor] ?? '#f5f5f5',
        players: members?.filter(m => m.motor === motor) ?? [],
    }));

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">
                {dt.groupBalance.distribucionMotor}
            </h3>

            {/* Avatar scatter by motor */}
            {members && members.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {motors.map(m => (
                        <div key={m.motor} className="space-y-2">
                            <div
                                className="rounded-xl p-2.5 min-h-[54px] flex flex-wrap gap-1.5 items-start content-start"
                                style={{ backgroundColor: m.bg }}
                            >
                                {m.players.length > 0 ? (
                                    m.players.map(p => (
                                        <PlayerDot
                                            key={p.session_id}
                                            name={p.child_name}
                                            color={m.color}
                                            size="sm"
                                        />
                                    ))
                                ) : (
                                    <span className="text-[10px] text-argo-grey/50 italic">—</span>
                                )}
                            </div>
                            <div className="text-center">
                                <span
                                    className="text-[10px] font-bold"
                                    style={{ color: m.color }}
                                >
                                    {m.label}
                                </span>
                                <p className="text-[10px] text-argo-grey">
                                    {m.count} {m.count === 1 ? dt.common.jugador : dt.common.jugadores}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bar chart */}
            <div className="space-y-2.5">
                {motors.map((m, i) => (
                    <div key={m.motor} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-argo-navy">{m.label}</span>
                            <span className="text-xs font-bold" style={{ color: m.color }}>
                                {m.pct}%
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-argo-bg overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: m.color, opacity: 0.85 }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, m.pct)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.08 }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
