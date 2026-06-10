import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Check, Trash2, Loader2, Layers, MoreHorizontal, UserCheck, Users } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { SectionIntro } from '../../components/dashboard/SectionIntro';
import { AXIS_COLORS } from '../../lib/designTokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface TenantData { id: string; slug: string; display_name: string; plan: string; roster_limit: number; active_players_count: number; }
interface GroupRow { id: string; name: string; slug?: string; created_at: string; member_count: number; }
interface MemberRow { id: string; session_id: string; added_at: string; child_name: string; child_age: number | null; sport: string; archetype_label: string; eje: string; motor: string; eje_secundario: string; }
interface CoachRow { member_id: string; email: string; full_name: string | null; status: string; }
interface TenantMemberLite { id: string; email: string; role: string; status: string; full_name?: string | null; }

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const getToken = async () => { const { data: { session } } = await supabase.auth.getSession(); return session?.access_token ?? null; };
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const tt = (lang: string, es: string, en: string, pt: string) => (lang === 'en' ? en : lang === 'pt' ? pt : es);

/* ── Dev mock data ─────────────────────────────────────────────────────────── */
const DEV_GROUPS: GroupRow[] = [
    { id: 'dev-g1', name: 'Sub-12 Fútbol', slug: 'devteam1', created_at: new Date().toISOString(), member_count: 3 },
    { id: 'dev-g2', name: 'Sub-15 Básquet', slug: 'devteam2', created_at: new Date().toISOString(), member_count: 2 },
];
const DEV_MEMBERS: Record<string, MemberRow[]> = {
    'dev-g1': [
        { id: 'dm-1', session_id: 'dev-1', added_at: new Date().toISOString(), child_name: 'Valentina López', child_age: 11, sport: 'Fútbol', archetype_label: 'Impulsor Dinámico', eje: 'D', motor: 'Rápido', eje_secundario: 'I' },
        { id: 'dm-2', session_id: 'dev-2', added_at: new Date().toISOString(), child_name: 'Tomás Herrera', child_age: 9, sport: 'Básquet', archetype_label: 'Conector Rítmico', eje: 'I', motor: 'Medio', eje_secundario: 'S' },
        { id: 'dm-3', session_id: 'dev-3', added_at: new Date().toISOString(), child_name: 'Sofía Martínez', child_age: 13, sport: 'Natación', archetype_label: 'Estratega Observador', eje: 'C', motor: 'Lento', eje_secundario: 'S' },
    ],
    'dev-g2': [
        { id: 'dm-4', session_id: 'dev-1', added_at: new Date().toISOString(), child_name: 'Valentina López', child_age: 11, sport: 'Fútbol', archetype_label: 'Impulsor Dinámico', eje: 'D', motor: 'Rápido', eje_secundario: 'I' },
        { id: 'dm-5', session_id: 'dev-2', added_at: new Date().toISOString(), child_name: 'Tomás Herrera', child_age: 9, sport: 'Básquet', archetype_label: 'Conector Rítmico', eje: 'I', motor: 'Medio', eje_secundario: 'S' },
    ],
};

/* ── Component ─────────────────────────────────────────────────────────────── */
export const TenantGroups: React.FC = () => {
    const { tenant, devBypass, role } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void; devBypass?: boolean; role?: string }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const { toast } = useToast();
    const isAdmin = (role ?? 'owner') !== 'coach';

    // List
    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Detail
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailGroup, setDetailGroup] = useState<{ id: string; name: string; slug?: string } | null>(null);
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [coaches, setCoaches] = useState<CoachRow[]>([]);

    // Rename
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');

    // Assign coach
    const [showAssign, setShowAssign] = useState(false);
    const [allMembers, setAllMembers] = useState<TenantMemberLite[]>([]);

    // Delete
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Menu
    const [showMenu, setShowMenu] = useState(false);

    /* ── Fetch teams ───────────────────────────────────────────────────────── */
    const fetchGroups = useCallback(async () => {
        if (devBypass) { setGroups(DEV_GROUPS); setLoading(false); return; }
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-groups', { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setGroups(data.groups); }
        } finally { setLoading(false); }
    }, [devBypass]);

    useEffect(() => { if (tenant) fetchGroups(); }, [tenant, fetchGroups]);

    /* ── Create team ───────────────────────────────────────────────────────── */
    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'create', name: newName.trim() }) });
            if (res.ok) { setNewName(''); setShowCreate(false); fetchGroups(); toast('success', dt.groups.grupoCreado); }
        } finally { setCreating(false); }
    };

    /* ── Fetch detail ──────────────────────────────────────────────────────── */
    const fetchDetail = useCallback(async (groupId: string) => {
        if (devBypass) {
            const g = DEV_GROUPS.find(g => g.id === groupId);
            setDetailGroup(g ? { id: g.id, name: g.name, slug: g.slug } : null);
            setMembers(DEV_MEMBERS[groupId] ?? []);
            setCoaches([]);
            return;
        }
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`/api/tenant-groups?id=${groupId}`, { headers: authHeaders(token) });
        if (res.ok) { const data = await res.json(); setDetailGroup(data.group); setMembers(data.members); setCoaches(data.coaches ?? []); }
    }, [devBypass]);

    const selectGroup = (id: string) => {
        setSelectedId(id);
        setEditing(false);
        setConfirmDelete(false);
        setShowAssign(false);
        setShowMenu(false);
        fetchDetail(id);
    };

    /* ── Rename ────────────────────────────────────────────────────────────── */
    const handleRename = async () => {
        if (!editName.trim() || !selectedId) return;
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'rename', id: selectedId, name: editName.trim() }) });
        setEditing(false);
        fetchDetail(selectedId);
        fetchGroups();
        toast('success', dt.groups.grupoRenombrado);
    };

    /* ── Delete ─────────────────────────────────────────────────────────────── */
    const handleDelete = async () => {
        if (!selectedId) return;
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'delete', id: selectedId }) });
        toast('success', dt.groups.grupoEliminado);
        setSelectedId(null); setDetailGroup(null); setMembers([]); setCoaches([]);
        fetchGroups();
    };

    /* ── Assign / unassign coach ───────────────────────────────────────────── */
    const openAssign = async () => {
        setShowAssign(true);
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-members', { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setAllMembers(data.members ?? []); }
        } catch { /* noop */ }
    };

    const handleAssignCoach = async (memberId: string) => {
        if (!selectedId) return;
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'assign_coach', group_id: selectedId, member_id: memberId }) });
        if (res.ok) { fetchDetail(selectedId); toast('success', tt(lang, 'Entrenador asignado', 'Coach assigned', 'Treinador atribuído')); }
    };

    const handleUnassignCoach = async (memberId: string) => {
        if (!selectedId) return;
        setCoaches(prev => prev.filter(c => c.member_id !== memberId));
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'unassign_coach', group_id: selectedId, member_id: memberId }) });
        toast('success', tt(lang, 'Entrenador quitado', 'Coach removed', 'Treinador removido'));
    };

    const assignedIds = new Set(coaches.map(c => c.member_id));
    const availableCoaches = allMembers.filter(m => m.role === 'coach' && !assignedIds.has(m.id));

    /* ── Loading ───────────────────────────────────────────────────────────── */
    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    const groupIntroBody = tt(lang,
        'Crea planteles y asigna un entrenador a cada uno. El entrenador comparte el link de su plantel y los jugadores que entran quedan en ese plantel.',
        'Create teams and assign a coach to each. The coach shares their team link, and players who enter land in that team.',
        'Crie plantéis e atribua um treinador a cada um. O treinador compartilha o link do plantel e os jogadores que entram ficam nesse plantel.');

    // Planteles (the structural unit that owns the link) are admin-only.
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Layers size={28} className="text-argo-border mb-3" />
                <p className="text-sm font-semibold text-argo-navy mb-1">{tt(lang, 'Sin acceso', 'No access', 'Sem acesso')}</p>
                <p className="text-xs text-argo-light max-w-[260px]">{tt(lang, 'Los planteles los gestiona el administrador de la institución.', 'Teams are managed by the institution admin.', 'Os plantéis são gerenciados pelo administrador da instituição.')}</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {isAdmin && (
                <SectionIntro
                    storageKey="argo_intro_teams_v1"
                    icon={<Layers size={16} />}
                    title={tt(lang, 'Planteles', 'Teams', 'Plantéis')}
                    body={groupIntroBody}
                />
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{tt(lang, 'Planteles', 'Teams', 'Plantéis')}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.groups.subtitulo}</p>
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* ═══ LEFT PANEL ═══ */}
                <div className="space-y-3">
                    {/* Create button / inline form (admin only) */}
                    {isAdmin && (showCreate ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder={dt.groups.nombrePlaceholder}
                                className="flex-1 px-3.5 py-2.5 rounded-lg border border-argo-border text-[13px] outline-none focus:border-argo-violet-200 transition-colors"
                                autoFocus
                            />
                            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="px-3.5 py-2.5 rounded-lg bg-argo-navy text-white text-[12px] font-semibold hover:bg-argo-navy/90 disabled:opacity-40 transition-colors">
                                {creating ? <Loader2 size={14} className="animate-spin" /> : dt.common.crear}
                            </button>
                            <button onClick={() => { setShowCreate(false); setNewName(''); }} className="p-2 rounded-lg text-argo-light hover:text-argo-grey hover:bg-argo-bg transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-[13px] font-medium text-argo-navy hover:bg-argo-bg px-3 py-2.5 rounded-lg transition-colors">
                            <Plus size={16} strokeWidth={1.5} />
                            {dt.groups.crearGrupo}
                        </button>
                    ))}

                    {/* Teams list */}
                    <div className="bg-white rounded-[14px] shadow-argo overflow-y-auto" style={{ maxHeight: 'calc(100vh - 18rem)' }}>
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1,2,3].map(i => <div key={i} className="h-14 bg-argo-bg rounded-lg animate-pulse" />)}
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="py-12 text-center">
                                <Layers size={24} className="text-argo-border mx-auto mb-3" />
                                <p className="text-sm text-argo-light">{dt.groups.sinGrupos}</p>
                                <p className="text-xs text-argo-light mt-1">{dt.groups.sinGruposDesc}</p>
                            </div>
                        ) : (
                            groups.map(g => {
                                const isActive = selectedId === g.id;
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => selectGroup(g.id)}
                                        className={`w-full text-left px-5 py-4 border-b border-argo-border last:border-b-0 transition-all ${
                                            isActive ? 'bg-argo-violet-50' : 'hover:bg-argo-bg/50'
                                        }`}
                                    >
                                        <p className={`text-[13px] font-semibold ${isActive ? 'text-argo-violet-500' : 'text-argo-navy'}`}>
                                            {g.name}
                                        </p>
                                        <p className="text-[11px] text-argo-light mt-0.5">
                                            {g.member_count} {g.member_count === 1 ? dt.common.jugador : dt.common.jugadores}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT PANEL ═══ */}
                <div className="min-w-0 lg:sticky lg:top-6">
                    <AnimatePresence mode="wait">
                        {!selectedId ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-[300px]">
                                <div className="text-center max-w-sm">
                                    <Layers size={28} className="text-argo-border mx-auto mb-4" />
                                    <p className="text-[15px] font-semibold text-argo-navy mb-2">
                                        {tt(lang, 'Selecciona un plantel', 'Select a team', 'Selecione um plantel')}
                                    </p>
                                    <p className="text-xs text-argo-light leading-relaxed">
                                        {tt(lang, 'Elige un plantel de la lista para ver su enlace, sus entrenadores y sus jugadores.', 'Choose a team from the list to see its link, coaches and players.', 'Escolha um plantel da lista para ver seu link, treinadores e jogadores.')}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedId}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Team header */}
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        {editing ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                                                    className="flex-1 text-lg font-bold text-argo-navy border-b-2 border-argo-violet-500 bg-transparent outline-none"
                                                    autoFocus
                                                />
                                                <Tooltip text={tt(lang, 'Confirmar', 'Confirm', 'Confirmar')}><button onClick={handleRename} className="p-1.5 rounded-lg hover:bg-argo-bg text-emerald-600"><Check size={14} /></button></Tooltip>
                                                <Tooltip text={tt(lang, 'Cancelar', 'Cancel', 'Cancelar')}><button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-argo-bg text-argo-light"><X size={14} /></button></Tooltip>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h2 className="text-lg font-bold text-argo-navy">{detailGroup?.name ?? '...'}</h2>
                                                    <p className="text-[11px] text-argo-light mt-0.5">{members.length} {members.length === 1 ? dt.common.jugador : dt.common.jugadores}</p>
                                                </div>
                                                {isAdmin && (
                                                    <div className="relative">
                                                        <Tooltip text={tt(lang, 'Opciones', 'Options', 'Opções')}>
                                                            <button onClick={() => setShowMenu(v => !v)} className="p-1.5 rounded-lg text-argo-light hover:text-argo-grey hover:bg-argo-bg transition-colors">
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </Tooltip>
                                                        {showMenu && (
                                                            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-argo-hover border border-argo-border py-1 w-40">
                                                                <button onClick={() => { setEditName(detailGroup?.name ?? ''); setEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-argo-secondary hover:bg-argo-bg transition-colors flex items-center gap-2">
                                                                    <Pencil size={12} /> {tt(lang, 'Renombrar', 'Rename', 'Renomear')}
                                                                </button>
                                                                <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                                                                    <Trash2 size={12} /> {tt(lang, 'Eliminar', 'Delete', 'Excluir')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Delete confirmation */}
                                    {confirmDelete && (
                                        <div className="mt-3 pt-3 border-t border-argo-border flex items-center gap-3">
                                            <p className="text-xs text-red-600 flex-1">{dt.groups.confirmarEliminar}</p>
                                            <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium">{dt.common.confirmar}</button>
                                            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-argo-border text-xs">{dt.common.cancelar}</button>
                                        </div>
                                    )}

                                </div>

                                {/* Coaches — admin only */}
                                {isAdmin && (
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[13px] font-semibold text-argo-navy flex items-center gap-1.5">
                                            <UserCheck size={13} className="text-argo-grey" /> {tt(lang, 'Entrenadores', 'Coaches', 'Treinadores')}
                                        </h3>
                                        {isAdmin && (
                                            <button onClick={openAssign} className="flex items-center gap-1.5 text-[11px] font-medium text-argo-violet-500 hover:opacity-70 transition-opacity">
                                                <Plus size={12} /> {tt(lang, 'Asignar', 'Assign', 'Atribuir')}
                                            </button>
                                        )}
                                    </div>
                                    {coaches.length === 0 ? (
                                        <p className="text-xs text-argo-light">{tt(lang, 'Sin entrenadores asignados.', 'No coaches assigned.', 'Sem treinadores atribuídos.')}</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {coaches.map(c => (
                                                <div key={c.member_id} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg border border-argo-border text-[12px] font-medium text-argo-secondary group">
                                                    {c.full_name || c.email}
                                                    {c.status === 'pending' && <span className="text-[10px] text-amber-500">({tt(lang, 'pendiente', 'pending', 'pendente')})</span>}
                                                    {isAdmin && (
                                                        <Tooltip text={tt(lang, 'Quitar', 'Remove', 'Remover')}>
                                                            <button onClick={() => handleUnassignCoach(c.member_id)} className="p-0.5 rounded text-argo-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                                <X size={10} />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showAssign && isAdmin && (
                                        <div className="mt-3 pt-3 border-t border-argo-border">
                                            {availableCoaches.length === 0 ? (
                                                <p className="text-[11px] text-argo-light">{tt(lang, 'No hay entrenadores disponibles. Crea uno en Usuarios.', 'No coaches available. Create one in Users.', 'Nenhum treinador disponível. Crie um em Usuários.')}</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableCoaches.map(m => (
                                                        <button key={m.id} onClick={() => handleAssignCoach(m.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-argo-border text-argo-secondary hover:border-argo-violet-200 transition-all">
                                                            <Plus size={10} /> {m.full_name || m.email}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <button onClick={() => setShowAssign(false)} className="mt-2 text-[11px] text-argo-light hover:text-argo-grey transition-colors">{dt.common.cancelar}</button>
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Players in this plantel — read-only (they join via the link) */}
                                <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                                    <div className="px-6 py-4 flex items-center justify-between border-b border-argo-border">
                                        <h3 className="text-[13px] font-semibold text-argo-navy flex items-center gap-1.5">
                                            <Users size={13} className="text-argo-grey" /> {tt(lang, 'Jugadores', 'Players', 'Jogadores')} ({members.length})
                                        </h3>
                                        <span className="text-[11px] text-argo-light">{tt(lang, 'Solo lectura', 'Read-only', 'Somente leitura')}</span>
                                    </div>
                                    {members.length === 0 ? (
                                        <p className="px-6 py-4 text-xs text-argo-light">{tt(lang, 'Este plantel todavía no tiene jugadores. Entran por el link del plantel.', 'This team has no players yet. They join via the team link.', 'Este plantel ainda não tem jogadores. Eles entram pelo link do plantel.')}</p>
                                    ) : (
                                        <div>
                                            {members.map(m => {
                                                const dot = AXIS_COLORS[m.eje] ?? '#6366f1';
                                                return (
                                                    <div key={m.id} className="flex items-center gap-3 px-6 py-3 border-b border-argo-border last:border-b-0">
                                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-argo-navy truncate">{m.child_name}</p>
                                                            <p className="text-xs text-argo-light truncate">
                                                                {m.archetype_label}
                                                                {m.child_age ? ` · ${m.child_age} ${tt(lang, 'años', 'years', 'anos')}` : ''}
                                                                {m.sport ? ` · ${m.sport}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
