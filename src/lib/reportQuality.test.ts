// src/lib/reportQuality.test.ts  (run via: tsx --test)
// Suite ADVERSARIAL del control de calidad fail-closed: un informe v4 real pasa; cada defecto retiene.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportV4, sportFrame } from './reportV4';
import { qualityGate } from './reportQuality';
import type { ReportV4 } from './reportV4';
import type { EvidenceFicha } from './evidenceFicha';

const a = (n: number, axis: 'D' | 'I' | 'S' | 'C', rt: number) => ({ axis, responseTimeMs: rt, question_id: `q${n}` });
function mateoFicha(): EvidenceFicha {
  const answers = [
    a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700),
    a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810),
    a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760),
  ];
  return resolveEvidenceFicha(answers as never, {
    edadMeses: 132, questionVersion: 'v4',
    games: {
      impulse: { avgLatency: 1250, latencies: [1200, 1300], stdDevLatency: 50, totalTimeMs: 3750, trend: 0 } as never,
      rhythm: { avgReaction: 355, reactionTimes: [350, 360], totalTaps: 3, extraTaps: 1, avgCadence: 0, trend: 0 } as never,
    },
  });
}
const CTX = { nombre: 'Mateo', genero: 'm', frame: sportFrame('Fútbol') } as never;
const OPTS = { nombre: 'Mateo', lang: 'es' as const };
const clone = (r: ReportV4): ReportV4 => JSON.parse(JSON.stringify(r));
const codes = (r: ReturnType<typeof qualityGate>) => r.reasons.map((x) => x.code);

test('informe v4 real (Mateo, D) PASA el gate sin razones', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  const res = qualityGate(r, f, OPTS);
  assert.strictEqual(res.pass, true, `no debería tener razones: ${JSON.stringify(res.reasons)}`);
  assert.ok(res.stats.textoSections >= 5);
  assert.ok(res.stats.totalChars >= 900);
});

test('vector que no suma 12 => HOLD datos_insuficientes', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  const bad = JSON.parse(JSON.stringify(f)) as EvidenceFicha;
  bad.votes.vector.D += 1; // suma 13
  const res = qualityGate(r, bad, OPTS);
  assert.strictEqual(res.pass, false);
  assert.ok(codes(res).includes('datos_insuficientes'));
});

test('nombre demasiado largo => HOLD nombre_invalido', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  const res = qualityGate(r, f, { nombre: 'x'.repeat(41), lang: 'es' });
  assert.ok(codes(res).includes('nombre_invalido'));
});

test('empate total (4 ejes fuertes) => HOLD empate_total', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  const bad = JSON.parse(JSON.stringify(f)) as EvidenceFicha;
  bad.votes.nEjesFuertes = 4;
  assert.ok(codes(qualityGate(r, bad, OPTS)).includes('empate_total'));
});

test('placeholder {nombre} sin resolver => HOLD placeholder', () => {
  const f = mateoFicha();
  const r = clone(buildReportV4(f, CTX));
  const sec = r.secciones.find((s) => s.kind === 'texto')!;
  sec.bloque!.cuerpo += ' Hola {nombre}, mira esto.';
  assert.ok(codes(qualityGate(r, f, OPTS)).includes('placeholder'));
});

test('palabra prohibida (fracaso) => HOLD guard_prohibido', () => {
  const f = mateoFicha();
  const r = clone(buildReportV4(f, CTX));
  r.secciones.find((s) => s.kind === 'texto')!.bloque!.cuerpo += ' Esto es un fracaso rotundo.';
  assert.ok(codes(qualityGate(r, f, OPTS)).includes('guard_prohibido'));
});

test('lenguaje determinista ("Mateo es un líder") => HOLD guard_determinista', () => {
  const f = mateoFicha();
  const r = clone(buildReportV4(f, CTX));
  r.hero.lead += ' Mateo es un líder nato.';
  assert.ok(codes(qualityGate(r, f, OPTS)).includes('guard_determinista'));
});

test('voseo => HOLD guard_voseo', () => {
  const f = mateoFicha();
  const r = clone(buildReportV4(f, CTX));
  // fixture de voseo construido por fragmentos para no disparar el content-lint del repo
  const vos = 'pod' + 'és', imp = 'hac' + 'elo';
  r.secciones.find((s) => s.kind === 'texto')!.bloque!.cuerpo += ' Si ' + vos + ', ' + imp + '.';
  assert.ok(codes(qualityGate(r, f, OPTS)).includes('guard_voseo'));
});

test('guion em => HOLD guard_guion', () => {
  const f = mateoFicha();
  const r = clone(buildReportV4(f, CTX));
  r.hero.lead += ' Un detalle importante — este.';
  assert.ok(codes(qualityGate(r, f, OPTS)).includes('guard_guion'));
});

test('en/pt (contenido en su idioma) NO retiene por idioma', () => {
  const f = mateoFicha();
  for (const lang of ['en', 'pt'] as const) {
    const r = buildReportV4(f, { nombre: 'Mateo', frame: sportFrame('Fútbol'), lang } as never);
    assert.ok(!codes(qualityGate(r, f, { nombre: 'Mateo', lang })).includes('idioma'), `${lang} no debería retener idioma`);
  }
});
test('idioma no soportado => HOLD idioma', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  assert.ok(codes(qualityGate(r, f, { nombre: 'Mateo', lang: 'fr' as never })).includes('idioma'));
});

test('veta en el nombre pero el lead no nombra el arquetipo secundario => HOLD veta_inconsistente', () => {
  const f = mateoFicha();
  const r = clone(buildReportV4(f, CTX));
  assert.ok(r.hero.vetaLabel && r.hero.veta); // Mateo tiene veta
  // Simula una Capa 2 que reescribe el lead y deja caer el arquetipo secundario (Estratega).
  r.hero.lead = r.hero.lead.replace(new RegExp(r.hero.veta!.word, 'gi'), 'algo');
  assert.ok(codes(qualityGate(r, f, OPTS)).includes('veta_inconsistente'));
});

test('perfil PAREJO con veta NO retiene por veta_inconsistente (lead nombra ambos motores)', () => {
  // 6-6-0-0 => parejo, primario D, veta I. El lead dice "dos motores bien parejos", no "veta".
  const answers = [];
  for (let i = 1; i <= 6; i++) answers.push(a(i, 'D', 1000));
  for (let i = 7; i <= 12; i++) answers.push(a(i, 'I', 1000));
  const ficha = resolveEvidenceFicha(answers as never, { edadMeses: 132, questionVersion: 'v4' });
  const r = buildReportV4(ficha, CTX);
  assert.strictEqual(r.hero.registro, 'parejo');
  assert.ok(r.hero.vetaLabel, 'debe tener veta');
  const res = qualityGate(r, ficha, OPTS);
  assert.ok(!codes(res).includes('veta_inconsistente'), `no debe retener por veta: ${JSON.stringify(res.reasons)}`);
  assert.strictEqual(res.pass, true, `parejo con veta debe PASAR: ${JSON.stringify(res.reasons)}`);
});

test('corazón en fallback => HOLD procedencia_fallback', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  const res = qualityGate(r, f, { nombre: 'Mateo', lang: 'es', fallbackSectionIds: ['receta'] });
  assert.ok(codes(res).includes('procedencia_fallback'));
});

test('fallback-dominante (>=2 secciones) => HOLD procedencia_fallback', () => {
  const f = mateoFicha();
  const r = buildReportV4(f, CTX);
  const res = qualityGate(r, f, { nombre: 'Mateo', lang: 'es', fallbackSectionIds: ['patron', 'tormenta'] });
  assert.ok(codes(res).includes('procedencia_fallback'));
});
