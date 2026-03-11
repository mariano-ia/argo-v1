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
 * Never blocks the user flow. Retries once on failure.
 */
export async function saveSession(payload: SessionPayload): Promise<boolean> {
    try {
        const row = {
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
        if (!error) return true;

        console.error('[sessionStore] Insert failed, retrying in 1s:', error.message, error.details);
        await new Promise(r => setTimeout(r, 1000));

        const { error: retryError } = await supabase.from('sessions').insert(row);
        if (retryError) {
            console.error('[sessionStore] Retry also failed:', retryError.message, retryError.details);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[sessionStore] Unexpected error:', err);
        return false;
    }
}
