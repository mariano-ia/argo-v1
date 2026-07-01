import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface OneLink {
    id: string;
    slug: string;
    status: 'available' | 'sent' | 'pending' | 'completed';
    recipient_email: string | null;
    child_name: string | null;
    sport: string | null;
    completed_at: string | null;
    session_id: string | null;
}

interface PanelData {
    purchase: { email: string; pack_size: number; paid_at: string };
    links: OneLink[];
    summary: { total: number; completed: number; pending: number; available: number };
}

/* ── i18n ──────────────────────────────────────────────────────────────────── */

const T = {
    es: {
        title: 'Mis informes',
        pack: (n: number) => `Pack de ${n} ${n === 1 ? 'informe' : 'informes'}`,
        used: (n: number, t: number) => `${n} de ${t} usados`,
        available: 'Disponible',
        availableDesc: 'Genera un link para que un deportista juegue.',
        sent: 'Link enviado',
        pending: 'Pendiente',
        completed: 'Completado',
        sentTo: 'Enviado a',
        generateLink: 'Generar link',
        copyLink: 'Copiar link',
        copied: 'Copiado',
        viewReport: 'Ver informe',
        buyMore: 'Comprar más informes',
        howTitle: 'Cómo funciona',
        how1: 'Genera un link para cada deportista que quieras perfilar.',
        how2: 'El adulto responsable completa el registro y le pasa el dispositivo al deportista.',
        how3: 'El deportista juega una aventura de menos de 10 minutos.',
        how4: 'El informe completo llega al email del adulto responsable.',
        modalTitle: 'Generar link de juego',
        modalDesc: 'Ingresa el email del adulto responsable. Recibirá las instrucciones y luego el informe.',
        emailPlaceholder: 'Email del adulto responsable',
        namePlaceholder: 'Nombre del deportista (opcional)',
        sportSelect: 'Deporte del deportista',
        sportOtherPlaceholder: 'Escribe el deporte...',
        sports: ['Fútbol', 'Hockey', 'Básquet', 'Rugby', 'Tenis', 'Natación', 'Voley', 'Atletismo', 'Handball', 'Béisbol', 'Otro'],
        cancel: 'Cancelar',
        generateAndSend: 'Generar y enviar',
        loading: 'Cargando...',
        notFound: 'Compra no encontrada',
        notFoundDesc: 'Verifica el link que recibiste por email.',
        notPaid: 'Pago pendiente',
        notPaidDesc: 'Tu pago todavía no fue confirmado. Si ya pagaste, espera unos minutos e intenta de nuevo.',
        accessTitle: 'Accede a tus informes',
        accessDesc: 'Ingresa el email con el que compraste y te enviamos un link de acceso a tu panel.',
        accessEmailPlaceholder: 'Tu email',
        accessSend: 'Enviarme el link',
        accessSending: 'Enviando...',
        accessSentTitle: 'Revisa tu email',
        accessSentDesc: 'Si tienes compras con ese email, te enviamos un link para acceder a tu panel.',
    },
    en: {
        title: 'My reports',
        pack: (n: number) => `Pack of ${n} ${n === 1 ? 'report' : 'reports'}`,
        used: (n: number, t: number) => `${n} of ${t} used`,
        available: 'Available',
        availableDesc: 'Generate a link for an athlete to play.',
        sent: 'Link sent',
        pending: 'Pending',
        completed: 'Completed',
        sentTo: 'Sent to',
        generateLink: 'Generate link',
        copyLink: 'Copy link',
        copied: 'Copied',
        viewReport: 'View report',
        buyMore: 'Buy more reports',
        howTitle: 'How it works',
        how1: 'Generate a link for each athlete you want to profile.',
        how2: 'The responsible adult registers and hands the device to the athlete.',
        how3: 'The athlete plays an adventure of less than 10 minutes.',
        how4: 'The full report arrives at the adult\'s email.',
        modalTitle: 'Generate play link',
        modalDesc: 'Enter the responsible adult\'s email. They will receive instructions and then the report.',
        emailPlaceholder: 'Responsible adult\'s email',
        namePlaceholder: 'Athlete\'s name (optional)',
        sportSelect: 'Athlete\'s sport',
        sportOtherPlaceholder: 'Type the sport...',
        sports: ['Soccer', 'Hockey', 'Basketball', 'Rugby', 'Tennis', 'Swimming', 'Volleyball', 'Track & Field', 'Handball', 'Baseball', 'Other'],
        cancel: 'Cancel',
        generateAndSend: 'Generate & send',
        loading: 'Loading...',
        notFound: 'Purchase not found',
        notFoundDesc: 'Check the link you received by email.',
        notPaid: 'Payment pending',
        notPaidDesc: 'Your payment has not been confirmed yet. If you already paid, wait a few minutes and try again.',
        accessTitle: 'Access your reports',
        accessDesc: 'Enter the email you purchased with and we will send you a link to your panel.',
        accessEmailPlaceholder: 'Your email',
        accessSend: 'Send me the link',
        accessSending: 'Sending...',
        accessSentTitle: 'Check your email',
        accessSentDesc: 'If you have purchases with that email, we sent you a link to access your panel.',
    },
    pt: {
        title: 'Meus relatórios',
        pack: (n: number) => `Pack de ${n} ${n === 1 ? 'relatório' : 'relatórios'}`,
        used: (n: number, t: number) => `${n} de ${t} usados`,
        available: 'Disponível',
        availableDesc: 'Gere um link para um atleta jogar.',
        sent: 'Link enviado',
        pending: 'Pendente',
        completed: 'Completado',
        sentTo: 'Enviado para',
        generateLink: 'Gerar link',
        copyLink: 'Copiar link',
        copied: 'Copiado',
        viewReport: 'Ver relatório',
        buyMore: 'Comprar mais relatórios',
        howTitle: 'Como funciona',
        how1: 'Gere um link para cada atleta que deseja perfilar.',
        how2: 'O adulto responsável completa o registro e passa o dispositivo ao atleta.',
        how3: 'O atleta joga uma aventura de menos de 10 minutos.',
        how4: 'O relatório completo chega no email do adulto responsável.',
        modalTitle: 'Gerar link de jogo',
        modalDesc: 'Insira o email do adulto responsável. Ele receberá as instruções e depois o relatório.',
        emailPlaceholder: 'Email do adulto responsável',
        namePlaceholder: 'Nome do atleta (opcional)',
        sportSelect: 'Esporte do atleta',
        sportOtherPlaceholder: 'Digite o esporte...',
        sports: ['Futebol', 'Hóquei', 'Basquete', 'Rugby', 'Tênis', 'Natação', 'Vôlei', 'Atletismo', 'Handebol', 'Beisebol', 'Outro'],
        cancel: 'Cancelar',
        generateAndSend: 'Gerar e enviar',
        loading: 'Carregando...',
        notFound: 'Compra não encontrada',
        notFoundDesc: 'Verifique o link que recebeu por email.',
        notPaid: 'Pagamento pendente',
        notPaidDesc: 'Seu pagamento ainda não foi confirmado. Se já pagou, aguarde alguns minutos e tente novamente.',
        accessTitle: 'Acesse seus relatórios',
        accessDesc: 'Insira o email com que comprou e enviaremos um link de acesso ao seu painel.',
        accessEmailPlaceholder: 'Seu email',
        accessSend: 'Enviar o link',
        accessSending: 'Enviando...',
        accessSentTitle: 'Verifique seu email',
        accessSentDesc: 'Se você tem compras com esse email, enviamos um link para acessar seu painel.',
    },
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export const OnePanel: React.FC = () => {
    const { lang } = useLang();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const t = T[lang as keyof typeof T] ?? T.es;

    const [data, setData] = useState<PanelData | null>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'not_found' | 'not_paid' | 'confirming' | 'need_email' | 'access_sent'>('loading');
    const [modal, setModal] = useState<string | null>(null); // link_id for modal
    const [modalEmail, setModalEmail] = useState('');
    const [modalName, setModalName] = useState('');
    const [modalSport, setModalSport] = useState('');
    const [modalSportCustom, setModalSportCustom] = useState('');
    const [sending, setSending] = useState(false);
    const [accessEmail, setAccessEmail] = useState('');
    const [requesting, setRequesting] = useState(false);

    const lastSport = t.sports[t.sports.length - 1];
    const sportFinal = modalSport === lastSport ? modalSportCustom.trim() : modalSport;
    const [copied, setCopied] = useState<string | null>(null);
    const pollRef = React.useRef<ReturnType<typeof setInterval>>();

    const isSuccess = searchParams.get('success') === '1';

    const fetchData = useCallback(async () => {
        if (!token) { setStatus('need_email'); return; }
        try {
            const res = await fetch(`/api/one-panel?token=${token}`);
            if (res.ok) {
                setData(await res.json());
                setStatus('ok');
                // Stop polling if active
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined; }
            } else if (res.status === 403) {
                // If coming from successful checkout, poll for webhook
                if (isSuccess && status !== 'ok') {
                    setStatus('confirming');
                } else {
                    setStatus('not_paid');
                }
            } else {
                setStatus('not_found');
            }
        } catch { setStatus('not_found'); }
    }, [token, isSuccess, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Poll when confirming payment (waiting for webhook)
    useEffect(() => {
        if (status === 'confirming' && !pollRef.current) {
            let attempts = 0;
            pollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const res = await fetch(`/api/one-panel?token=${token}`);
                    if (res.ok) {
                        setData(await res.json());
                        setStatus('ok');
                        clearInterval(pollRef.current!);
                        pollRef.current = undefined;
                    } else if (attempts >= 15) { // 30 seconds max
                        setStatus('not_paid');
                        clearInterval(pollRef.current!);
                        pollRef.current = undefined;
                    }
                } catch { /* keep polling */ }
            }, 2000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [status, token]);

    const requestAccess = async () => {
        if (!accessEmail.trim() || requesting) return;
        setRequesting(true);
        try {
            await fetch('/api/one-panel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'request-access', email: accessEmail.trim() }),
            });
        } catch { /* ignore — we always show the same confirmation */ }
        setRequesting(false);
        setStatus('access_sent');
    };

    const handleGenerate = async () => {
        if (!modal || !modalEmail || !sportFinal) return;
        setSending(true);
        await fetch(`/api/one-panel?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-link', link_id: modal, recipient_email: modalEmail, child_name: modalName, sport: sportFinal }),
        });
        setSending(false);
        setModal(null);
        setModalEmail('');
        setModalName('');
        setModalSport('');
        setModalSportCustom('');
        fetchData();
    };

    const handleCopy = (slug: string) => {
        const url = `${window.location.origin}/one/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2000);
    };

    if (status === 'loading' || status === 'confirming') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-argo-neutral">
                <div className="flex items-center justify-center gap-1.5 mb-8">
                    <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}> One</span>
                    </span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin mb-4" />
                {status === 'confirming' && (
                    <div className="text-center" style={{ maxWidth: '320px' }}>
                        <p className="text-base font-semibold text-argo-navy mb-2">
                            {lang === 'en' ? 'We received your payment' : lang === 'pt' ? 'Recebemos seu pagamento' : 'Recibimos tu pago'}
                        </p>
                        <p className="text-sm text-argo-grey leading-relaxed">
                            {lang === 'en'
                                ? 'We are confirming your purchase. When it\'s ready, we\'ll send you an email and this page will update automatically.'
                                : lang === 'pt'
                                    ? 'Estamos confirmando sua compra. Quando estiver pronto, enviaremos um email e esta página será atualizada automaticamente.'
                                    : 'Estamos confirmando tu compra. Cuando esté listo, te enviaremos un email y esta página se actualizará automáticamente.'}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'need_email' || status === 'access_sent') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-argo-neutral">
                <div className="w-full max-w-sm">
                    <div className="flex items-center justify-center gap-1.5 mb-8">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}> One</span>
                        </span>
                    </div>
                    {status === 'access_sent' ? (
                        <div className="text-center">
                            <h2 className="text-xl font-light text-argo-navy mb-3">{t.accessSentTitle}</h2>
                            <p className="text-sm text-argo-grey">{t.accessSentDesc}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[14px] shadow-argo px-6 py-7">
                            <h2 className="text-lg font-semibold text-argo-navy mb-1.5 text-center">{t.accessTitle}</h2>
                            <p className="text-[13px] text-argo-grey mb-5 text-center leading-relaxed">{t.accessDesc}</p>
                            <input
                                type="email"
                                placeholder={t.accessEmailPlaceholder}
                                value={accessEmail}
                                onChange={e => setAccessEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && requestAccess()}
                                className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                            />
                            <button
                                onClick={requestAccess}
                                disabled={requesting || !accessEmail.trim()}
                                className="w-full py-3 rounded-xl text-sm font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-50"
                            >
                                {requesting ? t.accessSending : t.accessSend}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'not_found' || status === 'not_paid') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-argo-neutral">
                <div style={{ maxWidth: '360px' }}>
                    <div className="flex items-center justify-center gap-1.5 mb-8">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}> One</span>
                        </span>
                    </div>
                    <h2 className="text-xl font-light text-argo-navy mb-3">{status === 'not_found' ? t.notFound : t.notPaid}</h2>
                    <p className="text-sm text-argo-grey">{status === 'not_found' ? t.notFoundDesc : t.notPaidDesc}</p>
                </div>
            </div>
        );
    }

    const { purchase, links, summary } = data!;
    const completedPct = (summary.completed / summary.total) * 100;

    const statusColor = (s: string) => s === 'completed' ? '#22C55E' : s === 'pending' || s === 'sent' ? '#F59E0B' : '#D2D2D7';

    return (
        <div className="min-h-screen bg-argo-neutral">
            <div className="max-w-[560px] mx-auto px-5 py-12">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-1.5">
                        <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 300 }}> One</span>
                        </span>
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-[22px] font-light text-argo-navy tracking-tight mb-1.5">{t.title}</h1>
                    <p className="text-[13px] text-argo-grey">
                        <span className="font-semibold text-argo-secondary">{purchase.email}</span> · {t.pack(purchase.pack_size)}
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2.5 mb-6 px-1">
                    <div className="flex-1 h-1 rounded-full bg-argo-border overflow-hidden">
                        <div className="h-full rounded-full bg-argo-violet-500 transition-all" style={{ width: `${completedPct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-argo-grey whitespace-nowrap">{t.used(summary.completed, summary.total)}</span>
                </div>

                {/* Slots */}
                <div className="space-y-3 mb-8">
                    {links.map(link => (
                        <motion.div
                            key={link.id}
                            layout
                            className={`bg-white rounded-[14px] shadow-argo px-5 py-4 flex items-center gap-4 ${link.status === 'completed' ? 'opacity-80' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-[10px] border flex items-center justify-center flex-shrink-0"
                                 style={{ borderColor: `${statusColor(link.status)}40`, background: `${statusColor(link.status)}10` }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(link.status) }} />
                            </div>

                            <div className="flex-1 min-w-0">
                                {link.status === 'completed' && (
                                    <>
                                        <p className="text-sm font-semibold text-argo-navy truncate">{link.child_name || t.completed}</p>
                                        <p className="text-xs text-argo-grey">{link.sport ? `${link.sport} · ` : ''}{t.completed}{link.completed_at ? ` · ${new Date(link.completed_at).toLocaleDateString()}` : ''}</p>
                                    </>
                                )}
                                {(link.status === 'sent' || link.status === 'pending') && (
                                    <>
                                        <p className="text-sm font-semibold text-argo-navy">{link.child_name || t.sent}</p>
                                        <p className="text-xs text-argo-grey">{t.sentTo} <span className="text-argo-violet-500">{link.recipient_email}</span> · {link.sport ? `${link.sport} · ` : ''}{t.pending}</p>
                                    </>
                                )}
                                {link.status === 'available' && (
                                    <>
                                        <p className="text-sm font-semibold text-argo-navy">{t.available}</p>
                                        <p className="text-xs text-argo-grey">{t.availableDesc}</p>
                                    </>
                                )}
                            </div>

                            <div className="flex-shrink-0">
                                {link.status === 'completed' && link.session_id && (
                                    <Link
                                        to={`/report/${link.session_id}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                    >
                                        <ExternalLink size={12} /> {t.viewReport}
                                    </Link>
                                )}
                                {(link.status === 'sent' || link.status === 'pending') && (
                                    <button
                                        onClick={() => handleCopy(link.slug)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-argo-border text-argo-secondary hover:border-argo-violet-300 transition-colors"
                                    >
                                        {copied === link.slug ? <><Check size={12} /> {t.copied}</> : <><Copy size={12} /> {t.copyLink}</>}
                                    </button>
                                )}
                                {link.status === 'available' && (
                                    <button
                                        onClick={() => { setModal(link.id); setModalEmail(''); setModalName(''); setModalSport(''); setModalSportCustom(''); }}
                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors"
                                    >
                                        {t.generateLink}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Buy more reports */}
                <div className="text-center mb-8">
                    <Link
                        to="/one"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg text-[13px] font-semibold border border-argo-border text-argo-secondary hover:border-argo-violet-300 transition-colors"
                    >
                        {t.buyMore}
                    </Link>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-[14px] shadow-argo px-5 py-5 mb-8">
                    <p className="text-[13px] font-semibold text-argo-navy mb-3">{t.howTitle}</p>
                    {[t.how1, t.how2, t.how3, t.how4].map((step, i) => (
                        <p key={i} className="text-xs text-argo-grey leading-relaxed mb-2 last:mb-0">
                            <strong className="text-argo-secondary">{i + 1}.</strong> {step}
                        </p>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t border-argo-border">
                    <p className="text-[11px] text-argo-light">
                        <Link to="/privacy" className="underline hover:text-argo-grey transition-colors">Privacy</Link>
                        {' · '}
                        <Link to="/terms" className="underline hover:text-argo-grey transition-colors">Terms</Link>
                        {' · '}
                        <a href="mailto:hola@argomethod.com" className="underline hover:text-argo-grey transition-colors">Help</a>
                    </p>
                </div>
            </div>

            {/* Generate link modal */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
                        onClick={() => setModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex items-start justify-between mb-1">
                                <h3 className="text-base font-semibold text-argo-navy">{t.modalTitle}</h3>
                                <button onClick={() => setModal(null)} className="text-argo-light hover:text-argo-grey transition-colors -mr-1">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-[13px] text-argo-grey mb-5">{t.modalDesc}</p>
                            <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                value={modalEmail}
                                onChange={e => setModalEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                            />
                            <input
                                type="text"
                                placeholder={t.namePlaceholder}
                                value={modalName}
                                onChange={e => setModalName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                            />
                            <select
                                value={modalSport}
                                onChange={e => setModalSport(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border border-argo-border text-sm focus:outline-none focus:ring-2 focus:ring-argo-violet-300 ${modalSport ? 'text-argo-navy' : 'text-argo-light'} ${modalSport === lastSport ? 'mb-3' : 'mb-5'}`}
                            >
                                <option value="">{t.sportSelect}</option>
                                {t.sports.map(d => <option key={d} value={d} className="text-argo-navy">{d}</option>)}
                            </select>
                            {modalSport === lastSport && (
                                <input
                                    type="text"
                                    placeholder={t.sportOtherPlaceholder}
                                    value={modalSportCustom}
                                    onChange={e => setModalSportCustom(e.target.value)}
                                    autoFocus
                                    className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-5"
                                />
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModal(null)}
                                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold border border-argo-border text-argo-grey hover:text-argo-navy transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={sending || !modalEmail || !sportFinal}
                                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-50"
                                >
                                    {sending ? '...' : t.generateAndSend}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
