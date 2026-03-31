import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantAI {
    id: string;
    display_name: string;
    email: string;
    plan: string;
    chat_queries_this_period: number;
    chat_soft_cap: number;
    chat_cap_percent: number;
    chat_total_messages: number;
    chat_est_cost: number;
    report_count: number;
    report_cost: number;
    total_est_cost: number;
}

interface GlobalStats {
    total_tenants: number;
    total_report_cost: number;
    total_chat_est_cost: number;
    total_cost: number;
    total_reports: number;
    total_chat_messages: number;
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export const AdminAIUsage: React.FC = () => {
    const [tenants, setTenants] = useState<TenantAI[]>([]);
    const [global, setGlobal] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'total_est_cost' | 'chat_queries_this_period' | 'report_count'>('total_est_cost');

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/admin-ai-usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) {
                const data = await res.json();
                setTenants(data.tenants);
                setGlobal(data.global);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const sorted = [...tenants].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    const nearCap = tenants.filter(t => t.chat_cap_percent >= 80 && t.plan !== 'enterprise');

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Consumo IA</h1>
                <p className="text-sm text-gray-500 mt-0.5">Desglose de costos por tenant y funcionalidad.</p>
            </div>

            {/* Global stats */}
            {global && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Costo total IA</p>
                        <p className="text-lg font-bold text-gray-900">${global.total_cost.toFixed(4)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Informes generados</p>
                        <p className="text-lg font-bold text-gray-900">{global.total_reports}</p>
                        <p className="text-[10px] text-gray-400">${global.total_report_cost.toFixed(4)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Mensajes chat</p>
                        <p className="text-lg font-bold text-gray-900">{global.total_chat_messages}</p>
                        <p className="text-[10px] text-gray-400">~${global.total_chat_est_cost.toFixed(4)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Costo/informe prom.</p>
                        <p className="text-lg font-bold text-gray-900">
                            ${global.total_reports > 0 ? (global.total_report_cost / global.total_reports).toFixed(4) : '0.0000'}
                        </p>
                    </div>
                </div>
            )}

            {/* Alerts */}
            {nearCap.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-amber-700 font-medium mb-2">
                        <AlertCircle size={13} /> {nearCap.length} tenant{nearCap.length > 1 ? 's' : ''} cerca del soft cap (&gt;80%)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {nearCap.map(t => (
                            <span key={t.id} className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                                {t.display_name} ({t.chat_cap_percent}%)
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Ordenar por:</span>
                {[
                    { key: 'total_est_cost' as const, label: 'Costo total' },
                    { key: 'chat_queries_this_period' as const, label: 'Queries chat' },
                    { key: 'report_count' as const, label: 'Informes' },
                ].map(s => (
                    <button
                        key={s.key}
                        onClick={() => setSortBy(s.key)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${sortBy === s.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Tenant</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Plan</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Informes</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Costo informes</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Chat queries</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Cap %</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Costo chat est.</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase text-right">Costo total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sorted.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-900 truncate max-w-[180px]">{t.display_name}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{t.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-[11px] font-bold uppercase text-gray-600">{t.plan}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">{t.report_count}</td>
                                <td className="px-4 py-3 text-right text-gray-700">${t.report_cost.toFixed(4)}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-gray-700">{t.chat_queries_this_period}</span>
                                    <span className="text-gray-300">/{t.chat_soft_cap === 999999 ? '∞' : t.chat_soft_cap}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`text-xs font-medium ${t.chat_cap_percent >= 80 ? 'text-amber-600' : t.chat_cap_percent >= 50 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                        {t.chat_soft_cap === 999999 ? '—' : `${t.chat_cap_percent}%`}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">~${t.chat_est_cost.toFixed(4)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">${t.total_est_cost.toFixed(4)}</td>
                            </tr>
                        ))}
                        {sorted.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Sin datos de consumo</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
