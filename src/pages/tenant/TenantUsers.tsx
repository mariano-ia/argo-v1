import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
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
}

export const TenantUsers: React.FC = () => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchMembers = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/tenant-members', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members ?? []);
            }
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, []);

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
                body: JSON.stringify({ email: email.trim() }),
            });

            if (res.ok) {
                setFeedback({ type: 'success', text: dt.users.enviado(email.trim()) });
                setEmail('');
                fetchMembers();
            } else {
                const data = await res.json();
                const text = data.error === 'already_member' ? dt.users.yaEsMiembro
                    : data.error === 'already_invited' ? dt.users.yaInvitado
                    : `${dt.users.errorEnvio} (${data.error ?? res.status})`;
                setFeedback({ type: 'error', text });
            }
        } catch {
            setFeedback({ type: 'error', text: dt.users.errorEnvio });
        } finally {
            setInviting(false);
        }
    };

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
                <form onSubmit={handleInvite} className="flex gap-3">
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
                ) : (
                    <div className="divide-y divide-argo-border">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-argo-violet-50 text-argo-violet-500 flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                                    {m.email[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-argo-navy truncate">{m.email}</p>
                                    <p className="text-xs text-argo-light capitalize">
                                        {m.role}{m.isCurrentUser ? ` · ${dt.users.tu}` : ''}
                                    </p>
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                                    m.status === 'active'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {m.status === 'active' ? <Check size={10} /> : <Clock size={10} />}
                                    {m.status === 'active' ? dt.users.activo : dt.users.pendiente}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
