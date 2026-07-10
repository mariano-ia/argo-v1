import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card } from '../components/ui';
import { useLang } from '../context/LangContext';
import type { Lang } from '../types/puentes';

/**
 * Fase 1 — /puente/:token (frozen model, docs/ARGOONE-DECISIONES.md §4)
 * The child's ONE shareable bridges-link. The authorizing adult shares it as
 * many times as they want; ANY adult who opens it onboards here (name + email
 * + terms), pays their own USD 4.99 (Stripe, email pre-filled) and gets ONLY
 * their bridge report by email, on a permanent link. Never the child's
 * individual report — that is what makes the link safely re-shareable.
 *
 * Pre-payment the page knows ONLY the child's first name (bridge-link-resolve).
 * Behind VITE_BRIDGES_V2 (the resolve endpoint 404s while the flag is off).
 */

interface LinkData {
    child_first_name: string | null;
    lang: string;
}

const T = {
    es: {
        eyebrow: 'ArgoPuente® · Te compartieron un link',
        title: (n: string) => `Tu puente con ${n}`,
        body: (n: string) => `Un adulto que acompaña a ${n} te compartió este link para que tengas tu propio puente: una lectura breve de cómo conectas tú con ${n}, hecha a partir de tu propio estilo. Respondes un cuestionario corto (5 a 7 minutos) y recibes tu informe puente por email, en un enlace que no vence.`,
        note: (n: string) => `Tu puente es solo tuyo. El informe individual de ${n} no se incluye: lo tiene el adulto que lo autorizó.`,
        nameLabel: 'Tu nombre',
        namePlaceholder: 'Como quieres aparecer en tu informe',
        emailLabel: 'Tu email',
        emailPlaceholder: 'Aquí llega tu informe puente',
        consentPre: 'Acepto los ',
        consentLink: 'términos',
        consentPost: ' y entiendo que este informe no es un servicio clínico ni terapéutico.',
        cta: 'Continuar al pago',
        price: 'USD 4.99',
        loading: 'Cargando…',
        invalid: 'Este link no es válido o fue renovado.',
        invalidDesc: 'Pide al adulto que te lo compartió que te envíe el link vigente.',
        retry: 'No pudimos cargar. Reintenta.',
        retryCta: 'Reintentar',
        emailInvalid: 'Revisa tu email.',
        alreadyHasBridge: 'Ese email ya tiene su puente con este niño. Te reenviamos el enlace a tu correo.',
        error: 'Algo salió mal. Intenta de nuevo.',
    },
    en: {
        eyebrow: 'ArgoPuente® · Someone shared a link with you',
        title: (n: string) => `Your bridge with ${n}`,
        body: (n: string) => `An adult who accompanies ${n} shared this link so you can have your own bridge: a short reading of how you connect with ${n}, built from your own style. You answer a short questionnaire (5 to 7 minutes) and receive your bridge report by email, on a link that never expires.`,
        note: (n: string) => `Your bridge is yours alone. ${n}'s individual report is not included: it belongs to the adult who authorized them.`,
        nameLabel: 'Your name',
        namePlaceholder: 'How you want to appear on your report',
        emailLabel: 'Your email',
        emailPlaceholder: 'Your bridge report arrives here',
        consentPre: 'I accept the ',
        consentLink: 'terms',
        consentPost: ' and understand this report is not a clinical or therapeutic service.',
        cta: 'Continue to payment',
        price: 'USD 4.99',
        loading: 'Loading…',
        invalid: 'This link is not valid or was renewed.',
        invalidDesc: 'Ask the adult who shared it to send you the current link.',
        retry: "We couldn't load. Try again.",
        retryCta: 'Retry',
        emailInvalid: 'Check your email.',
        alreadyHasBridge: 'That email already has its bridge with this child. We re-sent the link to your inbox.',
        error: 'Something went wrong. Try again.',
    },
    pt: {
        eyebrow: 'ArgoPuente® · Compartilharam um link com você',
        title: (n: string) => `Sua ponte com ${n}`,
        body: (n: string) => `Um adulto que acompanha ${n} compartilhou este link para que você tenha a sua própria ponte: uma leitura breve de como você se conecta com ${n}, feita a partir do seu próprio estilo. Você responde um questionário curto (5 a 7 minutos) e recebe seu relatório de ponte por email, em um link que não vence.`,
        note: (n: string) => `A sua ponte é só sua. O relatório individual de ${n} não está incluído: ele pertence ao adulto que autorizou.`,
        nameLabel: 'Seu nome',
        namePlaceholder: 'Como você quer aparecer no seu relatório',
        emailLabel: 'Seu email',
        emailPlaceholder: 'Seu relatório de ponte chega aqui',
        consentPre: 'Aceito os ',
        consentLink: 'termos',
        consentPost: ' e entendo que este relatório não é um serviço clínico ou terapêutico.',
        cta: 'Continuar para o pagamento',
        price: 'USD 4.99',
        loading: 'Carregando…',
        invalid: 'Este link não é válido ou foi renovado.',
        invalidDesc: 'Peça ao adulto que compartilhou para enviar o link vigente.',
        retry: 'Não conseguimos carregar. Tente de novo.',
        retryCta: 'Tentar de novo',
        emailInvalid: 'Verifique seu email.',
        alreadyHasBridge: 'Esse email já tem a sua ponte com esta criança. Reenviamos o link para o seu correio.',
        error: 'Algo deu errado. Tente de novo.',
    },
};

export default function PuenteLink() {
    const { token } = useParams<{ token: string }>();
    const { lang } = useLang();
    const [status, setStatus] = useState<'loading' | 'ok' | 'invalid' | 'retry'>('loading');
    const [data, setData] = useState<LinkData | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!token) { setStatus('invalid'); return; }
        // DEV preview: /puente/demo renders the onboarding with sample data.
        if (import.meta.env.DEV && token === 'demo') {
            setData({ child_first_name: 'Juan', lang: 'es' });
            setStatus('ok');
            return;
        }
        let alive = true;
        (async () => {
            try {
                const res = await fetch('/api/bridge-link-resolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ link_token: token }),
                });
                if (!alive) return;
                // Only a 404 (unknown/rotated token) is a PERMANENT invalid link.
                // 429 / 5xx / network are transient → offer a retry, not a dead end.
                if (res.status === 404) { setStatus('invalid'); return; }
                if (!res.ok) { setStatus('retry'); return; }
                setData(await res.json());
                setStatus('ok');
            } catch { if (alive) setStatus('retry'); }
        })();
        return () => { alive = false; };
    }, [token, attempt]);

    const t = T[(lang as Lang)] ?? T.es;
    const emailOk = /.+@.+\..+/.test(email.trim());
    const nameOk = name.trim().length > 0;

    const submit = async () => {
        if (!consent || submitting) return;
        if (!nameOk || !emailOk) { setError(t.emailInvalid); return; }
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/puentes-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bridge_link_token: token,
                    recipient_email: email.trim(),
                    recipient_name: name.trim(),
                    consent_given: consent,
                    lang,
                }),
            });
            const j = await res.json().catch(() => ({}));
            // Already has their bridge with this child (1 per email × niño). The
            // server re-sent the permanent link to that inbox (never echoes the
            // token on the shareable-link path) — tell them to check their email.
            if (res.status === 409) { setError(t.alreadyHasBridge); setSubmitting(false); return; }
            // The link was rotated/revoked between render and submit: permanent.
            if (res.status === 404) { setStatus('invalid'); return; }
            if (res.status === 429) { setError(t.retry); setSubmitting(false); return; }
            if (!res.ok || !j.checkout_url) { setError(t.error); setSubmitting(false); return; }
            window.location.href = j.checkout_url;
        } catch { setError(t.error); setSubmitting(false); }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-argo-neutral"><p className="text-argo-grey text-sm">{t.loading}</p></div>;
    }
    if (status === 'retry') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral px-4 text-center">
                <div className="max-w-sm">
                    <p className="text-lg font-light text-argo-navy mb-4">{t.retry}</p>
                    <Button variant="secondary" onClick={() => { setStatus('loading'); setAttempt(a => a + 1); }}>{t.retryCta}</Button>
                </div>
            </div>
        );
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

    const childName = data.child_first_name || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');

    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
                <Card padding="lg">
                    <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-3 font-semibold">{t.eyebrow}</p>
                    <h1 className="text-3xl font-bold tracking-tight text-argo-navy">{t.title(childName)}</h1>

                    <p className="mt-5 text-argo-secondary text-base leading-relaxed">{t.body(childName)}</p>
                    <p className="mt-3 text-sm text-argo-grey leading-relaxed">{t.note(childName)}</p>

                    <div className="mt-6">
                        <label className="block text-xs font-semibold tracking-[0.14em] uppercase text-argo-grey mb-1.5">{t.nameLabel}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300" />
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs font-semibold tracking-[0.14em] uppercase text-argo-grey mb-1.5">{t.emailLabel}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300" />
                    </div>

                    <label className="mt-5 flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-argo-violet-500" />
                        <span className="text-sm text-argo-secondary leading-relaxed">{t.consentPre}<Link to="/terms" target="_blank" className="text-argo-violet-500 underline">{t.consentLink}</Link>{t.consentPost}</span>
                    </label>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                    <div className="mt-6">
                        <Button variant="violet" size="lg" onClick={submit} disabled={!consent || !nameOk || !emailOk || submitting}>
                            {t.cta} <span className="ml-1.5 text-sm font-bold opacity-90">{t.price}</span>
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
