import React from 'react';
import type { AxisDistribution, MotorDistribution } from '../../../lib/groupBalance';
import { AXIS_CONFIG } from '../../../lib/groupBalanceRules';

/* ── DISC Distribution (horizontal bars) ───────────────────────────────────── */

export const AxisChart: React.FC<{ dist: AxisDistribution; memberCount: number }> = ({ dist, memberCount }) => {
    const axes = (['D', 'I', 'S', 'C'] as const).map(axis => ({
        axis,
        pct: dist[axis],
        count: Math.round((dist[axis] / 100) * memberCount),
        ...AXIS_CONFIG[axis],
    }));

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">Distribución DISC</h3>
            <div className="space-y-2.5">
                {axes.map(a => (
                    <div key={a.axis} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                                    style={{ background: a.color }}
                                >
                                    {a.axis}
                                </span>
                                <span className="text-xs font-medium text-argo-navy">{a.name}</span>
                            </div>
                            <span className="text-xs text-argo-grey">
                                {a.count} {a.count === 1 ? 'jugador' : 'jugadores'} · <span className="font-bold text-argo-navy">{a.pct}%</span>
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-argo-neutral overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, a.pct)}%`, background: a.color, opacity: 0.8 }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── Motor Distribution ────────────────────────────────────────────────────── */

const MOTOR_CONFIG = {
    Rápido: { label: 'Dinámico', color: '#f59e0b' },
    Medio:  { label: 'Rítmico',  color: '#6366f1' },
    Lento:  { label: 'Sereno',   color: '#06b6d4' },
};

export const MotorChart: React.FC<{ dist: MotorDistribution; memberCount: number }> = ({ dist, memberCount }) => {
    const motors = (['Rápido', 'Medio', 'Lento'] as const).map(motor => ({
        motor,
        pct: dist[motor],
        count: Math.round((dist[motor] / 100) * memberCount),
        ...MOTOR_CONFIG[motor],
    }));

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">Distribución de motor</h3>
            <div className="space-y-2.5">
                {motors.map(m => (
                    <div key={m.motor} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-argo-navy">{m.label}</span>
                            <span className="text-xs text-argo-grey">
                                {m.count} · <span className="font-bold text-argo-navy">{m.pct}%</span>
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-argo-neutral overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, m.pct)}%`, background: m.color, opacity: 0.8 }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
