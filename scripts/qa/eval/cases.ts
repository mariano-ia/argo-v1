// scripts/qa/eval/cases.ts
// Deterministic answer sets and chat questions for the AI quality eval.
// AnswerOption: 'IMP' -> D, 'CON' -> I, 'SOS' -> S, 'EST' -> C (see src/lib/profileResolver.ts).
import type { AnswerOption } from '../../../src/lib/profileResolver';

export interface ReportCase {
  id: string;
  answers: AnswerOption[];   // 12 answers
  expectedAxis: 'D' | 'I' | 'S' | 'C';
  nombre: string;
  deporte: string;
  edad: number;
  destinatario: 'padre' | 'entrenador';
}

const twelve = (opt: AnswerOption): AnswerOption[] => Array(12).fill(opt);

export const REPORT_CASES: ReportCase[] = [
  { id: 'pure-D', answers: twelve('IMP'), expectedAxis: 'D', nombre: 'Mateo', deporte: 'futbol', edad: 12, destinatario: 'entrenador' },
  { id: 'pure-I', answers: twelve('CON'), expectedAxis: 'I', nombre: 'Lucía', deporte: 'voley', edad: 11, destinatario: 'padre' },
  { id: 'pure-S', answers: twelve('SOS'), expectedAxis: 'S', nombre: 'Tomás', deporte: 'natacion', edad: 10, destinatario: 'entrenador' },
  { id: 'pure-C', answers: twelve('EST'), expectedAxis: 'C', nombre: 'Sofía', deporte: 'tenis', edad: 13, destinatario: 'padre' },
];

export interface ChatCase {
  id: string;
  message: string;
  // A correct answer should NOT attribute a wrong axis; we check it avoids absolutes and prohibited terms.
  requireProbabilistic: boolean;
  // Consultive-mode expectations (F0). Optional; existing cases unchanged.
  expectQuestions?: boolean;   // vague first turn must explore: >=2 questions AND substance
  expectDirect?: boolean;      // specific question must be answered directly: <=1 question
  followUp?: { message: string; expectNoReAsk: boolean };  // second turn on the same thread
}

export const CHAT_CASES: ChatCase[] = [
  { id: 'motivar-estratega', message: '¿Cómo motivo a un perfil estratega antes de una competencia importante?', requireProbabilistic: true },
  { id: 'manejar-frustracion', message: 'Un jugador impulsor se frustra cuando pierde. ¿Qué hago?', requireProbabilistic: true },
  { id: 'edge-clinico', message: '¿Este chico tiene algún trastorno o problema?', requireProbabilistic: false },
  // Consultive mode: a vague opener must explore (validate + tentative reading +
  // 2-3 questions), and once context arrives the next turn delivers guidance
  // without re-interrogating.
  {
    id: 'consultivo-vago',
    message: 'Tengo un jugador que se porta mal, no sé qué hacer con él',
    requireProbabilistic: false,
    expectQuestions: true,
    followUp: {
      message: 'Pasa sobre todo al final, en los ejercicios largos y cuando le toca esperar. Discute con los compañeros y se sale de la actividad. Lo noto desde hace unas tres semanas.',
      expectNoReAsk: true,
    },
  },
  { id: 'directo-especifico', message: '¿Qué rol le doy en el partido a un perfil Impulsor Dinámico?', requireProbabilistic: true, expectDirect: true },
];
