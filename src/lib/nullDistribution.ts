// src/lib/nullDistribution.ts
// Frozen null-distribution constants (EXACT enumeration of the 455 compositions of 12 votes
// over 4 axes, multinomial(12, 1/4)) + the pure classification primitives used by the resolver.
// The numbers are reproduced independently by scripts/enum-bandas.mjs, scripts/test-formas.mjs
// and src/lib/nullDistribution.test.ts (all in qa:unit) — if any drifts, its check fails.
// Spec §3/§6/§7 of docs/METODO-CALCULO-NUEVO.md. Change a threshold here => update the spec,
// the .mjs checks and docs/archetype-naming.md together.

import type { Axis, Banda, Registro, FormaId, VetaBanda } from './evidenceFicha';

/** Masas del nulo por brecha del primario B = 1º−2º (en %). */
export const P_B = {
  eq0: 22.79, eq1: 36.48, eq2: 23.85, eq3: 9.82, eq4: 4.28, eq5: 1.98, ge6: 0.79,
  ge2: 40.73, ge4: 7.06, ge5: 2.78, range2to4: 37.95, le1: 59.27,
} as const;

/** Masa del nulo del name-gate adoptado y sus componentes. */
export const NAME_GATE_MASS = {
  adopted: 7.68,        // B≥4 OR (B≥2 ∧ top≥7)  <- adoptado
  component_top7: 5.70, // B≥2 ∧ top≥7
  old_top6: 20.90,      // B≥2 ∧ top≥6 (retirado, demasiado laxo)
} as const;

/** Veta B2 = 2º−3º: marginal sobre las 455 y condicional a primario con brecha ≥1. */
export const P_B2 = {
  marginal: { le1: 71.40, range2to3: 26.49, ge3: 5.86, ge4: 2.11 },
  condB1: { le1: 75.72, range2to3: 23.14, ge4: 1.15 }, // denominador P(B≥1)=77.21%
  pB1: 77.21,
} as const;

/** Blend completo en el nombre y monitor de opuestos (spec §1/§3.2). */
export const BLEND_NULL = {
  blendNamed: 0.092,            // P(B2≥4 ∧ primario nombrado)
  blendNamedNonOpposite: 0.061, // ×2/3 (las que sí entran al nombre)
  oppositeMonitorJoint: 0.295,  // P(B2≥4 ∧ B≥1 ∧ opuesto); nulo condicional = 1/3
} as const;

/** Cascada de 7 formas (spec §6): comps de las 455 y masa nula. */
export const FORMA_STATS: Record<FormaId, { comps: number; mass: number }> = {
  duo_empate: { comps: 30, mass: 9.85 },
  equilibrio: { comps: 17, mass: 12.94 },
  duo: { comps: 72, mass: 16.65 },
  versatil: { comps: 12, mass: 19.83 },
  lider_acompanante: { comps: 132, mass: 33.67 },
  definido: { comps: 88, mass: 6.27 },
  muy_definido: { comps: 104, mass: 0.79 },
};

/** Ejes opuestos (diagonales del círculo DISC). */
export const OPPOSITE: Record<Axis, Axis> = { D: 'S', S: 'D', I: 'C', C: 'I' };
export function isOppositeAxis(a: Axis, b: Axis): boolean {
  return OPPOSITE[a] === b;
}

/** Banda de confianza del primario (B). */
export function classifyBanda(B: number): Banda {
  if (B >= 4) return 'definido';
  if (B >= 2) return 'con_matices';
  return 'mezcla';
}

/**
 * Registro de TONO por el margen de votos B = 1º−2º (owner 2026-07-07). 4 niveles, TODOS nombran el perfil:
 *   B≥6 'rotundo'  → suena fuerte, cita la cifra ("apareció en 10 de 12").
 *   B=4-5 'claro'  → "se define con claridad por X".
 *   B=2-3 'matices'→ "se inclina hacia X, con Y presente" (probabilístico, pero con nombre).
 *   B=0-1 'parejo' → "dos motores parejos: X y Y" (los dos en el nombre).
 * La firmeza es sobre el DATO; la lectura queda en presente/tendencia (nunca rasgo permanente).
 */
export function classifyRegistro(B: number): Registro {
  if (B >= 6) return 'rotundo';
  if (B >= 4) return 'claro';
  if (B >= 2) return 'matices';
  return 'parejo';
}

/** Name-gate del primario: sustantivo único solo si pasa. */
export function nameGate(B: number, topCount: number): boolean {
  return B >= 4 || (B >= 2 && topCount >= 7);
}

/** Confianza de la veta por su propia brecha B2 = 2º−3º. */
export function classifyVetaBanda(B2: number): VetaBanda {
  if (B2 >= 4) return 'afirmada';
  if (B2 >= 2) return 'tentativa';
  return 'sin';
}

/**
 * Cascada de forma sobre los conteos ORDENADOS descendente (suman 12).
 * n_ejes_fuertes = ejes con conteo ≥ top-1. Evalúa B=0 primero (mapea toda la banda Mezcla).
 * Debe reproducir FORMA_STATS sobre las 455 (verificado por los tests).
 */
export function classifyForma(sortedDesc: number[]): FormaId {
  const top = sortedDesc[0];
  const second = sortedDesc[1];
  const B = top - second;
  const nFuertes = sortedDesc.filter((x) => x >= top - 1).length;
  if (B === 0) return nFuertes === 2 ? 'duo_empate' : 'equilibrio';
  if (B === 1) return second >= 4 ? 'duo' : 'versatil';
  if (B <= 3) return 'lider_acompanante'; // B ∈ {2,3}
  if (B <= 5) return 'definido';          // B ∈ {4,5}
  return 'muy_definido';                   // B ≥ 6
}
