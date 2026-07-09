import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import { getPuentesCopy } from '../lib/puentesTranslations';
import type { Lang } from '../types/puentes';

const SUPPORTED: Lang[] = ['es', 'en', 'pt'];

export default function PuentesCheckout() {
    const [params] = useSearchParams();
    const sourceSessionId = params.get('source_session_id');
    const queryLang = (params.get('lang') || 'es') as Lang;
    const initialLang: Lang = SUPPORTED.includes(queryLang) ? queryLang : 'es';

    const [lang, setLang] = useState<Lang>(initialLang);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [country, setCountry] = useState<string>('');

    // Pull the source session's child name and inherit lang for display
    useEffect(() => {
        if (!sourceSessionId) return;
        // Best-effort country auto-detection
        (async () => {
            try {
                const r = await fetch('https://ipapi.co/json/');
                if (r.ok) {
                    const d = await r.json();
                    if (d.country_code) setCountry(d.country_code as string);
                }
            } catch { /* noop */ }
        })();
    }, [sourceSessionId]);

    const c = useMemo(() => getPuentesCopy(lang), [lang]);

    const submit = async () => {
        if (!sourceSessionId) {
            setError(lang === 'en' ? 'Missing source session.' : lang === 'pt' ? 'Sessão de origem ausente.' : 'Falta la sesión de origen.');
            return;
        }
        if (!consent || !email) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/puentes-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_session_id: sourceSessionId,
                    recipient_email: email,
                    recipient_name: name || null,
                    country: country || undefined,
                    lang,
                    consent_given: consent,
                }),
            });
            const data = await res.json();

            // If this email already has ArgoPuente®, redirect to their
            // existing report instead of charging them again.
            if (res.status === 409 && data.existing_magic_link) {
                window.location.href = data.existing_magic_link;
                return;
            }
            if (!res.ok || !data.checkout_url) {
                setError(data.error || c.errors.generic);
                setLoading(false);
                return;
            }
            window.location.href = data.checkout_url;
        } catch {
            setError(c.errors.generic);
            setLoading(false);
        }
    };

    if (!sourceSessionId) {
        return (
            <div className="min-h-screen bg-argo-neutral py-16 px-4">
                <div className="max-w-md mx-auto">
                    <Card padding="lg" className="text-center">
                        <p className="text-argo-secondary">{lang === 'en' ? 'This page needs to be opened from your Argo report email.' : lang === 'pt' ? 'Esta página precisa ser aberta a partir do email do seu relatório Argo.' : 'Esta página debe abrirse desde el email del informe Argo.'}</p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-argo-neutral py-16 px-4">
            <div className="max-w-md mx-auto">
                {/* Language switcher */}
                <div className="flex justify-end gap-1 mb-4">
                    {SUPPORTED.map((l) => (
                        <button
                            key={l}
                            onClick={() => setLang(l)}
                            className={[
                                'text-xs uppercase tracking-widest font-semibold px-2 py-1 rounded',
                                lang === l ? 'text-argo-violet-500' : 'text-argo-light hover:text-argo-secondary',
                            ].join(' ')}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                <Card padding="lg">
                    <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-2 font-semibold">
                        {c.checkout.eyebrow}
                    </p>
                    <h1 className="text-2xl font-bold text-argo-navy tracking-tight">
                        {c.checkout.title}
                    </h1>
                    <p className="mt-4 text-argo-secondary leading-relaxed">
                        {c.checkout.description}
                    </p>

                    <div className="mt-6 p-4 rounded-[14px] bg-argo-bg flex items-baseline justify-between">
                        <span className="text-xs uppercase tracking-widest text-argo-grey font-semibold">
                            {lang === 'en' ? 'Price' : lang === 'pt' ? 'Preço' : 'Precio'}
                        </span>
                        <span className="text-2xl font-bold text-argo-navy tracking-tight">
                            {c.checkout.priceUsd}
                        </span>
                    </div>

                    <div className="mt-6 space-y-4">
                        <Input
                            label={c.checkout.emailLabel}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                        />
                        <Input
                            label={c.checkout.nameLabel}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <label className="flex items-start gap-3 text-sm text-argo-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 accent-argo-violet-500"
                            />
                            <span className="leading-relaxed">
                                {c.checkout.consentLabel}{' '}
                                <Link to="/terms" target="_blank" className="text-argo-indigo underline">
                                    {c.checkout.termsLink}
                                </Link>
                            </span>
                        </label>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <Button
                            variant="violet"
                            size="lg"
                            className="w-full"
                            loading={loading}
                            disabled={!consent || !email || loading}
                            onClick={submit}
                        >
                            {c.checkout.payCta}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
