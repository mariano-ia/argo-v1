import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Check, Trash2, Loader2, Search, Layers, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { GroupBalancePanel } from './components/GroupBalancePanel';
import type { MemberProfile } from '../../lib/groupBalance';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';
import { AXIS_COLORS } from '../../lib/designTokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface TenantData { id: string; slug: string; display_name: string; plan: string; credits_remaining: number; }
interface GroupRow { id: string; name: string; created_at: string; member_count: number; }
interface MemberRow { id: string; session_id: string; added_at: string; child_name: string; child_age: number | null; sport: string; archetype_label: string; eje: string; motor: string; eje_secundario: string; }
interface SessionRow { id: string; child_name: string; child_age: number; sport: string | null; archetype_label: string; eje: string; motor: string; }

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const getToken = async () => { const { data: { session } } = await supabase.auth.getSession(); return session?.access_token ?? null; };
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

/* ── Component ─────────────────────────────────────────────────────────────── */
export const TenantGroups: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const { toast } = useToast();

    // List
    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Detail
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailGroup, setDetailGroup] = useState<{ id: string; name: string } | null>(null);
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Rename
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');

    // Add members
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [allSessions, setAllSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);
    const [addSearch, setAddSearch] = useState('');

    // Delete
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Menu
    const [showMenu, setShowMenu] = useState(false);

    /* ── Fetch groups ──────────────────────────────────────────────────────── */
    const fetchGroups = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-groups', { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setGroups(data.groups); }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (tenant) fetchGroups(); }, [tenant, fetchGroups]);

    /* ── Create group ──────────────────────────────────────────────────────── */
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
        setDetailLoading(true);
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch(`/api/tenant-groups?id=${groupId}`, { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setDetailGroup(data.group); setMembers(data.members); }
        } finally { setDetailLoading(false); }
    }, []);

    const selectGroup = (id: string) => {
        setSelectedId(id);
        setEditing(false);
        setConfirmDelete(false);
        setShowAddPanel(false);
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
        setSelectedId(null); setDetailGroup(null); setMembers([]);
        fetchGroups();
    };

    /* ── Remove member ─────────────────────────────────────────────────────── */
    const handleRemoveMember = async (sessionId: string) => {
        if (!selectedId) return;
        const removed = members.find(m => m.session_id === sessionId);
        setMembers(prev => prev.filter(m => m.session_id !== sessionId));
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'remove_members', group_id: selectedId, session_ids: [sessionId] }) });
        if (!res.ok && removed) { setMembers(prev => [...prev, removed]); toast('error', dt.groups.noSePudoQuitar); }
        else { toast('success', dt.groups.jugadorQuitado); fetchGroups(); }
    };

    /* ── Add members ───────────────────────────────────────────────────────── */
    const openAddPanel = async () => {
        setShowAddPanel(true);
        setSelectedSessions(new Set());
        setAddSearch('');
        setSessionsLoading(true);
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-sessions', { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setAllSessions(data.sessions); }
        } finally { setSessionsLoading(false); }
    };

    const handleAddMembers = async () => {
        if (selectedSessions.size === 0 || !selectedId) return;
        setAdding(true);
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'add_members', group_id: selectedId, session_ids: Array.from(selectedSessions) }) });
        setAdding(false);
        setShowAddPanel(false);
        fetchDetail(selectedId);
        fetchGroups();
        toast('success', dt.groups.jugadoresAgregados(selectedSessions.size));
    };

    const memberSessionIds = new Set(members.map(m => m.session_id));
    const availableSessions = allSessions.filter(s => !memberSessionIds.has(s.id));
    const filteredAvailable = addSearch
        ? availableSessions.filter(s => s.child_name.toLowerCase().includes(addSearch.toLowerCase()))
        : availableSessions;

    /* ── Loading ───────────────────────────────────────────────────────────── */
    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.groups.titulo}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.groups.subtitulo}</p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} />}
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* ═══ LEFT PANEL ═══ */}
                <div className="space-y-3">
                    {/* Create button / inline form */}
                    {showCreate ? (
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
                    )}

                    {/* Groups list */}
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
                                        {lang === 'en' ? 'Select a formation' : lang === 'pt' ? 'Selecione uma formacao' : 'Selecciona una formacion'}
                                    </p>
                                    <p className="text-xs text-argo-light leading-relaxed">
                                        {lang === 'en' ? 'Choose a formation from the list to see its members, balance analysis and coaching tools.' : lang === 'pt' ? 'Escolha uma formacao da lista para ver seus membros, analise de equilibrio e ferramentas.' : 'Elige una formacion de la lista para ver sus miembros, analisis de equilibrio y herramientas.'}
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
                                {/* Group header */}
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
                                                <button onClick={handleRename} className="p-1.5 rounded-lg hover:bg-argo-bg text-emerald-600"><Check size={14} /></button>
                                                <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-argo-bg text-argo-light"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h2 className="text-lg font-bold text-argo-navy">{detailGroup?.name ?? '...'}</h2>
                                                    <p className="text-[11px] text-argo-light mt-0.5">{members.length} {members.length === 1 ? dt.common.jugador : dt.common.jugadores}</p>
                                                </div>
                                                <div className="relative">
                                                    <button onClick={() => setShowMenu(v => !v)} className="p-1.5 rounded-lg text-argo-light hover:text-argo-grey hover:bg-argo-bg transition-colors">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    {showMenu && (
                                                        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-argo-hover border border-argo-border py-1 w-40">
                                                            <button onClick={() => { setEditName(detailGroup?.name ?? ''); setEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-argo-secondary hover:bg-argo-bg transition-colors flex items-center gap-2">
                                                                <Pencil size={12} /> {lang === 'en' ? 'Rename' : lang === 'pt' ? 'Renomear' : 'Renombrar'}
                                                            </button>
                                                            <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                                                                <Trash2 size={12} /> {lang === 'en' ? 'Delete' : lang === 'pt' ? 'Excluir' : 'Eliminar'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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

                                {/* Members as chips */}
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em]">{dt.common.jugadores}</p>
                                        <button onClick={openAddPanel} className="flex items-center gap-1.5 text-[11px] font-medium text-argo-violet-500 hover:opacity-70 transition-opacity">
                                            <Plus size={12} /> {dt.groups.agregarJugadores}
                                        </button>
                                    </div>

                                    {detailLoading ? (
                                        <div className="flex gap-2 flex-wrap">{[1,2,3].map(i => <div key={i} className="h-8 w-28 bg-argo-bg rounded-lg animate-pulse" />)}</div>
                                    ) : members.length === 0 ? (
                                        <p className="text-xs text-argo-light">{dt.groups.sinMiembros}</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {members.map(m => {
                                                const dot = AXIS_COLORS[m.eje] ?? '#6366f1';
                                                return (
                                                    <div key={m.id} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg border border-argo-border text-[12px] font-medium text-argo-secondary group">
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                                                        {m.child_name}
                                                        <button onClick={() => handleRemoveMember(m.session_id)} className="p-0.5 rounded text-argo-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Inline add panel */}
                                    <AnimatePresence>
                                        {showAddPanel && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                <div className="mt-4 pt-4 border-t border-argo-border space-y-3">
                                                    <div className="relative">
                                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-argo-light" />
                                                        <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder={lang === 'en' ? 'Search...' : 'Buscar...'} className="w-full pl-7 pr-2 py-1.5 rounded-md border border-argo-border text-[11px] outline-none focus:border-argo-violet-200" />
                                                    </div>

                                                    {sessionsLoading ? (
                                                        <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-argo-bg rounded-lg animate-pulse" />)}</div>
                                                    ) : filteredAvailable.length === 0 ? (
                                                        <p className="text-[11px] text-argo-light">{allSessions.length === 0 ? dt.players?.sinJugadores ?? 'No players' : dt.groups.todosEnGrupo}</p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                                                            {filteredAvailable.map(s => {
                                                                const dot = AXIS_COLORS[s.eje] ?? '#6366f1';
                                                                const isSelected = selectedSessions.has(s.id);
                                                                return (
                                                                    <button
                                                                        key={s.id}
                                                                        onClick={() => { const next = new Set(selectedSessions); if (next.has(s.id)) next.delete(s.id); else next.add(s.id); setSelectedSessions(next); }}
                                                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                                                                            isSelected ? 'border-argo-navy bg-argo-navy text-white' : 'border-argo-border text-argo-secondary hover:border-argo-violet-200'
                                                                        }`}
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : dot }} />
                                                                        {s.child_name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={handleAddMembers}
                                                            disabled={selectedSessions.size === 0 || adding}
                                                            className="px-3.5 py-2 rounded-lg bg-argo-navy text-white text-[11px] font-semibold hover:bg-argo-navy/90 disabled:opacity-40 transition-colors"
                                                        >
                                                            {adding ? <Loader2 size={12} className="animate-spin" /> : `${dt.groups.agregarJugadores} (${selectedSessions.size})`}
                                                        </button>
                                                        <button onClick={() => setShowAddPanel(false)} className="text-[11px] text-argo-light hover:text-argo-grey transition-colors">{dt.common.cancelar}</button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Balance panel */}
                                {!detailLoading && members.length >= 2 && (
                                    <GroupBalancePanel
                                        members={members.map(m => ({
                                            session_id: m.session_id,
                                            child_name: m.child_name,
                                            child_age: m.child_age,
                                            sport: m.sport,
                                            eje: m.eje as MemberProfile['eje'],
                                            motor: m.motor,
                                            eje_secundario: m.eje_secundario,
                                            archetype_label: m.archetype_label,
                                        }))}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
