import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useLang } from '../context/LangContext';

/* ── i18n ──────────────────────────────────────────────────────────────────── */

const T = {
    es: {
        title: 'Planes y precios',
        subtitle: 'Herramientas de perfilamiento conductual para acompañar a tus deportistas. Elige el plan que se ajusta a tu realidad.',
        monthly: 'Mensual',
        annual: 'Anual',
        save: 'Ahorra hasta 21%',
        year: 'año',
        month: 'mes',
        billedAnnually: 'facturado anualmente',
        trialTitle: 'Comienza con 14 días gratis',
        trialDesc: 'Dashboard completo, 8 deportistas, Argo Coach. Sin tarjeta de crédito.',
        startTrial: 'Comenzar trial gratuito',
        contactSales: 'Contactar ventas',
        familiesLabel: 'Padres y familias',
        familiesTitle: 'ArgoOne®',
        familiesDesc: 'El niño juega una aventura de 10 minutos y recibes un informe personalizado con su perfil conductual, palabras clave para comunicarte mejor, y orientaciones concretas para acompañarlo. Sin suscripción, sin crear cuenta.',
        buyCta: 'Comprar',
        buyModalTitle: 'Comprar ArgoOne®',
        buyModalDesc: 'Ingresa tu email. Te llevamos al pago y después recibes el link para que el niño juegue y para crear tu puente.',
        buyEmailPlaceholder: 'Tu email',
        buyConsent: 'Acepto los términos.',
        buyGo: 'Ir al pago',
        buyCancel: 'Cancelar',
        buyError: 'Algo salió mal. Intenta de nuevo.',
        report: 'informe',
        reports: 'informes',
        perReport: 'por informe',
        backHome: 'Volver al inicio',
        features: {
            players: (n: number) => `Hasta ${n} jugadores activos`,
            playersUnlimited: 'Jugadores ilimitados',
            reprofile: 'Re-perfilamiento cada 6 meses',
            included: 'incluido',
            unlimited: 'ilimitado',
            groups: 'Planteles y grupos ilimitados',
            ai: 'Argo Coach',
            guide: 'Predictor Conductual completo',
            words: 'Palabras puente y checklist',
            dashboard: 'Dashboard completo',
            dashboardApi: 'Dashboard completo + API',
            priority: 'Soporte prioritario',
            custom: 'Integraciones custom',
            onboarding: 'Onboarding asistido',
            dedicated: 'Soporte dedicado',
        },
    },
    en: {
        title: 'Plans & pricing',
        subtitle: 'Behavioral profiling tools to support your athletes. Choose the plan that fits your reality.',
        monthly: 'Monthly',
        annual: 'Annual',
        save: 'Save up to 21%',
        year: 'year',
        month: 'month',
        billedAnnually: 'billed annually',
        trialTitle: 'Start with 14 free days',
        trialDesc: '8 athletes, dashboard with limited features, AI consultant (10 queries). No credit card required.',
        startTrial: 'Start free trial',
        contactSales: 'Contact sales',
        familiesLabel: 'Parents & families',
        familiesTitle: 'ArgoOne®',
        familiesDesc: 'The child plays a 10-minute adventure and you receive a personalized report with their behavioral profile, key communication phrases, and concrete guidance. No subscription, no account needed.',
        buyCta: 'Buy',
        buyModalTitle: 'Buy ArgoOne®',
        buyModalDesc: 'Enter your email. We take you to payment, then you receive the link for the child to play and to create your bridge.',
        buyEmailPlaceholder: 'Your email',
        buyConsent: 'I accept the terms.',
        buyGo: 'Go to payment',
        buyCancel: 'Cancel',
        buyError: 'Something went wrong. Try again.',
        report: 'report',
        reports: 'reports',
        perReport: 'per report',
        backHome: 'Back to home',
        features: {
            players: (n: number) => `Up to ${n} active players`,
            playersUnlimited: 'Unlimited players',
            reprofile: 'Re-profiling every 6 months',
            included: 'included',
            unlimited: 'unlimited',
            groups: 'Unlimited teams and groups',
            ai: 'Argo Coach',
            guide: 'Full Behavioral Predictor',
            words: 'Bridge words & checklist',
            dashboard: 'Full dashboard',
            dashboardApi: 'Full dashboard + API',
            priority: 'Priority support',
            custom: 'Custom integrations',
            onboarding: 'Assisted onboarding',
            dedicated: 'Dedicated support',
        },
    },
    pt: {
        title: 'Planos e preços',
        subtitle: 'Ferramentas de perfilamento comportamental para acompanhar seus atletas. Escolha o plano que se adapta à sua realidade.',
        monthly: 'Mensal',
        annual: 'Anual',
        save: 'Economize até 21%',
        year: 'ano',
        month: 'mês',
        billedAnnually: 'cobrado anualmente',
        trialTitle: 'Comece com 14 dias grátis',
        trialDesc: 'Dashboard completo, 8 atletas, Argo Coach. Sem cartão de crédito.',
        startTrial: 'Começar trial gratuito',
        contactSales: 'Contatar vendas',
        familiesLabel: 'Pais e famílias',
        familiesTitle: 'ArgoOne®',
        familiesDesc: 'A criança joga uma aventura de 10 minutos e você recebe um relatório personalizado com o perfil comportamental, palavras-chave para se comunicar melhor e orientações concretas. Sem assinatura, sem criar conta.',
        buyCta: 'Comprar',
        buyModalTitle: 'Comprar ArgoOne®',
        buyModalDesc: 'Insira seu email. Levamos você ao pagamento e depois você recebe o link para a criança jogar e para criar sua ponte.',
        buyEmailPlaceholder: 'Seu email',
        buyConsent: 'Aceito os termos.',
        buyGo: 'Ir ao pagamento',
        buyCancel: 'Cancelar',
        buyError: 'Algo deu errado. Tente de novo.',
        report: 'relatório',
        reports: 'relatórios',
        perReport: 'por relatório',
        backHome: 'Voltar ao início',
        features: {
            players: (n: number) => `Até ${n} jogadores ativos`,
            playersUnlimited: 'Jogadores ilimitados',
            reprofile: 'Re-perfilamento a cada 6 meses',
            included: 'incluído',
            unlimited: 'ilimitado',
            groups: 'Plantéis e grupos ilimitados',
            ai: 'Argo Coach',
            guide: 'Preditor Comportamental completo',
            words: 'Palavras-ponte e checklist',
            dashboard: 'Dashboard completo',
            dashboardApi: 'Dashboard completo + API',
            priority: 'Suporte prioritário',
            custom: 'Integrações custom',
            onboarding: 'Onboarding assistido',
            dedicated: 'Suporte dedicado',
        },
    },
};

/* ── Sub-components ────────────────────────────────────────────────────────── */

const FeatureRow: React.FC<{ label: string; sub?: string }> = ({ label, sub }) => (
    <li className="flex items-start gap-2 py-2 border-b border-argo-bg last:border-b-0">
        <Check size={14} className="text-argo-violet-500 flex-shrink-0 mt-0.5" />
        <span className="text-[13px] text-argo-secondary">
            {label}{sub && <span className="text-argo-light"> ({sub})</span>}
        </span>
    </li>
);

/* ── Page ──────────────────────────────────────────────────────────────────── */

export const PricingPage: React.FC = () => {
    const { lang } = useLang();
    const [annual, setAnnual] = useState(true);
    const t = T[lang as keyof typeof T] ?? T.es;

    // ArgoOne fusion (F4): the families card sells the single $12.99 ArgoOne®
    // (informe del niño + Puente incluido) and a small email modal goes straight
    // to Stripe. The old two-tier scheme ($9.99 / ArgoOne+®) is retired.
    const [buyOpen, setBuyOpen] = useState(false);
    const [buyEmail, setBuyEmail] = useState('');
    const [buyConsent, setBuyConsent] = useState(false);
    const [buyLoading, setBuyLoading] = useState(false);
    const [buyErr, setBuyErr] = useState('');
    const startBuy = async () => {
        if (!buyEmail.trim() || !buyConsent || buyLoading) return;
        setBuyLoading(true); setBuyErr('');
        try {
            const res = await fetch('/api/one-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: buyEmail.trim(), kind: 'one_puente', lang }),
            });
            const j = await res.json();
            if (j.checkout_url) { window.location.href = j.checkout_url; return; }
            setBuyErr(t.buyError); setBuyLoading(false);
        } catch { setBuyErr(t.buyError); setBuyLoading(false); }
    };
    const f = t.features;

    return (
        <div className="min-h-screen bg-argo-neutral">
            <div className="max-w-[960px] mx-auto px-6 py-16">

                {/* Logo */}
                <Link to="/" className="inline-flex items-center gap-1.5 mb-12">
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}>Method®</span>
                    </span>
                </Link>

                {/* Header */}
                <h1 className="text-[32px] font-light text-argo-navy tracking-tight leading-tight mb-2">{t.title}</h1>
                <p className="text-[15px] text-argo-grey leading-relaxed max-w-[520px] mb-8">{t.subtitle}</p>

                {/* Toggle */}
                <div className="flex items-center gap-3 mb-6">
                    <span className={`text-[13px] font-medium ${!annual ? 'text-argo-navy' : 'text-argo-grey'}`}>{t.monthly}</span>
                    <button
                        onClick={() => setAnnual(v => !v)}
                        className={`w-11 h-6 rounded-full relative transition-colors ${annual ? 'bg-argo-violet-500' : 'bg-argo-border'}`}
                    >
                        <span className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-all ${annual ? 'right-[2px]' : 'left-[2px]'}`} />
                    </button>
                    <span className={`text-[13px] font-medium ${annual ? 'text-argo-navy' : 'text-argo-grey'}`}>{t.annual}</span>
                    {annual && (
                        <span className="text-[11px] font-bold text-white bg-argo-violet-500 px-2.5 py-1 rounded-full">{t.save}</span>
                    )}
                </div>

                {/* Trial callout */}
                <div className="bg-argo-violet-50 border border-argo-violet-100 rounded-xl px-5 py-3.5 text-center mb-8">
                    <p className="text-sm font-semibold text-argo-violet-500">{t.trialTitle}</p>
                    <p className="text-xs text-argo-grey mt-0.5">{t.trialDesc}</p>
                </div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">

                    {/* PRO */}
                    <div className="bg-white rounded-[16px] shadow-argo p-7 flex flex-col">
                        <p className="text-[11px] font-bold text-argo-violet-500 uppercase tracking-[0.08em] mb-2">PRO</p>
                        <div className="mb-1">
                            <span className="text-[34px] font-bold text-argo-navy tracking-tight">{annual ? '$40' : '$49'}</span>
                            <span className="text-sm text-argo-grey ml-1">/ {t.month}</span>
                        </div>
                        {annual && (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[13px] text-argo-light line-through">$49/{t.month}</span>
                                    <span className="text-[11px] font-bold text-argo-violet-500 bg-argo-violet-50 px-2 py-0.5 rounded-md">{t.save}</span>
                                </div>
                                <p className="text-[11px] text-argo-light mb-4">{t.billedAnnually} ($480/{t.year})</p>
                            </>
                        )}
                        {!annual && <div className="mb-4" />}
                        <ul className="flex-1 mb-6">
                            <FeatureRow label={f.players(50)} />
                            <FeatureRow label={f.reprofile} sub={f.included} />
                            <FeatureRow label={f.groups} />
                            <FeatureRow label={f.ai} sub={f.included} />
                            <FeatureRow label={f.guide} />
                            <FeatureRow label={f.words} />
                            <FeatureRow label={f.dashboard} />
                        </ul>
                        <Link
                            to="/signup"
                            className="block w-full py-3 rounded-xl text-[13px] font-semibold border border-argo-border text-argo-navy hover:border-argo-violet-300 hover:text-argo-violet-500 transition-colors text-center"
                        >
                            {t.startTrial}
                        </Link>
                    </div>

                    {/* ACADEMY */}
                    <div className="bg-white rounded-[16px] shadow-argo p-7 flex flex-col relative border-2 border-argo-violet-500">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-argo-violet-500 text-white text-[10px] font-bold px-3.5 py-1 rounded-full tracking-wide whitespace-nowrap">
                            {lang === 'en' ? 'Most popular' : lang === 'pt' ? 'Mais popular' : 'Más popular'}
                        </span>
                        <p className="text-[11px] font-bold text-argo-violet-500 uppercase tracking-[0.08em] mb-2">Academy</p>
                        <div className="mb-1">
                            <span className="text-[34px] font-bold text-argo-navy tracking-tight">{annual ? '$70' : '$89'}</span>
                            <span className="text-sm text-argo-grey ml-1">/ {t.month}</span>
                        </div>
                        {annual && (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[13px] text-argo-light line-through">$89/{t.month}</span>
                                    <span className="text-[11px] font-bold text-argo-violet-500 bg-argo-violet-50 px-2 py-0.5 rounded-md">{t.save}</span>
                                </div>
                                <p className="text-[11px] text-argo-light mb-4">{t.billedAnnually} ($840/{t.year})</p>
                            </>
                        )}
                        {!annual && <div className="mb-4" />}
                        <ul className="flex-1 mb-6">
                            <FeatureRow label={f.players(100)} />
                            <FeatureRow label={f.reprofile} sub={f.included} />
                            <FeatureRow label={f.groups} />
                            <FeatureRow label={f.ai} sub={f.included} />
                            <FeatureRow label={f.guide} />
                            <FeatureRow label={f.words} />
                            <FeatureRow label={f.dashboard} />
                            <FeatureRow label={f.priority} />
                        </ul>
                        <Link
                            to="/signup"
                            className="block w-full py-3 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors text-center shadow-lg shadow-argo-violet-500/25"
                        >
                            {t.startTrial}
                        </Link>
                    </div>

                    {/* ENTERPRISE */}
                    <div className="bg-argo-bg rounded-[16px] shadow-argo p-7 flex flex-col">
                        <p className="text-[11px] font-bold text-argo-navy uppercase tracking-[0.08em] mb-2">Enterprise</p>
                        <div className="mb-4">
                            <span className="text-[22px] font-bold text-argo-navy tracking-tight">
                                {lang === 'en' ? 'Custom' : lang === 'pt' ? 'Sob medida' : 'A medida'}
                            </span>
                        </div>
                        <ul className="flex-1 mb-6">
                            <FeatureRow label={f.playersUnlimited} />
                            <FeatureRow label={f.reprofile} sub={f.included} />
                            <FeatureRow label={f.groups} />
                            <FeatureRow label={lang === 'en' ? 'Argo Coach Premium' : lang === 'pt' ? 'Argo Coach Premium' : 'Argo Coach Premium'} sub={lang === 'en' ? 'advanced model' : lang === 'pt' ? 'modelo avançado' : 'modelo avanzado'} />
                            <FeatureRow label={f.dashboardApi} />
                            <FeatureRow label={f.custom} />
                            <FeatureRow label={f.onboarding} />
                            <FeatureRow label={f.dedicated} />
                        </ul>
                        <a
                            href="mailto:hola@argomethod.com"
                            className="block w-full py-3 rounded-xl text-[13px] font-semibold border border-argo-border text-argo-navy hover:border-argo-violet-300 hover:text-argo-violet-500 transition-colors text-center"
                        >
                            {t.contactSales}
                        </a>
                    </div>
                </div>

                {/* Families — compact */}
                <div className="pt-8 border-t border-argo-border mb-12">
                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-3">{t.familiesLabel}</p>
                    <div className="bg-white rounded-[14px] shadow-argo p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                            <p className="text-[15px] font-semibold text-argo-navy mb-1">{t.familiesTitle}</p>
                            <p className="text-[13px] text-argo-grey leading-relaxed">{t.familiesDesc}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                                <p className="text-[15px] font-semibold text-argo-navy">ArgoOne®</p>
                                <p className="text-[13px] font-semibold text-argo-violet-500 mt-0.5">USD 12.99</p>
                            </div>
                            <button
                                onClick={() => { setBuyOpen(true); setBuyEmail(''); setBuyConsent(false); setBuyErr(''); }}
                                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors"
                            >
                                {t.buyCta}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 text-sm text-argo-grey">
                    <Link to="/" className="hover:text-argo-navy transition-colors">{t.backHome}</Link>
                    <span className="text-argo-border">·</span>
                    <Link to="/terms" className="hover:text-argo-navy transition-colors">Terms</Link>
                    <span className="text-argo-border">·</span>
                    <Link to="/privacy" className="hover:text-argo-navy transition-colors">Privacy</Link>
                </div>
            </div>

            {/* F4 — email modal -> Stripe */}
            {buyOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setBuyOpen(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-xl">
                        <h3 className="text-base font-semibold text-argo-navy">{t.buyModalTitle} <span className="text-argo-violet-500">USD 12.99</span></h3>
                        <p className="text-[13px] text-argo-grey mt-1 mb-5 leading-relaxed">{t.buyModalDesc}</p>
                        <input
                            type="email"
                            placeholder={t.buyEmailPlaceholder}
                            value={buyEmail}
                            onChange={e => setBuyEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && startBuy()}
                            className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 mb-3"
                        />
                        <label className="flex items-start gap-2.5 cursor-pointer mb-1">
                            <input type="checkbox" checked={buyConsent} onChange={e => setBuyConsent(e.target.checked)} className="mt-0.5 accent-argo-violet-500" />
                            <span className="text-[13px] text-argo-secondary leading-relaxed">{t.buyConsent}</span>
                        </label>
                        {buyErr && <p className="text-[13px] text-red-600 mt-2">{buyErr}</p>}
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setBuyOpen(false)} className="flex-1 py-3 rounded-xl text-[13px] font-semibold border border-argo-border text-argo-grey hover:text-argo-navy transition-colors">{t.buyCancel}</button>
                            <button onClick={startBuy} disabled={buyLoading || !buyEmail.trim() || !buyConsent} className="flex-1 py-3 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-50">{buyLoading ? '...' : t.buyGo}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
