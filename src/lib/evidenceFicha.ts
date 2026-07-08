// src/lib/evidenceFicha.ts
// Data contract for the redesigned Argo method (v4). Capa 1 (deterministic) PRODUCES an
// EvidenceFicha; render, AI, persistence, dashboard and coach CONSUME it.
// Hard rules: (1) the name comes ONLY from `votes`, never from the motor; (2) no tempo word
// (Dinámico/Rítmico/Sereno/Observador/Rápido/Medio/Lento/reflexivo/ágil) enters `arquetipoLabel`;
// (3) `tempoZona` degrades to 'intermedio' (zona=null) when the confidence interval crosses the cut;
// (4) every field is serialisable to jsonb (the whole ficha persists — spec §10).
// Names: docs/archetype-naming.md · Calc: docs/METODO-CALCULO-NUEVO.md

import type { IslandMetrics } from '../components/games/IslasDesconocidas';
import type { RhythmMetrics } from '../components/onboarding/screens/MiniGame1';
import type { AdaptationMetrics } from '../components/games/LaTormenta';
import type { AnswerRecord, DiscSignals } from './dischSignals';

export type Axis = 'D' | 'I' | 'S' | 'C';
export type Banda = 'mezcla' | 'con_matices' | 'definido';
// Registro de TONO (owner 2026-07-07): la firmeza es sobre el DATO (el margen de votos, un hecho),
// el "potencial" sobre la LECTURA (presente/tendencia). Los 4 niveles suenan distinto pero TODOS
// nombran el perfil. 'rotundo' cita la cifra; ninguno afirma rasgo permanente.
export type Registro = 'parejo' | 'matices' | 'claro' | 'rotundo';
export type FormaId =
  | 'duo_empate' | 'equilibrio' | 'duo' | 'versatil'
  | 'lider_acompanante' | 'definido' | 'muy_definido';
export type VetaBanda = 'sin' | 'tentativa' | 'afirmada';
export type MotorZona = 'lento' | 'intermedio' | 'rapido';

/** Evidencia de votos (elecciones DISC). Produce el NOMBRE; el motor no participa. */
export interface VotesEvidence {
  vector: Record<Axis, number>;   // conteos crudos, suman 12
  ejePrimario: Axis;
  ejeSecundario: Axis;
  topCount: number;
  secondCount: number;
  thirdCount: number;
  B: number;                      // top-second, gatea el primario
  B2: number;                     // second-third, gatea la veta
  nEjesFuertes: number;           // ejes con conteo >= topCount-1
  secundarioEmpatado: boolean;    // second == third
  banda: Banda;
  registro: Registro;
  forma: FormaId;
  nombrarPrimario: boolean;       // B>=4 || (B>=2 && topCount>=7)
  vetaBanda: VetaBanda;           // B2<=1 sin / 2-3 tentativa / >=4 afirmada
  vetaOpuesta: boolean;           // eje secundario diagonal opuesto (D<->S, I<->C)
  vetaEnNombre: boolean;          // (para el gráfico) veta lo bastante fuerte para el nombre duro
  // REGLA DURA (owner 2026-07-07): SIEMPRE hay perfil + veta en el encabezado, sin importar la fuerza.
  // El gráfico de confianza (banda/registro) dice cuánto está definido; NUNCA se oculta el nombre.
  arquetipoLabel: string;         // siempre "[Primario] con veta [Secundario]" (o solo primario si el 2º tiene 0 votos)
}

/** Un sub-motor medido (age-fair). El intervalo ANCHO manda: si cruza el corte, zona=null. */
export interface SubMotor {
  rawMs: number;
  ageFair: number;                // rawMs / factorEdad
  nTrials: number;                // arrays.length real (N de ensayos)
  percentilCelda: number | null;  // percentil del valor age-fair dentro de la celda de edad
  ic: [number, number];           // intervalo de confianza ANCHO
  zona: MotorZona | null;         // null (=> 'intermedio') si el IC cruza p33/p67
  confianza: 'media' | 'baja';
}

/** Insights de los mini-juegos (per-child). NO nombra. Lectura normativa por edad. */
export interface MotorInsight {
  narratable: boolean;            // false si falta Juego A o B, o fallback por tiempo
  edadMeses: number;
  factorEdad: number;             // f(edad) interpolado por meses
  normaLabel: 'referencia_bibliografica' | 'poblacion_argo';
  decision: SubMotor | null;      // Juego A (latencia de decisión)
  reaction: SubMotor | null;      // Juego B (tiempo de reacción)
  adaptation: SubMotor | null;    // Juego C (reacomodo) — NO entra al tempo; alimenta §5
  tempoScore: number | null;      // 0.50*latencia_af + 0.50*reaccion_af, clamp[0,100]
  tempoZona: MotorZona | null;
}

/** La ficha completa que persiste (jsonb) y regenera el informe de forma determinista. */
export interface EvidenceFicha {
  version: 4;
  methodVersion: string;          // 'v4'
  questionVersion: string;
  votes: VotesEvidence;
  motor: MotorInsight;
  gameMetricsRaw: {
    impulse: IslandMetrics | null;
    rhythm: RhythmMetrics | null;
    adaptation: AdaptationMetrics | null;
  };
  // Autocontenida: las respuestas per-answer + las señales individuales viven en la ficha,
  // así el informe (temas, contingencia, evolución) regenera solo desde evidence_ficha jsonb.
  respuestas: AnswerRecord[];   // length 12 (número de escena, eje, tiempo) — spec §4
  signals: DiscSignals;         // receta + contingencia + ritmoAcople (individuación DISC)
}
