import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Lead {
    id: string;
    created_at: string;
    name: string;
    email: string;
    institution: string;
    whatsapp: string;
    country: string;
    sport: string | null;
    team_size: string | null;
    source: string;
    status: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
    new: { label: 'Nuevo', cls: 'bg-argo-violet-100 text-argo-violet-500' },
    contacted: { label: 'Contactado', cls: 'bg-amber-100 text-amber-700' },
    closed: { label: 'Cerrado', cls: 'bg-green-100 text-green-700' },
};

const STATUSES = ['new', 'contacted', 'closed'] as const;

const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

export const AdminLeads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/demo-request', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) {
                const data = await res.json();
                setLeads(data.requests ?? []);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const updateStatus = async (id: string, status: string) => {
        const prev = leads;
        setLeads(l => l.map(x => (x.id === id ? { ...x, status } : x)));
        setSaving(id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch('/api/demo-request', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (!res.ok) setLeads(prev);
        } catch {
            setLeads(prev);
        } finally { setSaving(null); }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    const counts = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Leads</h1>
                <p className="text-sm text-gray-500 mt-0.5">Solicitudes de demo de ArgoAcademy® desde la web.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-argo-violet-50 border border-argo-violet-200 rounded-lg px-4 py-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Sin contactar</p>
                    <p className="text-lg font-bold text-argo-violet-500">{counts.new}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Contactados</p>
                    <p className="text-lg font-bold text-gray-900">{counts.contacted}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Total</p>
                    <p className="text-lg font-bold text-gray-900">{counts.total}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Fecha</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Nombre</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Contacto</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Institución</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">País</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Deporte</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Niños</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leads.map(l => (
                            <tr key={l.id} className="hover:bg-gray-50/50 align-top">
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(l.created_at)}</td>
                                <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{l.name}</td>
                                <td className="px-4 py-3">
                                    <a href={`mailto:${l.email}`} className="text-indigo-600 hover:underline block truncate max-w-[180px]">{l.email}</a>
                                    <a
                                        href={`https://wa.me/${l.whatsapp.replace(/[^\d]/g, '')}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-green-600 hover:underline"
                                    >{l.whatsapp}</a>
                                </td>
                                <td className="px-4 py-3 text-gray-700 truncate max-w-[160px]">{l.institution}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{l.country}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{l.sport || '—'}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{l.team_size || '—'}</td>
                                <td className="px-4 py-3">
                                    <select
                                        value={l.status}
                                        disabled={saving === l.id}
                                        onChange={e => updateStatus(l.id, e.target.value)}
                                        className={`text-[11px] font-bold uppercase rounded px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-argo-violet-400 ${STATUS_META[l.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {STATUSES.map(s => (
                                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Sin solicitudes todavía</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
