import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { fadeUp } from '../../lib/animations';
import { Search, Download, Trash2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RowStatus = 'completed' | 'registered';

interface UnifiedRow {
    id: string;
    created_at: string;
    email: string;
    status: RowStatus;
    // completed-only fields
    adult_name?: string;
    child_name?: string;
    child_age?: number;
    sport?: string;
    eje?: string;
    motor?: string;
    archetype_label?: string;
    ai_cost_usd?: number;
}

// Raw Supabase shapes
interface SessionRow {
    id: string;
    created_at: string;
    adult_name: string;
    adult_email: string;
    child_name: string;
    child_age: number;
    sport: string;
    eje: string;
    motor: string;
    archetype_label: string;
    ai_cost_usd: number;
}

interface LeadRow {
    email: string;
    last_seen: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EJE_COLOR: Record<string, string> = {
    D: 'bg-red-100 text-red-700',
    I: 'bg-amber-100 text-amber-700',
    S: 'bg-green-100 text-green-700',
    C: 'bg-blue-100 text-blue-700',
};

function mergeRows(sessions: SessionRow[], leads: LeadRow[]): UnifiedRow[] {
    const sessionEmails = new Set(sessions.map(s => s.adult_email?.toLowerCase()));

    const completedRows: UnifiedRow[] = sessions.map(s => ({
        id: s.id,
        created_at: s.created_at,
        email: s.adult_email,
        status: 'completed',
        adult_name: s.adult_name,
        child_name: s.child_name,
        child_age: s.child_age,
        sport: s.sport,
        eje: s.eje,
        motor: s.motor,
        archetype_label: s.archetype_label,
        ai_cost_usd: s.ai_cost_usd,
    }));

    const registeredRows: UnifiedRow[] = leads
        .filter(l => !sessionEmails.has(l.email?.toLowerCase()))
        .map(l => ({
            id: `lead::${l.email}`,
            created_at: l.last_seen,
            email: l.email,
            status: 'registered',
        }));

    return [...completedRows, ...registeredRows]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Sessions: React.FC = () => {
    const [rows, setRows]             = useState<UnifiedRow[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [page, setPage]             = useState(0);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [{ data: sessions }, { data: leads }] = await Promise.all([
                supabase
                    .from('sessions')
                    .select('id,created_at,adult_name,adult_email,child_name,child_age,sport,eje,motor,archetype_label,ai_cost_usd')
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('leads')
                    .select('email,last_seen')
                    .order('last_seen', { ascending: false }),
            ]);
            setRows(mergeRows(sessions ?? [], leads ?? []));
            setLoading(false);
        };
        load();
    }, []);

    const filtered = rows.filter(r =>
        [r.email, r.adult_name, r.child_name, r.archetype_label]
            .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const fmt = (iso: string) =>
        new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

    const deleteRow = async (row: UnifiedRow) => {
        setConfirmingId(null);
        try {
            const body = row.status === 'completed'
                ? { type: 'session', id: row.id }
                : { type: 'lead', email: row.email };

            const res = await fetch('/api/delete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setRows(prev => prev.filter(r => r.id !== row.id));
            }
        } catch {
            // Network error — row stays in list
        }
    };

    const exportCSV = () => {
        const headers = ['Fecha', 'Email', 'Estado', 'Adulto', 'Niño', 'Edad', 'Deporte', 'Arquetipo', 'Eje', 'Motor', 'Costo IA'];
        const csvRows = [
            headers.join(','),
            ...filtered.map(r => [
                fmt(r.created_at),
                r.email,
                r.status === 'completed' ? 'Completó' : 'Solo se registró',
                r.adult_name ?? '',
                r.child_name ?? '',
                r.child_age ?? '',
                r.sport ?? '',
                r.archetype_label ?? '',
                r.eje ?? '',
                r.motor ?? '',
                r.ai_cost_usd != null && r.ai_cost_usd > 0 ? r.ai_cost_usd.toFixed(4) : '',
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `argo-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const completedCount   = rows.filter(r => r.status === 'completed').length;
    const registeredCount  = rows.filter(r => r.status === 'registered').length;

    return (
        <div>
            <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Sesiones</h1>
                    <p className="text-sm text-argo-grey mt-0.5">
                        {completedCount} completadas · {registeredCount} solo se registraron
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey/50" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Buscar nombre, email..."
                            className="pl-9 pr-4 py-2 text-sm border border-argo-border rounded-lg focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 w-56"
                        />
                    </div>
                    <button
                        onClick={exportCSV}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-argo-border rounded-lg hover:bg-argo-neutral transition-all disabled:opacity-40"
                    >
                        <Download size={14} /> Exportar CSV
                    </button>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                </div>
            ) : (
                <>
                    <motion.div {...fadeUp(0.1)} className="bg-white border border-argo-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-argo-neutral border-b border-argo-border text-[10px] uppercase tracking-widest text-argo-grey">
                                        <th className="text-left px-5 py-3 font-semibold">Fecha</th>
                                        <th className="text-left px-5 py-3 font-semibold">Email</th>
                                        <th className="text-left px-5 py-3 font-semibold">Estado</th>
                                        <th className="text-left px-5 py-3 font-semibold">Adulto</th>
                                        <th className="text-left px-5 py-3 font-semibold">Niño</th>
                                        <th className="text-left px-5 py-3 font-semibold">Edad</th>
                                        <th className="text-left px-5 py-3 font-semibold">Deporte</th>
                                        <th className="text-left px-5 py-3 font-semibold">Arquetipo</th>
                                        <th className="text-left px-5 py-3 font-semibold">Eje</th>
                                        <th className="text-left px-5 py-3 font-semibold">Motor</th>
                                        <th className="text-right px-5 py-3 font-semibold">Costo IA</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="text-center py-12 text-argo-grey/50 text-sm">
                                                {search ? 'Sin resultados para esa búsqueda.' : 'Todavía no hay sesiones registradas.'}
                                            </td>
                                        </tr>
                                    ) : paginated.map((row, i) => (
                                        <tr
                                            key={row.id}
                                            className={`border-b border-argo-border last:border-0 hover:bg-argo-neutral/50 transition-colors ${
                                                i % 2 === 0 ? 'bg-white' : 'bg-argo-neutral/20'
                                            }`}
                                        >
                                            <td className="px-5 py-3 text-argo-grey whitespace-nowrap">{fmt(row.created_at)}</td>
                                            <td className="px-5 py-3 text-argo-grey">{row.email}</td>
                                            <td className="px-5 py-3">
                                                {row.status === 'completed' ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                                        Completó
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                                                        Solo se registró
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-argo-navy whitespace-nowrap">{row.adult_name ?? '—'}</td>
                                            <td className="px-5 py-3 font-semibold text-argo-navy">{row.child_name ?? '—'}</td>
                                            <td className="px-5 py-3 text-argo-grey">{row.child_age ?? '—'}</td>
                                            <td className="px-5 py-3 text-argo-grey">{row.sport ?? '—'}</td>
                                            <td className="px-5 py-3 text-argo-navy font-medium">{row.archetype_label ?? '—'}</td>
                                            <td className="px-5 py-3">
                                                {row.eje ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EJE_COLOR[row.eje] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {row.eje}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-argo-grey">{row.motor ?? '—'}</td>
                                            <td className="px-5 py-3 text-right text-argo-grey font-mono text-xs">
                                                {row.ai_cost_usd && row.ai_cost_usd > 0 ? `$${row.ai_cost_usd.toFixed(4)}` : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-right whitespace-nowrap">
                                                {confirmingId === row.id ? (
                                                    <span className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => deleteRow(row)}
                                                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(null)}
                                                            className="text-xs text-argo-grey hover:text-argo-navy transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmingId(row.id)}
                                                        className="text-argo-grey/40 hover:text-red-500 transition-colors p-1"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {totalPages > 1 && (
                        <motion.div {...fadeUp(0.15)} className="flex items-center justify-between mt-4">
                            <span className="text-xs text-argo-grey">
                                Página {page + 1} de {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 text-xs font-semibold border border-argo-border rounded-lg disabled:opacity-40 hover:bg-argo-neutral transition-all"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 text-xs font-semibold border border-argo-border rounded-lg disabled:opacity-40 hover:bg-argo-neutral transition-all"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
};
