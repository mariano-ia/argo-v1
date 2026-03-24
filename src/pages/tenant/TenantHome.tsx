import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Send, Loader2, Coins, Activity, Users, Layers, Copy, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getReportData } from '../../lib/argosEngine';
import { getTendenciaContent } from '../../lib/archetypeData';
import { TENDENCIA_LABELS } from '../../lib/profileResolver';
import { buildReportHtml } from '../../components/onboarding/screens/AdultReport';
import { sendReport } from '../../lib/emailService';
import { getOdysseyT } from '../../lib/odysseyTranslations';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { calcAxisDistribution, getGroupTypes } from '../../lib/groupBalance';
import { GROUP_PROFILE_TEXTS, AXIS_CONFIG } from '../../lib/groupBalanceRules';
import type { MemberProfile } from '../../lib/groupBalance';

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

/* ── Axis colors ─────────────────────────────────────────────────────────── */
const AXIS_CHIP: Record<string, { border: string; text: string }> = {
    D: { border: 'rgba(249,115,22,0.35)', text: 'rgba(249,115,22,0.75)' },
    I: { border: 'rgba(245,158,11,0.35)', text: 'rgba(180,120,14,0.75)' },
    S: { border: 'rgba(34,197,94,0.35)',  text: 'rgba(22,101,52,0.75)' },
    C: { border: 'rgba(99,102,241,0.35)', text: 'rgba(99,102,241,0.75)' },
};
const AXIS_DOT: Record<string, string> = { D: '#f97316', I: '#f59e0b', S: '#22c55e', C: '#6366f1' };
const AXIS_NAMES_ES: Record<string, string> = { D: 'Impulsor', I: 'Conector', S: 'Sosten', C: 'Estratega' };

/* ── Archetype micro-descriptions (deterministic, from archetypeData perfil) */
const MICRO_DESC: Record<string, string> = {
    'D-Rápido': 'Lidera con accion directa',
    'D-Medio': 'Decide con proposito claro',
    'D-Lento': 'Persiste con determinacion firme',
    'I-Rápido': 'Contagia entusiasmo al grupo',
    'I-Medio': 'Conecta a traves del vinculo',
    'I-Lento': 'Observa y conecta en profundidad',
    'S-Rápido': 'Responde rapido para apoyar',
    'S-Medio': 'Sostiene con consistencia',
    'S-Lento': 'Estabiliza desde la calma',
    'C-Rápido': 'Analiza y ejecuta al instante',
    'C-Medio': 'Procesa con metodo y precision',
    'C-Lento': 'Observa antes de intervenir',
};

/* ── Activity digest (deterministic) ─────────────────────────────────────── */
function getActivityDigest(sessions: SessionRow[], lang: string): string {
    if (sessions.length === 0) {
        return lang === 'en' ? 'Share your link to start getting sessions.' :
               lang === 'pt' ? 'Compartilhe seu link para comecar a receber sessoes.' :
               'Comparte tu link para empezar a recibir sesiones.';
    }
    const now = Date.now();
    const twoWeeksAgo = now - 14 * 86400000;
    const fourWeeksAgo = now - 28 * 86400000;
    const recent = sessions.filter(s => new Date(s.created_at).getTime() > twoWeeksAgo).length;
    const prev = sessions.filter(s => {
        const t = new Date(s.created_at).getTime();
        return t > fourWeeksAgo && t <= twoWeeksAgo;
    }).length;

    if (recent > prev && recent > 0) {
        return lang === 'en' ? `Activity is growing. ${recent} sessions in the last 2 weeks.` :
               lang === 'pt' ? `A atividade esta crescendo. ${recent} sessoes nas ultimas 2 semanas.` :
               `La actividad viene creciendo. ${recent} sesiones en las ultimas 2 semanas.`;
    }
    if (recent === 0 && sessions.length > 0) {
        return lang === 'en' ? 'No new sessions in the last 2 weeks. Share your link to reactivate.' :
               lang === 'pt' ? 'Sem novas sessoes nas ultimas 2 semanas. Compartilhe seu link.' :
               'Sin sesiones nuevas en las ultimas 2 semanas. Comparte tu link para reactivar.';
    }
    const avg = Math.round(sessions.length / Math.max(1, Math.ceil((now - new Date(sessions[sessions.length - 1]?.created_at).getTime()) / (7 * 86400000))));
    return lang === 'en' ? `Stable activity. Average of ${avg} sessions per week.` :
           lang === 'pt' ? `Atividade estavel. Media de ${avg} sessoes por semana.` :
           `Actividad estable. Promedio de ${avg} sesiones por semana.`;
}

/* ── Distribution digest ─────────────────────────────────────────────────── */
function getDistributionDigest(sessions: SessionRow[], lang: string): string {
    if (sessions.length < 3) {
        return lang === 'en' ? 'More profiles are needed to see the distribution of your athletes.' :
               lang === 'pt' ? 'Mais perfis sao necessarios para ver a distribuicao dos seus atletas.' :
               'Se necesitan mas perfiles para ver la distribucion de tus deportistas.';
    }
    const members: MemberProfile[] = sessions.map(s => ({
        session_id: s.id, child_name: s.child_name, child_age: s.child_age,
        sport: s.sport ?? '', eje: s.eje as MemberProfile['eje'],
        motor: s.motor, eje_secundario: s.eje_secundario ?? '',
        archetype_label: s.archetype_label,
    }));
    const dist = calcAxisDistribution(members);
    const types = getGroupTypes(dist);
    const primary = types[0] ?? 'Balanceado';
    const text = GROUP_PROFILE_TEXTS[primary];
    if (!text) return '';

    // Simplify the identity text for the home dashboard
    return text.identity;
}

/* ── Activity sparkline (SVG) ────────────────────────────────────────────── */
const ActivityChart: React.FC<{ sessions: SessionRow[] }> = ({ sessions }) => {
    const weeks = useMemo(() => {
        const now = Date.now();
        const buckets: number[] = new Array(8).fill(0); // last 8 weeks
        sessions.forEach(s => {
            const weeksAgo = Math.floor((now - new Date(s.created_at).getTime()) / (7 * 86400000));
            if (weeksAgo >= 0 && weeksAgo < 8) buckets[7 - weeksAgo]++;
        });
        return buckets;
    }, [sessions]);

    const max = Math.max(...weeks, 1);
    const w = 280, h = 80, px = 8, py = 8;
    const plotW = w - px * 2, plotH = h - py * 2;
    const points = weeks.map((v, i) => ({
        x: px + (i / (weeks.length - 1)) * plotW,
        y: py + plotH - (v / max) * plotH,
    }));
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${line} L${points[points.length - 1].x},${h - py} L${points[0].x},${h - py} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ maxHeight: 100 }}>
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#955FB5" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#955FB5" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#chartGrad)" />
            <path d={line} fill="none" stroke="#955FB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" stroke="#955FB5" strokeWidth="1.5" />
            ))}
        </svg>
    );
};

/* ── Component ───────────────────────────────────────────────────────────── */
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
                const res = await fetch('/api/tenant-sessions', { headers: { Authorization: `Bearer ${session.access_token}` } });
                if (res.ok) { const data = await res.json(); setSessions(data.sessions); }
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
    const uniquePlayers = new Set(sessions.map(s => s.child_name)).size;

    // Sessions this month
    const now = new Date();
    const thisMonthCount = sessions.filter(s => {
        const d = new Date(s.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Distribution for bar chart
    const axisCounts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    sessions.forEach(s => { if (axisCounts[s.eje] !== undefined) axisCounts[s.eje]++; });
    const totalForDist = sessions.length || 1;

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
            await sendReport({
                toEmail: s.adult_email, nombreAdulto: s.adult_name, nombreNino: s.child_name,
                deporte: s.sport ?? '', edad: s.child_age, arquetipo: arquetipoFull,
                reportHtml: buildReportHtml(report, null, ot), maduracionTemprana: s.child_age < 10,
                sessionId: s.id, lang: sLang,
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

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* Toasts */}
            {resendMsg && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${resendMsg.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {resendMsg.ok ? dt.home.informeEnviado : dt.home.errorEnvio}
                </div>
            )}
            {paymentMsg && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${paymentMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {paymentMsg.text}
                </div>
            )}

            {/* ═══ ROW 1: Header + Link ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">
                        {dt.home.bienvenida(tenant.display_name)}
                    </h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.home.descripcionInicio}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="font-mono text-[11px] text-argo-grey bg-argo-bg border border-argo-border rounded-lg px-3 py-2 truncate max-w-[240px]">
                        {playLink}
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-argo-violet-500 text-white text-[11px] font-semibold hover:bg-argo-violet-400 transition-colors flex-shrink-0"
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? (lang === 'en' ? 'Copied' : lang === 'pt' ? 'Copiado' : 'Copiado') : (lang === 'en' ? 'Copy' : lang === 'pt' ? 'Copiar' : 'Copiar')}
                    </button>
                </div>
            </div>

            {/* ═══ ROW 2: Stats ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {[
                    { icon: Coins, label: dt.home.creditos, value: tenant.credits_remaining, sub: `Plan ${tenant.plan}` },
                    { icon: Activity, label: lang === 'en' ? 'Sessions' : lang === 'pt' ? 'Sessoes' : 'Sesiones', value: sessionsLoading ? '...' : sessions.length, sub: thisMonthCount > 0 ? `+${thisMonthCount} ${lang === 'en' ? 'this month' : lang === 'pt' ? 'este mes' : 'este mes'}` : (lang === 'en' ? 'completed' : lang === 'pt' ? 'completadas' : 'completadas') },
                    { icon: Users, label: lang === 'en' ? 'Athletes' : lang === 'pt' ? 'Atletas' : 'Deportistas', value: sessionsLoading ? '...' : uniquePlayers, sub: lang === 'en' ? 'with profile' : lang === 'pt' ? 'com perfil' : 'con perfil' },
                    { icon: Layers, label: lang === 'en' ? 'Groups' : lang === 'pt' ? 'Grupos' : 'Grupos', value: '—', sub: lang === 'en' ? 'created' : lang === 'pt' ? 'criados' : 'creados' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[14px] px-6 py-5 shadow-argo transition-all hover:shadow-argo-hover group">
                        <div className="w-9 h-9 rounded-[10px] bg-argo-bg flex items-center justify-center text-argo-grey mb-3.5 transition-colors group-hover:bg-argo-violet-50 group-hover:text-argo-violet-400">
                            <stat.icon size={18} />
                        </div>
                        <p className="text-xs text-argo-grey font-medium mb-2">{stat.label}</p>
                        <p className="text-[32px] font-bold text-argo-navy tracking-tight leading-none">{stat.value}</p>
                        <p className="text-[11px] text-argo-light mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* ═══ ROW 3: Activity chart + Distribution ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-10">
                {/* Activity */}
                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-1">
                        {lang === 'en' ? 'Recent activity' : lang === 'pt' ? 'Atividade recente' : 'Actividad reciente'}
                    </h2>
                    <p className="text-[11px] text-argo-light mb-4">
                        {lang === 'en' ? 'Sessions per week, last 8 weeks' : lang === 'pt' ? 'Sessoes por semana, ultimas 8 semanas' : 'Sesiones por semana, ultimas 8 semanas'}
                    </p>
                    {sessionsLoading ? (
                        <div className="h-[100px] bg-argo-bg rounded-lg animate-pulse" />
                    ) : (
                        <ActivityChart sessions={sessions} />
                    )}
                    <p className="text-xs text-argo-secondary leading-relaxed mt-4 pl-3 border-l-2 border-argo-violet-100">
                        {sessionsLoading ? '...' : getActivityDigest(sessions, lang)}
                    </p>
                </div>

                {/* Distribution */}
                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-1">
                        {lang === 'en' ? 'Profile distribution' : lang === 'pt' ? 'Distribuicao de perfis' : 'Distribucion de perfiles'}
                    </h2>
                    <p className="text-[11px] text-argo-light mb-4">
                        {lang === 'en' ? 'Your athletes by behavioral axis' : lang === 'pt' ? 'Seus atletas por eixo comportamental' : 'Tus deportistas por eje de conducta'}
                    </p>

                    {sessionsLoading ? (
                        <div className="space-y-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-4 bg-argo-bg rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(['D', 'I', 'S', 'C'] as const).map(axis => {
                                const count = axisCounts[axis];
                                const pct = Math.round((count / totalForDist) * 100);
                                const cfg = AXIS_CONFIG[axis];
                                const name = dt.profile?.axisNames?.[axis] ?? AXIS_NAMES_ES[axis];
                                return (
                                    <div key={axis} className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-argo-secondary w-20">{name}</span>
                                        <div className="flex-1 h-[4px] rounded-sm bg-argo-border overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-sm"
                                                style={{ background: cfg.color, opacity: 0.7 }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-semibold text-argo-grey w-8 text-right">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!sessionsLoading && sessions.length >= 3 && (
                        <p className="text-xs text-argo-secondary leading-relaxed mt-4 pl-3 border-l-2 border-argo-violet-100">
                            {getDistributionDigest(sessions, lang)}
                        </p>
                    )}
                </div>
            </div>

            {/* ═══ ROW 4: Last 3 sessions + Quick actions ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                {/* Last sessions */}
                <div className="bg-white rounded-[14px] shadow-argo">
                    <div className="flex items-center justify-between px-6 pt-5 pb-0">
                        <h2 className="text-[15px] font-semibold text-argo-navy">
                            {lang === 'en' ? 'Latest sessions' : lang === 'pt' ? 'Ultimas sessoes' : 'Ultimas sesiones'}
                        </h2>
                        <button onClick={() => navigate('/dashboard/players')} className="flex items-center gap-1 text-xs font-medium text-argo-violet-500 hover:opacity-70 transition-opacity">
                            {dt.home.verTodas}
                            <ChevronRight size={12} />
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        {sessionsLoading ? (
                            <div className="space-y-4">
                                {[1,2,3].map(i => <div key={i} className="h-14 bg-argo-bg rounded-lg animate-pulse" />)}
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-argo-secondary">{dt.home.sinSesiones}</p>
                                <p className="text-xs text-argo-light mt-1">{dt.home.sinSesionesDesc}</p>
                            </div>
                        ) : (
                            <div>
                                {sessions.slice(0, 3).map((s) => {
                                    const chip = AXIS_CHIP[s.eje] ?? AXIS_CHIP.C;
                                    const dot = AXIS_DOT[s.eje] ?? '#6366f1';
                                    const microKey = `${s.eje}-${s.motor}` as keyof typeof MICRO_DESC;
                                    const micro = MICRO_DESC[microKey] ?? '';
                                    return (
                                        <div key={s.id} className="flex items-center gap-3.5 py-3.5 border-b border-argo-border last:border-b-0 group">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-semibold text-argo-navy truncate">{s.child_name}</p>
                                                <p className="text-xs text-argo-grey mt-0.5">
                                                    {s.child_age} {dt.common.anos}{s.sport ? `  ·  ${s.sport}` : ''}  ·  {formatDate(s.created_at)}
                                                </p>
                                                {micro && <p className="text-[11px] text-argo-light mt-0.5 italic">{micro}</p>}
                                            </div>
                                            <span
                                                className="text-[11px] font-medium px-3 py-1 rounded-full bg-transparent flex-shrink-0 hidden sm:inline-block"
                                                style={{ border: `1px solid ${chip.border}`, color: chip.text }}
                                            >
                                                {s.archetype_label}
                                            </span>
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
                    <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                        <p className="text-[13px] font-semibold text-argo-navy mb-3">
                            {lang === 'en' ? 'Quick actions' : lang === 'pt' ? 'Acoes rapidas' : 'Acciones rapidas'}
                        </p>
                        <div className="flex flex-col gap-2">
                            {[
                                { path: '/dashboard/groups', label: lang === 'en' ? 'Create new group' : lang === 'pt' ? 'Criar novo grupo' : 'Crear grupo nuevo' },
                                { path: '/dashboard/guide', label: lang === 'en' ? 'Check the guide' : lang === 'pt' ? 'Consultar o guia' : 'Consultar la guia' },
                                { path: '/dashboard/chat', label: lang === 'en' ? 'Ask the assistant' : lang === 'pt' ? 'Perguntar ao assistente' : 'Consultar al asistente' },
                            ].map(a => (
                                <button
                                    key={a.path}
                                    onClick={() => navigate(a.path)}
                                    className="flex items-center justify-between text-xs font-medium text-argo-secondary border border-argo-border rounded-lg px-4 py-2.5 hover:bg-argo-violet-50 hover:border-argo-violet-200 transition-all"
                                >
                                    {a.label}
                                    <ChevronRight size={12} className="text-argo-light" />
                                </button>
                            ))}
                        </div>
                    </div>

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
