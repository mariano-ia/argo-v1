import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Download, Trash2 } from 'lucide-react';

interface LeadRow {
    user_id: string;
    email: string;
    first_seen: string;
    last_seen: string;
}

export const Leads: React.FC = () => {
    const [rows, setRows]       = useState<LeadRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [page, setPage]       = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('leads')
                .select('user_id,email,first_seen,last_seen')
                .order('last_seen', { ascending: false });
            setRows(data ?? []);
            setLoading(false);
        };
        fetch();
    }, []);

    const filtered = rows.filter(r =>
        r.email?.toLowerCase().includes(search.toLowerCase())
    );

    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const fmt = (iso: string) =>
        new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

    const deleteRow = async (userId: string) => {
        setRows(prev => prev.filter(r => r.user_id !== userId));
        await supabase.from('leads').delete().eq('user_id', userId);
    };

    const exportCSV = () => {
        const headers = ['Email', 'Primera vez', 'Última vez'];
        const csvRows = [
            headers.join(','),
            ...filtered.map(r => [
                r.email,
                fmt(r.first_seen),
                fmt(r.last_seen),
            ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `argo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Leads</h1>
                    <p className="text-sm text-argo-grey mt-0.5">{rows.length} usuarios registrados</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey/50" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Buscar email..."
                            className="pl-9 pr-4 py-2 text-sm border border-argo-border rounded-lg focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 w-48"
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
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                </div>
            ) : (
                <>
                    <div className="bg-white border border-argo-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-argo-neutral border-b border-argo-border text-[10px] uppercase tracking-widest text-argo-grey">
                                        <th className="text-left px-5 py-3 font-semibold">Email</th>
                                        <th className="text-left px-5 py-3 font-semibold">Primera vez</th>
                                        <th className="text-left px-5 py-3 font-semibold">Última vez</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-argo-grey/50 text-sm">
                                                {search ? 'Sin resultados para esa búsqueda.' : 'Todavía no hay leads registrados.'}
                                            </td>
                                        </tr>
                                    ) : paginated.map((row, i) => (
                                        <tr
                                            key={row.user_id}
                                            className={`border-b border-argo-border last:border-0 hover:bg-argo-neutral/50 transition-colors ${
                                                i % 2 === 0 ? 'bg-white' : 'bg-argo-neutral/20'
                                            }`}
                                        >
                                            <td className="px-5 py-3 font-semibold text-argo-navy">{row.email}</td>
                                            <td className="px-5 py-3 text-argo-grey whitespace-nowrap">{fmt(row.first_seen)}</td>
                                            <td className="px-5 py-3 text-argo-grey whitespace-nowrap">{fmt(row.last_seen)}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => deleteRow(row.user_id)}
                                                    className="text-argo-grey/40 hover:text-red-500 transition-colors p-1"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
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
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
