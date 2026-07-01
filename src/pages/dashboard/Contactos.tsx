import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Download, Users, GraduationCap, Home } from 'lucide-react';

type Audience = 'coach' | 'family';

interface Contact {
    email: string;
    name: string;
    lang: string;
    audience: Audience;
    segments: string[];
    sources: string[];
    country: string;
    city: string;
    sport: string;
    profiles: number;
    first_seen: string | null;
    last_activity: string | null;
}

const SEGMENT_LABEL: Record<string, string> = {
    paid: 'Cliente pago',
    trial: 'Trial',
    one: 'ArgoOne',
    puentes: 'Puentes',
    lead: 'Lead',
};

const SEGMENT_STYLE: Record<string, string> = {
    paid: 'bg-green-50 text-green-700 border-green-200',
    trial: 'bg-argo-violet-50 text-argo-violet-600 border-argo-violet-200',
    one: 'bg-blue-50 text-blue-700 border-blue-200',
    puentes: 'bg-amber-50 text-amber-700 border-amber-200',
    lead: 'bg-argo-neutral text-argo-grey border-argo-border',
};

const AUDIENCE_LABEL: Record<Audience, string> = {
    coach: 'Entrenador/Institución',
    family: 'Familia',
};

const LANGS = ['es', 'en', 'pt'];

export const Contactos: React.FC = () => {
    const [rows, setRows]       = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [search, setSearch]   = useState('');
    const [audience, setAudience] = useState<'all' | Audience>('all');
    const [segment, setSegment]   = useState<'all' | string>('all');
    const [lang, setLang]         = useState<'all' | string>('all');
    const [page, setPage]       = useState(0);
    const PAGE_SIZE = 25;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { setError('Sesión expirada.'); setLoading(false); return; }
                const res = await fetch('/api/admin-contacts', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || `Error ${res.status}`);
                }
                const body = await res.json();
                setRows(body.contacts ?? []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al cargar contactos.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (audience !== 'all' && r.audience !== audience) return false;
            if (segment !== 'all' && !r.segments.includes(segment)) return false;
            if (lang !== 'all' && r.lang !== lang) return false;
            if (q && !(r.email.includes(q) || r.name.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [rows, search, audience, segment, lang]);

    const resetPage = () => setPage(0);

    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const coachCount = useMemo(() => rows.filter(r => r.audience === 'coach').length, [rows]);
    const familyCount = useMemo(() => rows.filter(r => r.audience === 'family').length, [rows]);

    const fmt = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString('es-AR', { dateStyle: 'short' }) : '—';

    const exportCSV = () => {
        const headers = [
            'Email', 'Nombre', 'Audiencia', 'Relacion', 'Idioma', 'Perfiles',
            'Pais', 'Ciudad', 'Deporte', 'Origen', 'Primera vez', 'Ultima actividad',
        ];
        const csvRows = [
            headers.join(','),
            ...filtered.map(r => [
                r.email,
                r.name,
                AUDIENCE_LABEL[r.audience],
                r.segments.map(s => SEGMENT_LABEL[s] ?? s).join(' / '),
                r.lang,
                r.profiles,
                r.country,
                r.city,
                r.sport,
                r.sources.join(' / '),
                fmt(r.first_seen),
                fmt(r.last_activity),
            ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `argo-contactos-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
        <div className="flex items-center gap-3 bg-white border border-argo-border rounded-2xl px-5 py-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-argo-neutral flex items-center justify-center text-argo-grey">
                <Icon size={17} />
            </div>
            <div>
                <p className="text-xl font-bold text-argo-navy leading-none">{value.toLocaleString('es-AR')}</p>
                <p className="text-[11px] text-argo-grey mt-1">{label}</p>
            </div>
        </div>
    );

    const FilterPill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                active
                    ? 'bg-argo-navy text-white border-argo-navy'
                    : 'bg-white text-argo-grey border-argo-border hover:bg-argo-neutral'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Contactos</h1>
                    <p className="text-sm text-argo-grey mt-0.5">
                        {rows.length.toLocaleString('es-AR')} contactos únicos en toda la base
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey/50" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); resetPage(); }}
                            placeholder="Buscar email o nombre..."
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
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <StatCard icon={Users} label="Contactos totales" value={rows.length} />
                <StatCard icon={GraduationCap} label="Entrenadores / instituciones" value={coachCount} />
                <StatCard icon={Home} label="Familias" value={familyCount} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] uppercase tracking-widest text-argo-grey/60 mr-1">Audiencia</span>
                <FilterPill active={audience === 'all'} onClick={() => { setAudience('all'); resetPage(); }}>Todas</FilterPill>
                <FilterPill active={audience === 'coach'} onClick={() => { setAudience('coach'); resetPage(); }}>Entrenadores</FilterPill>
                <FilterPill active={audience === 'family'} onClick={() => { setAudience('family'); resetPage(); }}>Familias</FilterPill>
                <span className="w-px h-5 bg-argo-border mx-1" />
                <span className="text-[11px] uppercase tracking-widest text-argo-grey/60 mr-1">Relación</span>
                <FilterPill active={segment === 'all'} onClick={() => { setSegment('all'); resetPage(); }}>Todas</FilterPill>
                {Object.keys(SEGMENT_LABEL).map(s => (
                    <FilterPill key={s} active={segment === s} onClick={() => { setSegment(s); resetPage(); }}>{SEGMENT_LABEL[s]}</FilterPill>
                ))}
                <span className="w-px h-5 bg-argo-border mx-1" />
                <span className="text-[11px] uppercase tracking-widest text-argo-grey/60 mr-1">Idioma</span>
                <FilterPill active={lang === 'all'} onClick={() => { setLang('all'); resetPage(); }}>Todos</FilterPill>
                {LANGS.map(l => (
                    <FilterPill key={l} active={lang === l} onClick={() => { setLang(l); resetPage(); }}>{l.toUpperCase()}</FilterPill>
                ))}
            </div>

            {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                </div>
            ) : (
                <>
                    <p className="text-xs text-argo-grey mb-2">
                        {filtered.length.toLocaleString('es-AR')} {filtered.length === 1 ? 'resultado' : 'resultados'}
                    </p>
                    <div className="bg-white border border-argo-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-argo-neutral border-b border-argo-border text-[10px] uppercase tracking-widest text-argo-grey">
                                        <th className="text-left px-5 py-3 font-semibold">Contacto</th>
                                        <th className="text-left px-5 py-3 font-semibold">Audiencia</th>
                                        <th className="text-left px-5 py-3 font-semibold">Relación</th>
                                        <th className="text-left px-5 py-3 font-semibold">Idioma</th>
                                        <th className="text-left px-5 py-3 font-semibold">Perfiles</th>
                                        <th className="text-left px-5 py-3 font-semibold">País</th>
                                        <th className="text-left px-5 py-3 font-semibold">Última act.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-argo-grey/50 text-sm">
                                                {search || audience !== 'all' || segment !== 'all' || lang !== 'all'
                                                    ? 'Sin resultados para esos filtros.'
                                                    : 'Todavía no hay contactos.'}
                                            </td>
                                        </tr>
                                    ) : paginated.map((row, i) => (
                                        <tr
                                            key={row.email}
                                            className={`border-b border-argo-border last:border-0 hover:bg-argo-neutral/50 transition-colors ${
                                                i % 2 === 0 ? 'bg-white' : 'bg-argo-neutral/20'
                                            }`}
                                        >
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-argo-navy">{row.email}</div>
                                                {row.name && <div className="text-xs text-argo-grey mt-0.5">{row.name}</div>}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-argo-secondary">
                                                {AUDIENCE_LABEL[row.audience]}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {row.segments.map(s => (
                                                        <span
                                                            key={s}
                                                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SEGMENT_STYLE[s] ?? SEGMENT_STYLE.lead}`}
                                                        >
                                                            {SEGMENT_LABEL[s] ?? s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-argo-grey uppercase">{row.lang || '—'}</td>
                                            <td className="px-5 py-3 text-argo-grey">{row.profiles || '—'}</td>
                                            <td className="px-5 py-3 text-argo-grey whitespace-nowrap">{row.country || '—'}</td>
                                            <td className="px-5 py-3 text-argo-grey whitespace-nowrap">{fmt(row.last_activity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-argo-grey">Página {page + 1} de {totalPages}</span>
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
