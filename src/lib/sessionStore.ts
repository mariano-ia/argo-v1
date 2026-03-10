import { supabase } from './supabase';
import type { AdultData } from '../components/onboarding/OnboardingFlow';
import type { QuestionAnswer } from './profileResolver';

interface SessionPayload {
    adultData: AdultData;
    eje: string;
    motor: string;
    archetypeLabel: string;
    answers: QuestionAnswer[];
    aiUsage?: {
        tokensInput: number;
        tokensOutput: number;
        costUsd: number;
    };
}

/**
 * Saves a completed onboarding session to Supabase.
 * Silently fails — never blocks the user flow.
 */
export async function saveSession(payload: SessionPayload): Promise<void> {
    try {
        await supabase.from('sessions').insert({
            adult_name:      payload.adultData.nombreAdulto,
            adult_email:     payload.adultData.email,
            child_name:      payload.adultData.nombreNino,
            child_age:       payload.adultData.edad,
            sport:           payload.adultData.deporte || null,
            eje:             payload.eje,
            motor:           payload.motor,
            archetype_label: payload.archetypeLabel,
            answers:         payload.answers,
            ai_tokens_input:  payload.aiUsage?.tokensInput  ?? 0,
            ai_tokens_output: payload.aiUsage?.tokensOutput ?? 0,
            ai_cost_usd:      payload.aiUsage?.costUsd      ?? 0,
        });
    } catch (err) {
        console.warn('[sessionStore] Failed to save session:', err);
    }
}
