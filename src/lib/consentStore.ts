import type { AdultData } from '../components/onboarding/OnboardingFlowV2';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RequestConsentInput {
    adultData: AdultData;
    flowType: 'auth' | 'tenant' | 'one';
    tenantId?: string;
    oneLinkId?: string;
    lang: string;
}

export interface RequestConsentResult {
    ok: boolean;
    token?: string;
    error?: string;
}

export type ConsentStatus = 'pending' | 'confirmed' | 'expired' | 'not_found';

// ─── API calls ───────────────────────────────────────────────────────────────

export async function requestConsent(input: RequestConsentInput): Promise<RequestConsentResult> {
    const body = {
        adult_name:  input.adultData.nombreAdulto,
        adult_email: input.adultData.email,
        child_name:  input.adultData.nombreNino,
        child_age:   input.adultData.edad,
        sport:       input.adultData.deporte,
        flow_type:   input.flowType,
        tenant_id:   input.tenantId ?? null,
        one_link_id: input.oneLinkId ?? null,
        lang:        input.lang,
    };

    if (import.meta.env.DEV) {
        const mockToken = 'dev' + Math.random().toString(16).slice(2).padEnd(29, '0').slice(0, 29);
        console.info('[consentStore] DEV — would request consent:', body, '→ token:', mockToken);
        return { ok: true, token: mockToken };
    }

    try {
        const res = await fetch('/api/request-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({ ok: false, error: 'parse_error' }));
        if (!res.ok || !json.ok) {
            return { ok: false, error: json.error || `http_${res.status}` };
        }
        return { ok: true, token: json.token };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'unexpected';
        console.error('[consentStore] requestConsent failed:', msg);
        return { ok: false, error: msg };
    }
}

export async function checkConsentStatus(token: string): Promise<ConsentStatus> {
    if (import.meta.env.DEV && token.startsWith('dev')) {
        // In DEV we auto-confirm after 2 seconds of waiting
        return 'confirmed';
    }
    try {
        const res = await fetch(`/api/consent-status?token=${encodeURIComponent(token)}`);
        if (!res.ok) return 'not_found';
        const json = await res.json().catch(() => null);
        const status = json?.status;
        if (status === 'confirmed' || status === 'pending' || status === 'expired') return status;
        return 'not_found';
    } catch {
        return 'pending'; // transient errors — keep polling
    }
}

export interface ConsentDataFromServer {
    adult_name: string;
    adult_email: string;
    child_name: string;
    child_age: number;
    sport: string | null;
    flow_type: 'auth' | 'tenant' | 'one';
    lang: string;
    tenant_slug: string | null;
    one_link_slug: string | null;
}

export async function confirmConsent(token: string): Promise<{
    ok: boolean;
    childName?: string;
    lang?: string;
    consentData?: ConsentDataFromServer;
    error?: string;
}> {
    try {
        const res = await fetch('/api/confirm-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => null);
        if (res.status === 410) return { ok: false, error: 'expired' };
        if (res.status === 404) return { ok: false, error: 'not_found' };
        if (!res.ok || !json?.ok) return { ok: false, error: json?.error || `http_${res.status}` };
        return {
            ok: true,
            childName: json.child_name,
            lang: json.lang,
            consentData: json.consent_data as ConsentDataFromServer | undefined,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'unexpected';
        return { ok: false, error: msg };
    }
}

// ─── Resume helper (sessionStorage, survives the consent-landing redirect) ──

const RESUME_KEY = 'argo_consent_resume';

export interface ConsentResumePayload {
    token: string;
    adultData: AdultData;
    flowType: 'auth' | 'tenant' | 'one';
    lang: string;
    timestamp: number;
}

export function saveConsentResume(data: Omit<ConsentResumePayload, 'timestamp'>): void {
    try {
        sessionStorage.setItem(RESUME_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch {
        // non-critical
    }
}

export function takeConsentResume(expectedToken?: string): ConsentResumePayload | null {
    try {
        const raw = sessionStorage.getItem(RESUME_KEY);
        if (!raw) return null;
        const data: ConsentResumePayload = JSON.parse(raw);
        // TTL: 10 minutes — keeps the resume window tight
        if (Date.now() - data.timestamp > 10 * 60 * 1000) {
            sessionStorage.removeItem(RESUME_KEY);
            return null;
        }
        if (expectedToken && data.token !== expectedToken) {
            return null;
        }
        // Consume on read so it can't be reused accidentally
        sessionStorage.removeItem(RESUME_KEY);
        return data;
    } catch {
        return null;
    }
}

// ─── localStorage recovery (separate slot from argo_session_recovery) ────────

const CONSENT_RECOVERY_KEY = 'argo_consent_recovery';

export interface ConsentRecoveryData {
    token: string;
    adultData: AdultData;
    flowType: 'auth' | 'tenant' | 'one';
    tenantId?: string;
    oneLinkId?: string;
    lang: string;
    timestamp: number;
}

export function saveConsentRecovery(data: Omit<ConsentRecoveryData, 'timestamp'>): void {
    try {
        const payload: ConsentRecoveryData = { ...data, timestamp: Date.now() };
        localStorage.setItem(CONSENT_RECOVERY_KEY, JSON.stringify(payload));
    } catch {
        // non-critical
    }
}

export function getConsentRecovery(): ConsentRecoveryData | null {
    try {
        const raw = localStorage.getItem(CONSENT_RECOVERY_KEY);
        if (!raw) return null;
        const data: ConsentRecoveryData = JSON.parse(raw);
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp > twentyFourHoursMs) {
            localStorage.removeItem(CONSENT_RECOVERY_KEY);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

export function clearConsentRecovery(): void {
    try {
        localStorage.removeItem(CONSENT_RECOVERY_KEY);
    } catch {
        // non-critical
    }
}
