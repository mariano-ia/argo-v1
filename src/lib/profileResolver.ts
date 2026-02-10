
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
    const counts: Record<AnswerOption, number> = {
        IMP: 0,
        CON: 0,
        SOS: 0,
        EST: 0
    };

    answers.forEach(a => {
        if (counts[a] !== undefined) {
            counts[a]++;
        }
    });

    // Determine Dominant Axis
    // Mapping: IMP->D, CON->I, SOS->S, EST->C
    const scores = [
        { type: 'IMP', axis: 'D', count: counts.IMP },
        { type: 'CON', axis: 'I', count: counts.CON },
        { type: 'SOS', axis: 'S', count: counts.SOS },
        { type: 'EST', axis: 'C', count: counts.EST }
    ];

    // Sort by count descending. Tie-break: maintain order (IMP > CON > SOS > EST)
    scores.sort((a, b) => b.count - a.count);

    const dominant = scores[0];
    let axis = dominant.axis as EjeInput;
    
    // Check for C+S special case (Estratega Observador)
    // If C is high and S is also high? Or just specific mapping.
    // The current argosEngine uses 'C+S' as an axis key for "Estratega Observador".
    // If EST (C) is dominant, we might check if SOS (S) is secondary and close?
    // For simplicity, sticking to the primary mapping unless forced.
    // However, the user mentioned "Estratega Observador" (which translates to C+S in argosEngine).
    // Let's assume if C is dominant, it maps to C+S logic if that's the only C archetype, 
    // BUT argosEngine has:
    // D -> Impulsor
    // I -> Conector
    // C+S -> Estratega
    // So if Axis is C, we might need to Output C+S to match the ID.
    if (axis === 'C') {
        axis = 'C+S';
    }

    // Determine Motor
    // D/I -> Rápido
    // S/C -> Lento
    let motor: MotorInput = 'Lento'; // default
    if (axis === 'D' || axis === 'I') {
        motor = 'Rápido';
    } else {
        motor = 'Lento';
    }

    // Find label
    const arch = ARQUETIPOS.find(a => a.eje === axis && a.motor === motor);
    
    return {
        counts,
        eje: axis,
        motor,
        arquetipoLabel: arch ? arch.label : 'Desconocido',
        arquetipoId: arch ? arch.id : 'unknown'
    };
}
