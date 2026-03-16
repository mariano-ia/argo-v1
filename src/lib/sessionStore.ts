import type { AdultData } from '../components/onboarding/OnboardingFlow';
import type { QuestionAnswer } from './profileResolver';

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

/**
 * Saves a completed onboarding session via the server-side API
 * (bypasses RLS using the service role key on the server).
 * In development, logs to console instead.
 * Retries once on failure. Returns { ok, error } for UI feedback.
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

    // Dev mode: log and mock success
    if (import.meta.env.DEV) {
        console.info('[sessionStore] DEV — would save session:', body);
        return { ok: true };
    }

    try {
        const res = await fetch('/api/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) return { ok: true };

        const errData = await res.json().catch(() => ({ error: res.statusText }));
        const msg = errData.error || `HTTP ${res.status}`;
        console.error('[sessionStore] Save failed, retrying in 2s:', msg);

        // Retry once
        await new Promise(r => setTimeout(r, 2000));

        const retry = await fetch('/api/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (retry.ok) return { ok: true };

        const retryData = await retry.json().catch(() => ({ error: retry.statusText }));
        const retryMsg = retryData.error || `HTTP ${retry.status}`;
        console.error('[sessionStore] Retry also failed:', retryMsg);
        return { ok: false, error: retryMsg };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error';
        console.error('[sessionStore] Unexpected error:', msg);
        return { ok: false, error: msg };
    }
}
