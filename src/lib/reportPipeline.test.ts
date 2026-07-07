// src/lib/reportPipeline.test.ts  (run via: tsx --test)
// Opción 1: Capa 1 es el piso que sale; Capa 2 solo mejora si pasa el gate; defecto de dato => held.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { sportFrame } from './reportV4';
import type { ReportV4 } from './reportV4';
import { runReportPipeline } from './reportPipeline';
import type { EvidenceFicha } from './evidenceFicha';

const a = (n: number, axis: 'D' | 'I' | 'S' | 'C', rt: number) => ({ axis, responseTimeMs: rt, question_id: `q${n}` });
function mateoFicha(): EvidenceFicha {
  const answers = [
    a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700),
    a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810),
    a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760),
  ];
  return resolveEvidenceFicha(answers as never, { edadMeses: 132, questionVersion: 'v4' });
}
const CTX = { nombre: 'Mateo', genero: 'm', frame: sportFrame('Fútbol') } as never;

test('Capa 1 sola pasa el gate => status ready, origen capa1', () => {
  const r = runReportPipeline(mateoFicha(), CTX, { lang: 'es' });
  assert.strictEqual(r.status, 'ready');
  assert.strictEqual(r.origen, 'capa1');
  assert.strictEqual(r.heldReason, null);
  assert.ok(r.report.secciones.length > 5);
});

test('defecto de dato (vector != 12) => held, con razón', () => {
  const f = mateoFicha();
  f.votes.vector.D += 1; // 13
  const r = runReportPipeline(f, CTX, { lang: 'es' });
  assert.strictEqual(r.status, 'held');
  assert.ok(r.heldReason);
});

test('Capa 2 que pasa el gate => sale la versión enriquecida (origen capa2)', () => {
  const capa2 = (base: ReportV4) => {
    const report = JSON.parse(JSON.stringify(base)) as ReportV4;
    // "variación": reescribe una sección manteniendo estructura y sin romper el gate.
    const s = report.secciones.find((x) => x.kind === 'texto');
    if (s?.bloque) s.bloque.cuerpo = 'Con otras palabras, ' + s.bloque.cuerpo;
    return { report, fallbackSectionIds: [] };
  };
  const r = runReportPipeline(mateoFicha(), CTX, { lang: 'es', capa2 });
  assert.strictEqual(r.status, 'ready');
  assert.strictEqual(r.origen, 'capa2');
});

test('Capa 2 que NO pasa el gate => se descarta, sale la Capa 1 (piso)', () => {
  const capa2 = (base: ReportV4) => {
    const report = JSON.parse(JSON.stringify(base)) as ReportV4;
    const s = report.secciones.find((x) => x.kind === 'texto');
    if (s?.bloque) s.bloque.cuerpo += ' Mateo es un líder nato y siempre gana.'; // dispara determinista
    return { report, fallbackSectionIds: [] };
  };
  const r = runReportPipeline(mateoFicha(), CTX, { lang: 'es', capa2 });
  assert.strictEqual(r.status, 'ready');
  assert.strictEqual(r.origen, 'capa1'); // cayó al piso
});

test('Capa 2 que explota => se ignora, sale la Capa 1 (nunca rompe el envío)', () => {
  const capa2 = () => { throw new Error('IA caída'); };
  const r = runReportPipeline(mateoFicha(), CTX, { lang: 'es', capa2 });
  assert.strictEqual(r.status, 'ready');
  assert.strictEqual(r.origen, 'capa1');
});

test('lang no soportado => held idioma (aún es-only)', () => {
  const r = runReportPipeline(mateoFicha(), CTX, { lang: 'en' });
  assert.strictEqual(r.status, 'held');
  assert.ok(r.qc.reasons.some((x) => x.code === 'idioma'));
});
