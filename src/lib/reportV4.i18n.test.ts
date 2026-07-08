// src/lib/reportV4.i18n.test.ts  (run via: tsx --test)
// Guards de INTEGRACIÓN i18n del informe v4: (1) ningún placeholder residual (${...}/{nombre}) en en/pt,
// (2) sin MEZCLA de idioma (en = ASCII puro con nombre ASCII => nada de es/pt se coló; pt sin marcas
// inequívocamente españolas), (3) label + títulos en el idioma correcto. Complementa el snapshot
// (que congela el output exacto) chequeando propiedades del idioma, no strings puntuales.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportV4, sportFrame } from './reportV4';
import type { ReportV4 } from './reportV4';
import type { Lang } from './archetypeContentV4';

const a = (n: number, x: 'D' | 'I' | 'S' | 'C', rt = 1000) => ({ axis: x, responseTimeMs: rt, question_id: `q${n}` });
const seq = (arr: ('D' | 'I' | 'S' | 'C')[]) => arr.map((x, i) => a(i + 1, x));
const G = { impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never, rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never };

// Un perfil por EJE primario (ejercita todo el contenido de eje) + games (motor narratable).
const PROFILES: { eje: string; answers: ReturnType<typeof a>[]; deporte: string }[] = [
  { eje: 'D', deporte: 'Fútbol', answers: [a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700), a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810), a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760)] },
  { eje: 'I', deporte: 'Handball', answers: seq(['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'D', 'D', 'S', 'C']) },
  { eje: 'S', deporte: 'Tenis', answers: seq(['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'D', 'D', 'I', 'C']) },
  { eje: 'C', deporte: 'Ajedrez', answers: seq(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'D', 'D', 'I', 'S']) },
];

function build(lang: Lang, name: string, p: (typeof PROFILES)[number]): ReportV4 {
  const ficha = resolveEvidenceFicha(p.answers as never, { edadMeses: 132, questionVersion: 'v4', games: G } as never);
  return buildReportV4(ficha, { nombre: name, frame: sportFrame(p.deporte), lang } as never);
}

/** Todo el texto del informe (hero + secciones), tal como lo leería un adulto. */
function fullText(r: ReportV4): string {
  const parts = [r.hero.arquetipoLabel, r.hero.lead, r.hero.meter.labels.join(' ')];
  for (const s of r.secciones) {
    parts.push(s.titulo);
    if (s.bloque) parts.push(s.bloque.cuerpo, s.bloque.ejemplo ?? '');
    if (s.palabras) parts.push(...s.palabras.puente, ...s.palabras.ruido, s.palabras.nota);
    if (s.guia) parts.push(s.guia.lead, s.guia.antes, s.guia.durante, s.guia.despues, s.guia.ejemplo);
  }
  return parts.join('\n');
}

// (1) Sin placeholders residuales en NINGÚN idioma.
for (const lang of ['es', 'en', 'pt'] as const) {
  test(`${lang}: sin placeholders residuales`, () => {
    for (const p of PROFILES) {
      const t = fullText(build(lang, 'Alex', p));
      const residual = t.match(/\$\{[^}]*\}|\{[a-zA-Z_]+\}/g);
      assert.strictEqual(residual, null, `${lang}/${p.eje}: placeholders sin resolver: ${residual}`);
    }
  });
}

// (2a) EN con nombre ASCII => texto ASCII puro. Cualquier acento/ñ/ã sería es/pt colado.
test('en: sin mezcla de idioma (ASCII puro con nombre ASCII)', () => {
  for (const p of PROFILES) {
    const t = fullText(build('en', 'Alex', p));
    const nonAscii = t.match(/[^\x00-\x7F]/g);
    assert.strictEqual(nonAscii, null, `en/${p.eje}: caracteres no-ASCII (posible es/pt colado): ${nonAscii && [...new Set(nonAscii)].join('')}`);
  }
});

// (2b) PT sin marcas inequívocamente españolas (ñ, ¿, ¡) ni palabras es-only.
test('pt: sin mezcla de idioma (sin ñ/¿/¡ ni palabras es-only)', () => {
  const ES_ONLY = [/[ñ¿¡]/, /\bniñ[oa]s?\b/i, /\bactividad\b/i, /\bcómo\b/i, /\btambién\b/i, /\bentrenamiento\b/i, /\blos\b/i, /\blas\b/i];
  for (const p of PROFILES) {
    const t = fullText(build('pt', 'Alex', p));
    for (const re of ES_ONLY) {
      assert.ok(!re.test(t), `pt/${p.eje}: marca es-only ${re} apareció`);
    }
  }
});

// (3) Label + títulos en el idioma correcto.
test('label + títulos en el idioma del informe', () => {
  const EN_ARQ = /^(Driver|Connector|Sustainer|Strategist)\b/;
  const PT_ARQ = /^(Impulsionador|Conector|Sustentador|Estrategista)\b/;
  const rEn = build('en', 'Alex', PROFILES[0]);
  const rPt = build('pt', 'Alex', PROFILES[0]);
  assert.match(rEn.hero.arquetipoLabel, EN_ARQ, 'en arquetipoLabel');
  assert.match(rPt.hero.arquetipoLabel, PT_ARQ, 'pt arquetipoLabel');
  assert.ok(rEn.secciones.some((s) => s.titulo === 'Their mix'), 'en título "Their mix"');
  assert.ok(rPt.secciones.some((s) => s.titulo === 'Sua mistura'), 'pt título "Sua mistura"');
  // veta: en usa "with a ... lean", pt "com veta ...", es "con veta ..."
  assert.ok(rEn.hero.veta && rEn.hero.veta.pre === 'with a' && rEn.hero.veta.post === 'lean', 'en veta pieces');
  assert.ok(rPt.hero.veta && rPt.hero.veta.pre === 'com veta' && rPt.hero.veta.post === '', 'pt veta pieces');
});
