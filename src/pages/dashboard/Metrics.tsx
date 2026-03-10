import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

interface SessionRow {
    created_at: string;
    eje: string;
    archetype_label: string;
    ai_cost_usd: number;
    ai_tokens_input: number;
    ai_tokens_output: number;
}

const EJE_COLORS: Record<string, string> = {
    D: '#ef4444',
    I: '#f59e0b',
    S: '#22c55e',
    C: '#6366f1',
};

const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div className="bg-white border border-argo-border rounded-2xl p-6">
        <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-1">{label}</div>
        <div className="font-display text-3xl font-bold text-argo-navy">{value}</div>
        {sub && <div className="text-xs text-argo-grey/60 mt-1">{sub}</div>}
    </div>
);

export const Metrics: React.FC = () => {
    const [rows, setRows]       = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('sessions')
            .select('created_at,eje,archetype_label,ai_cost_usd,ai_tokens_input,ai_tokens_output')
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

    // ── Calculations ──────────────────────────────────────────────────────────
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
        .map(([date, count]) => ({ date: date.slice(5), count })); // MM-DD

    // DISC distribution
    const ejeCount: Record<string, number> = {};
    rows.forEach(r => { ejeCount[r.eje] = (ejeCount[r.eje] ?? 0) + 1; });
    const pieData = Object.entries(ejeCount).map(([eje, value]) => ({ eje, value }));

    // Top archetypes
    const archetypeCount: Record<string, number> = {};
    rows.forEach(r => { archetypeCount[r.archetype_label] = (archetypeCount[r.archetype_label] ?? 0) + 1; });
    const archetypeData = Object.entries(archetypeCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({ name: name.split(' ').slice(0, 2).join(' '), count }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-2xl font-bold text-argo-navy">Métricas</h1>
                <p className="text-sm text-argo-grey mt-0.5">Actividad y costos de IA</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Sesiones totales" value={String(total)} />
                <StatCard label="Esta semana" value={String(thisWeek)} />
                <StatCard label="Costo IA total" value={`$${totalCost.toFixed(2)}`} sub={`${(totalTokens / 1000).toFixed(0)}k tokens`} />
                <StatCard label="Costo IA promedio" value={`$${avgCost.toFixed(4)}`} sub="por sesión" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Daily sessions */}
                <div className="bg-white border border-argo-border rounded-2xl p-6">
                    <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-4">
                        Sesiones — últimos 30 días
                    </div>
                    {dailyData.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-sm text-argo-grey/50">Sin datos aún</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                                <Tooltip contentStyle={{ fontSize: 11 }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* DISC pie */}
                <div className="bg-white border border-argo-border rounded-2xl p-6">
                    <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-4">
                        Distribución por eje DISC
                    </div>
                    {pieData.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-sm text-argo-grey/50">Sin datos aún</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="eje"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={({ eje, percent }) => `${eje} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map(entry => (
                                        <Cell key={entry.eje} fill={EJE_COLORS[entry.eje] ?? '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Top archetypes */}
                <div className="bg-white border border-argo-border rounded-2xl p-6 md:col-span-2">
                    <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-4">
                        Arquetipos más frecuentes
                    </div>
                    {archetypeData.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-sm text-argo-grey/50">Sin datos aún</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={archetypeData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                                <Tooltip contentStyle={{ fontSize: 11 }} />
                                <Bar dataKey="count" fill="#1d3557" radius={[0, 3, 3, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
