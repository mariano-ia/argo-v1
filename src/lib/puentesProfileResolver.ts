import type {
    AdultAxis,
    AdultDominantEmotion,
    AdultHistory,
    AdultMotor,
    AdultPressureStyle,
    AdultProfile,
    Lang,
    PuentesAnswer,
} from '../types/puentes';
import { PUENTES_QUESTIONS, REQUIRED_QUESTION_IDS, type PuentesOption } from './puentesQuestions';

const SECONDARY_AXIS_THRESHOLD = 3;

function findOption(lang: Lang, questionId: string, optionId: string): PuentesOption | undefined {
    const questions = PUENTES_QUESTIONS[lang] ?? PUENTES_QUESTIONS.es;
    const q = questions.find(qq => qq.id === questionId);
    return q?.options.find(o => o.id === optionId);
}

export function resolveAdultProfile(answers: PuentesAnswer[], lang: Lang): AdultProfile {
    const answeredIds = new Set(answers.map(a => a.questionId));
    const missing = REQUIRED_QUESTION_IDS.filter(id => !answeredIds.has(id));
    if (missing.length > 0) {
        throw new Error(`Missing answers for: ${missing.join(',')}`);
    }

    const axisCounts: Record<AdultAxis, number> = { D: 0, I: 0, S: 0, C: 0 };
    const motorCounts: Record<AdultMotor, number> = { agil: 0, equilibrado: 0, profundo: 0 };
    const pressureCounts: Record<AdultPressureStyle, number> = { regulado: 0, reactivo: 0, evitativo: 0 };
    const contextValues: Record<string, string> = {};

    for (const a of answers) {
        const opt = findOption(lang, a.questionId, a.optionId);
        if (!opt) continue;
        if (opt.axis) axisCounts[opt.axis]++;
        if (opt.motor) motorCounts[opt.motor]++;
        if (opt.pressure) pressureCounts[opt.pressure]++;
        if (opt.contextKey && opt.contextValue) contextValues[opt.contextKey] = opt.contextValue;
    }

    const sortedAxes = (Object.entries(axisCounts) as [AdultAxis, number][])
        .sort((a, b) => b[1] - a[1]);
    const eje_primary = sortedAxes[0][0];
    const eje_secondary = sortedAxes[1][1] >= SECONDARY_AXIS_THRESHOLD ? sortedAxes[1][0] : null;

    const sortedMotors = (Object.entries(motorCounts) as [AdultMotor, number][])
        .sort((a, b) => b[1] - a[1]);
    const topMotorCount = sortedMotors[0][1];
    const topMotors = sortedMotors.filter(([, c]) => c === topMotorCount).map(([m]) => m);
    const motor: AdultMotor = topMotors.length > 1 ? 'equilibrado' : topMotors[0];

    const sortedPressure = (Object.entries(pressureCounts) as [AdultPressureStyle, number][])
        .sort((a, b) => b[1] - a[1]);
    const pressure_style = sortedPressure[0][0];

    return {
        eje_primary,
        eje_secondary,
        motor,
        pressure_style,
        history: (contextValues.history ?? 'none') as AdultHistory,
        dominant_emotion: (contextValues.dominant_emotion ?? 'mezcla') as AdultDominantEmotion,
    };
}
