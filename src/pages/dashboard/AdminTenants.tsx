import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, AlertCircle, ChevronDown, Plus, X } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Tenant {
    id: string;
    email: string;
    display_name: string;
    slug: string;
    plan: string;
    roster_limit: number;
    ai_queries_count: number;
    trial_expires_at: string | null;
    onboarding_completed: boolean;
    created_at: string;
    institution_type: string | null;
    sport: string | null;
    country: string | null;
    active_players: number;
    total_sessions: number;
    last_session: string | null;
    days_since_last: number | null;
    trial_days_left: number | null;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const planColor: Record<string, string> = {
    trial: 'bg-amber-50 text-amber-700 border-amber-200',
    pro: 'bg-violet-50 text-violet-700 border-violet-200',
    academy: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    enterprise: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const _formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); void _formatDate;

/* ── Component ──────────────────────────────────────────────────────────────── */

export const AdminTenants: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState<string>('');
    const [showCreate, setShowCreate] = useState(false);
    const [actionTenant, setActionTenant] = useState<string | null>(null);

    // Create form
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newOwnerName, setNewOwnerName] = useState('');
    const [newRoster, setNewRoster] = useState('500');
    const [creating, setCreating] = useState(false);

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? '';
    };

    const fetchTenants = useCallback(async () => {
        const token = await getToken();
        try {
            const res = await fetch('/api/admin-tenants', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setTenants(data.tenants);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTenants(); }, [fetchTenants]);

    const doAction = async (action: string, tenantId: string, extra: Record<string, unknown> = {}) => {
        const token = await getToken();
        await fetch('/api/admin-tenants', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, tenant_id: tenantId, ...extra }),
        });
        setActionTenant(null);
        fetchTenants();
    };

    const handleCreate = async () => {
        if (!newEmail || !newName) return;
        setCreating(true);
        const token = await getToken();
        await fetch('/api/admin-tenants', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create-enterprise', email: newEmail, display_name: newName, full_name: newOwnerName, roster_limit: parseInt(newRoster) || 500 }),
        });
        setCreating(false);
        setShowCreate(false);
        setNewEmail('');
        setNewName('');
        setNewOwnerName('');
        setNewRoster('500');
        fetchTenants();
    };

    const filtered = tenants.filter(t => {
        if (planFilter && t.plan !== planFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return t.display_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
        }
        return true;
    });

    // Stats
    const totalTenants = tenants.length;
    const byPlan = tenants.reduce((acc, t) => { acc[t.plan] = (acc[t.plan] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const inactive30 = tenants.filter(t => t.days_since_last !== null && t.days_since_last > 30).length;
    const expiringTrials = tenants.filter(t => t.trial_days_left !== null && t.trial_days_left <= 3).length;

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Tenants</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{totalTenants} cuentas registradas</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={14} /> Crear Enterprise
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: totalTenants },
                    { label: 'Trial', value: byPlan.trial ?? 0 },
                    { label: 'PRO', value: byPlan.pro ?? 0 },
                    { label: 'Academy', value: byPlan.academy ?? 0 },
                    { label: 'Enterprise', value: byPlan.enterprise ?? 0 },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">{s.label}</p>
                        <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Alerts */}
            {(inactive30 > 0 || expiringTrials > 0) && (
                <div className="flex gap-3">
                    {expiringTrials > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                            <AlertCircle size={13} /> {expiringTrials} trial{expiringTrials > 1 ? 's' : ''} por vencer
                        </div>
                    )}
                    {inactive30 > 0 && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                            <AlertCircle size={13} /> {inactive30} tenant{inactive30 > 1 ? 's' : ''} inactivos (+30 días)
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o slug..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={e => setPlanFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                    <option value="">Todos los planes</option>
                    <option value="trial">Trial</option>
                    <option value="pro">PRO</option>
                    <option value="academy">Academy</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Tenant</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Plan</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Equipo</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Sesiones</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">IA queries</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Última actividad</th>
                            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{t.display_name}</p>
                                    <p className="text-xs text-gray-400 truncate">{t.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${planColor[t.plan] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {t.plan}
                                    </span>
                                    {t.trial_days_left !== null && t.trial_days_left <= 3 && (
                                        <span className="ml-1.5 text-[10px] text-amber-600 font-medium">{t.trial_days_left}d</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-gray-900 font-medium">{t.active_players}</span>
                                    <span className="text-gray-400">/{t.roster_limit}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{t.total_sessions}</td>
                                <td className="px-4 py-3 text-gray-700">{t.ai_queries_count}</td>
                                <td className="px-4 py-3">
                                    {t.last_session ? (
                                        <span className={`text-xs ${t.days_since_last !== null && t.days_since_last > 30 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                            {t.days_since_last === 0 ? 'Hoy' : t.days_since_last === 1 ? 'Ayer' : `Hace ${t.days_since_last}d`}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-300">Sin actividad</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 relative">
                                    <button
                                        onClick={() => setActionTenant(actionTenant === t.id ? null : t.id)}
                                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <ChevronDown size={14} className="text-gray-400" />
                                    </button>
                                    {actionTenant === t.id && (
                                        <div className="absolute right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                                            {t.plan !== 'pro' && (
                                                <button onClick={() => doAction('change-plan', t.id, { plan: 'pro' })} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Cambiar a PRO</button>
                                            )}
                                            {t.plan !== 'academy' && (
                                                <button onClick={() => doAction('change-plan', t.id, { plan: 'academy' })} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Cambiar a Academy</button>
                                            )}
                                            {t.plan !== 'enterprise' && (
                                                <button onClick={() => doAction('change-plan', t.id, { plan: 'enterprise', roster_limit: 500 })} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Cambiar a Enterprise</button>
                                            )}
                                            <div className="h-px bg-gray-100 my-1" />
                                            <button onClick={() => doAction('reset-trial', t.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Resetear a trial</button>
                                            <button onClick={() => doAction('extend-trial', t.id, { days: 14 })} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Extender trial +14d</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron tenants</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Enterprise Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-gray-900">Crear cuenta Enterprise</h3>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">El owner recibe un email de bienvenida personalizado con instrucciones para configurar su cuenta.</p>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nombre de la institución (ej: Club Atlético Rosario)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <input
                                type="text"
                                placeholder="Nombre del responsable (ej: Martín García)"
                                value={newOwnerName}
                                onChange={e => setNewOwnerName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <input
                                type="email"
                                placeholder="Email del responsable"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <input
                                type="number"
                                placeholder="Roster limit (default: 500)"
                                value={newRoster}
                                onChange={e => setNewRoster(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:text-gray-700">Cancelar</button>
                            <button onClick={handleCreate} disabled={creating || !newEmail || !newName} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                                {creating ? '...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
