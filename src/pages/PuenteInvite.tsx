import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card } from '../components/ui';
import { CouponField, type AppliedCoupon } from '../components/CouponField';
import { AXIS_COLORS } from '../lib/designTokens';
import { useLang } from '../context/LangContext';
import type { Lang } from '../types/puentes';

const BASE_CENTS = 499; // ArgoPuente® $4.99
const fmtUsd = (cents: number) => `USD ${(cents / 100).toFixed(2)}`;

/**
 * F8 — /puente/invite/:token
 * An adult invited by a child's responsible adult lands here to create their own
 * ArgoPuente® ($4.99). The invite (B14) authorizes the purchase, so the email is
 * PRE-FILLED and LOCKED to the invited address (debt #4: any other email 403s the
 * checkout gate). Behind VITE_BRIDGES_V2; the invite bypass in puentes-checkout is
 * additionally gated by PUENTES_ADDON_V2.
 */

interface InviteData {
    perfilamiento_id: string;
    invited_email: string;
    child_name: string | null;
    child_age: number | null;
    sport: string | null;
    eje: string | null;
    archetype_label: string | null;
    lang: string;
}

const T = {
    es: {
        eyebrow: 'ArgoPuente® · Te invitaron',
        title: (n: string) => `Tu puente con ${n}`,
        body: (n: string) => `Un adulto que acompaña a ${n} te invitó a crear tu propio puente: una lectura breve de cómo conectas con ${n}, a partir de tu propio estilo. Responde un cuestionario corto (5 a 7 minutos) y obtienes tu informe puente.`,
        emailLabel: 'Tu email (el de la invitación)',
        consent: 'Acepto los términos y entiendo que este informe no es un servicio clínico ni terapéutico.',
        cta: 'Continuar al pago',
        price: 'USD 4.99',
        loading: 'Cargando…',
        invalid: 'Esta invitación no es válida o expiró.',
        invalidDesc: 'Pídele al adulto que te invitó que la genere de nuevo desde su panel.',
        error: 'Algo salió mal. Intenta de nuevo.',
    },
    en: {
        eyebrow: 'ArgoPuente® · You were invited',
        title: (n: string) => `Your bridge with ${n}`,
        body: (n: string) => `An adult who accompanies ${n} invited you to create your own bridge: a short reading of how you connect with ${n}, built from your own style. Answer a short questionnaire (5 to 7 minutes) and get your bridge report.`,
        emailLabel: 'Your email (the invited one)',
        consent: 'I accept the terms and understand this report is not a clinical or therapeutic service.',
        cta: 'Continue to payment',
        price: 'USD 4.99',
        loading: 'Loading…',
        invalid: 'This invitation is not valid or has expired.',
        invalidDesc: 'Ask the adult who invited you to generate it again from their panel.',
        error: 'Something went wrong. Try again.',
    },
    pt: {
        eyebrow: 'ArgoPuente® · Você foi convidado',
        title: (n: string) => `Sua ponte com ${n}`,
        body: (n: string) => `Um adulto que acompanha ${n} convidou você a criar sua própria ponte: uma leitura breve de como você se conecta com ${n}, a partir do seu próprio estilo. Responda um questionário curto (5 a 7 minutos) e obtenha seu relatório de ponte.`,
        emailLabel: 'Seu email (o do convite)',
        consent: 'Aceito os termos e entendo que este relatório não é um serviço clínico ou terapêutico.',
        cta: 'Continuar para o pagamento',
        price: 'USD 4.99',
        loading: 'Carregando…',
        invalid: 'Este convite não é válido ou expirou.',
        invalidDesc: 'Peça ao adulto que convidou você para gerá-lo de novo no painel dele.',
        error: 'Algo deu errado. Tente de novo.',
    },
};

export default function PuenteInvite() {
    const { token } = useParams<{ token: string }>();
    const { lang } = useLang();
    const [status, setStatus] = useState<'loading' | 'ok' | 'invalid'>('loading');
    const [data, setData] = useState<InviteData | null>(null);
    const [consent, setConsent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
    const totalCents = coupon ? coupon.discountedCents : BASE_CENTS;

    useEffect(() => {
        if (!token) { setStatus('invalid'); return; }
        // DEV preview: /puente/invite/demo renders a sample offer (no API under Vite).
        // Mirrors the real post-cut payload: pre-payment the endpoint ships ONLY the
        // child's first name (age/sport/eje/archetype are null until onboarding+pago).
        if (import.meta.env.DEV && token === 'demo') {
            setData({ perfilamiento_id: 'demo', invited_email: 'abuela@ejemplo.com', child_name: 'Juan', child_age: null, sport: null, eje: null, archetype_label: null, lang: 'es' });
            setStatus('ok');
            return;
        }
        (async () => {
            try {
                const res = await fetch('/api/bridge-invite-accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invite_token: token }),
                });
                if (!res.ok) { setStatus('invalid'); return; }
                setData(await res.json());
                setStatus('ok');
            } catch { setStatus('invalid'); }
        })();
    }, [token]);

    const t = T[(lang as Lang)] ?? T.es;

    const submit = async () => {
        if (!data || !consent || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/puentes-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invite_token: token,
                    source_session_id: data.perfilamiento_id,
                    recipient_email: data.invited_email,  // locked to the invite (debt #4)
                    consent_given: consent,
                    lang,
                    coupon_code: coupon?.code,
                }),
            });
            const j = await res.json();
            if (res.status === 409 && j.existing_magic_link) { window.location.href = j.existing_magic_link; return; }
            if (j.error === 'invalid_coupon') { setError(lang === 'en' ? 'The coupon is no longer valid. Remove it and try again.' : lang === 'pt' ? 'O cupom não é mais válido. Remova-o e tente de novo.' : 'El cupón dejó de ser válido. Quítalo e intenta de nuevo.'); setSubmitting(false); return; }
            // A 403 here is permanent (invite no longer valid / expired between
            // render and submit), not a transient error — send them to the
            // non-retryable invalid screen instead of a "try again" prompt.
            if (res.status === 403) { setStatus('invalid'); return; }
            if (!res.ok || !j.checkout_url) { setError(t.error); setSubmitting(false); return; }
            window.location.href = j.checkout_url;
        } catch { setError(t.error); setSubmitting(false); }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-argo-neutral"><p className="text-argo-grey text-sm">{t.loading}</p></div>;
    }
    if (status === 'invalid' || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral px-4 text-center">
                <div className="max-w-sm">
                    <p className="text-xl font-light text-argo-navy mb-3">{t.invalid}</p>
                    <p className="text-sm text-argo-grey">{t.invalidDesc}</p>
                </div>
            </div>
        );
    }

    const name = data.child_name || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
    const meta = [data.child_age ? `${data.child_age}` : null, data.sport].filter(Boolean).join(' · ');

    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
                <Card padding="lg">
                    <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-3 font-semibold">{t.eyebrow}</p>
                    <h1 className="text-3xl font-bold tracking-tight text-argo-navy">{t.title(name)}</h1>

                    <div className="mt-5 flex items-center gap-3 p-3 rounded-[14px] bg-argo-bg border border-argo-border">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg text-white" style={{ background: data.eje ? AXIS_COLORS[data.eje] : '#AEAEB2' }}>
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-bold text-argo-navy truncate">{name}{meta ? <span className="text-argo-grey font-normal">  ·  {meta}</span> : null}</p>
                            {data.archetype_label && <p className="text-sm text-argo-secondary truncate">{data.archetype_label}</p>}
                        </div>
                    </div>

                    <p className="mt-5 text-argo-secondary text-base leading-relaxed">{t.body(name)}</p>

                    <div className="mt-6">
                        <label className="block text-xs font-semibold tracking-[0.14em] uppercase text-argo-grey mb-1.5">{t.emailLabel}</label>
                        <input type="email" value={data.invited_email} readOnly disabled className="w-full px-4 py-3 rounded-xl border border-argo-border bg-argo-neutral text-sm text-argo-secondary" />
                    </div>

                    <CouponField
                        product="puente"
                        baseCents={BASE_CENTS}
                        lang={(lang as 'es' | 'en' | 'pt')}
                        onChange={setCoupon}
                        className="mt-4"
                    />

                    <label className="mt-5 flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-argo-violet-500" />
                        <span className="text-sm text-argo-secondary leading-relaxed">{t.consent}</span>
                    </label>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                    <div className="mt-6">
                        <Button variant="violet" size="lg" onClick={submit} disabled={!consent || submitting}>
                            {t.cta} <span className="ml-1.5 text-sm font-bold opacity-90">{fmtUsd(totalCents)}</span>
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
