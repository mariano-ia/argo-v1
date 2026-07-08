// src/lib/nullDistribution.test.ts  (run via: tsx --test)
// Ties the TypeScript classification functions to the frozen constants: enumerating the 455
// compositions with classifyForma/nameGate must reproduce FORMA_STATS and NAME_GATE_MASS.
// This is the TS-side mirror of scripts/enum-bandas.mjs / scripts/test-formas.mjs.
import test from 'node:test';
import assert from 'node:assert';
import {
  classifyForma, classifyBanda, classifyRegistro, nameGate, classifyVetaBanda, isOppositeAxis,
  FORMA_STATS, NAME_GATE_MASS,
} from './nullDistribution';

const N = 12;
const P = Math.pow(0.25, 12);
const fact = (n: number): number => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

test('classifyForma reproduces the frozen 455-composition cascade', () => {
  const stat: Record<string, { comps: number; mass: number }> = {};
  let comps = 0, total = 0;
  for (let a = 0; a <= N; a++)
    for (let b = 0; b <= N - a; b++)
      for (let c = 0; c <= N - a - b; c++) {
        const d = N - a - b - c;
        if (d < 0) continue;
        comps++;
        const s = [a, b, c, d].sort((x, y) => y - x);
        const p = (fact(N) / (fact(a) * fact(b) * fact(c) * fact(d))) * P;
        const f = classifyForma(s);
        stat[f] = stat[f] || { comps: 0, mass: 0 };
        stat[f].comps++; stat[f].mass += p; total += p;
      }
  assert.strictEqual(comps, 455);
  assert.strictEqual(+(total * 100).toFixed(2), 100.0);
  for (const [f, exp] of Object.entries(FORMA_STATS)) {
    assert.strictEqual(stat[f].comps, exp.comps, `${f} comps`);
    assert.strictEqual(+(stat[f].mass * 100).toFixed(2), exp.mass, `${f} mass`);
  }
});

test('nameGate reproduces the adopted 7.68% null mass', () => {
  let m = 0;
  for (let a = 0; a <= N; a++)
    for (let b = 0; b <= N - a; b++)
      for (let c = 0; c <= N - a - b; c++) {
        const d = N - a - b - c;
        if (d < 0) continue;
        const s = [a, b, c, d].sort((x, y) => y - x);
        const p = (fact(N) / (fact(a) * fact(b) * fact(c) * fact(d))) * P;
        if (nameGate(s[0] - s[1], s[0])) m += p;
      }
  assert.strictEqual(+(m * 100).toFixed(2), NAME_GATE_MASS.adopted);
});

test('band / registro (4 niveles de tono) / veta thresholds', () => {
  assert.strictEqual(classifyBanda(4), 'definido');
  assert.strictEqual(classifyBanda(3), 'con_matices');
  assert.strictEqual(classifyBanda(1), 'mezcla');
  // registro de tono: rotundo B>=6, claro B=4-5, matices B=2-3, parejo B<=1 (owner 2026-07-07)
  assert.strictEqual(classifyRegistro(6), 'rotundo');
  assert.strictEqual(classifyRegistro(4), 'claro');
  assert.strictEqual(classifyRegistro(2), 'matices');
  assert.strictEqual(classifyRegistro(1), 'parejo');
  assert.strictEqual(classifyVetaBanda(4), 'afirmada');
  assert.strictEqual(classifyVetaBanda(2), 'tentativa');
  assert.strictEqual(classifyVetaBanda(1), 'sin');
});

test('opposite axes are the DISC diagonals D<->S and I<->C', () => {
  assert.ok(isOppositeAxis('D', 'S'));
  assert.ok(isOppositeAxis('I', 'C'));
  assert.ok(!isOppositeAxis('D', 'I'));
  assert.ok(!isOppositeAxis('D', 'C'));
});
