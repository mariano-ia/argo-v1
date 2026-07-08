// src/lib/reportV4.snapshot.test.ts  (run via: tsx --test)
// RED DE SEGURIDAD del engine: el output de 8 perfiles canónicos (es/en/pt) debe quedar IDÉNTICO
// (carácter por carácter) al snapshot congelado. Si algo cambia, falla. Nació para blindar es durante
// el refactor i18n; ahora congela los 3 idiomas. Snapshots: src/lib/__snapshots__/reportV4.{es,en,pt}.json
// (regenerar SOLO con intención explícita — es equivale a un cambio de copy revisado).
import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportV4, sportFrame } from './reportV4';
import type { Lang } from './archetypeContentV4';

const a = (n: number, x: 'D' | 'I' | 'S' | 'C', rt = 1000) => ({ axis: x, responseTimeMs: rt, question_id: `q${n}` });
const seq = (arr: ('D' | 'I' | 'S' | 'C')[]) => arr.map((x, i) => a(i + 1, x));
const G = { impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never, rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never };

const profiles = [
  { name: 'Mateo', deporte: 'Fútbol', edad: 11, games: G, answers: [a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700), a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810), a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760)] },
  { name: 'Lucas', deporte: 'Básquet', edad: 12, answers: seq(['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D']) },
  { name: 'Sofi', deporte: 'Natación', edad: 10, answers: seq(['S', 'S', 'S', 'S', 'S', 'D', 'D', 'D', 'D', 'C', 'C', 'I']) },
  { name: 'Bruno', deporte: 'Handball', edad: 13, answers: seq(['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'D', 'D', 'S', 'C']) },
  { name: 'Emma', deporte: 'Gimnasia', edad: 9, answers: seq(['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'D', 'D', 'I', 'C']) },
  { name: 'Tomás', deporte: 'Ajedrez', edad: 14, answers: seq(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'D', 'D', 'I', 'S']) },
  { name: 'Ana', deporte: 'Tenis', edad: 11, answers: seq(['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'I', 'C']) },
  { name: 'Leo', deporte: 'Rugby', edad: 12, answers: [a(1, 'D', 600), a(2, 'D', 600), a(3, 'D', 650), a(4, 'D', 620), a(5, 'C', 1600), a(6, 'C', 1500), a(7, 'D', 640), a(8, 'D', 630), a(9, 'C', 1550), a(10, 'I', 1500), a(11, 'D', 660), a(12, 'D', 610)] },
];

function serialize(lang: Lang, name: string, deporte: string, edad: number, answers: ReturnType<typeof a>[], games?: unknown) {
  const ficha = resolveEvidenceFicha(answers as never, { edadMeses: edad * 12, questionVersion: 'v4', ...(games ? { games } : {}) } as never);
  const r = buildReportV4(ficha, { nombre: name, frame: sportFrame(deporte), lang } as never);
  const parts = [`HERO ${r.hero.arquetipoLabel} [${r.hero.registro}]`, r.hero.lead];
  for (const s of r.secciones) {
    if (s.kind === 'texto') parts.push(`# ${s.titulo}`, s.bloque!.cuerpo, s.bloque!.ejemplo ?? '');
    else if (s.kind === 'palabras') parts.push(`# ${s.titulo}`, s.palabras!.puente.join(' | '), s.palabras!.ruido.join(' | '), s.palabras!.nota);
    else if (s.kind === 'guia') parts.push(`# ${s.titulo}`, s.guia!.lead, s.guia!.antes, s.guia!.durante, s.guia!.despues, s.guia!.ejemplo);
  }
  parts.push(`OMIT ${r.omitidas.map((o) => o.id).join(',')}`);
  return parts.join('\n');
}

for (const lang of ['es', 'en', 'pt'] as const) {
  const snap: Record<string, string> = JSON.parse(readFileSync(new URL(`./__snapshots__/reportV4.${lang}.json`, import.meta.url), 'utf8'));
  for (const p of profiles) {
    test(`snapshot ${lang.toUpperCase()} idéntico: ${p.name}`, () => {
      const got = serialize(lang, p.name, p.deporte, p.edad, p.answers, p.games);
      assert.strictEqual(got, snap[p.name], `El output ${lang.toUpperCase()} de ${p.name} cambió vs el snapshot.`);
    });
  }
}
