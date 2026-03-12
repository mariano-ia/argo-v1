import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

interface SessionRow {
    id: string;
    child_name: string;
    child_age: number;
    adult_name: string;
    adult_email: string;
    sport: string | null;
    archetype_label: string;
    eje: string;
    eje_secundario: string | null;
    created_at: string;
}

export const TenantHome: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const [copied, setCopied] = React.useState(false);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    useEffect(() => {
        if (!tenant) return;

        const fetchSessions = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const res = await fetch('/api/tenant-sessions', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data.sessions);
                }
            } catch {
                // silently fail
            } finally {
                setSessionsLoading(false);
            }
        };

        fetchSessions();
    }, [tenant]);

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    const playLink = `${window.location.origin}/play/${tenant.slug}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(playLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-argo-navy mb-1">
                Hola, {tenant.display_name}
            </h1>
            <p className="text-sm text-argo-grey mb-8">
                Plan {tenant.plan} · {tenant.credits_remaining} crédito{tenant.credits_remaining !== 1 ? 's' : ''} disponible{tenant.credits_remaining !== 1 ? 's' : ''}
            </p>

            {/* Play link card */}
            <div className="bg-white border border-argo-border rounded-2xl p-6 shadow-sm mb-6">
                <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest mb-3">
                    Tu link de invitación
                </h2>
                <p className="text-xs text-argo-grey mb-4">
                    Comparte este link con los adultos que quieras invitar a realizar la experiencia Argo con sus niños.
                </p>

                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-argo-neutral border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy font-mono truncate">
                        {playLink}
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-argo-border rounded-lg hover:bg-argo-neutral transition-all flex-shrink-0"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>

                <p className="text-[10px] text-argo-grey/50 mt-3">
                    Cada vez que alguien inicie la experiencia desde este link, se descontará 1 crédito de tu cuenta.
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-argo-border rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold mb-1">Créditos</p>
                    <p className="text-2xl font-bold text-argo-navy">{tenant.credits_remaining}</p>
                </div>
                <div className="bg-white border border-argo-border rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold mb-1">Sesiones</p>
                    <p className="text-2xl font-bold text-argo-navy">
                        {sessionsLoading ? '…' : sessions.length}
                    </p>
                </div>
                <div className="bg-white border border-argo-border rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold mb-1">Plan</p>
                    <p className="text-2xl font-bold text-argo-navy capitalize">{tenant.plan}</p>
                </div>
            </div>

            {/* Sessions list */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-argo-border flex items-center gap-2">
                    <Users size={15} className="text-argo-grey" />
                    <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">
                        Sesiones realizadas
                    </h2>
                </div>

                {sessionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-argo-grey">Todavía no hay sesiones registradas.</p>
                        <p className="text-xs text-argo-grey/50 mt-1">Compartí tu link para que empiecen a llegar.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-argo-border">
                        {sessions.map((s) => (
                            <div key={s.id} className="px-6 py-4 hover:bg-argo-neutral/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-argo-navy truncate">
                                            {s.child_name}
                                            <span className="font-normal text-argo-grey ml-1.5">
                                                {s.child_age} años{s.sport ? ` · ${s.sport}` : ''}
                                            </span>
                                        </p>
                                        <p className="text-xs text-argo-grey mt-0.5 truncate">
                                            Adulto: {s.adult_name} ({s.adult_email})
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F0FF] text-[#6366f1]">
                                            {s.archetype_label}
                                        </span>
                                        <p className="text-[10px] text-argo-grey/60 mt-1">
                                            {formatDate(s.created_at)} · {formatTime(s.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
