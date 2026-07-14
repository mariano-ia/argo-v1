import React from 'react';
import { TenantOnboarding } from './TenantOnboarding';
import { useLang } from '../../context/LangContext';
import type { TenantData } from '../TenantDashboard';

/**
 * DEV-ONLY visual preview of the tenant onboarding slides ("La experiencia", etc.).
 * Route: /preview/onboarding
 * Renders <TenantOnboarding> with a mock tenant so the card can be reviewed without
 * a logged-in tenant. The in-card ES/EN/PT switcher works live (content is driven by
 * the lang prop, which we feed from the language context). Not linked anywhere.
 */
const MOCK_TENANT = {
    id: 'preview',
    slug: 'preview',
    display_name: '',
    plan: 'trial',
    roster_limit: 8,
    active_players_count: 0,
} as unknown as TenantData;

export const OnboardingPreview: React.FC = () => {
    const { lang } = useLang();
    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            <TenantOnboarding tenant={MOCK_TENANT} onComplete={async () => {}} lang={lang} />
        </div>
    );
};
