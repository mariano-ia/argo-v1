// src/lib/profileResolver.v4.test.ts  (run via: tsx --test)
// Canonical cases for the v4 engine. Owner rule (2026-07-07): SIEMPRE perfil + veta en el
// encabezado (nunca "no pudimos"); el registro/gráfico carga cuán definido está.
import test from 'node:test';
import assert from 'node:assert';
import { buildVotesEvidence, resolveMotorInsights, resolveEvidenceFicha } from './profileResolver';
import { factorEdad } from './ageNorms';

const vec = (D: number, I: number, S: number, C: number) => ({ D, I, S, C });

test('4-3-3-2 => registro parejo, PERO igual da perfil + veta', () => {
  const v = buildVotesEvidence(vec(4, 3, 3, 2));
  assert.strictEqual(v.B, 1);
  assert.strictEqual(v.forma, 'versatil');
  assert.strictEqual(v.registro, 'parejo');
  assert.strictEqual(v.arquetipoLabel, 'Impulsor con veta Conector'); // nunca null
});

test('5-3-2-2 => registro matices, perfil + veta', () => {
  const v = buildVotesEvidence(vec(5, 3, 2, 2));
  assert.strictEqual(v.B, 2);
  assert.strictEqual(v.registro, 'matices');
  assert.strictEqual(v.arquetipoLabel, 'Impulsor con veta Conector');
});

test('6-2-2-2 => registro claro (B=4), perfil + veta', () => {
  const v = buildVotesEvidence(vec(6, 2, 2, 2));
  assert.strictEqual(v.B, 4);
  assert.strictEqual(v.registro, 'claro'); // B=4 ahora suena "con claridad" (owner)
  assert.strictEqual(v.arquetipoLabel, 'Impulsor con veta Conector');
});

test('12-0-0-0 => registro rotundo; sin veta real (2º con 0 votos) => solo primario', () => {
  const v = buildVotesEvidence(vec(12, 0, 0, 0));
  assert.strictEqual(v.forma, 'muy_definido');
  assert.strictEqual(v.registro, 'rotundo');
  assert.strictEqual(v.arquetipoLabel, 'Impulsor'); // 2º eje = 0 votos => no se inventa veta
});

test('veta afirmada no-opuesta (D con veta C)', () => {
  const v = buildVotesEvidence(vec(7, 0, 0, 5)); // D=7, C=5
  assert.strictEqual(v.ejePrimario, 'D');
  assert.strictEqual(v.ejeSecundario, 'C');
  assert.strictEqual(v.vetaBanda, 'afirmada');
  assert.strictEqual(v.vetaOpuesta, false);
  assert.strictEqual(v.vetaEnNombre, true);
  assert.strictEqual(v.arquetipoLabel, 'Impulsor con veta Estratega');
});

test('veta OPUESTA (D con veta S): SIGUE mostrando perfil + veta (owner), flag para copy', () => {
  const v = buildVotesEvidence(vec(7, 0, 5, 0)); // D=7, S=5
  assert.strictEqual(v.ejePrimario, 'D');
  assert.strictEqual(v.ejeSecundario, 'S');
  assert.strictEqual(v.vetaOpuesta, true);       // el copy la enmarca como co-ocurrencia ("conviven")
  assert.strictEqual(v.vetaEnNombre, false);     // "afirmada fuerte" no, por opuesta — informa al gráfico
  assert.strictEqual(v.arquetipoLabel, 'Impulsor con veta Sostenedor'); // pero el nombre igual la muestra
});

test('motor: sin juegos => no narratable, sin zona', () => {
  const m = resolveMotorInsights({}, 12 * 12);
  assert.strictEqual(m.narratable, false);
  assert.strictEqual(m.tempoZona, null);
  assert.strictEqual(m.tempoScore, null);
});

test('motor: impulse+rhythm => narratable, banda por score, adaptation fuera del tempo', () => {
  const games = {
    impulse: { avgLatency: 1500, latencies: [1500, 1500], stdDevLatency: 0, totalTimeMs: 3000, trend: 0 } as never,
    rhythm: { avgReaction: 400, reactionTimes: [400, 400], totalTaps: 2, extraTaps: 5, avgCadence: 0, trend: 0 } as never,
    adaptation: { avgAdaptation: 900, adaptationTimes: [900], inertiaErrors: 3, correctTaps: 1, wrongTaps: 0, totalTimeMs: 900 } as never,
  };
  const m = resolveMotorInsights(games, 10 * 12);
  assert.strictEqual(m.narratable, true);
  assert.strictEqual(m.tempoZona, 'rapido'); // juegos rápidos => score alto => 'rapido'
  assert.ok(m.tempoScore !== null && m.tempoScore >= 60);
  assert.ok(m.decision && m.reaction && m.adaptation);
  assert.strictEqual(m.factorEdad, factorEdad(120));
});

test('resolveEvidenceFicha assembles a v4 ficha con perfil + veta', () => {
  const answers = [
    ...Array(6).fill({ axis: 'D', responseTimeMs: 1000 }),
    ...Array(2).fill({ axis: 'I', responseTimeMs: 1000 }),
    ...Array(2).fill({ axis: 'S', responseTimeMs: 1000 }),
    ...Array(2).fill({ axis: 'C', responseTimeMs: 1000 }),
  ];
  const f = resolveEvidenceFicha(answers as never, { edadMeses: 144, questionVersion: 'q1' });
  assert.strictEqual(f.version, 4);
  assert.strictEqual(f.votes.ejePrimario, 'D');
  assert.strictEqual(f.votes.arquetipoLabel, 'Impulsor con veta Conector'); // 6-2-2-2
  assert.strictEqual(f.motor.narratable, false);
});

test('resolveEvidenceFicha embebe respuestas[] + señales DISC (contingencia real)', () => {
  // Chico D con desvío a Estratega en la adversidad (Q5-7), en orden de escena.
  const a = (n: number, axis: 'D' | 'I' | 'S' | 'C') => ({ axis, responseTimeMs: 1000, question_id: `q${n}` });
  const answers = [
    a(1, 'D'), a(2, 'D'), a(3, 'D'), a(4, 'D'),
    a(5, 'C'), a(6, 'C'), a(7, 'C'),        // adversidad: C,C,C => 3/3 (candado) => C (desvío)
    a(8, 'D'), a(9, 'D'), a(10, 'I'), a(11, 'D'), a(12, 'D'),
  ];
  const f = resolveEvidenceFicha(answers as never, { edadMeses: 132, questionVersion: 'v4-2026-07' });
  assert.strictEqual(f.respuestas.length, 12);
  assert.strictEqual(f.votes.ejePrimario, 'D');        // 8-3-1-0
  assert.strictEqual(f.signals.receta[0].axis, 'D');   // principal
  const adv = f.signals.contingencia.patrones.find((p) => p.context === 'adversidad');
  assert.strictEqual(adv?.axis, 'C');                  // cuando se complica, cambia a Estratega
  assert.strictEqual(adv?.esDesvio, true);
});
