
import { EjeInput, MotorInput, ARQUETIPOS } from './argosEngine';
import { Axis } from './onboardingData';

export interface QuestionAnswer {
    axis: Axis;
    responseTimeMs: number;
}


export type AnswerOption = 'IMP' | 'CON' | 'SOS' | 'EST';

export interface ProfileResult {
    counts: Record<AnswerOption, number>;
    eje: EjeInput;
    motor: MotorInput;
    arquetipoLabel: string;
    arquetipoId: string;
}

export function resolveProfile(answers: AnswerOption[]): ProfileResult {
    const counts: Record<AnswerOption, number> = { IMP: 0, CON: 0, SOS: 0, EST: 0 };

    answers.forEach(a => {
        if (counts[a] !== undefined) counts[a]++;
    });

    // Determine Dominant Axis: IMP->D, CON->I, SOS->S, EST->C
    const scores = [
        { axis: 'D', count: counts.IMP },
        { axis: 'I', count: counts.CON },
        { axis: 'S', count: counts.SOS },
        { axis: 'C', count: counts.EST },
    ];
    scores.sort((a, b) => b.count - a.count);

    const axis = scores[0].axis as EjeInput;
    const secondCount = scores[1].count;
    const topCount = scores[0].count;

    // Determine Motor based on dominance ratio:
    // If dominant is very clear (>40% lead) → Rápido
    // If close between top two (≤2 difference for 12 questions) → Medio
    // Otherwise → Lento
    const total = answers.length;
    const diff = topCount - secondCount;

    let motor: MotorInput;
    if (total === 0) {
        motor = 'Medio';
    } else if (diff >= Math.ceil(total * 0.25)) {
        // Very dominant: Rápido
        motor = 'Rápido';
    } else if (diff <= 1) {
        // Very close: Lento (deliberate, processing)
        motor = 'Lento';
    } else {
        // Middle: Medio
        motor = 'Medio';
    }

    const arch = ARQUETIPOS.find(a => a.eje === axis && a.motor === motor);

    return {
        counts,
        eje: axis,
        motor,
        arquetipoLabel: arch ? arch.label : 'Desconocido',
        arquetipoId: arch ? arch.id : 'unknown',
    };
}

/**
 * Resolves a full profile from the gamified onboarding answers.
 * Motor is determined primarily by average response time per the spec:
 *   < 5 000 ms avg → Rápido
 *   > 12 000 ms avg → Lento
 *   otherwise → Medio (falls back to score-difference for tie-breaking)
 */
export function resolveFromAnswers(answers: QuestionAnswer[]): ProfileResult {
    // — Eje from axis counts —
    const axisCounts: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
    answers.forEach(a => { axisCounts[a.axis]++; });

    const sorted = (Object.keys(axisCounts) as Axis[]).sort(
        (a, b) => axisCounts[b] - axisCounts[a]
    );

    const dominantAxis = sorted[0];
    const topCount    = axisCounts[sorted[0]];
    const secondCount = axisCounts[sorted[1]];
    const diff        = topCount - secondCount;
    const total       = answers.length;

    // — Motor from average response time —
    const avgMs = total > 0
        ? answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / total
        : 5000;

    let motor: MotorInput;
    if (avgMs < 5000) {
        motor = 'Rápido';
    } else if (avgMs > 12000) {
        motor = 'Lento';
    } else {
        // Medium time range — use score-difference as tiebreaker
        if (diff >= Math.ceil(total * 0.25)) {
            motor = 'Rápido';
        } else if (diff <= 1) {
            motor = 'Lento';
        } else {
            motor = 'Medio';
        }
    }

    const arch = ARQUETIPOS.find(a => a.eje === dominantAxis && a.motor === motor);

    // Map Axis back to AnswerOption for counts compatibility
    const legacyCounts: Record<AnswerOption, number> = {
        IMP: axisCounts.D,
        CON: axisCounts.I,
        SOS: axisCounts.S,
        EST: axisCounts.C,
    };

    return {
        counts: legacyCounts,
        eje: dominantAxis,
        motor,
        arquetipoLabel: arch ? arch.label : 'Desconocido',
        arquetipoId: arch ? arch.id : 'unknown',
    };
}
