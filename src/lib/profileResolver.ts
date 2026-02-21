
import { EjeInput, MotorInput, ARQUETIPOS } from './argosEngine';

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
