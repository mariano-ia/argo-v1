import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Purchase {
    id: string;
    email: string;
    pack_size: number;
    amount_usd: number;
    currency: string;
    payment_provider: string;
    payment_status: string;
    created_at: string;
    paid_at: string | null;
    links: { available: number; sent: number; pending: number; completed: number };
}

const statusColor: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

export const AdminArgoOne: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [summary, setSummary] = useState<{ total_revenue: number; total_purchases: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/admin-argo-one', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) {
                const data = await res.json();
                setPurchases(data.purchases);
                setSummary(data.summary);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Argo One</h1>
                <p className="text-sm text-gray-500 mt-0.5">Compras puntuales de padres y familias.</p>
            </div>

            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Revenue total</p>
                        <p className="text-lg font-bold text-emerald-700">${summary.total_revenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Compras completadas</p>
                        <p className="text-lg font-bold text-gray-900">{summary.total_purchases}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Total compras</p>
                        <p className="text-lg font-bold text-gray-900">{purchases.length}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Fecha</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Email</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Pack</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Monto</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Estado</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Provider</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Links</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {purchases.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(p.created_at)}</td>
                                <td className="px-4 py-3 text-gray-700 truncate max-w-[180px]">{p.email}</td>
                                <td className="px-4 py-3 text-gray-700 font-medium">{p.pack_size}</td>
                                <td className="px-4 py-3 text-gray-900 font-semibold">${p.amount_usd.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor[p.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                                        {p.payment_status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400">{p.payment_provider}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1.5 text-[10px]">
                                        {p.links.completed > 0 && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{p.links.completed} ok</span>}
                                        {(p.links.sent + p.links.pending) > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">{p.links.sent + p.links.pending} pend</span>}
                                        {p.links.available > 0 && <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{p.links.available} disp</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {purchases.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Sin compras registradas</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
