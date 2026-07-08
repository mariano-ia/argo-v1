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

test('idioma no soportado => held idioma', () => {
  const r = runReportPipeline(mateoFicha(), CTX, { lang: 'fr' as never });
  assert.strictEqual(r.status, 'held');
  assert.ok(r.qc.reasons.some((x) => x.code === 'idioma'));
});
test('en/pt => ready (i18n integrado)', () => {
  for (const lang of ['en', 'pt'] as const) {
    const r = runReportPipeline(mateoFicha(), CTX, { lang });
    assert.strictEqual(r.status, 'ready', `lang ${lang} debería pasar`);
  }
});

// Espeja EXACTAMENTE lo que corre el cliente (OnboardingFlowV2 shadow): QuestionAnswer[] +
// games desde los refs + edadMeses desde años. Verifica que el payload shadow sea válido.
test('shadow del cliente: QuestionAnswer[] + games + edad => report_v4 + report_qc válidos, gate ready', () => {
  // QuestionAnswer[] tal cual lo arma el cuestionario (axis, responseTimeMs, question_id).
  const answers = [
    a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700),
    a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810),
    a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760),
  ];
  const edadMeses = Math.round(11 * 12); // adultData.edad (años) * 12
  const ficha = resolveEvidenceFicha(answers as never, {
    edadMeses, questionVersion: 'v4-2026-07',
    games: {
      impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never,
      rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never,
      adaptation: undefined,
    },
  });
  const pipe = runReportPipeline(ficha, { nombre: 'Mateo', genero: 'm', frame: sportFrame('Fútbol') } as never, { lang: 'es' });
  assert.strictEqual(pipe.status, 'ready');
  // el payload shadow que el cliente manda al server
  const shadow = { evidence_ficha: ficha, report_v4: pipe.report, report_qc: pipe.qc };
  assert.strictEqual(shadow.report_qc.pass, true);
  assert.ok(shadow.report_v4.hero.arquetipoLabel.includes('Impulsor'));
  assert.ok(shadow.evidence_ficha.version === 4);
  // serializable a jsonb (persiste tal cual)
  assert.doesNotThrow(() => JSON.stringify(shadow));
});
