import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';

type Status = 'loading' | 'ready' | 'not_found' | 'no_credits' | 'error';

export const TenantPlay: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [status, setStatus] = useState<Status>('loading');
    const [tenantId, setTenantId] = useState<string>('');

    useEffect(() => {
        if (!slug) { setStatus('not_found'); return; }

        fetch('/api/start-play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        })
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    setTenantId(data.tenant_id);
                    setStatus('ready');
                } else if (res.status === 404) {
                    setStatus('not_found');
                } else if (res.status === 403) {
                    setStatus('no_credits');
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
        return (
            <StatusScreen
                title="Link no válido"
                message="Este link no corresponde a ninguna cuenta activa. Verifica con quien te lo compartió."
            />
        );
    }

    if (status === 'no_credits') {
        return (
            <StatusScreen
                title="Sin créditos disponibles"
                message="La cuenta asociada a este link no tiene créditos disponibles. Contacta al responsable para más información."
            />
        );
    }

    if (status === 'error') {
        return (
            <StatusScreen
                title="Algo salió mal"
                message="No pudimos iniciar la experiencia. Intenta de nuevo en unos minutos."
            />
        );
    }

    // Ready — launch the onboarding flow without user auth
    return <OnboardingFlow tenantId={tenantId} />;
};

// ─── Status screen ───────────────────────────────────────────────────────────

const StatusScreen: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
         style={{ backgroundColor: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '360px' }}>
            <div className="flex items-center justify-center gap-1.5 mb-8">
                <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                </span>
            </div>
            <h2 style={{ fontWeight: 300, fontSize: '24px', color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                {title}
            </h2>
            <p style={{ fontWeight: 400, fontSize: '15px', color: '#86868B', lineHeight: 1.7 }}>
                {message}
            </p>
        </div>
    </div>
);
