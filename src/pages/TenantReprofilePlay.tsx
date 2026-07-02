import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingFlowV2 } from '../components/onboarding/OnboardingFlowV2';
import type { AdultData } from '../components/onboarding/OnboardingFlowV2';

type Status = 'loading' | 'ready' | 'invalid' | 'inactive' | 'too_soon' | 'trial_expired' | 'error';

// /play/r/:reprofileToken — re-profile an EXISTING child. Resolves the child via its
// reprofile_token (server-side, 6-month hard gate enforced in /api/start-reprofile),
// pre-fills the child's identity, and runs the odyssey. The reprofile play_token
// carries the signed child id so the completion appends a new perfilamiento.
export const TenantReprofilePlay: React.FC = () => {
    const { reprofileToken } = useParams<{ reprofileToken: string }>();
    const [status, setStatus] = useState<Status>('loading');
    const [tenantId, setTenantId] = useState('');
    const [playToken, setPlayToken] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [tenantSport, setTenantSport] = useState('');
    const [adultData, setAdultData] = useState<AdultData | null>(null);
    const [monthsRemaining, setMonthsRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!reprofileToken) { setStatus('invalid'); return; }
        fetch('/api/start-reprofile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reprofile_token: reprofileToken }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    const sport = data.sport ?? data.tenant_sport ?? '';
                    setTenantId(data.tenant_id);
                    setPlayToken(data.play_token ?? '');
                    setTenantName(data.tenant_name ?? '');
                    setTenantSport(sport);
                    setAdultData({
                        nombreAdulto: data.adult_name ?? '',
                        email: data.adult_email ?? '',
                        nombreNino: data.child_name ?? '',
                        edad: typeof data.child_age === 'number' ? data.child_age : 0,
                        deporte: sport,
                    });
                    setStatus('ready');
                } else if (res.status === 403 && data.error === 'reprofile_too_soon') {
                    setMonthsRemaining(typeof data.months_remaining === 'number' ? data.months_remaining : null);
                    setStatus('too_soon');
                } else if (res.status === 403 && data.error === 'trial_expired') {
                    setStatus('trial_expired');
                } else if (res.status === 410) {
                    setStatus('inactive');
                } else if (res.status === 404 || res.status === 400) {
                    setStatus('invalid');
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));
    }, [reprofileToken]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    if (status === 'too_soon') {
        const faltan = monthsRemaining && monthsRemaining > 0
            ? (monthsRemaining === 1 ? 'Falta cerca de 1 mes.' : `Faltan cerca de ${monthsRemaining} meses.`)
            : '';
        return (
            <StatusScreen
                title="Todavía no es momento de re-perfilar"
                message={`El re-perfilado está disponible cada 6 meses, para capturar bien la evolución del niño. ${faltan}`.trim()}
            />
        );
    }

    if (status === 'inactive') {
        return (
            <StatusScreen
                title="Jugador no disponible"
                message="Este jugador ya no está activo en la cuenta. Consulta con quien te compartió el link."
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

    if (status === 'invalid') {
        return (
            <StatusScreen
                title="Link no válido"
                message="Este link de re-perfilado no corresponde a ningún jugador activo. Verifica con quien te lo compartió."
            />
        );
    }

    if (status === 'error') {
        return (
            <StatusScreen
                title="Algo salió mal"
                message="No pudimos iniciar el re-perfilado. Intenta de nuevo en unos minutos."
            />
        );
    }

    if (status === 'ready' && adultData) {
        return (
            <OnboardingFlowV2
                tenantId={tenantId}
                playToken={playToken}
                institutionName={tenantName}
                institutionSport={tenantSport}
                initialAdultData={adultData}
                reprofileToken={reprofileToken}
            />
        );
    }

    return null;
};

const StatusScreen: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
         style={{ backgroundColor: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '360px' }}>
            <div className="flex items-center justify-center gap-1.5 mb-8">
                <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}>Method®</span>
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
