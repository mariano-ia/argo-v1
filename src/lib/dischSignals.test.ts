// src/lib/dischSignals.test.ts  (run via: tsx --test)
// Las 3 señales individuales, y sobre todo la REGLA DE ORO: sin patrón robusto, se calla (no inventa).
import test from 'node:test';
import assert from 'node:assert';
import { computeReceta, computeContingencia, computeRitmoAcople } from './dischSignals';

type Ax = 'D' | 'I' | 'S' | 'C';
const ans = (number: number, axis: Ax, responseTimeMs = 1000) => ({ questionId: `q${number}`, number, axis, responseTimeMs });

test('receta: 8-3-1-0 => orden con presencia intra-individual', () => {
  const r = computeReceta({ D: 8, C: 3, I: 1, S: 0 });
  assert.deepStrictEqual(r.map((x) => [x.axis, x.presencia]), [
    ['D', 'principal'], ['C', 'presente'], ['I', 'apenas'], ['S', 'ausente'],
  ]);
});

test('contingencia: patrones robustos + marca el desvío (cambia de registro)', () => {
  const answers = [
    ans(1, 'D'), ans(2, 'D'),            // inicio: D,D
    ans(3, 'D'), ans(4, 'D'),
    ans(5, 'C'), ans(6, 'C'), ans(7, 'D'), // adversidad: C,C,D => C (desvío)
    ans(8, 'D'), ans(11, 'D'),           // esfuerzo: D,D
    ans(9, 'D'), ans(10, 'I'), ans(12, 'D'),
  ];
  const c = computeContingencia(answers, 'D');
  const inicio = c.patrones.find((p) => p.context === 'inicio');
  const adv = c.patrones.find((p) => p.context === 'adversidad');
  const esf = c.patrones.find((p) => p.context === 'esfuerzo');
  assert.strictEqual(inicio?.axis, 'D'); assert.strictEqual(inicio?.esDesvio, false);
  assert.strictEqual(adv?.axis, 'C'); assert.strictEqual(adv?.esDesvio, true); assert.strictEqual(adv?.support, 2);
  assert.strictEqual(esf?.axis, 'D');
  assert.deepStrictEqual(c.contextosVaria, []);
});

test('REGLA DE ORO: adversidad 1-1-1 (todas distintas) => NO afirma patrón, cae a "varía"', () => {
  const answers = [
    ans(1, 'D'), ans(2, 'D'),
    ans(5, 'D'), ans(6, 'I'), ans(7, 'S'), // adversidad: 3 ejes distintos => sin mayoría
    ans(8, 'D'), ans(11, 'D'),
  ];
  const c = computeContingencia(answers, 'D');
  assert.ok(c.contextosVaria.includes('adversidad'));
  assert.ok(!c.patrones.some((p) => p.context === 'adversidad')); // no inventa un patrón
});

test('REGLA DE ORO: contexto de 2 escenas dividido (1-1) => varía, no patrón', () => {
  const answers = [ans(1, 'D'), ans(2, 'I'), ans(5, 'C'), ans(6, 'C'), ans(7, 'C')];
  const c = computeContingencia(answers, 'D');
  assert.ok(c.contextosVaria.includes('inicio'));       // 1-1 no alcanza
  assert.strictEqual(c.patrones.find((p) => p.context === 'adversidad')?.axis, 'C'); // 3/3 sí
});

test('ritmoAcople: rápido en el primario, lento en el resto => primario_rapido', () => {
  const answers = [
    ans(1, 'D', 500), ans(2, 'D', 500), ans(3, 'D', 500), ans(4, 'D', 500), ans(8, 'D', 500), ans(11, 'D', 500),
    ans(5, 'C', 2000), ans(6, 'C', 2000), ans(7, 'I', 2000), ans(9, 'S', 2000), ans(10, 'I', 2000), ans(12, 'C', 2000),
  ];
  const r = computeRitmoAcople(answers, 'D');
  assert.strictEqual(r?.direccion, 'primario_rapido');
});

test('REGLA DE ORO: ritmo uniforme => se calla (null), no fuerza un acople', () => {
  const answers = [
    ans(1, 'D', 1000), ans(2, 'D', 1000), ans(3, 'D', 1000),
    ans(5, 'C', 1000), ans(6, 'C', 1000), ans(10, 'I', 1000),
  ];
  assert.strictEqual(computeRitmoAcople(answers, 'D'), null);
});
