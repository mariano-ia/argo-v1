import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check, Users, CreditCard, Sparkles, Zap, Crown, Send, Loader2, Anchor } from 'lucide-react';
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

const CREDIT_PACKS = [
    { id: 'starter', credits: 10, priceUsd: 29, icon: Zap,      color: 'bg-sky-50 border-sky-200 text-sky-700',     btnColor: 'bg-sky-500 hover:bg-sky-600' },
    { id: 'team',    credits: 30, priceUsd: 69, icon: Sparkles,  color: 'bg-violet-50 border-violet-200 text-violet-700', btnColor: 'bg-violet-500 hover:bg-violet-600' },
    { id: 'club',    credits: 100, priceUsd: 179, icon: Crown,   color: 'bg-amber-50 border-amber-200 text-amber-700',  btnColor: 'bg-amber-500 hover:bg-amber-600' },
];

export const TenantHome: React.FC = () => {
    const { tenant, refreshTenant } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [copied, setCopied] = React.useState(false);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [buyingPack, setBuyingPack] = useState<string | null>(null);
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
            } catch {
                // silently fail
            } finally {
                setSessionsLoading(false);
            }
        };

        fetchSessions();
    }, [tenant]);

    const handleBuyPack = async (packId: string) => {
        setBuyingPack(packId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ pack_id: packId }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Checkout error');
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (err) {
            console.error('[TenantHome] Checkout error:', err);
            setPaymentMsg({ type: 'cancel', text: dt.home.errorPago });
            setTimeout(() => setPaymentMsg(null), 4000);
        } finally {
            setBuyingPack(null);
        }
    };

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const playLink = `${window.location.origin}/play/${tenant.slug}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(playLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResend = async (s: SessionRow) => {
        setResendingId(s.id);
        try {
            const lang = s.lang || 'es';
            const ot = getOdysseyT(lang as 'es' | 'en' | 'pt');
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
            const arquetipoFull = report.tendenciaLabel
                ? `${report.arquetipo.label}, ${report.tendenciaLabel}`
                : report.arquetipo.label;
            const maduracionTemprana = s.child_age < 10;

            await sendReport({
                toEmail:           s.adult_email,
                nombreAdulto:      s.adult_name,
                nombreNino:        s.child_name,
                deporte:           s.sport ?? '',
                edad:              s.child_age,
                arquetipo:         arquetipoFull,
                reportHtml:        buildReportHtml(report, null, ot),
                maduracionTemprana,
                sessionId:         s.id,
                lang,
                emailSubject:      ot.emailSubject(s.child_name, arquetipoFull),
                emailHeader:       ot.emailHeader,
                emailPreparedFor:  ot.emailPreparedFor(s.adult_name),
                emailArchetypeOf:  ot.emailArchetypeOf(s.child_name),
                emailFooter:       ot.emailFooter,
                emailMaturationTitle: ot.emailMaturationTitle,
                emailMaturationBody:  ot.emailMaturationBody,
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

    const locale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-AR';

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            {/* Resend snackbar — top-right */}
            {resendMsg && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
                    resendMsg.ok
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                }`}>
                    {resendMsg.ok ? dt.home.informeEnviado : dt.home.errorEnvio}
                </div>
            )}

            {/* Payment toast */}
            {paymentMsg && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
                    paymentMsg.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                    {paymentMsg.text}
                </div>
            )}

            <h1 className="font-display text-2xl font-bold text-argo-navy mb-1">
                {dt.home.bienvenida(tenant.display_name)}
            </h1>
            <p className="text-sm text-argo-secondary mb-8">
                {dt.settings.plan} {tenant.plan} · {tenant.credits_remaining} {dt.home.creditosDisponibles}
            </p>

            {/* Play link card */}
            <div className="bg-white rounded-[14px] p-6 shadow-argo mb-6">
                <h2 className="text-[15px] font-semibold text-argo-navy mb-3">
                    {dt.homeExtra.tuLinkInvitacion}
                </h2>
                <p className="text-xs text-argo-grey mb-4">
                    {dt.homeExtra.tuLinkInvitacionDesc}
                </p>

                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-argo-bg border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy font-mono truncate">
                        {playLink}
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-argo-border rounded-lg hover:bg-argo-bg transition-all flex-shrink-0"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? dt.home.linkCopiado : dt.home.copiarLink}
                    </button>
                </div>

                <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mt-3">
                    {dt.homeExtra.creditoNota}
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-[14px] p-5 shadow-argo">
                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1">{dt.home.creditos}</p>
                    <p className="text-[32px] font-bold text-argo-navy tracking-tight">{tenant.credits_remaining}</p>
                </div>
                <div className="bg-white rounded-[14px] p-5 shadow-argo">
                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1">{dt.home.sesionesRealizadas}</p>
                    <p className="text-[32px] font-bold text-argo-navy tracking-tight">
                        {sessionsLoading ? '…' : sessions.length}
                    </p>
                </div>
                <div className="bg-white rounded-[14px] p-5 shadow-argo">
                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1">{dt.settings.plan}</p>
                    <p className="text-[32px] font-bold text-argo-navy tracking-tight capitalize">{tenant.plan}</p>
                </div>
            </div>

            {/* Credit packs */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={15} className="text-argo-grey" />
                    <h2 className="text-[15px] font-semibold text-argo-navy">
                        {dt.homeExtra.comprarCreditos}
                    </h2>
                </div>
                {tenant.credits_remaining === 0 && (
                    <p className="text-xs text-amber-600 mb-3">
                        {dt.home.sinCreditos}
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CREDIT_PACKS.map((pack) => {
                        const Icon = pack.icon;
                        return (
                            <div
                                key={pack.id}
                                className={`border rounded-[14px] p-5 ${pack.color} transition-all hover:shadow-argo-hover`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon size={18} />
                                    <span className="text-sm font-bold uppercase tracking-wide capitalize">{pack.id}</span>
                                </div>
                                <p className="text-3xl font-bold mb-1">{pack.credits}</p>
                                <p className="text-xs opacity-70 mb-4">{dt.home.creditos}</p>
                                <button
                                    onClick={() => handleBuyPack(pack.id)}
                                    disabled={buyingPack !== null}
                                    className={`w-full py-2 rounded-lg text-white text-sm font-semibold ${pack.btnColor} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {buyingPack === pack.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            {dt.homeExtra.procesando}
                                        </span>
                                    ) : (
                                        `US$ ${pack.priceUsd}`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sessions list */}
            <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                <div className="px-6 py-4 border-b border-argo-border flex items-center gap-2">
                    <Users size={15} className="text-argo-grey" />
                    <h2 className="text-[15px] font-semibold text-argo-navy">
                        {dt.home.sesionesRealizadas}
                    </h2>
                </div>

                {sessionsLoading ? (
                    <SkeletonList rows={5} RowComponent={SkeletonSessionRow} />
                ) : sessions.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-[14px] bg-argo-violet-50 flex items-center justify-center mx-auto mb-3">
                            <Anchor size={20} className="text-argo-violet-500" />
                        </div>
                        <p className="text-sm text-argo-secondary">{dt.home.sinSesiones}</p>
                        <p className="text-xs text-argo-light mt-1">{dt.home.sinSesionesDesc}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-argo-border">
                        {sessions.map((s) => (
                            <div key={s.id} className="px-6 py-4 hover:bg-argo-bg/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-argo-navy truncate">
                                            {s.child_name}
                                            <span className="font-normal text-argo-grey ml-1.5">
                                                {s.child_age} {dt.common.anos}{s.sport ? ` · ${s.sport}` : ''}
                                            </span>
                                        </p>
                                        <p className="text-xs text-argo-secondary mt-0.5 truncate">
                                            {dt.homeExtra.adulto}: {s.adult_name} ({s.adult_email})
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => handleResend(s)}
                                            disabled={resendingId === s.id}
                                            title={dt.home.reenviarInforme}
                                            className="mt-0.5 p-1.5 rounded-lg text-argo-grey hover:text-argo-violet-500 hover:bg-argo-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {resendingId === s.id
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : <Send size={14} />
                                            }
                                        </button>
                                        <div className="text-right">
                                            <span className="inline-block border border-argo-violet-500/35 text-argo-violet-500/75 bg-transparent rounded-full text-[11px] font-medium px-3 py-1">
                                                {s.archetype_label}
                                            </span>
                                            <p className="text-[10px] font-semibold text-argo-light mt-1">
                                                {formatDate(s.created_at)} · {formatTime(s.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
