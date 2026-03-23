
import { EjeInput, MotorInput, ARQUETIPOS } from './argosEngine';
import { Axis } from './onboardingData';
import type { IslandMetrics } from '../components/games/IslasDesconocidas';
import type { RhythmMetrics } from '../components/onboarding/screens/MiniGame1';
import type { AdaptationMetrics } from '../components/games/LaTormenta';

/**
 * Mini-game metrics for motor calculation.
 * Motor = (Impulse × 0.30) + (Rhythm × 0.30) + (Adaptation × 0.40)
 */
export interface GameMetrics {
    impulse?: IslandMetrics | null;    // Game A — card latency
    rhythm?: RhythmMetrics | null;     // Game B — dodge reaction
    adaptation?: AdaptationMetrics | null; // Game C — storm adaptation
}

/**
 * Calculates motor from mini-game metrics.
 * Each vector produces a 0-100 score, then weighted average → Rápido/Medio/Lento.
 * Returns null if no game metrics are available (falls back to legacy).
 */
export function resolveMotorFromGames(games: GameMetrics): MotorInput | null {
    const scores: { weight: number; score: number }[] = [];

    // Vector 1: Impulse (card latency) — faster = higher score
    if (games.impulse) {
        const avg = games.impulse.avgLatency;
        // <1000ms = very fast (100), >5000ms = very slow (0)
        const score = Math.max(0, Math.min(100, (1 - (avg - 800) / 4200) * 100));
        scores.push({ weight: 0.30, score });
    }

    // Vector 2: Rhythm (dodge reaction) — faster avg reaction = higher score
    if (games.rhythm) {
        const avg = games.rhythm.avgReaction;
        // <300ms = very fast (100), >1500ms = very slow (0)
        const reactionScore = Math.max(0, Math.min(100, (1 - (avg - 200) / 1300) * 100));
        // Extra taps = impulsivity bonus (capped)
        const impulsivityBonus = Math.min(15, games.rhythm.extraTaps * 5);
        const score = Math.min(100, reactionScore + impulsivityBonus);
        scores.push({ weight: 0.30, score });
    }

    // Vector 3: Adaptation — faster adaptation + fewer errors = higher score
    if (games.adaptation) {
        const avg = games.adaptation.avgAdaptation;
        // <500ms = very fast (100), >4000ms = very slow (0)
        const adaptScore = Math.max(0, Math.min(100, (1 - (avg - 300) / 3700) * 100));
        // Penalize inertia errors
        const errorPenalty = Math.min(30, games.adaptation.inertiaErrors * 10);
        const score = Math.max(0, adaptScore - errorPenalty);
        scores.push({ weight: 0.40, score });
    }

    if (scores.length === 0) return null;

    // Normalize weights if some games are missing
    const totalWeight = scores.reduce((s, v) => s + v.weight, 0);
    const composite = scores.reduce((s, v) => s + (v.score * v.weight / totalWeight), 0);

    // Map composite score to motor
    if (composite >= 67) return 'Rápido';
    if (composite <= 33) return 'Lento';
    return 'Medio';
}

export interface QuestionAnswer {
    axis: Axis;
    responseTimeMs: number;
}

export interface SessionContext {
    priorEjes: string[];
    priorMotors: string[];
}

export const TENDENCIA_LABELS: Record<Axis, string> = {
    D: 'con chispa de acción',
    I: 'con brújula social',
    S: 'con raíz firme',
    C: 'con ojo de detalle',
};

export type AnswerOption = 'IMP' | 'CON' | 'SOS' | 'EST';

export interface ProfileResult {
    counts: Record<AnswerOption, number>;
    eje: EjeInput;
    motor: MotorInput;
    arquetipoLabel: string;
    arquetipoId: string;
    ejeSecundario: Axis;
    tendenciaLabel: string;
    tiebreakerApplied: boolean;
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
    const secondAxis = scores[1].axis as Axis;

    return {
        counts,
        eje: axis,
        motor,
        arquetipoLabel: arch ? arch.label : 'Desconocido',
        arquetipoId: arch ? arch.id : 'unknown',
        ejeSecundario: secondAxis,
        tendenciaLabel: TENDENCIA_LABELS[secondAxis],
        tiebreakerApplied: false,
    };
}

/**
 * Resolves a full profile from the gamified onboarding answers.
 * Motor is determined primarily by average response time per the spec:
 *   < 5 000 ms avg → Rápido
 *   > 12 000 ms avg → Lento
 *   otherwise → Medio (falls back to score-difference for tie-breaking)
 *
 * When sessionCtx is provided, applies tiebreaker logic to favor
 * less-represented ejes/motors for better profile dispersion.
 */
export function resolveFromAnswers(
    answers: QuestionAnswer[],
    sessionCtx?: SessionContext,
    gameMetrics?: GameMetrics,
): ProfileResult {
    // — Eje from axis counts —
    const axisCounts: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
    answers.forEach(a => { axisCounts[a.axis]++; });

    const sorted = (Object.keys(axisCounts) as Axis[]).sort(
        (a, b) => axisCounts[b] - axisCounts[a]
    );

    let dominantAxis = sorted[0];
    const topCount    = axisCounts[sorted[0]];
    const secondCount = axisCounts[sorted[1]];
    const diff        = topCount - secondCount;
    const total       = answers.length;
    let tiebreakerApplied = false;

    // — Eje tiebreaker: only on exact tie, pick less represented in group —
    if (sessionCtx && sessionCtx.priorEjes.length > 0 && diff === 0) {
        const candidates = sorted.filter(axis => axisCounts[axis] >= topCount - 1);
        const ejeCounts = candidates.map(axis => ({
            axis,
            count: sessionCtx.priorEjes.filter(e => e === axis).length,
        }));
        ejeCounts.sort((a, b) => a.count - b.count);
        if (ejeCounts[0].axis !== dominantAxis) {
            dominantAxis = ejeCounts[0].axis;
            tiebreakerApplied = true;
        }
    }

    // — Motor: prefer game-based calculation, fallback to legacy response time —
    let motor: MotorInput;
    const gameMotor = gameMetrics ? resolveMotorFromGames(gameMetrics) : null;

    if (gameMotor) {
        motor = gameMotor;
        console.log('[Motor] Resolved from mini-games:', motor);
    } else {
        // Legacy fallback: average response time
        const avgMs = total > 0
            ? answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / total
            : 5000;

        if (avgMs < 5000) {
            motor = 'Rápido';
        } else if (avgMs > 12000) {
            motor = 'Lento';
        } else {
            if (diff >= Math.ceil(total * 0.25)) {
                motor = 'Rápido';
            } else if (diff <= 1) {
                motor = 'Lento';
            } else {
                motor = 'Medio';
            }
        }

        // Motor tiebreaker: when too many "Medio", nudge based on avgMs
        if (sessionCtx && motor === 'Medio' && sessionCtx.priorMotors.length >= 3) {
            const medioRatio = sessionCtx.priorMotors.filter(m => m === 'Medio').length
                / sessionCtx.priorMotors.length;
            if (medioRatio > 0.6) {
                motor = avgMs < 8500 ? 'Rápido' : 'Lento';
                tiebreakerApplied = true;
            }
        }
    }

    // — Secondary eje (sub-profile) —
    // If tiebreaker changed the dominant, recalculate sorted order for secondary
    const ejeSecundario = dominantAxis === sorted[0]
        ? sorted[1]
        : sorted[0]; // original top becomes secondary

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
        ejeSecundario,
        tendenciaLabel: TENDENCIA_LABELS[ejeSecundario],
        tiebreakerApplied,
    };
}
