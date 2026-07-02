import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OnboardingFlowV2 } from '../components/onboarding/OnboardingFlowV2';
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
 * Public demo (/demo, "Jugar gratis"). Runs the SAME full onboarding as a normal
 * play — parental consent, sport, the odyssey — only flagged is_demo and ending
 * in an abridged (locked) report. One demo per email: if the registered email
 * already played, the onboarding signals back and we show the notice.
 *
 * /demo?preview=loading|ready renders the end screen directly for layout review.
 */
export const Demo: React.FC = () => {
    const { lang } = useLang();
    const [searchParams] = useSearchParams();
    const [blocked, setBlocked] = useState(false);
    const L = (es: string, en: string, pt: string) => (lang === 'es' ? es : lang === 'pt' ? pt : en);

    const preview = searchParams.get('preview');
    if (preview === 'loading') {
        return <DemoEndScreen email="prueba@argomethod.com" nombre="Mariano" aiPending />;
    }
    if (preview === 'ready') {
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

    // One demo per email — signaled from the registration step inside the flow.
    if (blocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-argo-neutral">
                <div className="w-full max-w-sm bg-white border border-argo-border rounded-2xl p-8 shadow-argo text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-5">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}>Method®</span>
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

    return <OnboardingFlowV2 demoMode onDemoBlocked={() => setBlocked(true)} />;
};

export default Demo;
