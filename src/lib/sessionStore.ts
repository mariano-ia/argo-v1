import type { AdultData } from '../components/onboarding/OnboardingFlowV2';
import type { QuestionAnswer } from './profileResolver';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionPayload {
    adultData: AdultData;
    eje: string;
    motor: string;
    archetypeLabel: string;
    ejeSecundario?: string;
    answers: QuestionAnswer[];
    tenantId?: string;
    lang?: string;
    aiUsage?: {
        tokensInput: number;
        tokensOutput: number;
        costUsd: number;
    };
}

interface StartSessionPayload {
    adultData: AdultData;
    tenantId?: string;
    lang?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function fetchWithRetry(
    url: string,
    body: Record<string, unknown>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: true, id: data.id };
        }

        const errData = await res.json().catch(() => ({ error: res.statusText }));
        const msg = errData.error || `HTTP ${res.status}`;
        console.error(`[sessionStore] ${url} failed, retrying in 2s:`, msg);

        await new Promise(r => setTimeout(r, 2000));

        const retry = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (retry.ok) {
            const data = await retry.json().catch(() => ({}));
            return { ok: true, id: data.id };
        }

        const retryData = await retry.json().catch(() => ({ error: retry.statusText }));
        const retryMsg = retryData.error || `HTTP ${retry.status}`;
        console.error(`[sessionStore] ${url} retry also failed:`, retryMsg);
        return { ok: false, error: retryMsg };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error';
        console.error(`[sessionStore] ${url} unexpected error:`, msg);
        return { ok: false, error: msg };
    }
}

// ─── Start session (Option 3) ────────────────────────────────────────────────

/**
 * Creates a "started" session when the child enters the odyssey.
 * Returns the session ID for later updates.
 */
export async function startSession(payload: StartSessionPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    const body = {
        adult_name:  payload.adultData.nombreAdulto,
        adult_email: payload.adultData.email,
        child_name:  payload.adultData.nombreNino,
        child_age:   payload.adultData.edad,
        sport:       payload.adultData.deporte || null,
        tenant_id:   payload.tenantId ?? null,
        lang:        payload.lang ?? 'es',
    };

    if (import.meta.env.DEV) {
        const mockId = `dev-${Date.now()}`;
        console.info('[sessionStore] DEV — would start session:', body, '→ id:', mockId);
        return { ok: true, id: mockId };
    }

    return fetchWithRetry('/api/session', { action: 'start', ...body });
}

// ─── Update session (Options 1 & 3) ─────────────────────────────────────────

/**
 * Updates an existing session by ID.
 * Used to fill in profile data (after resolution) and AI usage (after generation).
 */
export async function updateSession(
    id: string,
    fields: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
    if (import.meta.env.DEV) {
        console.info('[sessionStore] DEV — would update session:', id, fields);
        return { ok: true };
    }

    return fetchWithRetry('/api/session', { action: 'update', id, ...fields });
}

// ─── Save session (legacy fallback) ─────────────────────────────────────────

/**
 * Creates a complete session in one call (legacy path).
 * Used as fallback when startSession failed and we have no session ID.
 */
export async function saveSession(payload: SessionPayload): Promise<{ ok: boolean; error?: string }> {
    const body = {
        adult_name:       payload.adultData.nombreAdulto,
        adult_email:      payload.adultData.email,
        child_name:       payload.adultData.nombreNino,
        child_age:        payload.adultData.edad,
        sport:            payload.adultData.deporte || null,
        eje:              payload.eje,
        motor:            payload.motor,
        archetype_label:  payload.archetypeLabel,
        eje_secundario:   payload.ejeSecundario ?? null,
        tenant_id:        payload.tenantId ?? null,
        lang:             payload.lang ?? 'es',
        answers:          payload.answers,
        ai_tokens_input:  payload.aiUsage?.tokensInput  ?? 0,
        ai_tokens_output: payload.aiUsage?.tokensOutput ?? 0,
        ai_cost_usd:      payload.aiUsage?.costUsd      ?? 0,
    };

    if (import.meta.env.DEV) {
        console.info('[sessionStore] DEV — would save session:', body);
        return { ok: true };
    }

    return fetchWithRetry('/api/session', { action: 'save', ...body });
}

// ─── localStorage recovery (Option 2) ───────────────────────────────────────

const RECOVERY_KEY = 'argo_session_recovery';

export interface RecoverableSession {
    adultData: AdultData;
    answers: QuestionAnswer[];
    screenIndex: number;
    sessionId?: string;
    tenantId?: string;
    lang?: string;
    timestamp: number;
}

/** Save progress to localStorage after each answer */
export function saveProgressToLocal(data: RecoverableSession): void {
    try {
        localStorage.setItem(RECOVERY_KEY, JSON.stringify(data));
    } catch {
        // localStorage full or unavailable — non-critical
    }
}

/** Check for a recoverable session (max 2 hours old) */
export function getRecoverableSession(): RecoverableSession | null {
    try {
        const raw = localStorage.getItem(RECOVERY_KEY);
        if (!raw) return null;
        const session: RecoverableSession = JSON.parse(raw);
        const twoHoursMs = 2 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp > twoHoursMs) {
            localStorage.removeItem(RECOVERY_KEY);
            return null;
        }
        // Only recover if there are answers (child was mid-odyssey)
        if (!session.answers || session.answers.length === 0) return null;
        return session;
    } catch {
        return null;
    }
}

/** Clear recovery data on successful completion or restart */
export function clearRecoveryData(): void {
    try {
        localStorage.removeItem(RECOVERY_KEY);
    } catch {
        // non-critical
    }
}
