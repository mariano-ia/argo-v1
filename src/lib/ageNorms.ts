// src/lib/ageNorms.ts
// Age normalisation for the mini-game tempo insights (spec §2.3/§2.4, R4-D/E/F).
// Multiplicative rescaling (Kail): age-fair value = raw / f(edad). f interpolated by MONTHS.
//
// HONEST DEFAULT (owner decision #2, 2026-07-06): there are NO real per-age-cell p33/p67 norms
// yet, so there is no defensible cut. Until a real Argo population exists, `tempoZona` is ALWAYS
// null (=> 'intermedio'): we never assert 'rápido'/'lento' off bibliographic seed ranges. The
// score is still computed (for the wide interval / future calibration), but no zone is claimed.
// Roadmap to real norms: spec §14.1 (población Argo, excluding is_demo + owners).

import type { MotorZona } from './evidenceFicha';

// Bibliographic seed anchors (Kail-style developmental slowing of processing speed). f=1.00 ≈ 16y.
const FACTOR_ANCHORS: Record<number, number> = {
  8: 1.45, 9: 1.38, 10: 1.30, 11: 1.23, 12: 1.16, 13: 1.10, 14: 1.05, 15: 1.02, 16: 1.00,
};

/** f(edad): interpolated by months between bibliographic anchors, clamped to [8,16] years. */
export function factorEdad(edadMeses: number): number {
  const years = Math.max(8, Math.min(16, edadMeses / 12));
  const lo = Math.floor(years);
  const hi = Math.min(16, lo + 1);
  if (lo === hi) return FACTOR_ANCHORS[lo];
  const frac = years - lo;
  return FACTOR_ANCHORS[lo] + (FACTOR_ANCHORS[hi] - FACTOR_ANCHORS[lo]) * frac;
}

/** Age-fair value: multiplicative rescaling (divide by f => floor AND range scale by f, per Kail). */
export function ageFairMs(rawMs: number, f: number): number {
  return rawMs / f;
}

// Seed 0-100 mapping ranges (bibliographic; recalibrate with real data — spec §14.1).
const LATENCY_RANGE = { fast: 800, slow: 5000 };
const REACTION_RANGE = { fast: 200, slow: 1500 };
function toScore(v: number, r: { fast: number; slow: number }): number {
  return Math.max(0, Math.min(100, (1 - (v - r.fast) / (r.slow - r.fast)) * 100));
}

/** Tempo score 0-100 from the age-fair decision + reaction values (0.50/0.50). Adaptation is NOT included. */
export function tempoScoreFromAgeFair(latencyAf: number | null, reactionAf: number | null): number | null {
  const parts: number[] = [];
  if (latencyAf != null) parts.push(toScore(latencyAf, LATENCY_RANGE));
  if (reactionAf != null) parts.push(toScore(reactionAf, REACTION_RANGE));
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((s, x) => s + x, 0) / parts.length);
}

/**
 * Tempo zone. Returns null (=> 'intermedio') until real per-age-cell percentile norms exist:
 * with only bibliographic seed ranges the confidence interval crosses any cut, so no zone is asserted.
 */
export function tempoZonaFromScore(_score: number | null): MotorZona | null {
  return null;
}
