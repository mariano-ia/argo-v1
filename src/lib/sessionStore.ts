import { supabase } from './supabase';
import type { AdultData } from '../components/onboarding/OnboardingFlow';
import type { QuestionAnswer } from './profileResolver';

interface SessionPayload {
    adultData: AdultData;
    eje: string;
    motor: string;
    archetypeLabel: string;
    ejeSecundario?: string;
    answers: QuestionAnswer[];
    aiUsage?: {
        tokensInput: number;
        tokensOutput: number;
        costUsd: number;
    };
}

/**
 * Saves a completed onboarding session to Supabase.
 * Includes authenticated user_id for RLS compliance.
 * Retries once on failure. Returns { ok, error } for UI feedback.
 */
export async function saveSession(payload: SessionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        // Get authenticated user for RLS
        const { data: { user } } = await supabase.auth.getUser();

        const row = {
            user_id:          user?.id ?? null,
            adult_name:       payload.adultData.nombreAdulto,
            adult_email:      payload.adultData.email,
            child_name:       payload.adultData.nombreNino,
            child_age:        payload.adultData.edad,
            sport:            payload.adultData.deporte || null,
            eje:              payload.eje,
            motor:            payload.motor,
            archetype_label:  payload.archetypeLabel,
            eje_secundario:   payload.ejeSecundario ?? null,
            answers:          payload.answers,
            ai_tokens_input:  payload.aiUsage?.tokensInput  ?? 0,
            ai_tokens_output: payload.aiUsage?.tokensOutput ?? 0,
            ai_cost_usd:      payload.aiUsage?.costUsd      ?? 0,
        };

        const { error } = await supabase.from('sessions').insert(row);
        if (!error) return { ok: true };

        console.error('[sessionStore] Insert failed, retrying in 2s:', error.message, error.details, error.hint);
        await new Promise(r => setTimeout(r, 2000));

        const { error: retryError } = await supabase.from('sessions').insert(row);
        if (retryError) {
            const msg = retryError.message || 'Unknown error';
            console.error('[sessionStore] Retry also failed:', msg, retryError.details, retryError.hint);
            return { ok: false, error: msg };
        }
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error';
        console.error('[sessionStore] Unexpected error:', err);
        return { ok: false, error: msg };
    }
}
