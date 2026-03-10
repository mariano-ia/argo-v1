import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';

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

const EJE_COLOR: Record<string, string> = {
    D: 'bg-red-100 text-red-700',
    I: 'bg-amber-100 text-amber-700',
    S: 'bg-green-100 text-green-700',
    C: 'bg-blue-100 text-blue-700',
};

export const Sessions: React.FC = () => {
    const [rows, setRows]       = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [page, setPage]       = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('sessions')
                .select('id,created_at,adult_name,adult_email,child_name,child_age,sport,eje,motor,archetype_label,ai_cost_usd')
                .order('created_at', { ascending: false });
            setRows(data ?? []);
            setLoading(false);
        };
        fetch();
    }, []);

    const filtered = rows.filter(r =>
        [r.adult_name, r.adult_email, r.child_name, r.archetype_label]
            .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const fmt = (iso: string) =>
        new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Sesiones</h1>
                    <p className="text-sm text-argo-grey mt-0.5">{rows.length} sesiones totales</p>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey/50" />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Buscar nombre, email..."
                        className="pl-9 pr-4 py-2 text-sm border border-argo-border rounded-lg focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 w-56"
                    />
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
                                        <th className="text-left px-5 py-3 font-semibold">Fecha</th>
                                        <th className="text-left px-5 py-3 font-semibold">Adulto</th>
                                        <th className="text-left px-5 py-3 font-semibold">Email</th>
                                        <th className="text-left px-5 py-3 font-semibold">Niño</th>
                                        <th className="text-left px-5 py-3 font-semibold">Edad</th>
                                        <th className="text-left px-5 py-3 font-semibold">Deporte</th>
                                        <th className="text-left px-5 py-3 font-semibold">Arquetipo</th>
                                        <th className="text-left px-5 py-3 font-semibold">Eje</th>
                                        <th className="text-left px-5 py-3 font-semibold">Motor</th>
                                        <th className="text-right px-5 py-3 font-semibold">Costo IA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center py-12 text-argo-grey/50 text-sm">
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
                                            <td className="px-5 py-3 font-semibold text-argo-navy whitespace-nowrap">{row.adult_name}</td>
                                            <td className="px-5 py-3 text-argo-grey">{row.adult_email}</td>
                                            <td className="px-5 py-3 font-semibold text-argo-navy">{row.child_name}</td>
                                            <td className="px-5 py-3 text-argo-grey text-center">{row.child_age}</td>
                                            <td className="px-5 py-3 text-argo-grey">{row.sport || '—'}</td>
                                            <td className="px-5 py-3 text-argo-navy font-medium">{row.archetype_label}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EJE_COLOR[row.eje] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {row.eje}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-argo-grey">{row.motor}</td>
                                            <td className="px-5 py-3 text-right text-argo-grey font-mono text-xs">
                                                {row.ai_cost_usd > 0 ? `$${row.ai_cost_usd.toFixed(4)}` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
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
