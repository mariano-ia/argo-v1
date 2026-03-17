import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { fadeUp } from '../../lib/animations';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedbackRow {
    id: string;
    session_id: string;
    clarity: string;
    helpfulness: string;
    identification: string;
    open_comment: string | null;
    created_at: string;
    sessions: {
        adult_name: string;
        child_name: string;
        archetype_label: string;
        sport: string;
    };
}

interface Totals {
    clarity: Record<string, number>;
    helpfulness: Record<string, number>;
    identification: Record<string, number>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CLARITY_LABELS: Record<string, string> = {
    muy_claro: 'Muy claro',
    algo_claro: 'Algo claro',
    confuso: 'Confuso',
};

const HELPFULNESS_LABELS: Record<string, string> = {
    mucho: 'Mucho',
    algo: 'Algo',
    poco: 'Poco',
};

const IDENTIFICATION_LABELS: Record<string, string> = {
    identificado: 'Identificado',
    mas_o_menos: 'Más o menos',
    nada: 'Nada',
};

const BAR_COLORS = ['#f97316', '#fdba74', '#d4d4d8'];

const TOOLTIP_STYLE = {
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 10,
    border: '1px solid #D2D2D7',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ChartCard: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({
    title, children, delay = 0.1,
}) => (
    <motion.div
        {...fadeUp(delay)}
        className="bg-white border border-argo-border rounded-2xl p-6"
    >
        <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold mb-4">
            {title}
        </div>
        {children}
    </motion.div>
);

function buildChartData(
    totals: Record<string, number>,
    labels: Record<string, string>,
) {
    return Object.entries(labels).map(([key, label]) => ({
        name: label,
        count: totals[key] ?? 0,
    }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Feedback: React.FC = () => {
    const [rows, setRows] = useState<FeedbackRow[]>([]);
    const [totals, setTotals] = useState<Totals | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { setError('No autenticado'); setLoading(false); return; }

                const res = await fetch('/api/feedback', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => ({ error: 'Error' }));
                    throw new Error(body.error || `HTTP ${res.status}`);
                }

                const data = await res.json();
                setRows(data.feedback);
                setTotals(data.totals);
                setTotal(data.total);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-60">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-60 text-sm text-red-500">
                {error}
            </div>
        );
    }

    const clarityData = totals ? buildChartData(totals.clarity, CLARITY_LABELS) : [];
    const helpfulnessData = totals ? buildChartData(totals.helpfulness, HELPFULNESS_LABELS) : [];
    const identificationData = totals ? buildChartData(totals.identification, IDENTIFICATION_LABELS) : [];

    const comments = rows.filter(r => r.open_comment);

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="font-display text-2xl font-bold text-argo-navy">Feedback</h1>
                <p className="text-sm text-argo-grey mt-0.5">
                    {total} {total === 1 ? 'respuesta' : 'respuestas'}
                </p>
            </motion.div>

            {/* Charts — 3 columns */}
            {total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ChartCard title="Claridad del informe" delay={0.1}>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={clarityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#1D1D1F' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#86868B' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                                    {clarityData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Utilidad percibida" delay={0.15}>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={helpfulnessData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#1D1D1F' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#86868B' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                                    {helpfulnessData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Identificación con el resultado" delay={0.2}>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={identificationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#1D1D1F' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#86868B' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                                    {identificationData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* Comments table */}
            {comments.length > 0 && (
                <motion.div {...fadeUp(0.25)} className="bg-white border border-argo-border rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-argo-border">
                        <div className="text-[10px] uppercase tracking-widest text-argo-grey font-semibold">
                            Comentarios abiertos ({comments.length})
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-argo-border text-left">
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-argo-grey font-semibold">Fecha</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-argo-grey font-semibold">Adulto</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-argo-grey font-semibold">Deportista</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-argo-grey font-semibold">Arquetipo</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-argo-grey font-semibold">Comentario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comments.map(row => (
                                    <tr key={row.id} className="border-b border-argo-border last:border-0 hover:bg-argo-neutral/50 transition-colors">
                                        <td className="px-6 py-3 text-argo-grey whitespace-nowrap">
                                            {new Date(row.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-3 text-argo-navy font-medium">{row.sessions?.adult_name ?? '—'}</td>
                                        <td className="px-6 py-3 text-argo-navy">{row.sessions?.child_name ?? '—'}</td>
                                        <td className="px-6 py-3 text-argo-grey">{row.sessions?.archetype_label ?? '—'}</td>
                                        <td className="px-6 py-3 text-argo-navy max-w-md">
                                            <span className="line-clamp-2">{row.open_comment}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Empty state */}
            {total === 0 && (
                <motion.div {...fadeUp(0.1)} className="bg-white border border-argo-border rounded-2xl p-12 text-center">
                    <p className="text-sm text-argo-grey/60">Todavía no hay respuestas de feedback</p>
                </motion.div>
            )}
        </div>
    );
};
