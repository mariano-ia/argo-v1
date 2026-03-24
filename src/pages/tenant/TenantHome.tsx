import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Send, Loader2, Coins, Activity, Users, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getReportData } from '../../lib/argosEngine';
import { getTendenciaContent } from '../../lib/archetypeData';
import { TENDENCIA_LABELS } from '../../lib/profileResolver';
import { buildReportHtml } from '../../components/onboarding/screens/AdultReport';
import { sendReport } from '../../lib/emailService';
import { getOdysseyT } from '../../lib/odysseyTranslations';
import { SkeletonList, SkeletonSessionRow } from '../../components/ui/Skeleton';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';

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
    motor: string;
    eje_secundario: string | null;
    lang: string | null;
    created_at: string;
}

/* ── Axis color map for chips ────────────────────────────────────────────── */
const AXIS_CHIP: Record<string, { border: string; text: string; dot: string }> = {
    D: { border: 'rgba(249,115,22,0.35)', text: 'rgba(249,115,22,0.75)', dot: '#f97316' },
    I: { border: 'rgba(245,158,11,0.35)', text: 'rgba(180,120,14,0.75)', dot: '#f59e0b' },
    S: { border: 'rgba(34,197,94,0.35)',  text: 'rgba(22,101,52,0.75)',  dot: '#22c55e' },
    C: { border: 'rgba(99,102,241,0.35)', text: 'rgba(99,102,241,0.75)', dot: '#6366f1' },
};

const AXIS_DOT: Record<string, string> = { D: '#f97316', I: '#f59e0b', S: '#22c55e', C: '#6366f1' };

export const TenantHome: React.FC = () => {
    const { tenant, refreshTenant } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const navigate = useNavigate();
    const [copied, setCopied] = React.useState(false);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [resendingId, setResendingId] = useState<string | null>(null);
    const [resendMsg, setResendMsg] = useState<{ id: string; ok: boolean } | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);

    // Handle payment return
    useEffect(() => {
        const payment = searchParams.get('payment');
        if (payment === 'success') {
            setPaymentMsg({ type: 'success', text: dt.home.pagoConfirmado });
            refreshTenant();
            setSearchParams({}, { replace: true });
            setTimeout(() => setPaymentMsg(null), 6000);
        } else if (payment === 'cancel') {
            setPaymentMsg({ type: 'cancel', text: dt.home.pagoCancelado });
            setSearchParams({}, { replace: true });
            setTimeout(() => setPaymentMsg(null), 4000);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            } catch { /* silently fail */ }
            finally { setSessionsLoading(false); }
        };
        fetchSessions();
    }, [tenant]);

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const playLink = `${window.location.origin}/play/${tenant.slug}`;
    const copyLink = async () => { await navigator.clipboard.writeText(playLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const locale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-AR';
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short' });

    const handleResend = async (s: SessionRow) => {
        setResendingId(s.id);
        try {
            const sLang = s.lang || 'es';
            const ot = getOdysseyT(sLang as 'es' | 'en' | 'pt');
            const report = getReportData(s.eje, s.motor, s.eje_secundario ?? '', s.child_name);
            if (s.eje_secundario) {
                const tendencia = getTendenciaContent(s.eje, s.eje_secundario);
                if (tendencia) {
                    report.tendenciaLabel = TENDENCIA_LABELS[s.eje_secundario as keyof typeof TENDENCIA_LABELS];
                    report.tendenciaParagraph = tendencia.parrafo.replace(/\{nombre\}/g, s.child_name);
                    report.palabrasPuenteExtra = tendencia.palabrasPuenteExtra;
                    report.palabrasRuidoExtra = tendencia.palabrasRuidoExtra;
                }
            }
            const arquetipoFull = report.tendenciaLabel ? `${report.arquetipo.label}, ${report.tendenciaLabel}` : report.arquetipo.label;
            const maduracionTemprana = s.child_age < 10;

            await sendReport({
                toEmail: s.adult_email, nombreAdulto: s.adult_name, nombreNino: s.child_name,
                deporte: s.sport ?? '', edad: s.child_age, arquetipo: arquetipoFull,
                reportHtml: buildReportHtml(report, null, ot), maduracionTemprana, sessionId: s.id, lang: sLang,
                emailSubject: ot.emailSubject(s.child_name, arquetipoFull), emailHeader: ot.emailHeader,
                emailPreparedFor: ot.emailPreparedFor(s.adult_name), emailArchetypeOf: ot.emailArchetypeOf(s.child_name),
                emailFooter: ot.emailFooter, emailMaturationTitle: ot.emailMaturationTitle, emailMaturationBody: ot.emailMaturationBody,
            });
            setResendMsg({ id: s.id, ok: true });
        } catch (err) {
            console.error('[TenantHome] Resend error:', err);
            setResendMsg({ id: s.id, ok: false });
        } finally {
            setResendingId(null);
            setTimeout(() => setResendMsg(null), 3000);
        }
    };

    const uniquePlayers = new Set(sessions.map(s => s.child_name)).size;

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* Resend snackbar */}
            {resendMsg && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${resendMsg.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {resendMsg.ok ? dt.home.informeEnviado : dt.home.errorEnvio}
                </div>
            )}

            {/* Payment toast */}
            {paymentMsg && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${paymentMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {paymentMsg.text}
                </div>
            )}

            {/* ── Page header ──────────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">
                    {dt.home.bienvenida(tenant.display_name)}
                </h1>
                <p className="text-[13px] text-argo-grey mt-1">
                    {dt.home.descripcionInicio}
                </p>
            </div>

            {/* ── Stats row ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {[
                    { icon: Coins, label: dt.home.creditos, value: tenant.credits_remaining, sub: `Plan ${tenant.plan}` },
                    { icon: Activity, label: dt.home.sesionesRealizadas, value: sessionsLoading ? '...' : sessions.length, sub: lang === 'en' ? 'completed' : lang === 'pt' ? 'completadas' : 'completadas' },
                    { icon: Users, label: dt.nav.jugadores, value: sessionsLoading ? '...' : uniquePlayers, sub: lang === 'en' ? 'with profile' : lang === 'pt' ? 'com perfil' : 'con perfil' },
                    { icon: Layers, label: dt.nav.grupos, value: '—', sub: lang === 'en' ? 'created' : lang === 'pt' ? 'criados' : 'creados' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[14px] px-6 py-5 shadow-argo transition-all hover:shadow-argo-hover">
                        <div className="w-9 h-9 rounded-[10px] bg-argo-bg flex items-center justify-center text-argo-grey mb-3.5">
                            <stat.icon size={18} />
                        </div>
                        <p className="text-xs text-argo-grey font-medium mb-2">{stat.label}</p>
                        <p className="text-[32px] font-bold text-argo-navy tracking-tight leading-none">{stat.value}</p>
                        <p className="text-[11px] text-argo-light mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Content grid: Sessions + sidebar ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

                {/* Sessions card */}
                <div className="bg-white rounded-[14px] shadow-argo">
                    <div className="flex items-center justify-between px-6 pt-5 pb-0">
                        <h2 className="text-[15px] font-semibold text-argo-navy">{dt.home.sesionesRealizadas}</h2>
                        <button onClick={() => navigate('/dashboard/players')} className="text-xs font-medium text-argo-violet-500 hover:opacity-70 transition-opacity">
                            {dt.home.verTodas ?? 'Ver todas'}
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        {sessionsLoading ? (
                            <SkeletonList rows={5} RowComponent={SkeletonSessionRow} />
                        ) : sessions.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-sm text-argo-secondary">{dt.home.sinSesiones}</p>
                                <p className="text-xs text-argo-light mt-1">{dt.home.sinSesionesDesc}</p>
                            </div>
                        ) : (
                            <div>
                                {sessions.slice(0, 8).map((s) => {
                                    const chip = AXIS_CHIP[s.eje] ?? AXIS_CHIP.C;
                                    const dot = AXIS_DOT[s.eje] ?? '#6366f1';
                                    return (
                                        <div key={s.id} className="flex items-center gap-3.5 py-3.5 border-b border-argo-border last:border-b-0 group">
                                            {/* Axis dot */}
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />

                                            {/* Name + meta */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-semibold text-argo-navy truncate">{s.child_name}</p>
                                                <p className="text-xs text-argo-grey mt-0.5">
                                                    {s.child_age} {dt.common.anos}{s.sport ? `  ·  ${s.sport}` : ''}  ·  {formatDate(s.created_at)}
                                                </p>
                                            </div>

                                            {/* Profile chip */}
                                            <span
                                                className="text-[11px] font-medium px-3 py-1 rounded-full bg-transparent flex-shrink-0 hidden sm:inline-block"
                                                style={{ border: `1px solid ${chip.border}`, color: chip.text }}
                                            >
                                                {s.archetype_label}
                                            </span>

                                            {/* Resend */}
                                            <button
                                                onClick={() => handleResend(s)}
                                                disabled={resendingId === s.id}
                                                title={dt.home.reenviarInforme}
                                                className="p-1.5 rounded-lg text-argo-light hover:text-argo-violet-500 hover:bg-argo-bg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                                            >
                                                {resendingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-5">
                    {/* Link card */}
                    <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                        <p className="text-[11px] text-argo-grey font-medium mb-3">{dt.homeExtra.tuLinkInvitacion}</p>
                        <div className="flex gap-2.5 items-center">
                            <div className="flex-1 font-mono text-xs text-argo-secondary bg-argo-bg border border-argo-border rounded-lg px-3.5 py-2.5 truncate">
                                {playLink}
                            </div>
                            <button onClick={copyLink} className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-argo-violet-500 text-white text-xs font-semibold hover:bg-argo-violet-400 transition-colors">
                                {copied ? <Check size={14} /> : dt.home.copiarLink}
                            </button>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                        <p className="text-[13px] font-semibold text-argo-navy mb-3">
                            {lang === 'en' ? 'Quick actions' : lang === 'pt' ? 'Acoes rapidas' : 'Acciones rapidas'}
                        </p>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => navigate('/dashboard/groups')} className="text-left text-xs font-medium text-argo-secondary border border-argo-border rounded-lg px-4 py-2.5 hover:bg-argo-violet-50 hover:border-argo-violet-200 transition-all">
                                {lang === 'en' ? 'Create new group' : lang === 'pt' ? 'Criar novo grupo' : 'Crear grupo nuevo'}
                            </button>
                            <button onClick={() => navigate('/dashboard/guide')} className="text-left text-xs font-medium text-argo-secondary border border-argo-border rounded-lg px-4 py-2.5 hover:bg-argo-violet-50 hover:border-argo-violet-200 transition-all">
                                {lang === 'en' ? 'Check the guide' : lang === 'pt' ? 'Consultar o guia' : 'Consultar la guia'}
                            </button>
                            <button onClick={() => navigate('/dashboard/chat')} className="text-left text-xs font-medium text-argo-secondary border border-argo-border rounded-lg px-4 py-2.5 hover:bg-argo-violet-50 hover:border-argo-violet-200 transition-all">
                                {lang === 'en' ? 'Ask the assistant' : lang === 'pt' ? 'Perguntar ao assistente' : 'Consultar al asistente'}
                            </button>
                        </div>
                    </div>

                    {/* Credits note */}
                    {tenant.credits_remaining <= 5 && (
                        <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                            <p className="text-xs text-argo-grey">{dt.home.sinCreditos}</p>
                            <button className="mt-2 text-xs font-semibold text-argo-violet-500 hover:opacity-70 transition-opacity">
                                {dt.homeExtra.comprarCreditos}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
