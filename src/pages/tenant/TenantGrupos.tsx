import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Check, Trash2, Loader2, Search, Layers, MoreHorizontal } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { GroupBalancePanel } from './components/GroupBalancePanel';
import { CollapsibleSection } from './components/CollapsibleSection';
import type { MemberProfile } from '../../lib/groupBalance';
import { useLang } from '../../context/LangContext';
import { SectionIntro } from '../../components/dashboard/SectionIntro';
import { ContextChip } from '../../components/dashboard/ContextChip';
import { AXIS_COLORS } from '../../lib/designTokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface TenantData { id: string; slug: string; display_name: string; plan: string; roster_limit: number; active_players_count: number; }
interface GroupRow { id: string; name: string; created_at: string; member_count: number; }
interface MemberRow { id: string; session_id: string; added_at: string; child_name: string; child_age: number | null; sport: string; archetype_label: string; eje: string; motor: string; eje_secundario: string; }
interface SessionRow { id: string; child_name: string; child_age: number; sport: string | null; archetype_label: string; eje: string; motor: string; }

const getToken = async () => { const { data: { session } } = await supabase.auth.getSession(); return session?.access_token ?? null; };
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const tt = (lang: string, es: string, en: string, pt: string) => (lang === 'en' ? en : lang === 'pt' ? pt : es);

/**
 * "Química de grupos" — analytical tool. Build groups from YOUR players to see
 * how the chemistry/dynamics work. Available to both admins and coaches; each
 * sees only the groups they created. Separate from planteles (which own the link).
 */
export const TenantGrupos: React.FC = () => {
    const { tenant, effectiveTeamId } = useOutletContext<{ tenant: TenantData | null; devBypass?: boolean; effectiveTeamId?: string | null }>();
    // In a plantel hat, the player pool to add to a group is scoped to that plantel.
    const teamScope = effectiveTeamId ? `&team=${effectiveTeamId}` : '';
    const { lang } = useLang();
    const { toast } = useToast();

    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailGroup, setDetailGroup] = useState<{ id: string; name: string } | null>(null);
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const [showAddPanel, setShowAddPanel] = useState(false);
    const [allSessions, setAllSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);
    const [addSearch, setAddSearch] = useState('');

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const fetchGroups = useCallback(async () => {
        const token = await getToken();
        if (!token) { setLoading(false); return; }
        try {
            const res = await fetch(`/api/tenant-chem-groups?tenant_id=${tenant?.id ?? ''}${teamScope}`, { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setGroups(data.groups ?? []); }
        } finally { setLoading(false); }
    }, [tenant, teamScope]);

    useEffect(() => { if (tenant) fetchGroups(); }, [tenant, fetchGroups]);

    // Switching plantel clears any selected group from the previous one.
    useEffect(() => { setSelectedId(null); }, [teamScope]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        const token = await getToken();
        if (!token) { setCreating(false); return; }
        try {
            const res = await fetch('/api/tenant-chem-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'create', name: newName.trim(), tenant_id: tenant?.id, team: effectiveTeamId }) });
            if (res.ok) { setNewName(''); setShowCreate(false); fetchGroups(); toast('success', tt(lang, 'Grupo creado', 'Group created', 'Grupo criado')); }
        } finally { setCreating(false); }
    };

    const fetchDetail = useCallback(async (groupId: string) => {
        setDetailLoading(true);
        const token = await getToken();
        if (!token) { setDetailLoading(false); return; }
        try {
            const res = await fetch(`/api/tenant-chem-groups?id=${groupId}&tenant_id=${tenant?.id ?? ''}`, { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setDetailGroup(data.group); setMembers(data.members ?? []); }
        } finally { setDetailLoading(false); }
    }, [tenant]);

    const selectGroup = (id: string) => {
        setSelectedId(id); setEditing(false); setConfirmDelete(false); setShowAddPanel(false); setShowMenu(false);
        fetchDetail(id);
    };

    const handleRename = async () => {
        if (!editName.trim() || !selectedId) return;
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-chem-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'rename', id: selectedId, name: editName.trim(), tenant_id: tenant?.id }) });
        setEditing(false); fetchDetail(selectedId); fetchGroups();
        toast('success', tt(lang, 'Grupo renombrado', 'Group renamed', 'Grupo renomeado'));
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-chem-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'delete', id: selectedId, tenant_id: tenant?.id }) });
        toast('success', tt(lang, 'Grupo eliminado', 'Group deleted', 'Grupo excluído'));
        setSelectedId(null); setDetailGroup(null); setMembers([]); fetchGroups();
    };

    const handleRemoveMember = async (sessionId: string) => {
        if (!selectedId) return;
        const removed = members.find(m => m.session_id === sessionId);
        setMembers(prev => prev.filter(m => m.session_id !== sessionId));
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/tenant-chem-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'remove_members', group_id: selectedId, session_ids: [sessionId], tenant_id: tenant?.id }) });
        if (!res.ok && removed) { setMembers(prev => [...prev, removed]); toast('error', tt(lang, 'No se pudo quitar', 'Could not remove', 'Não foi possível remover')); }
        else { fetchGroups(); }
    };

    const openAddPanel = async () => {
        setShowAddPanel(true); setSelectedSessions(new Set()); setAddSearch(''); setSessionsLoading(true);
        const token = await getToken();
        if (!token) { setSessionsLoading(false); return; }
        try {
            const res = await fetch(`/api/tenant-sessions?tenant_id=${tenant?.id ?? ''}${teamScope}`, { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setAllSessions(data.sessions ?? []); }
        } finally { setSessionsLoading(false); }
    };

    const handleAddMembers = async () => {
        if (selectedSessions.size === 0 || !selectedId) return;
        setAdding(true);
        const token = await getToken();
        if (!token) { setAdding(false); return; }
        await fetch('/api/tenant-chem-groups', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ action: 'add_members', group_id: selectedId, session_ids: Array.from(selectedSessions), tenant_id: tenant?.id }) });
        setAdding(false); setShowAddPanel(false); fetchDetail(selectedId); fetchGroups();
        toast('success', tt(lang, 'Jugadores agregados', 'Players added', 'Jogadores adicionados'));
    };

    const memberSessionIds = new Set(members.map(m => m.session_id));
    const availableSessions = allSessions.filter(s => !memberSessionIds.has(s.id));
    const filteredAvailable = addSearch
        ? availableSessions.filter(s => s.child_name.toLowerCase().includes(addSearch.toLowerCase()))
        : availableSessions;

    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    const jugador = tt(lang, 'jugador', 'player', 'jogador');
    const jugadores = tt(lang, 'jugadores', 'players', 'jogadores');

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <SectionIntro
                storageKey="argo_intro_chem_groups_v1"
                icon={<Layers size={16} />}
                title={tt(lang, 'Química de grupos', 'Group chemistry', 'Química de grupos')}
                body={tt(lang,
                    'Arma grupos con tus jugadores y mira cómo funciona su dinámica: qué perfiles se complementan y dónde puede haber tensión.',
                    'Build groups from your players and see how their dynamics work: which profiles complement each other and where there may be tension.',
                    'Monte grupos com seus jogadores e veja como funciona a dinâmica: quais perfis se complementam e onde pode haver tensão.')}
            />
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{tt(lang, 'Química de grupos', 'Group chemistry', 'Química de grupos')}</h1>
                    <ContextChip />
                </div>
                <p className="text-[13px] text-argo-grey mt-1">{tt(lang, 'Agrupa a tus jugadores para analizar la química de cada grupo.', 'Group your players to analyze each group chemistry.', 'Agrupe seus jogadores para analisar a química de cada grupo.')}</p>
            </div>

            {!effectiveTeamId ? (
                <div className="bg-white rounded-[14px] shadow-argo py-16 flex flex-col items-center text-center px-6">
                    <Layers size={28} className="text-argo-border mb-3" />
                    <p className="text-[15px] font-semibold text-argo-navy mb-1">{tt(lang, 'Elige un plantel', 'Pick a team', 'Escolha um plantel')}</p>
                    <p className="text-[13px] text-argo-light max-w-sm leading-relaxed">{tt(lang, 'La química de grupos se analiza dentro de un plantel (cada categoría es distinta). Elige uno en el selector de arriba para ver y crear sus grupos.', 'Group chemistry is analyzed within a team (each category is different). Pick one in the selector above to see and create its groups.', 'A química de grupos é analisada dentro de um plantel (cada categoria é diferente). Escolha um no seletor acima para ver e criar seus grupos.')}</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* LEFT */}
                <div className="space-y-3">
                    {showCreate ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder={tt(lang, 'Nombre del grupo (ej: Línea defensiva)', 'Group name (e.g.: Back line)', 'Nome do grupo (ex: Linha defensiva)')}
                                className="flex-1 px-3.5 py-2.5 rounded-lg border border-argo-border text-[13px] outline-none focus:border-argo-violet-200 transition-colors"
                                autoFocus
                            />
                            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="px-3.5 py-2.5 rounded-lg bg-argo-navy text-white text-[12px] font-semibold hover:bg-argo-navy/90 disabled:opacity-40 transition-colors">
                                {creating ? <Loader2 size={14} className="animate-spin" /> : tt(lang, 'Crear', 'Create', 'Criar')}
                            </button>
                            <button onClick={() => { setShowCreate(false); setNewName(''); }} className="p-2 rounded-lg text-argo-light hover:text-argo-grey hover:bg-argo-bg transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-[13px] font-medium text-argo-navy hover:bg-argo-bg px-3 py-2.5 rounded-lg transition-colors">
                            <Plus size={16} strokeWidth={1.5} />
                            {tt(lang, 'Crear grupo', 'Create group', 'Criar grupo')}
                        </button>
                    )}

                    <div className="bg-white rounded-[14px] shadow-argo overflow-y-auto" style={{ maxHeight: 'calc(100vh - 18rem)' }}>
                        {loading ? (
                            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-argo-bg rounded-lg animate-pulse" />)}</div>
                        ) : groups.length === 0 ? (
                            <div className="py-12 text-center">
                                <Layers size={24} className="text-argo-border mx-auto mb-3" />
                                <p className="text-sm text-argo-light">{tt(lang, 'Todavía no creaste grupos.', 'No groups created yet.', 'Nenhum grupo criado ainda.')}</p>
                                <p className="text-xs text-argo-light mt-1">{tt(lang, 'Crea un grupo con tus jugadores para analizar su química.', 'Create a group from your players to analyze their chemistry.', 'Crie um grupo com seus jogadores para analisar a química.')}</p>
                            </div>
                        ) : (
                            groups.map(g => {
                                const isActive = selectedId === g.id;
                                return (
                                    <button key={g.id} onClick={() => selectGroup(g.id)} className={`w-full text-left px-5 py-4 border-b border-argo-border last:border-b-0 transition-all ${isActive ? 'bg-argo-violet-50' : 'hover:bg-argo-bg/50'}`}>
                                        <p className={`text-[13px] font-semibold ${isActive ? 'text-argo-violet-500' : 'text-argo-navy'}`}>{g.name}</p>
                                        <p className="text-[11px] text-argo-light mt-0.5">{g.member_count} {g.member_count === 1 ? jugador : jugadores}</p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="min-w-0 lg:sticky lg:top-6">
                    <AnimatePresence mode="wait">
                        {!selectedId ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-[300px]">
                                <div className="text-center max-w-sm">
                                    <Layers size={28} className="text-argo-border mx-auto mb-4" />
                                    <p className="text-[15px] font-semibold text-argo-navy mb-2">{tt(lang, 'Selecciona un grupo', 'Select a group', 'Selecione um grupo')}</p>
                                    <p className="text-xs text-argo-light leading-relaxed">{tt(lang, 'Elige un grupo de la lista para ver sus jugadores y su química.', 'Choose a group from the list to see its players and chemistry.', 'Escolha um grupo da lista para ver seus jogadores e química.')}</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key={selectedId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                                {/* Header */}
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        {editing ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} className="flex-1 text-lg font-bold text-argo-navy border-b-2 border-argo-violet-500 bg-transparent outline-none" autoFocus />
                                                <Tooltip text={tt(lang, 'Confirmar', 'Confirm', 'Confirmar')}><button onClick={handleRename} className="p-1.5 rounded-lg hover:bg-argo-bg text-emerald-600"><Check size={14} /></button></Tooltip>
                                                <Tooltip text={tt(lang, 'Cancelar', 'Cancel', 'Cancelar')}><button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-argo-bg text-argo-light"><X size={14} /></button></Tooltip>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h2 className="text-lg font-bold text-argo-navy">{detailGroup?.name ?? '...'}</h2>
                                                    <p className="text-[11px] text-argo-light mt-0.5">{members.length} {members.length === 1 ? jugador : jugadores}</p>
                                                </div>
                                                <div className="relative">
                                                    <Tooltip text={tt(lang, 'Opciones', 'Options', 'Opções')}>
                                                        <button onClick={() => setShowMenu(v => !v)} className="p-1.5 rounded-lg text-argo-light hover:text-argo-grey hover:bg-argo-bg transition-colors"><MoreHorizontal size={16} /></button>
                                                    </Tooltip>
                                                    {showMenu && (
                                                        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-argo-hover border border-argo-border py-1 w-40">
                                                            <button onClick={() => { setEditName(detailGroup?.name ?? ''); setEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-argo-secondary hover:bg-argo-bg transition-colors flex items-center gap-2"><Pencil size={12} /> {tt(lang, 'Renombrar', 'Rename', 'Renomear')}</button>
                                                            <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"><Trash2 size={12} /> {tt(lang, 'Eliminar', 'Delete', 'Excluir')}</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {confirmDelete && (
                                        <div className="mt-3 pt-3 border-t border-argo-border flex items-center gap-3">
                                            <p className="text-xs text-red-600 flex-1">{tt(lang, '¿Eliminar este grupo? Esta acción no se puede deshacer.', 'Delete this group? This cannot be undone.', 'Excluir este grupo? Esta ação não pode ser desfeita.')}</p>
                                            <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium">{tt(lang, 'Confirmar', 'Confirm', 'Confirmar')}</button>
                                            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-argo-border text-xs">{tt(lang, 'Cancelar', 'Cancel', 'Cancelar')}</button>
                                        </div>
                                    )}
                                </div>

                                {/* Members */}
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-2">
                                    <CollapsibleSection title={`${jugadores.charAt(0).toUpperCase() + jugadores.slice(1)} (${members.length})`} defaultOpen={true} badge={undefined}>
                                        <div className="flex items-center justify-end mb-3">
                                            <button onClick={openAddPanel} className="flex items-center gap-1.5 text-[11px] font-medium text-argo-violet-500 hover:opacity-70 transition-opacity"><Plus size={12} /> {tt(lang, 'Agregar jugadores', 'Add players', 'Adicionar jogadores')}</button>
                                        </div>
                                        {detailLoading ? (
                                            <div className="flex gap-2 flex-wrap">{[1,2,3].map(i => <div key={i} className="h-8 w-28 bg-argo-bg rounded-lg animate-pulse" />)}</div>
                                        ) : members.length === 0 ? (
                                            <p className="text-xs text-argo-light">{tt(lang, 'Este grupo todavía no tiene jugadores.', 'This group has no players yet.', 'Este grupo ainda não tem jogadores.')}</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {members.map(m => {
                                                    const dot = AXIS_COLORS[m.eje] ?? '#6366f1';
                                                    return (
                                                        <div key={m.id} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg border border-argo-border text-[12px] font-medium text-argo-secondary group">
                                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                                                            {m.child_name}
                                                            <Tooltip text={tt(lang, 'Quitar', 'Remove', 'Remover')}>
                                                                <button onClick={() => handleRemoveMember(m.session_id)} className="p-0.5 rounded text-argo-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={10} /></button>
                                                            </Tooltip>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <AnimatePresence>
                                            {showAddPanel && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                    <div className="mt-4 pt-4 border-t border-argo-border space-y-3">
                                                        <div className="relative">
                                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-argo-light" />
                                                            <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder={tt(lang, 'Buscar...', 'Search...', 'Buscar...')} className="w-full pl-7 pr-2 py-1.5 rounded-md border border-argo-border text-[11px] outline-none focus:border-argo-violet-200" />
                                                        </div>
                                                        {sessionsLoading ? (
                                                            <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-argo-bg rounded-lg animate-pulse" />)}</div>
                                                        ) : filteredAvailable.length === 0 ? (
                                                            <p className="text-[11px] text-argo-light">{allSessions.length === 0 ? tt(lang, 'No tienes jugadores todavía.', 'No players yet.', 'Nenhum jogador ainda.') : tt(lang, 'Todos tus jugadores ya están en el grupo.', 'All your players are already in the group.', 'Todos os seus jogadores já estão no grupo.')}</p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                                                                {filteredAvailable.map(s => {
                                                                    const dot = AXIS_COLORS[s.eje] ?? '#6366f1';
                                                                    const isSelected = selectedSessions.has(s.id);
                                                                    return (
                                                                        <button key={s.id} onClick={() => { const next = new Set(selectedSessions); if (next.has(s.id)) next.delete(s.id); else next.add(s.id); setSelectedSessions(next); }} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${isSelected ? 'border-argo-navy bg-argo-navy text-white' : 'border-argo-border text-argo-secondary hover:border-argo-violet-200'}`}>
                                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : dot }} />
                                                                            {s.child_name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={handleAddMembers} disabled={selectedSessions.size === 0 || adding} className="px-3.5 py-2 rounded-lg bg-argo-navy text-white text-[11px] font-semibold hover:bg-argo-navy/90 disabled:opacity-40 transition-colors">
                                                                {adding ? <Loader2 size={12} className="animate-spin" /> : `${tt(lang, 'Agregar', 'Add', 'Adicionar')} (${selectedSessions.size})`}
                                                            </button>
                                                            <button onClick={() => setShowAddPanel(false)} className="text-[11px] text-argo-light hover:text-argo-grey transition-colors">{tt(lang, 'Cancelar', 'Cancel', 'Cancelar')}</button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CollapsibleSection>
                                </div>

                                {/* Chemistry */}
                                {!detailLoading && members.length >= 2 && (
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-argo-navy mb-2 px-1">{tt(lang, 'Química del grupo', 'Group chemistry', 'Química do grupo')}</h3>
                                        <GroupBalancePanel
                                            locked={tenant?.plan === 'trial'}
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
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            )}
        </motion.div>
    );
};
