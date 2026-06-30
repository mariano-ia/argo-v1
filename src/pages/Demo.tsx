import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OnboardingFlowV2 } from '../components/onboarding/OnboardingFlowV2';
import type { AdultData } from '../components/onboarding/OnboardingFlowV2';
import { DemoEndScreen } from '../components/onboarding/screens/DemoEndScreen';
import { getReportData } from '../lib/argosEngine';
import { useLang } from '../context/LangContext';
import type { QuestionAnswer } from '../lib/profileResolver';

// Mock answers used only by /demo?preview=ready. 12 entries leaning S-dominant
// with response times that produce the "Arranque progresivo" pattern (first
// half slower, second half faster, low CV).
const PREVIEW_MOCK_ANSWERS: QuestionAnswer[] = [
    { axis: 'S', responseTimeMs: 6200 },
    { axis: 'S', responseTimeMs: 6400 },
    { axis: 'D', responseTimeMs: 5800 },
    { axis: 'S', responseTimeMs: 6100 },
    { axis: 'C', responseTimeMs: 6300 },
    { axis: 'S', responseTimeMs: 5900 },
    { axis: 'S', responseTimeMs: 3400 },
    { axis: 'I', responseTimeMs: 3200 },
    { axis: 'S', responseTimeMs: 3600 },
    { axis: 'D', responseTimeMs: 3500 },
    { axis: 'C', responseTimeMs: 3300 },
    { axis: 'S', responseTimeMs: 3700 },
];

/**
 * Demo público al que apunta el QR del slide 9 del deck institucional.
 * Onboarding mínimo (email + nombre), corre el juego completo, y al final
 * envía el informe al email del prospecto. No persiste sesión en DB.
 */
export const Demo: React.FC = () => {
    const { lang, setLang } = useLang();
    const L = (es: string, en: string, pt: string) =>
        lang === 'es' ? es : lang === 'pt' ? pt : en;

    // All hooks must be called before any early return (Rules of Hooks).
    const [searchParams] = useSearchParams();
    const [adultData, setAdultData] = useState<AdultData | null>(null);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);
    const [blocked, setBlocked] = useState(false);

    // ── Preview mode: render the end screen directly without playing.
    // Use /demo?preview=loading or /demo?preview=ready to inspect the layout.
    const preview = searchParams.get('preview');
    if (preview === 'loading') {
        return (
            <DemoEndScreen
                email="prueba@argomethod.com"
                nombre="Mariano"
                aiPending
            />
        );
    }
    if (preview === 'ready') {
        // Sostenedor Rítmico sample so the preview matches the canonical
        // report layout (S-dominant bars + "Arranque progresivo" pattern).
        const sampleReport = getReportData('S', 'Medio', '', 'Mariano', lang);
        return (
            <DemoEndScreen
                email="prueba@argomethod.com"
                nombre="Mariano"
                report={sampleReport}
                aiSections={null}
                aiPending={false}
                deporte="Rugby"
                edad={13}
                answers={PREVIEW_MOCK_ANSWERS}
            />
        );
    }

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    const handleStart = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const cleanName = nombre.trim();
        const cleanEmail = email.trim();
        if (cleanName.length < 2) {
            setError(L('Ingresa tu nombre.', 'Enter your name.', 'Insira seu nome.'));
            return;
        }
        if (!isValidEmail(cleanEmail)) {
            setError(L('Email inválido.', 'Invalid email.', 'Email inválido.'));
            return;
        }
        setError('');
        setChecking(true);
        // One demo per email. Fail-open: never block the funnel on an API error.
        try {
            const res = await fetch('/api/check-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.already_played) { setBlocked(true); setChecking(false); return; }
            }
        } catch { /* fail open */ }
        setChecking(false);
        // The demo plays as the prospect themselves: use their name as both
        // nombreAdulto and nombreNino. deporte/edad are dummies the report
        // template tolerates (the email header will say "· Argo Demo · 12 años").
        setAdultData({
            nombreAdulto: cleanName,
            email: cleanEmail,
            nombreNino: cleanName,
            // 13 ≥ COPPA threshold, so the demo skips the parental consent gate.
            edad: 13,
            deporte: 'Argo Demo',
        });
    };

    // ── Once we have adultData, hand off to OnboardingFlowV2 in demo mode ──
    if (adultData) {
        return (
            <OnboardingFlowV2
                demoMode
                initialConsent={{ token: 'demo', adultData }}
            />
        );
    }

    // ── Already played with this email — one demo per email ─────────────────
    if (blocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-argo-neutral">
                <div className="w-full max-w-sm bg-white border border-argo-border rounded-2xl p-8 shadow-argo text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-5">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                    </div>
                    <h1 style={{ fontWeight: 300, fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#1D1D1F', marginBottom: '10px' }}>
                        {L('Ya jugaste con este email.', 'You already played with this email.', 'Você já jogou com este email.')}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#424245', lineHeight: 1.5, marginBottom: '20px' }}>
                        {L(
                            'Cada email puede probar la demo una vez. Si quieres el informe completo, escríbenos a hola@argomethod.com.',
                            'Each email can try the demo once. If you want the full report, write to us at hola@argomethod.com.',
                            'Cada email pode testar a demo uma vez. Se quiser o relatório completo, escreva para hola@argomethod.com.',
                        )}
                    </p>
                    <a href="/" className="inline-block px-6 py-3 rounded-xl text-sm font-semibold border border-argo-border text-argo-navy hover:border-argo-violet-300 transition-colors">
                        {L('Volver al inicio', 'Back to home', 'Voltar ao início')}
                    </a>
                </div>
            </div>
        );
    }

    // ── Start form ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-argo-neutral">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span>
                            <span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                    </div>
                    <h1 style={{ fontWeight: 300, fontSize: '1.8rem', letterSpacing: '-0.025em', lineHeight: 1.15, color: '#1D1D1F', marginBottom: '10px' }}>
                        {L(
                            'Prueba Argo en 10 minutos.',
                            'Try Argo in 10 minutes.',
                            'Experimente o Argo em 10 minutos.',
                        )}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#424245', lineHeight: 1.5 }}>
                        {L(
                            'Vas a jugar una odisea de 10 minutos. Al terminar, te enviamos por email el mismo informe que recibe la familia cuando un niño juega.',
                            `You'll play a 10-minute odyssey. When you finish, we'll email you the same report a family gets when a child plays.`,
                            'Você vai jogar uma odisseia de 10 minutos. Ao terminar, enviamos por email o mesmo relatório que a família recebe quando uma criança joga.',
                        )}
                    </p>
                </div>

                <form onSubmit={handleStart} className="bg-white border border-argo-border rounded-2xl p-7 shadow-argo space-y-4">
                    <div>
                        <label className="block text-[11px] font-semibold text-argo-grey uppercase tracking-widest mb-1.5">
                            {L('Tu nombre', 'Your name', 'Seu nome')}
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            autoComplete="given-name"
                            className="w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-violet-200 focus:border-argo-violet-400"
                            placeholder={L('Tu nombre', 'Your name', 'Seu nome')}
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-argo-grey uppercase tracking-widest mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-violet-200 focus:border-argo-violet-400"
                            placeholder="tu@email.com"
                        />
                        <p className="text-[11px] text-argo-grey mt-1.5">
                            {L(
                                'Te enviamos el informe a este email. No te suscribimos a nada.',
                                `We'll send the report here. No subscription.`,
                                'Enviamos o relatório aqui. Sem assinatura.',
                            )}
                        </p>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-argo-grey uppercase tracking-widest mb-1.5">
                            {L('Idioma', 'Language', 'Idioma')}
                        </label>
                        <div className="flex gap-1.5">
                            {([
                                { code: 'es' as const, label: 'Español' },
                                { code: 'en' as const, label: 'English' },
                                { code: 'pt' as const, label: 'Português' },
                            ]).map(opt => (
                                <button
                                    key={opt.code}
                                    type="button"
                                    onClick={() => setLang(opt.code)}
                                    className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                                        lang === opt.code
                                            ? 'bg-argo-navy text-white border-argo-navy'
                                            : 'bg-white text-argo-grey border-argo-border hover:border-argo-secondary'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={checking}
                        className="w-full bg-argo-navy text-white font-medium py-3 rounded-lg text-sm hover:bg-argo-secondary transition-colors mt-2 disabled:opacity-60"
                    >
                        {checking
                            ? L('Verificando...', 'Checking...', 'Verificando...')
                            : L('Empezar la odisea', 'Start the odyssey', 'Começar a odisseia')}
                    </button>
                </form>

                <p className="text-[11px] text-argo-light text-center mt-6 leading-relaxed">
                    {L(
                        'Argo describe tendencias, no diagnostica. Una herramienta de comunicación, no clínica.',
                        'Argo describes tendencies, it does not diagnose. A communication tool, not a clinical one.',
                        'Argo descreve tendências, não diagnostica. Uma ferramenta de comunicação, não clínica.',
                    )}
                </p>
            </div>
        </div>
    );
};
