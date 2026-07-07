// src/lib/serverGate.test.ts  (run via: tsx --test)
// Verifica la lógica del GATE SERVER-SIDE inlineado en api/session.ts (copia del qualityGate).
// Vive en src/ (no en api/) para no disparar check:api-imports; importa el gate desde api/session.
// Es un test local (tsx), no se deploya: importar api/session es seguro (no ejecuta el handler).
import test from 'node:test';
import assert from 'node:assert';
import { gateReportV4 } from '../../api/session';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportV4, sportFrame } from './reportV4';

const a = (n: number, axis: 'D' | 'I' | 'S' | 'C', rt: number) => ({ axis, responseTimeMs: rt, question_id: `q${n}` });
function mateo() {
  const answers = [
    a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700),
    a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810),
    a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760),
  ];
  const ficha = resolveEvidenceFicha(answers as never, {
    edadMeses: 132, questionVersion: 'v4',
    games: { impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never, rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never },
  });
  return { ficha, report: buildReportV4(ficha, { nombre: 'Mateo', frame: sportFrame('Fútbol') } as never) };
}
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

test('server gate: informe v4 real => ready', () => {
  const { ficha, report } = mateo();
  assert.strictEqual(gateReportV4(report, ficha, 'Mateo', 'es').status, 'ready');
});
test('server gate: vector != 12 => held', () => {
  const { ficha, report } = mateo();
  const bad = clone(ficha); bad.votes.vector.D += 1;
  assert.strictEqual(gateReportV4(report, bad, 'Mateo', 'es').status, 'held');
});
test('server gate: lang != es => held idioma', () => {
  const { ficha, report } = mateo();
  assert.strictEqual(gateReportV4(report, ficha, 'Mateo', 'en').reason, 'idioma');
});
test('server gate: placeholder => held', () => {
  const { ficha, report } = mateo();
  const bad = clone(report);
  (bad.secciones.find((s) => s.kind === 'texto') as { bloque: { cuerpo: string } }).bloque.cuerpo += ' Hola {nombre}.';
  assert.strictEqual(gateReportV4(bad, ficha, 'Mateo', 'es').reason, 'placeholder');
});
test('server gate: palabra prohibida => held', () => {
  const { ficha, report } = mateo();
  const bad = clone(report);
  (bad.secciones.find((s) => s.kind === 'texto') as { bloque: { cuerpo: string } }).bloque.cuerpo += ' Es un fracaso.';
  assert.strictEqual(gateReportV4(bad, ficha, 'Mateo', 'es').reason, 'guard_prohibido');
});
test('server gate: determinista => held', () => {
  const { ficha, report } = mateo();
  const bad = clone(report);
  bad.hero.lead += ' Mateo es un líder.';
  assert.strictEqual(gateReportV4(bad, ficha, 'Mateo', 'es').reason, 'guard_determinista');
});
test('server gate: nombre compuesto con espacio => OK', () => {
  const { ficha, report } = mateo();
  assert.notStrictEqual(gateReportV4(report, ficha, 'Ana María', 'es').reason, 'nombre_invalido');
});
