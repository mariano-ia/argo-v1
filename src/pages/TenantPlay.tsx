import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { OnboardingFlowV2 } from '../components/onboarding/OnboardingFlowV2';
import { takeConsentResume } from '../lib/consentStore';
import type { AdultData } from '../components/onboarding/OnboardingFlowV2';

type Status = 'loading' | 'ready' | 'not_found' | 'roster_full' | 'trial_expired' | 'error';

export const TenantPlay: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const consentTokenFromUrl = searchParams.get('consent');
    const [status, setStatus] = useState<Status>('loading');
    const [tenantId, setTenantId] = useState<string>('');
    // If we're arriving from /consent/:token, pull the pre-populated adult data
    // from sessionStorage so we can skip the form entirely.
    const [initialConsent] = useState<{ token: string; adultData: AdultData } | null>(() => {
        if (!consentTokenFromUrl) return null;
        const resume = takeConsentResume(consentTokenFromUrl);
        if (!resume) return null;
        return { token: resume.token, adultData: resume.adultData };
    });

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
                    const errData = await res.json().catch(() => ({}));
                    if (errData.error === 'trial_expired') setStatus('trial_expired');
                    else if (errData.error === 'roster_full') setStatus('roster_full');
                    else setStatus('error');
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

    if (status === 'roster_full') {
        return (
            <StatusScreen
                title="Equipo completo"
                message="La cuenta asociada a este link alcanzó el límite de jugadores activos. Contacta al responsable para más información."
            />
        );
    }

    if (status === 'trial_expired') {
        return (
            <StatusScreen
                title="Periodo de prueba finalizado"
                message="El periodo de prueba de esta cuenta ha finalizado. Contacta al responsable para más información."
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
    return <OnboardingFlowV2 tenantId={tenantId} initialConsent={initialConsent} />;
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
                <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>beta</span>
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
