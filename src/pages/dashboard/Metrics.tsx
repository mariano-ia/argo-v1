import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar, CartesianGrid,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionRow {
    created_at: string;
    eje: string;
    motor: string;
    archetype_label: string;
    ai_cost_usd: number;
    ai_tokens_input: number;
    ai_tokens_output: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EJE_COLORS: Record<string, string> = {
    D: '#ef4444',
    I: '#f59e0b',
    S: '#22c55e',
    C: '#6366f1',
};

const EJE_LABELS: Record<string, string> = {
    D: 'Impulsor',
    I: 'Conector',
    S: 'Sostenedor',
    C: 'Estratega',
};

const MOTOR_COLORS: Record<string, string> = {
    'Rápido': '#0071E3',
    'Medio': '#86868B',
    'Lento': '#D2D2D7',
};

const TOOLTIP_STYLE = {
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 10,
    border: '1px solid #D2D2D7',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

const LABEL_STYLE = {
    color: '#86868B',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <motion.div
        variants={staggerItem}
        className="bg-white border border-argo-border rounded-2xl p-6 hover:shadow-sm transition-shadow"
    >
        <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-1">{label}</div>
        <div className="font-display text-3xl font-bold text-argo-navy">{value}</div>
        {sub && <div className="text-xs text-argo-grey/60 mt-1">{sub}</div>}
    </motion.div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string; delay?: number }> = ({
    title, children, className = '', delay = 0.1,
}) => (
    <motion.div
        {...fadeUp(delay)}
        className={`bg-white border border-argo-border rounded-2xl p-6 ${className}`}
    >
        <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-4">
            {title}
        </div>
        {children}
    </motion.div>
);

const EmptyState: React.FC = () => (
    <div className="h-44 flex items-center justify-center text-sm text-argo-grey/50">Sin datos aún</div>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const Metrics: React.FC = () => {
    const [rows, setRows] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('sessions')
            .select('created_at,eje,motor,archetype_label,ai_cost_usd,ai_tokens_input,ai_tokens_output')
            .is('deleted_at', null)
            .not('eje', 'eq', '_pending')
            .order('created_at', { ascending: true })
            .then(({ data }) => { setRows(data ?? []); setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-60">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    // ── Calculations ─────────────────────────────────────────────────────────
    const total = rows.length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const thisWeek = rows.filter(r => new Date(r.created_at) >= weekAgo).length;
    const totalCost = rows.reduce((s, r) => s + (r.ai_cost_usd ?? 0), 0);
    const avgCost = total > 0 ? totalCost / total : 0;
    const totalTokens = rows.reduce((s, r) => s + (r.ai_tokens_input ?? 0) + (r.ai_tokens_output ?? 0), 0);

    // Sessions per day (last 30 days)
    const days30: Record<string, number> = {};
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    rows.filter(r => new Date(r.created_at) >= thirtyDaysAgo).forEach(r => {
        const d = r.created_at.slice(0, 10);
        days30[d] = (days30[d] ?? 0) + 1;
    });
    const dailyData = Object.entries(days30)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date: date.slice(5), count }));

    // DISC distribution
    const ejeCount: Record<string, number> = {};
    rows.forEach(r => { ejeCount[r.eje] = (ejeCount[r.eje] ?? 0) + 1; });
    const pieData = Object.entries(ejeCount).map(([eje, value]) => ({ eje, value }));

    // Motor distribution
    const motorCount: Record<string, number> = {};
    rows.forEach(r => { if (r.motor) motorCount[r.motor] = (motorCount[r.motor] ?? 0) + 1; });
    const motorData = Object.entries(motorCount).map(([motor, value]) => ({ motor, value }));

    // All archetypes (no limit — scrollable card)
    const archetypeCount: Record<string, number> = {};
    rows.forEach(r => { archetypeCount[r.archetype_label] = (archetypeCount[r.archetype_label] ?? 0) + 1; });
    const archetypeData = Object.entries(archetypeCount)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({ name: name.split(' ').slice(0, 2).join(' '), count }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="font-display text-2xl font-bold text-argo-navy">Métricas</h1>
                <p className="text-sm text-argo-grey mt-0.5">Actividad y costos de IA</p>
            </motion.div>

            {/* Stat cards */}
            <motion.div
                variants={staggerContainer(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <StatCard label="Sesiones totales" value={String(total)} />
                <StatCard label="Esta semana" value={String(thisWeek)} />
                <StatCard label="Costo IA total" value={`$${totalCost.toFixed(2)}`} sub={`${(totalTokens / 1000).toFixed(0)}k tokens`} />
                <StatCard label="Costo IA promedio" value={`$${avgCost.toFixed(4)}`} sub="por sesión" />
            </motion.div>

            {/* Charts — 2x2 equal cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Arquetipos más frecuentes (scrollable) */}
                <ChartCard title="Arquetipos más frecuentes" delay={0.1}>
                    {archetypeData.length === 0 ? <EmptyState /> : (
                        <div className="h-[220px] overflow-y-auto">
                            <ResponsiveContainer width="100%" height={Math.max(220, archetypeData.length * 28)}>
                                <BarChart data={archetypeData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9, fill: '#86868B' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#1D1D1F' }} width={90} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Bar dataKey="count" fill="#1D1D1F" radius={[0, 4, 4, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* 2. Distribución por eje DISC (donut — % on hover only) */}
                <ChartCard title="Distribución por eje DISC" delay={0.15}>
                    {pieData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="eje"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    cornerRadius={4}
                                >
                                    {pieData.map(entry => (
                                        <Cell key={entry.eje} fill={EJE_COLORS[entry.eje] ?? '#94a3b8'} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(value: number, name: string) => [value, EJE_LABELS[name] || name]}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={6}
                                    wrapperStyle={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em' }}
                                    formatter={(value: string) => EJE_LABELS[value] || value}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* 3. Sesiones — últimos 30 días (AreaChart) */}
                <ChartCard title="Sesiones — últimos 30 días" delay={0.2}>
                    {dailyData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0071E3" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0071E3" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 9, fill: '#86868B' }}
                                    axisLine={{ stroke: '#D2D2D7' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 9, fill: '#86868B' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#0071E3"
                                    strokeWidth={2}
                                    fill="url(#gradSessions)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#0071E3', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* 4. Distribución por motor */}
                <ChartCard title="Distribución por motor" delay={0.25}>
                    {motorData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={motorData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9, fill: '#86868B' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="motor" tick={{ fontSize: 11, fill: '#1D1D1F', fontWeight: 500 }} width={60} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                    {motorData.map(entry => (
                                        <Cell key={entry.motor} fill={MOTOR_COLORS[entry.motor] ?? '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>
        </div>
    );
};
