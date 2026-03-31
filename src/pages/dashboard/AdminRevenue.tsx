import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RevenueData {
    mrr: { estimate: number; by_plan: Record<string, number> };
    argo_one: { total_revenue_usd: number; purchase_count: number; profiles_sold: number; by_month: Record<string, number> };
    signups: { total: number; by_month: Record<string, number> };
    conversion: { total_trials: number; total_paid: number; rate_percent: number };
}

/* ── Component ──────────────────────────────────────────────────────────────── */

const Stat: React.FC<{ label: string; value: string | number; sub?: string; accent?: boolean }> = ({ label, value, sub, accent }) => (
    <div className={`rounded-lg border px-4 py-3 ${accent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase">{label}</p>
        <p className={`text-lg font-bold ${accent ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
);

export const AdminRevenue: React.FC = () => {
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/admin-revenue', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) setData(await res.json());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading || !data) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    const { mrr, argo_one, signups, conversion } = data;

    // Sort months for charts
    const signupMonths = Object.entries(signups.by_month).sort(([a], [b]) => a.localeCompare(b));
    const oneMonths = Object.entries(argo_one.by_month).sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Revenue</h1>
                <p className="text-sm text-gray-500 mt-0.5">Métricas de ingresos y crecimiento.</p>
            </div>

            {/* MRR */}
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Recurring (suscripciones)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="MRR estimado" value={`$${mrr.estimate}`} sub="Basado en planes activos" accent />
                    <Stat label="PRO" value={mrr.by_plan.pro ?? 0} sub={`× $49/mes = $${(mrr.by_plan.pro ?? 0) * 49}`} />
                    <Stat label="Academy" value={mrr.by_plan.academy ?? 0} sub={`× $89/mes = $${(mrr.by_plan.academy ?? 0) * 89}`} />
                    <Stat label="Enterprise" value={mrr.by_plan.enterprise ?? 0} sub="Facturación custom" />
                </div>
            </div>

            {/* Argo One */}
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">One-time (Argo One)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Revenue total" value={`$${argo_one.total_revenue_usd.toFixed(2)}`} accent />
                    <Stat label="Compras" value={argo_one.purchase_count} />
                    <Stat label="Perfiles vendidos" value={argo_one.profiles_sold} />
                    <Stat label="Ticket promedio" value={argo_one.purchase_count > 0 ? `$${(argo_one.total_revenue_usd / argo_one.purchase_count).toFixed(2)}` : '—'} />
                </div>
                {oneMonths.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 mt-3 p-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Revenue Argo One por mes</p>
                        <div className="flex items-end gap-2 h-24">
                            {oneMonths.map(([month, amount]) => {
                                const maxVal = Math.max(...oneMonths.map(([, v]) => v));
                                const pct = maxVal > 0 ? (amount / maxVal) * 100 : 0;
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full bg-emerald-100 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }}>
                                            <div className="w-full h-full bg-emerald-500 rounded-t opacity-70" />
                                        </div>
                                        <span className="text-[9px] text-gray-400">{month.slice(5)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Growth */}
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Crecimiento</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Total cuentas" value={signups.total} />
                    <Stat label="Trials activos" value={conversion.total_trials} />
                    <Stat label="Pagos activos" value={conversion.total_paid} />
                    <Stat label="Conversión" value={`${conversion.rate_percent}%`} sub="Trial → pago" accent={conversion.rate_percent > 0} />
                </div>
                {signupMonths.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 mt-3 p-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Signups por mes</p>
                        <div className="flex items-end gap-2 h-24">
                            {signupMonths.map(([month, count]) => {
                                const maxVal = Math.max(...signupMonths.map(([, v]) => v));
                                const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 4)}%`, background: '#955FB5', opacity: 0.7 }} />
                                        <span className="text-[9px] text-gray-400">{month.slice(5)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
