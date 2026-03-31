import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingFlowV2 } from '../components/onboarding/OnboardingFlowV2';

/**
 * /one/:slug — Argo One play page.
 * Similar to TenantPlay but uses one-start-play API and one-complete API.
 * No tenant context.
 */

type Status = 'loading' | 'ready' | 'not_found' | 'already_used' | 'error';

export const OnePlay: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [status, setStatus] = useState<Status>('loading');
    const [linkId, setLinkId] = useState<string>('');

    useEffect(() => {
        if (!slug) { setStatus('not_found'); return; }

        fetch('/api/one-start-play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        })
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    setLinkId(data.link_id);
                    setStatus('ready');
                } else if (res.status === 404) {
                    setStatus('not_found');
                } else if (res.status === 403) {
                    const data = await res.json().catch(() => ({}));
                    setStatus(data.error === 'link_already_used' ? 'already_used' : 'error');
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));
    }, [slug]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    if (status === 'not_found') {
        return <StatusScreen title="Link no válido" message="Este link no corresponde a ninguna experiencia activa. Verifica con quien te lo compartió." />;
    }

    if (status === 'already_used') {
        return <StatusScreen title="Link ya utilizado" message="Este link ya fue utilizado para completar una experiencia. Cada link es de un solo uso." />;
    }

    if (status === 'error') {
        return <StatusScreen title="Algo salió mal" message="No pudimos iniciar la experiencia. Intenta de nuevo en unos minutos." />;
    }

    // Ready — launch onboarding without tenant, with oneLink context
    return <OnboardingFlowV2 oneLinkId={linkId} />;
};

const StatusScreen: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
         style={{ backgroundColor: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '360px' }}>
            <div className="flex items-center justify-center gap-1.5 mb-8">
                <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                </span>
            </div>
            <h2 style={{ fontWeight: 300, fontSize: '24px', color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: '12px' }}>{title}</h2>
            <p style={{ fontWeight: 400, fontSize: '15px', color: '#86868B', lineHeight: 1.7 }}>{message}</p>
        </div>
    </div>
);
