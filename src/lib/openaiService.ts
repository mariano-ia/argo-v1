import { ReportData } from './argosEngine';

export interface ReportContext {
    nombre: string;
    deporte: string;
    edad: number;
    destinatario: 'padre' | 'entrenador';
    lang?: string;
}

// Sections the AI rewrites (narrative)
export interface AISections {
    wow: string;
    motorDesc: string;
    combustible: string;
    corazon: string;
    reseteo: string;
    ecos: string;
    checklist: { antes: string; durante: string; despues: string };
}

export interface AIUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
}

export interface AIResult {
    sections: AISections;
    usage: AIUsage;
}

/**
 * Calls the server-side /api/generate-ai endpoint which handles
 * the OpenAI call securely (API key never leaves the server).
 */
export async function generateAISections(
    base: ReportData,
    ctx: ReportContext
): Promise<AIResult> {
    const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: base, context: ctx }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `AI generation failed (${response.status})`);
    }

    const { sections, usage } = await response.json();
    return { sections, usage };
}
