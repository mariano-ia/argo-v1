// src/lib/profileResolver.v4.test.ts  (run via: tsx --test)
// Canonical cases for the v4 engine (buildVotesEvidence / resolveMotorInsights).
import test from 'node:test';
import assert from 'node:assert';
import { buildVotesEvidence, resolveMotorInsights, resolveEvidenceFicha } from './profileResolver';
import { factorEdad } from './ageNorms';

const vec = (D: number, I: number, S: number, C: number) => ({ D, I, S, C });

test('4-3-3-2 => B=1 versatil, no name', () => {
  const v = buildVotesEvidence(vec(4, 3, 3, 2));
  assert.strictEqual(v.B, 1);
  assert.strictEqual(v.forma, 'versatil');
  assert.strictEqual(v.nombrarPrimario, false);
  assert.strictEqual(v.arquetipoLabel, null);
});

test('5-3-2-2 => B=2 top=5<7, co-líderes sin sustantivo', () => {
  const v = buildVotesEvidence(vec(5, 3, 2, 2));
  assert.strictEqual(v.B, 2);
  assert.strictEqual(v.topCount, 5);
  assert.strictEqual(v.nombrarPrimario, false);
  assert.strictEqual(v.arquetipoLabel, null);
});

test('6-2-2-2 => B=4 nombra (definido), registro tentativo, primario puro (B2=0)', () => {
  const v = buildVotesEvidence(vec(6, 2, 2, 2));
  assert.strictEqual(v.B, 4);
  assert.strictEqual(v.forma, 'definido');
  assert.strictEqual(v.banda, 'definido');
  assert.strictEqual(v.registro, 'tentativo'); // B=4 tentativo (A9)
  assert.strictEqual(v.nombrarPrimario, true);
  assert.strictEqual(v.vetaBanda, 'sin');
  assert.strictEqual(v.arquetipoLabel, 'Impulsor');
});

test('12-0-0-0 => muy_definido, registro claridad, primario puro', () => {
  const v = buildVotesEvidence(vec(12, 0, 0, 0));
  assert.strictEqual(v.forma, 'muy_definido');
  assert.strictEqual(v.registro, 'claridad');
  assert.strictEqual(v.arquetipoLabel, 'Impulsor');
});

test('veta afirmada no-opuesta entra al nombre (D con veta C)', () => {
  const v = buildVotesEvidence(vec(7, 0, 0, 5)); // D=7, C=5
  assert.strictEqual(v.ejePrimario, 'D');
  assert.strictEqual(v.ejeSecundario, 'C');
  assert.strictEqual(v.B, 2);
  assert.strictEqual(v.topCount, 7);
  assert.strictEqual(v.nombrarPrimario, true);
  assert.strictEqual(v.B2, 5);
  assert.strictEqual(v.vetaBanda, 'afirmada');
  assert.strictEqual(v.vetaOpuesta, false);
  assert.strictEqual(v.vetaEnNombre, true);
  assert.strictEqual(v.arquetipoLabel, 'Impulsor con veta Estratega');
});

test('veta OPUESTA no entra al nombre (D con veta S) => primario puro', () => {
  const v = buildVotesEvidence(vec(7, 0, 5, 0)); // D=7, S=5
  assert.strictEqual(v.ejePrimario, 'D');
  assert.strictEqual(v.ejeSecundario, 'S');
  assert.strictEqual(v.vetaBanda, 'afirmada');
  assert.strictEqual(v.vetaOpuesta, true);
  assert.strictEqual(v.vetaEnNombre, false);
  assert.strictEqual(v.arquetipoLabel, 'Impulsor');
});

test('motor: sin juegos => no narratable, sin zona', () => {
  const m = resolveMotorInsights({}, 12 * 12);
  assert.strictEqual(m.narratable, false);
  assert.strictEqual(m.tempoZona, null);
  assert.strictEqual(m.tempoScore, null);
});

test('motor: impulse+rhythm => narratable, zona null (seed), adaptation fuera del tempo', () => {
  const games = {
    impulse: { avgLatency: 1500, latencies: [1500, 1500], stdDevLatency: 0, totalTimeMs: 3000, trend: 0 } as never,
    rhythm: { avgReaction: 400, reactionTimes: [400, 400], totalTaps: 2, extraTaps: 5, avgCadence: 0, trend: 0 } as never,
    adaptation: { avgAdaptation: 900, adaptationTimes: [900], inertiaErrors: 3, correctTaps: 1, wrongTaps: 0, totalTimeMs: 900 } as never,
  };
  const m = resolveMotorInsights(games, 10 * 12);
  assert.strictEqual(m.narratable, true);
  // fast games (1500ms latency, 400ms reaction @10y) => high age-fair score => 'rapido' zone
  assert.strictEqual(m.tempoZona, 'rapido');
  assert.ok(m.tempoScore !== null && m.tempoScore >= 60);
  assert.ok(m.decision && m.reaction && m.adaptation);
  assert.strictEqual(m.factorEdad, factorEdad(120));
});

test('resolveEvidenceFicha assembles a v4 ficha', () => {
  const answers = [
    ...Array(6).fill({ axis: 'D', responseTimeMs: 1000 }),
    ...Array(2).fill({ axis: 'I', responseTimeMs: 1000 }),
    ...Array(2).fill({ axis: 'S', responseTimeMs: 1000 }),
    ...Array(2).fill({ axis: 'C', responseTimeMs: 1000 }),
  ];
  const f = resolveEvidenceFicha(answers as never, { edadMeses: 144, questionVersion: 'q1' });
  assert.strictEqual(f.version, 4);
  assert.strictEqual(f.methodVersion, 'v4');
  assert.strictEqual(f.votes.ejePrimario, 'D');
  assert.strictEqual(f.votes.arquetipoLabel, 'Impulsor'); // 6-2-2-2
  assert.strictEqual(f.motor.narratable, false);
});
