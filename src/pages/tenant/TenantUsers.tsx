import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Trash2, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';

interface Member {
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'active';
    invited_at: string;
    isCurrentUser: boolean;
    teams?: { id: string; name: string }[];
}

const tt = (lang: string, es: string, en: string, pt: string) => (lang === 'en' ? en : lang === 'pt' ? pt : es);

export const TenantUsers: React.FC = () => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const { role: callerRole, tenant } = useOutletContext<{ role?: string; tenant?: { id: string } | null }>();

    const [members, setMembers] = useState<Member[]>([]);
    const [teamsList, setTeamsList] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'coach' | 'member'>('coach');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [newTeamName, setNewTeamName] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [settingRole, setSettingRole] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmUnassign, setConfirmUnassign] = useState<{ memberId: string; teamId: string } | null>(null);
    const [unassigning, setUnassigning] = useState(false);

    const fetchMembers = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch(`/api/tenant-members?tenant_id=${tenant?.id ?? ''}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members ?? []);
            }
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    };

    const fetchTeams = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch(`/api/tenant-groups?tenant_id=${tenant?.id ?? ''}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) { const data = await res.json(); setTeamsList((data.groups ?? []).map((g: { id: string; name: string }) => ({ id: g.id, name: g.name }))); }
        } catch { /* silently fail */ }
    };

    useEffect(() => { fetchMembers(); fetchTeams(); }, []);

    // Create a team inline during the invite flow and auto-select it.
    const handleCreateTeam = async () => {
        const name = newTeamName.trim();
        if (!name) return;
        setCreatingTeam(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setCreatingTeam(false); return; }
        try {
            const res = await fetch('/api/tenant-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ action: 'create', name, tenant_id: tenant?.id }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.group?.id) {
                const g = data.group as { id: string; name: string };
                setTeamsList(prev => [...prev, { id: g.id, name: g.name }]);
                setSelectedTeams(prev => { const n = new Set(prev); n.add(g.id); return n; });
                setNewTeamName('');
            } else {
                setFeedback({ type: 'error', text: data.error ? `${data.error}` : tt(lang, 'No se pudo crear el plantel', 'Could not create team', 'Não foi possível criar o plantel') });
            }
        } catch {
            setFeedback({ type: 'error', text: tt(lang, 'No se pudo crear el plantel', 'Could not create team', 'Não foi possível criar o plantel') });
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        setFeedback(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setInviting(false); return; }

        try {
            const res = await fetch('/api/invite-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ email: email.trim(), lang, role: inviteRole, teams: inviteRole === 'coach' ? Array.from(selectedTeams) : [], tenant_id: tenant?.id }),
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                setFeedback({ type: 'success', text: data.attached
                    ? tt(lang,
                        `${email.trim()} ya tenía cuenta en Argo. Lo agregamos a tu equipo.`,
                        `${email.trim()} already had an Argo account. We added them to your team.`,
                        `${email.trim()} já tinha conta no Argo. Adicionamos à sua equipe.`)
                    : dt.users.enviado(email.trim()) });
                setEmail('');
                setSelectedTeams(new Set());
                fetchMembers();
            } else {
                const data = await res.json();
                const text = data.error === 'already_member' ? dt.users.yaEsMiembro
                    : data.error === 'already_invited' ? dt.users.yaInvitado
                    : data.error === 'email_already_exists' ? dt.users.emailYaRegistrado
                    : `${dt.users.errorEnvio} (${data.error ?? res.status})`;
                setFeedback({ type: 'error', text });
            }
        } catch {
            setFeedback({ type: 'error', text: dt.users.errorEnvio });
        } finally {
            setInviting(false);
        }
    };

    const isOwner = members.some(m => m.isCurrentUser && m.role === 'owner');

    // Remove a coach from one of their assigned planteles (with confirmation).
    const handleUnassign = async (memberId: string, teamId: string) => {
        setUnassigning(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setUnassigning(false); return; }
        try {
            const res = await fetch('/api/tenant-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ action: 'unassign_coach', group_id: teamId, member_id: memberId, tenant_id: tenant?.id }),
            });
            if (res.ok) { setFeedback({ type: 'success', text: tt(lang, 'Plantel quitado', 'Team removed', 'Plantel removido') }); fetchMembers(); }
            else { setFeedback({ type: 'error', text: tt(lang, 'No se pudo quitar el plantel', 'Could not remove team', 'Não foi possível remover o plantel') }); }
        } catch {
            setFeedback({ type: 'error', text: tt(lang, 'No se pudo quitar el plantel', 'Could not remove team', 'Não foi possível remover o plantel') });
        } finally {
            setUnassigning(false);
            setConfirmUnassign(null);
        }
    };

    const handleRemove = async (memberId: string) => {
        setDeleting(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setDeleting(false); return; }
        try {
            const res = await fetch('/api/remove-member', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ memberId, tenant_id: tenant?.id }),
            });
            if (res.ok) {
                setFeedback({ type: 'success', text: dt.users.eliminado });
                fetchMembers();
            } else {
                setFeedback({ type: 'error', text: dt.users.errorEliminar });
            }
        } catch {
            setFeedback({ type: 'error', text: dt.users.errorEliminar });
        } finally {
            setDeleting(false);
            setConfirmDeleteId(null);
        }
    };

    // Change a member's level: 'member' (Administración) ↔ 'coach' (Entrenador).
    // Owner-only (server-enforced); the institution owner can't be changed here.
    const handleSetRole = async (memberId: string, role: 'member' | 'coach') => {
        setSettingRole(memberId);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSettingRole(null); return; }
        try {
            const res = await fetch('/api/update-member-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ tenant_id: tenant?.id, member_id: memberId, role }),
            });
            if (res.ok) {
                setFeedback({ type: 'success', text: tt(lang, 'Nivel actualizado', 'Level updated', 'Nível atualizado') });
                fetchMembers();
            } else {
                setFeedback({ type: 'error', text: tt(lang, 'No se pudo cambiar el nivel', 'Could not change the level', 'Não foi possível mudar o nível') });
            }
        } catch {
            setFeedback({ type: 'error', text: tt(lang, 'No se pudo cambiar el nivel', 'Could not change the level', 'Não foi possível mudar o nível') });
        } finally {
            setSettingRole(null);
        }
    };

    // Coaches don't manage users — the institution admin does.
    if (callerRole === 'coach') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={28} className="text-argo-border mb-3" />
                <p className="text-sm font-semibold text-argo-navy mb-1">{tt(lang, 'Sin acceso', 'No access', 'Sem acesso')}</p>
                <p className="text-xs text-argo-light max-w-[260px]">{tt(lang, 'La gestión de usuarios la realiza el administrador de la institución.', 'User management is handled by the institution admin.', 'A gestão de usuários é feita pelo administrador da instituição.')}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.nav.usuarios}</h1>
                <p className="text-[13px] text-argo-grey mt-1">{dt.users.subtitulo}</p>
            </div>

            {/* Invite form */}
            <div className="bg-white rounded-[14px] shadow-argo p-6">
                <h2 className="text-[15px] font-semibold text-argo-navy mb-0.5">{dt.users.invitar}</h2>
                <p className="text-[13px] text-argo-grey mb-4">{dt.users.invitarDesc}</p>
                <form onSubmit={handleInvite} className="space-y-3">
                    {/* Role */}
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setInviteRole('coach')} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${inviteRole === 'coach' ? 'border-argo-navy bg-argo-navy text-white' : 'border-argo-border text-argo-secondary hover:border-argo-violet-200'}`}>
                            {tt(lang, 'Entrenador', 'Coach', 'Treinador')}
                        </button>
                        <button type="button" onClick={() => setInviteRole('member')} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${inviteRole === 'member' ? 'border-argo-navy bg-argo-navy text-white' : 'border-argo-border text-argo-secondary hover:border-argo-violet-200'}`}>
                            {tt(lang, 'Administrador', 'Admin', 'Administrador')}
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={dt.users.emailPlaceholder}
                            required
                            className="flex-1 rounded-lg border border-argo-border bg-argo-bg px-3.5 py-2.5 text-sm outline-none focus:border-argo-violet-200 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={inviting || !email.trim()}
                            className="px-5 py-2.5 rounded-lg bg-argo-navy text-white text-sm font-semibold hover:bg-argo-navy/90 transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                            {inviting ? '...' : dt.users.enviar}
                        </button>
                    </div>
                    {/* Team picker + inline create (coach only) */}
                    {inviteRole === 'coach' && (
                        <div>
                            <p className="text-[12px] text-argo-grey mb-1.5">{tt(lang, 'Asignar a planteles (opcional)', 'Assign to teams (optional)', 'Atribuir a plantéis (opcional)')}</p>
                            {teamsList.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {teamsList.map(t => {
                                        const sel = selectedTeams.has(t.id);
                                        return (
                                            <button key={t.id} type="button" onClick={() => { const n = new Set(selectedTeams); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); setSelectedTeams(n); }} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${sel ? 'border-argo-violet-500 bg-argo-violet-50 text-argo-violet-500' : 'border-argo-border text-argo-secondary hover:border-argo-violet-200'}`}>
                                                {t.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    value={newTeamName}
                                    onChange={e => setNewTeamName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTeam(); } }}
                                    placeholder={tt(lang, 'Crear un plantel nuevo', 'Create a new team', 'Criar um plantel novo')}
                                    className="flex-1 rounded-lg border border-argo-border bg-argo-bg px-3 py-2 text-[12px] outline-none focus:border-argo-violet-200 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateTeam}
                                    disabled={creatingTeam || !newTeamName.trim()}
                                    className="px-3 py-2 rounded-lg border border-argo-border text-[12px] font-semibold text-argo-navy hover:bg-argo-bg disabled:opacity-40 transition-colors flex-shrink-0"
                                >
                                    {creatingTeam ? '...' : tt(lang, 'Crear plantel', 'Create team', 'Criar plantel')}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
                {feedback && (
                    <p className={`text-xs mt-3 ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {feedback.text}
                    </p>
                )}
            </div>

            {/* Members list */}
            <div className="bg-white rounded-[14px] shadow-argo p-6">
                <h2 className="text-[15px] font-semibold text-argo-navy mb-4">{dt.users.miembros}</h2>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-12 bg-argo-bg rounded-lg animate-pulse" />)}
                    </div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users size={28} className="text-argo-border mb-3" />
                        <p className="text-sm font-semibold text-argo-navy mb-1">
                            {lang === 'en' ? 'No members yet' : lang === 'pt' ? 'Nenhum membro ainda' : 'Aún no hay miembros'}
                        </p>
                        <p className="text-xs text-argo-light leading-relaxed max-w-[240px]">
                            {lang === 'en' ? 'Invite a colleague using the form above.' : lang === 'pt' ? 'Convide um colega usando o formulário acima.' : 'Invita a un colega usando el formulario de arriba.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-argo-border">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-argo-violet-50 text-argo-violet-500 flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                                    {m.email[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-argo-navy truncate">{m.email}</p>
                                    <div className="text-xs text-argo-light flex items-center gap-1.5 mt-0.5">
                                        {m.role === 'owner' ? (
                                            <span className="font-semibold text-argo-secondary">{tt(lang, 'Propietario', 'Owner', 'Proprietário')}</span>
                                        ) : isOwner ? (
                                            <select
                                                value={m.role === 'coach' ? 'coach' : 'member'}
                                                onChange={e => handleSetRole(m.id, e.target.value as 'member' | 'coach')}
                                                disabled={settingRole === m.id}
                                                className="text-xs border border-argo-border rounded-md px-1.5 py-0.5 bg-white text-argo-secondary outline-none focus:border-argo-violet-200 disabled:opacity-50"
                                            >
                                                <option value="member">{tt(lang, 'Administrador', 'Admin', 'Administrador')}</option>
                                                <option value="coach">{tt(lang, 'Entrenador', 'Coach', 'Treinador')}</option>
                                            </select>
                                        ) : (
                                            <span>{m.role === 'coach' ? tt(lang, 'Entrenador', 'Coach', 'Treinador') : tt(lang, 'Administrador', 'Admin', 'Administrador')}</span>
                                        )}
                                        {m.isCurrentUser ? <span>· {dt.users.tu}</span> : null}
                                    </div>
                                    {m.teams && m.teams.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {m.teams.map(t => {
                                                const isConfirming = confirmUnassign?.memberId === m.id && confirmUnassign?.teamId === t.id;
                                                return (
                                                    <span key={t.id} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full border border-argo-border bg-argo-bg text-[11px] font-medium text-argo-secondary">
                                                        {t.name}
                                                        {isOwner && (isConfirming ? (
                                                            <span className="inline-flex items-center gap-1.5 ml-0.5">
                                                                <button onClick={() => handleUnassign(m.id, t.id)} disabled={unassigning} className="text-[10px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">{tt(lang, 'Quitar', 'Remove', 'Remover')}</button>
                                                                <button onClick={() => setConfirmUnassign(null)} className="text-[10px] text-argo-light hover:text-argo-grey">{dt.common.cancelar}</button>
                                                            </span>
                                                        ) : (
                                                            <button onClick={() => setConfirmUnassign({ memberId: m.id, teamId: t.id })} className="p-0.5 rounded-full text-argo-light hover:text-red-500 hover:bg-red-50 transition-colors" title={tt(lang, 'Quitar del plantel', 'Remove from team', 'Remover do plantel')}>
                                                                <X size={11} />
                                                            </button>
                                                        ))}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                                    m.status === 'active'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {m.status === 'active' ? <Check size={10} /> : <Clock size={10} />}
                                    {m.status === 'active' ? dt.users.activo : dt.users.pendiente}
                                </span>
                                {isOwner && m.role !== 'owner' && (
                                    confirmDeleteId === m.id ? (
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => handleRemove(m.id)}
                                                disabled={deleting}
                                                className="text-[11px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                                            >
                                                {dt.common.eliminar}
                                            </button>
                                            <span className="text-argo-border">|</span>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-[11px] font-medium text-argo-light hover:text-argo-grey"
                                            >
                                                {dt.common.cancelar}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(m.id)}
                                            title={dt.users.eliminarMiembro}
                                            className="text-argo-light hover:text-red-500 transition-colors flex-shrink-0 p-1"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
