
import { AnswerOption } from './profileResolver';

export const NAMES = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastián', 'Martín', 'Lucía', 'Nicolás', 'Mariana'];
export const SPORTS = ['Hockey', 'Fútbol', 'Tenis', 'Rugby', 'Natación', 'Basquet', 'Voley', 'Atletismo'];

// Placeholder questions - since the exact text wasn't found, we simulate the structure
export const QUESTIONS = [
    { id: 1, text: "Pregunta 1: ¿Cómo reaccionas ante un desafío inesperado?" },
    { id: 2, text: "Pregunta 2: ¿Qué valoras más en un equipo?" },
    { id: 3, text: "Pregunta 3: ¿Cuál es tu estilo de comunicación bajo presión?" },
    { id: 4, text: "Pregunta 4: ¿Cómo manejas las derrotas?" },
    { id: 5, text: "Pregunta 5: ¿Qué te motiva a entrenar?" },
    { id: 6, text: "Pregunta 6: ¿Cómo tomas decisiones importantes?" },
    { id: 7, text: "Pregunta 7: ¿Qué rol sueles asumir naturalmente?" },
    { id: 8, text: "Pregunta 8: ¿Cómo prefieres recibir feedback?" },
    { id: 9, text: "Pregunta 9: ¿Qué te frustra más de tus compañeros?" },
    { id: 10, text: "Pregunta 10: ¿Cómo preparas un partido importante?" },
    { id: 11, text: "Pregunta 11: ¿Qué buscas en un entrenador?" },
    { id: 12, text: "Pregunta 12: ¿Cuál es tu mayor fortaleza mental?" }
];

export const OPTIONS: AnswerOption[] = ['IMP', 'CON', 'SOS', 'EST'];

export interface SimulationState {
    name: string;
    sport: string;
    age: number;
    answers: Record<number, AnswerOption>;
}

export function generateRandomSimulation(): SimulationState {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const sport = SPORTS[Math.floor(Math.random() * SPORTS.length)];
    const age = Math.floor(Math.random() * (35 - 15 + 1)) + 15; // Random age 15-35

    const answers: Record<number, AnswerOption> = {};
    QUESTIONS.forEach(q => {
        answers[q.id] = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
    });

    return {
        name,
        sport,
        age,
        answers
    };
}
