import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card } from '../components/ui';
import { getPuentesCopy } from '../lib/puentesTranslations';
import type { Lang } from '../types/puentes';

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // 30s total

const SUCCESS_COPY: Record<Lang, {
    eyebrow: string;
    pollingTitle: string;
    pollingBody: string;
    readyTitle: (child: string) => string;
    readyBody: (email: string) => string;
    cta: string;
    timeoutTitle: string;
    timeoutBody: string;
    backToHome: string;
}> = {
    es: {
        eyebrow: 'ArgoPuente®',
        pollingTitle: 'Confirmando el pago...',
        pollingBody: 'Esto suele tardar 2 a 5 segundos. No cierres esta pantalla.',
        readyTitle: (child) => `Tu ArgoPuente® para ${child} está activo`,
        readyBody: (email) => `Te enviamos el enlace a ${email} para que puedas volver más tarde. Si quieres, empieza el cuestionario ahora.`,
        cta: 'Empezar ahora',
        timeoutTitle: 'Aún estamos confirmando el pago',
        timeoutBody: 'El pago puede tardar un poco más de lo esperado. Te enviaremos el enlace al email apenas se confirme. Podés cerrar esta pantalla con tranquilidad.',
        backToHome: 'Volver al inicio',
    },
    en: {
        eyebrow: 'ArgoPuente®',
        pollingTitle: 'Confirming your payment...',
        pollingBody: 'This usually takes 2 to 5 seconds. Please keep this screen open.',
        readyTitle: (child) => `Your ArgoPuente® for ${child} is ready`,
        readyBody: (email) => `We sent the link to ${email} so you can come back later. If you want, start the questionnaire now.`,
        cta: 'Start now',
        timeoutTitle: 'Still confirming your payment',
        timeoutBody: 'Payment confirmation is taking a bit longer than usual. We will email you the link as soon as it confirms. You can safely close this screen.',
        backToHome: 'Back to home',
    },
    pt: {
        eyebrow: 'ArgoPuente®',
        pollingTitle: 'Confirmando o pagamento...',
        pollingBody: 'Isto geralmente leva 2 a 5 segundos. Por favor mantenha esta tela aberta.',
        readyTitle: (child) => `Seu ArgoPuente® para ${child} está pronto`,
        readyBody: (email) => `Enviamos o link para ${email} para que você possa voltar depois. Se quiser, comece o questionário agora.`,
        cta: 'Começar agora',
        timeoutTitle: 'Ainda confirmando o pagamento',
        timeoutBody: 'A confirmação do pagamento está demorando mais que o normal. Enviaremos o link por email assim que confirmar. Você pode fechar esta tela com tranquilidade.',
        backToHome: 'Voltar ao início',
    },
};

export default function PuentesCheckoutSuccess() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const purchaseId = params.get('purchase_id');
    const queryLang = (params.get('lang') as Lang) || 'es';
    const [lang, setLang] = useState<Lang>(queryLang);
    const [stage, setStage] = useState<'polling' | 'ready' | 'timeout' | 'error'>('polling');
    const [magicToken, setMagicToken] = useState<string | null>(null);
    const [recipientEmail, setRecipientEmail] = useState<string>('');
    const [childName, setChildName] = useState<string>('');

    useEffect(() => {
        if (!purchaseId) {
            setStage('error');
            return;
        }
        let cancelled = false;
        let attempts = 0;

        const poll = async () => {
            attempts++;
            try {
                const res = await fetch(`/api/puentes-check-purchase?purchase_id=${encodeURIComponent(purchaseId)}`);
                if (!res.ok) throw new Error('check failed');
                const data = await res.json();
                if (cancelled) return;
                if (data.recipient_email) setRecipientEmail(data.recipient_email);
                if (data.child_name) setChildName(data.child_name);
                if (data.lang) setLang(data.lang as Lang);

                if (data.status === 'paid' && data.magic_token) {
                    setMagicToken(data.magic_token);
                    setStage('ready');
                    return;
                }
                if (attempts >= MAX_ATTEMPTS) {
                    setStage('timeout');
                    return;
                }
                setTimeout(poll, POLL_INTERVAL_MS);
            } catch {
                if (cancelled) return;
                if (attempts >= MAX_ATTEMPTS) setStage('timeout');
                else setTimeout(poll, POLL_INTERVAL_MS);
            }
        };

        poll();
        return () => { cancelled = true; };
    }, [purchaseId]);

    const t = SUCCESS_COPY[lang] ?? SUCCESS_COPY.es;
    const cTr = getPuentesCopy(lang);

    if (!purchaseId) {
        return (
            <CenterScreen>
                <Card padding="lg" className="text-center">
                    <p className="text-argo-secondary">{cTr.errors.generic}</p>
                </Card>
            </CenterScreen>
        );
    }

    return (
        <div className="min-h-screen bg-argo-neutral py-16 px-4">
            <div className="max-w-md mx-auto">
                <Card padding="lg" className="text-center">
                    <p className="text-xs uppercase tracking-widest text-argo-violet-500 font-semibold mb-3">
                        {t.eyebrow}
                    </p>

                    {stage === 'polling' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="inline-block w-10 h-10 rounded-full border-4 border-argo-violet-100 border-t-argo-violet-500 animate-spin mb-5" />
                            <h1 className="text-2xl font-bold text-argo-navy tracking-tight">{t.pollingTitle}</h1>
                            <p className="mt-3 text-sm text-argo-secondary leading-relaxed">{t.pollingBody}</p>
                        </motion.div>
                    )}

                    {stage === 'ready' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-argo-violet-50 mb-5">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#955FB5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-argo-navy tracking-tight leading-tight">
                                {t.readyTitle(childName || '')}
                            </h1>
                            <p className="mt-4 text-sm text-argo-secondary leading-relaxed">
                                {t.readyBody(recipientEmail || '')}
                            </p>
                            <Button
                                variant="violet"
                                size="lg"
                                className="mt-6 w-full"
                                onClick={() => magicToken && navigate(`/puentes/${magicToken}`)}
                            >
                                {t.cta}
                            </Button>
                        </motion.div>
                    )}

                    {stage === 'timeout' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mb-5">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-argo-navy tracking-tight">{t.timeoutTitle}</h1>
                            <p className="mt-3 text-sm text-argo-secondary leading-relaxed">{t.timeoutBody}</p>
                            <Button variant="secondary" size="lg" className="mt-6 w-full" onClick={() => navigate('/')}>
                                {t.backToHome}
                            </Button>
                        </motion.div>
                    )}

                    {stage === 'error' && (
                        <p className="text-argo-secondary">{cTr.errors.generic}</p>
                    )}
                </Card>
            </div>
        </div>
    );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-argo-neutral px-4">
            {children}
        </div>
    );
}
