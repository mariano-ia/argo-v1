import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus, ChevronRight, ArrowLeft, X, Pencil, Check, Trash2, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { SkeletonList, SkeletonGroupRow, SkeletonSessionRow } from '../../components/ui/Skeleton';
import { GroupBalancePanel } from './components/GroupBalancePanel';
import type { MemberProfile } from '../../lib/groupBalance';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

interface GroupRow {
    id: string;
    name: string;
    created_at: string;
    member_count: number;
}

interface MemberRow {
    id: string;
    session_id: string;
    added_at: string;
    child_name: string;
    child_age: number | null;
    sport: string;
    archetype_label: string;
    eje: string;
    motor: string;
    eje_secundario: string;
}

interface SessionRow {
    id: string;
    child_name: string;
    child_age: number;
    sport: string | null;
    archetype_label: string;
    eje: string;
    motor: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
};

const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
});

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EJE_COLORS: Record<string, string> = {
    D: 'bg-red-50 text-red-700 border-red-200',
    I: 'bg-amber-50 text-amber-700 border-amber-200',
    S: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    C: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export const TenantGroups: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void }>();
    const { toast } = useToast();

    // List state
    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Detail state
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailGroup, setDetailGroup] = useState<{ id: string; name: string } | null>(null);
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Rename state
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');

    // Add members modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [allSessions, setAllSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);

    // Delete
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Removing member
    const [removingId, setRemovingId] = useState<string | null>(null);

    /* ── Fetch groups ──────────────────────────────────────────────────────── */

    const fetchGroups = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-groups', { headers: authHeaders(token) });
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant) fetchGroups();
    }, [tenant, fetchGroups]);

    /* ── Create group ──────────────────────────────────────────────────────── */

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        setCreateError('');
        const token = await getToken();
        if (!token) return;

        try {
            const res = await fetch('/api/tenant-groups', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ action: 'create', name: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setCreateError(data.error || 'Error al crear grupo');
                return;
            }
            setNewName('');
            setShowCreate(false);
            fetchGroups();
            toast('success', 'Grupo creado');
        } finally {
            setCreating(false);
        }
    };

    /* ── Fetch group detail ────────────────────────────────────────────────── */

    const fetchDetail = useCallback(async (groupId: string) => {
        setDetailLoading(true);
        const token = await getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/tenant-groups?id=${groupId}`, {
                headers: authHeaders(token),
            });
            if (res.ok) {
                const data = await res.json();
                setDetailGroup(data.group);
                setMembers(data.members);
            }
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const openDetail = (groupId: string) => {
        setSelectedId(groupId);
        setEditing(false);
        setConfirmDelete(false);
        fetchDetail(groupId);
    };

    const closeDetail = () => {
        setSelectedId(null);
        setDetailGroup(null);
        setMembers([]);
        fetchGroups();
    };

    /* ── Rename ────────────────────────────────────────────────────────────── */

    const startEditing = () => {
        setEditName(detailGroup?.name ?? '');
        setEditing(true);
    };

    const handleRename = async () => {
        if (!editName.trim() || !selectedId) return;
        const token = await getToken();
        if (!token) return;

        await fetch('/api/tenant-groups', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ action: 'rename', id: selectedId, name: editName.trim() }),
        });
        setEditing(false);
        fetchDetail(selectedId);
        toast('success', 'Grupo renombrado');
    };

    /* ── Delete group ──────────────────────────────────────────────────────── */

    const handleDelete = async () => {
        if (!selectedId) return;
        const token = await getToken();
        if (!token) return;

        await fetch('/api/tenant-groups', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ action: 'delete', id: selectedId }),
        });
        toast('success', 'Grupo eliminado');
        closeDetail();
    };

    /* ── Remove member ─────────────────────────────────────────────────────── */

    const handleRemoveMember = async (sessionId: string) => {
        if (!selectedId) return;
        setRemovingId(sessionId);
        const token = await getToken();
        if (!token) return;

        // Optimistic: remove from UI immediately
        const removedMember = members.find(m => m.session_id === sessionId);
        setMembers(prev => prev.filter(m => m.session_id !== sessionId));
        setRemovingId(null);

        const res = await fetch('/api/tenant-groups', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ action: 'remove_members', group_id: selectedId, session_ids: [sessionId] }),
        });
        if (!res.ok && removedMember) {
            // Rollback on failure
            setMembers(prev => [...prev, removedMember]);
            toast('error', 'No se pudo quitar al jugador');
        } else {
            toast('success', 'Jugador quitado del grupo');
        }
    };

    /* ── Add members modal ─────────────────────────────────────────────────── */

    const openAddModal = async () => {
        setShowAddModal(true);
        setSelectedSessions(new Set());
        setSessionsLoading(true);
        const token = await getToken();
        if (!token) return;

        try {
            const res = await fetch('/api/tenant-sessions', { headers: authHeaders(token) });
            if (res.ok) {
                const data = await res.json();
                setAllSessions(data.sessions);
            }
        } finally {
            setSessionsLoading(false);
        }
    };

    const toggleSession = (id: string) => {
        setSelectedSessions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleAddMembers = async () => {
        if (selectedSessions.size === 0 || !selectedId) return;
        setAdding(true);
        const token = await getToken();
        if (!token) return;

        await fetch('/api/tenant-groups', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ action: 'add_members', group_id: selectedId, session_ids: Array.from(selectedSessions) }),
        });
        setAdding(false);
        setShowAddModal(false);
        fetchDetail(selectedId);
        toast('success', `${selectedSessions.size} ${selectedSessions.size === 1 ? 'jugador agregado' : 'jugadores agregados'}`);
    };

    // Sessions not already in the group
    const memberSessionIds = new Set(members.map(m => m.session_id));
    const availableSessions = allSessions.filter(s => !memberSessionIds.has(s.id));

    /* ── Loading guard ─────────────────────────────────────────────────────── */

    if (!tenant) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    /* ── DETAIL VIEW ───────────────────────────────────────────────────────── */

    if (selectedId) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto space-y-6"
            >
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={closeDetail}
                        className="p-2 rounded-lg hover:bg-argo-neutral transition-colors"
                    >
                        <ArrowLeft size={18} className="text-argo-grey" />
                    </button>
                    {editing ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                className="flex-1 text-xl font-bold text-argo-navy border-b-2 border-argo-indigo bg-transparent outline-none"
                                autoFocus
                            />
                            <button onClick={handleRename} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600">
                                <Check size={16} />
                            </button>
                            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-1">
                            <h1 className="text-xl font-bold text-argo-navy">{detailGroup?.name ?? '...'}</h1>
                            <button onClick={startEditing} className="p-1.5 rounded-lg hover:bg-argo-neutral text-argo-grey">
                                <Pencil size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Add members button */}
                <div className="flex justify-end">
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-argo-navy text-white text-sm font-medium hover:bg-argo-navy/90 transition-colors"
                    >
                        <UserPlus size={15} />
                        Agregar jugadores
                    </button>
                </div>

                {/* Members list */}
                <div className="bg-white border border-argo-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-argo-border flex items-center gap-2">
                        <Users size={15} className="text-argo-grey" />
                        <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">
                            Jugadores ({members.length})
                        </h2>
                    </div>

                    {detailLoading ? (
                        <SkeletonList rows={3} RowComponent={SkeletonSessionRow} />
                    ) : members.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-argo-grey">Este grupo no tiene jugadores todavía.</p>
                            <p className="text-xs text-argo-grey/50 mt-1">Agrega jugadores desde tus sesiones completadas.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-argo-border">
                            {members.map(m => (
                                <div key={m.id} className="px-6 py-4 hover:bg-argo-neutral/50 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-argo-navy truncate">
                                                {m.child_name}
                                                <span className="font-normal text-argo-grey ml-1.5">
                                                    {m.child_age != null ? `${m.child_age} años` : ''}{m.sport ? ` · ${m.sport}` : ''}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${EJE_COLORS[m.eje] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                {m.eje}
                                            </span>
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F0FF] text-[#6366f1]">
                                                {m.archetype_label}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveMember(m.session_id)}
                                                disabled={removingId === m.session_id}
                                                className="p-1.5 rounded-lg text-argo-grey hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                                                title="Quitar del grupo"
                                            >
                                                {removingId === m.session_id
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <X size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Group Balance Analysis ──────────────────────────────── */}
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

                {/* Delete group */}
                <div className="pt-4 border-t border-argo-border">
                    {confirmDelete ? (
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-red-600">Eliminar este grupo permanentemente?</p>
                            <button
                                onClick={handleDelete}
                                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-3 py-1.5 rounded-lg border border-argo-border text-xs font-medium hover:bg-argo-neutral"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                        >
                            <Trash2 size={14} />
                            Eliminar grupo
                        </button>
                    )}
                </div>

                {/* ── Add Members Modal ─────────────────────────────────────────── */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
                        <div
                            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-argo-border flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">Agregar jugadores</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-argo-neutral">
                                    <X size={16} className="text-argo-grey" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {sessionsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                                    </div>
                                ) : availableSessions.length === 0 ? (
                                    <div className="py-12 text-center px-6">
                                        <p className="text-sm text-argo-grey">No hay jugadores disponibles para agregar.</p>
                                        <p className="text-xs text-argo-grey/50 mt-1">
                                            {allSessions.length === 0
                                                ? 'Todavía no tienes sesiones completadas.'
                                                : 'Todos tus jugadores ya están en este grupo.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-argo-border">
                                        {availableSessions.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => toggleSession(s.id)}
                                                className={`w-full px-6 py-3.5 flex items-center gap-3 text-left transition-colors ${
                                                    selectedSessions.has(s.id) ? 'bg-indigo-50' : 'hover:bg-argo-neutral/50'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                                                    selectedSessions.has(s.id) ? 'bg-argo-navy border-argo-navy' : 'border-argo-border'
                                                }`}>
                                                    {selectedSessions.has(s.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-argo-navy truncate">
                                                        {s.child_name}
                                                        <span className="font-normal text-argo-grey ml-1.5">
                                                            {s.child_age} años{s.sport ? ` · ${s.sport}` : ''}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F0FF] text-[#6366f1] flex-shrink-0">
                                                    {s.archetype_label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {availableSessions.length > 0 && (
                                <div className="px-6 py-4 border-t border-argo-border">
                                    <button
                                        onClick={handleAddMembers}
                                        disabled={selectedSessions.size === 0 || adding}
                                        className="w-full py-2.5 rounded-lg bg-argo-navy text-white text-sm font-medium hover:bg-argo-navy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {adding ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={15} />
                                                Agregar {selectedSessions.size > 0 ? `(${selectedSessions.size})` : ''}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }

    /* ── LIST VIEW ─────────────────────────────────────────────────────────── */

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="font-display text-2xl font-bold text-argo-navy">Grupos</h1>
                <p className="text-sm text-argo-grey mt-1">
                    Organiza a tus deportistas en grupos para analizar el equilibrio del equipo.
                </p>
            </div>

            {/* Create group */}
            {showCreate ? (
                <div className="bg-white border border-argo-border rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <input
                            value={newName}
                            onChange={e => { setNewName(e.target.value); setCreateError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="Nombre del grupo (ej: Sub-15 Femenino)"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-argo-border text-sm outline-none focus:border-argo-navy transition-colors"
                            autoFocus
                        />
                        <button
                            onClick={handleCreate}
                            disabled={creating || !newName.trim()}
                            className="px-4 py-2.5 rounded-lg bg-argo-navy text-white text-sm font-medium hover:bg-argo-navy/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Crear
                        </button>
                        <button
                            onClick={() => { setShowCreate(false); setNewName(''); setCreateError(''); }}
                            className="p-2.5 rounded-lg hover:bg-argo-neutral text-argo-grey"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    {createError && (
                        <p className="text-xs text-red-500 mt-2">{createError}</p>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-argo-navy text-white text-sm font-medium hover:bg-argo-navy/90 transition-colors"
                >
                    <Plus size={15} />
                    Crear grupo
                </button>
            )}

            {/* Groups list */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-argo-border flex items-center gap-2">
                    <Users size={15} className="text-argo-grey" />
                    <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">
                        Tus grupos
                    </h2>
                </div>

                {loading ? (
                    <SkeletonList rows={4} RowComponent={SkeletonGroupRow} />
                ) : groups.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-argo-indigo/10 flex items-center justify-center mx-auto mb-3">
                            <Users size={20} className="text-argo-indigo" />
                        </div>
                        <p className="text-sm text-argo-grey">No tienes grupos creados todavía.</p>
                        <p className="text-xs text-argo-grey/50 mt-1">Crea tu primer grupo para empezar a organizar a tus deportistas.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-argo-border">
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => openDetail(g.id)}
                                className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-argo-neutral/50 transition-colors text-left"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-argo-navy truncate">{g.name}</p>
                                    <p className="text-xs text-argo-grey/60 mt-0.5">{formatDate(g.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F0FF] text-[#6366f1]">
                                        {g.member_count} {g.member_count === 1 ? 'jugador' : 'jugadores'}
                                    </span>
                                    <ChevronRight size={16} className="text-argo-grey/40" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
