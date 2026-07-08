// src/lib/dischSignals.ts
// Señales INDIVIDUALES de DISC más allá del tipo (owner 2026-07-07): sacarle el mayor jugo a las 12
// elecciones para que el informe hable de ESTE chico, no de su arquetipo. Tres extractores:
//   1. receta       — el orden completo de sus 4 ejes (huella intra-individual).
//   2. contingencia — CUÁNDO aparece cada lado (qué eje eligió en cada contexto de escena).
//   3. ritmoAcople  — en qué eligió rápido y en qué se tomó su tiempo (velocidad × elección).
//
// REGLA DE ORO (no decirle "verde" a un chico "rojo"): toda afirmación individual se GATEA por robustez.
// Un patrón se afirma solo con ≥2 escenas de acuerdo; una elección suelta es literal, nunca "tiende a";
// si el dato no lo sostiene con claridad, se CALLA. Nunca se inventa un patrón desde ruido.

import type { Axis } from './evidenceFicha';

export interface AnswerRecord {
  questionId: string;   // 'q1'..'q12'
  number: number;       // 1..12 (para el mapa de contexto)
  axis: Axis;
  responseTimeMs: number;
}

// ── Mapa de contexto de las 12 escenas (versionado con questionVersion) ──
export type ContextId =
  | 'inicio' | 'disfrute' | 'decision' | 'adversidad' | 'esfuerzo' | 'espera' | 'equipo' | 'meta';
export const CONTEXT_MAP_V4: Record<number, ContextId> = {
  1: 'inicio', 2: 'inicio',        // El Despegue, El Nuevo Ritmo
  3: 'disfrute',                   // El Motor del Viaje
  4: 'decision',                   // La Encrucijada
  5: 'adversidad', 6: 'adversidad', 7: 'adversidad', // Caos, Desajuste, Error del Nudo
  8: 'esfuerzo', 11: 'esfuerzo',   // El Empuje, La Práctica Final
  9: 'espera',                     // La Espera
  10: 'equipo',                    // El Apoyo
  12: 'meta',                      // La Meta
};
/** Contextos con ≥2 escenas → pueden formar un patrón robusto. El resto es solo literal. */
export const MULTI_CONTEXTS: ContextId[] = ['inicio', 'adversidad', 'esfuerzo'];

// ═══ 1. RECETA — el orden completo de los 4 ejes (intra-individual, es un hecho) ═══
export type Presencia = 'principal' | 'presente' | 'apenas' | 'ausente';
export interface RecetaItem { axis: Axis; count: number; presencia: Presencia; }

export function computeReceta(vector: Record<Axis, number>): RecetaItem[] {
  const axes: Axis[] = ['D', 'I', 'S', 'C'];
  const sorted = [...axes].sort((a, b) => vector[b] - vector[a]);
  return sorted.map((axis, i) => {
    const count = vector[axis];
    const presencia: Presencia =
      i === 0 ? 'principal' : count >= 3 ? 'presente' : count >= 1 ? 'apenas' : 'ausente';
    return { axis, count, presencia };
  });
}

// ═══ 2. CONTINGENCIA — qué eje eligió en cada contexto (SOLO patrones robustos) ═══
export interface Patron {
  context: ContextId;
  axis: Axis;
  support: number;   // cuántas escenas del contexto eligieron ese eje
  deTotal: number;   // escenas del contexto respondidas
  esDesvio: boolean; // el eje del patrón ≠ el primario (donde "cambia de registro")
}
export interface Contingencia { patrones: Patron[]; contextosVaria: ContextId[]; }

export function computeContingencia(answers: AnswerRecord[], primario: Axis): Contingencia {
  const byCtx = new Map<ContextId, Axis[]>();
  for (const a of answers) {
    const ctx = CONTEXT_MAP_V4[a.number];
    if (!ctx) continue;
    (byCtx.get(ctx) ?? byCtx.set(ctx, []).get(ctx)!).push(a.axis);
  }
  const patrones: Patron[] = [];
  const contextosVaria: ContextId[] = [];
  for (const ctx of MULTI_CONTEXTS) {
    const chosen = byCtx.get(ctx);
    if (!chosen || chosen.length < 2) continue;
    const counts: Partial<Record<Axis, number>> = {};
    chosen.forEach((ax) => { counts[ax] = (counts[ax] ?? 0) + 1; });
    const ranked = (Object.entries(counts) as [Axis, number][]).sort((a, b) => b[1] - a[1]);
    const [axis, support] = ranked[0];
    // CANDADO (panel 2026-07-08): afirmar patrón SOLO con UNANIMIDAD en un contexto de ≥3
    // escenas (3 de 3). En 3 escenas, "2 de 3" ocurre por azar el 62.5% de las veces: afirmarlo
    // fabricaría un rasgo. Los contextos de 2 escenas (inicio, esfuerzo) no afirman; van a "varía".
    // Cuando el dato no alcanza, la sección se calla (buildContingenciaSection => null).
    if (support === chosen.length && chosen.length >= 3) {
      patrones.push({ context: ctx, axis, support, deTotal: chosen.length, esDesvio: axis !== primario });
    } else {
      contextosVaria.push(ctx);
    }
  }
  return { patrones, contextosVaria };
}

// ═══ 3. RITMO ACOPLADO — rápido vs lento contra SU propia mediana (conservador) ═══
export interface RitmoAcople { direccion: 'primario_rapido' | 'primario_lento'; brecha: number; }

export function computeRitmoAcople(answers: AnswerRecord[], primario: Axis): RitmoAcople | null {
  const valid = answers.filter((a) => Number.isFinite(a.responseTimeMs) && a.responseTimeMs > 0);
  const prim = valid.filter((a) => a.axis === primario);
  const noPrim = valid.filter((a) => a.axis !== primario);
  if (prim.length < 3 || noPrim.length < 3) return null; // muy poca base ⇒ silencio
  const rts = valid.map((a) => a.responseTimeMs).sort((x, y) => x - y);
  const median = rts[Math.floor(rts.length / 2)];
  const fastRate = (arr: AnswerRecord[]) => arr.filter((a) => a.responseTimeMs < median).length / arr.length;
  const brecha = fastRate(prim) - fastRate(noPrim);
  if (Math.abs(brecha) < 0.5) return null; // sin separación clara ⇒ silencio (señal ruidosa)
  return { direccion: brecha > 0 ? 'primario_rapido' : 'primario_lento', brecha: +brecha.toFixed(2) };
}

/** Las 3 señales juntas (se computan sobre la ficha y alimentan las secciones individuales del informe). */
export interface DiscSignals { receta: RecetaItem[]; contingencia: Contingencia; ritmoAcople: RitmoAcople | null; }
export function computeDiscSignals(vector: Record<Axis, number>, answers: AnswerRecord[], primario: Axis): DiscSignals {
  return {
    receta: computeReceta(vector),
    contingencia: computeContingencia(answers, primario),
    ritmoAcople: computeRitmoAcople(answers, primario),
  };
}
