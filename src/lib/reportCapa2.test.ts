// src/lib/reportCapa2.test.ts  (run via: tsx --test)
// Recaudos de la Capa 2 (variación por IA). Verifica que el núcleo seguro (reportCapa2.ts) + el pipeline:
//  - preservan la ESTRUCTURA y los campos inmutables (labels, meter, palabras puente/ruido);
//  - ACEPTAN una variante distinta + fiel a los hechos (origen 'capa2', gate ready);
//  - RECHAZAN (=> cae a Capa 1): sin variante, poco distinta, hechos alterados, o texto que no pasa el gate.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportV4, sportFrame } from './reportV4';
import type { ReportV4 } from './reportV4';
import { runReportPipeline } from './reportPipeline';
import { makeCapa2, assembleCapa2, textSimilarity, factsPreserved, fullText } from './reportCapa2';
import type { Capa2Variant } from './reportCapa2';

const a = (n: number, x: 'D' | 'I' | 'S' | 'C', rt = 1000) => ({ axis: x, responseTimeMs: rt, question_id: `q${n}` });
const G = { impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never, rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never };
const ANSWERS = [a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700), a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810), a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760)];
const CTX = { nombre: 'Mateo', frame: sportFrame('Fútbol') } as never;
function mateo(): { ficha: ReturnType<typeof resolveEvidenceFicha>; base: ReportV4 } {
  const ficha = resolveEvidenceFicha(ANSWERS as never, { edadMeses: 132, questionVersion: 'v4', games: G } as never);
  return { ficha, base: buildReportV4(ficha, CTX) };
}

// Reordena las palabras (invierte) => preserva el multiset (números, "estratega") y baja la similitud a ~0.
const rev = (s: string): string => s.split(' ').reverse().join(' ');

// Construye una variante completa desde la Capa 1 aplicando `f` a cada campo de prosa.
function variantFrom(base: ReportV4, f: (s: string) => string): Capa2Variant {
  const sections: Record<string, { cuerpo?: string; ejemplo?: string }> = {};
  let guia: Capa2Variant['guia'];
  for (const s of base.secciones) {
    if (s.kind === 'texto' && s.bloque) sections[s.id] = { cuerpo: f(s.bloque.cuerpo), ejemplo: s.bloque.ejemplo ? f(s.bloque.ejemplo) : undefined };
    if (s.kind === 'guia' && s.guia) guia = { lead: f(s.guia.lead), antes: f(s.guia.antes), durante: f(s.guia.durante), despues: f(s.guia.despues), ejemplo: f(s.guia.ejemplo) };
  }
  return { lead: f(base.hero.lead), sections, guia };
}

test('assembleCapa2: reescribe prosa pero preserva estructura + campos inmutables', () => {
  const { base } = mateo();
  const variant = variantFrom(base, rev);
  const { report } = assembleCapa2(base, variant);
  // labels + meter inmutables
  assert.strictEqual(report.hero.arquetipoLabel, base.hero.arquetipoLabel);
  assert.deepStrictEqual(report.hero.meter, base.hero.meter);
  assert.strictEqual(report.hero.primarioLabel, base.hero.primarioLabel);
  // misma cantidad y orden de secciones
  assert.strictEqual(report.secciones.length, base.secciones.length);
  assert.deepStrictEqual(report.secciones.map((s) => s.id), base.secciones.map((s) => s.id));
  // palabras puente/ruido NO se tocan
  const pal = report.secciones.find((s) => s.kind === 'palabras');
  const palBase = base.secciones.find((s) => s.kind === 'palabras');
  assert.deepStrictEqual(pal?.palabras?.puente, palBase?.palabras?.puente);
  assert.deepStrictEqual(pal?.palabras?.ruido, palBase?.palabras?.ruido);
  // la prosa SÍ cambió (lead distinto)
  assert.notStrictEqual(report.hero.lead, base.hero.lead);
});

test('textSimilarity: identico ~1, reordenado ~0', () => {
  const { base } = mateo();
  const t = fullText(base);
  assert.ok(textSimilarity(t, t) > 0.99);
  assert.ok(textSimilarity(t, rev(t)) < 0.2);
});

test('factsPreserved: detecta un número alterado', () => {
  const { base } = mateo();
  const good = assembleCapa2(base, variantFrom(base, rev)).report;
  assert.ok(factsPreserved(base, good).ok, 'reordenar preserva los números');
  // alterar un contador en la sección receta ("8" -> "9")
  const bad = assembleCapa2(base, { sections: { receta: { cuerpo: base.secciones.find((s) => s.id === 'receta')!.bloque!.cuerpo.replace(/\b8\b/, '9') } } }).report;
  assert.ok(!factsPreserved(base, bad).ok, 'cambiar 8->9 debe fallar');
});

test('makeCapa2: RECHAZA sin variante / poco distinta / hechos alterados', () => {
  const { ficha, base } = mateo();
  const rejected: string[] = [];
  const onReject = (r: string) => rejected.push(r);
  // sin variante
  assert.strictEqual(makeCapa2(null, {}, onReject)(base, ficha, CTX), null);
  // poco distinta (variante == Capa 1)
  assert.strictEqual(makeCapa2(variantFrom(base, (s) => s), {}, onReject)(base, ficha, CTX), null);
  // hechos alterados (número cambiado en un cuerpo, resto reordenado para que sí sea distinta)
  const tampered = variantFrom(base, rev);
  tampered.sections!.receta.cuerpo = tampered.sections!.receta.cuerpo!.replace(/\b8\b/, '9');
  assert.strictEqual(makeCapa2(tampered, {}, onReject)(base, ficha, CTX), null);
  assert.deepStrictEqual(rejected, ['sin_variante', 'poco_distinto', 'hechos_alterados']);
});

test('pipeline con Capa 2 válida: origen capa2 + ready', () => {
  const { ficha, base } = mateo();
  const variant = variantFrom(base, rev);
  const r = runReportPipeline(ficha, CTX, { lang: 'es', capa2: makeCapa2(variant) });
  assert.strictEqual(r.status, 'ready', `qc: ${JSON.stringify(r.qc.reasons)}`);
  assert.strictEqual(r.origen, 'capa2');
  // el informe que sale ES la variación (lead distinto del determinista)
  assert.notStrictEqual(r.report.hero.lead, base.hero.lead);
});

test('pipeline con Capa 2 que NO pasa el gate (palabra prohibida): cae a Capa 1', () => {
  const { ficha, base } = mateo();
  const variant = variantFrom(base, rev);
  // inyecta una palabra prohibida en una sección => el gate del pipeline debe rechazar la Capa 2
  variant.sections!.logro.cuerpo = (variant.sections!.logro.cuerpo ?? '') + ' Esto es un fracaso.';
  const r = runReportPipeline(ficha, CTX, { lang: 'es', capa2: makeCapa2(variant) });
  assert.strictEqual(r.origen, 'capa1', 'una Capa 2 con palabra prohibida no puede salir');
  assert.strictEqual(r.status, 'ready'); // la Capa 1 (piso) sí pasa
});

test('pipeline con Capa 2 poco distinta: cae a Capa 1 (no rompe el envío)', () => {
  const { ficha, base } = mateo();
  const r = runReportPipeline(ficha, CTX, { lang: 'es', capa2: makeCapa2(variantFrom(base, (s) => s)) });
  assert.strictEqual(r.origen, 'capa1');
  assert.strictEqual(r.status, 'ready');
});
