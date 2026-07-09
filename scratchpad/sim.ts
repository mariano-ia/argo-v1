// Simula 5 partidas corriendo el pipeline REAL de prod (resolveEvidenceFicha + buildReportV4).
// Cero escritura en DB. Solo muestra qué informe sale.
import { resolveEvidenceFicha } from '../src/lib/profileResolver';
import { buildReportV4, sportFrame } from '../src/lib/reportV4';

type Ax = 'D' | 'I' | 'S' | 'C';
const a = (n: number, axis: Ax, rt: number) => ({ axis, responseTimeMs: rt, question_id: `q${n}` });
const mk = (s: string, rt: (ax: Ax) => number) => [...s].map((c, i) => a(i + 1, c as Ax, rt(c as Ax)));

// Cada string son las 12 respuestas (q1..q12). Diseñados para tocar todos los casos.
const players = [
  // 1) Conector muy definido, veta floja  → "Conector con destellos de Impulsor" [rotundo]
  { name: 'Bruno', sport: 'Fútbol', age: 11,
    ans: mk('IICIIIDIICID', () => 1200),
    games: { impulse: { avgLatency: 1200, latencies: [1150, 1250] }, rhythm: { avgReaction: 360, reactionTimes: [350, 370] } } },
  // 2) Parejo Sostén/Conector (dúo) → "Sostenedor y Conector" [parejo]; tormenta dispersa; sin motor
  { name: 'Mía', sport: 'Hockey', age: 13,
    ans: mk('ISISCISS IDSC'.replace(' ', ''), () => 1900), games: null },
  // 3) Estratega con veta fuerte + tormenta 3/3 (candado HABLA) → "Estratega con veta Impulsor"
  { name: 'Tomás', sport: 'Ajedrez', age: 14,
    ans: mk('CCCCCCCDDDDC', () => 2200),
    games: { impulse: { avgLatency: 2300, latencies: [2200, 2400] }, rhythm: { avgReaction: 900, reactionTimes: [880, 920] } } },
  // 4) Impulsor con tormenta 2/3 (candado CALLA contingencia) + veta OPUESTA → "Impulsor con destellos de Sostenedor"
  { name: 'Valen', sport: 'Natación', age: 10,
    ans: mk('DDDDSSDDICDD', (ax) => (ax === 'D' ? 650 : 1600)),
    games: { impulse: { avgLatency: 700, latencies: [680, 720] }, rhythm: { avgReaction: 300, reactionTimes: [290, 310] } } },
  // 5) Mezclado real (empate 3-3-3-3) → dúo [parejo], tormenta dispersa, sin fabricación; sin motor
  { name: 'Lu', sport: 'Tenis', age: 12,
    ans: mk('DISCDISCDISC', () => 1500), games: null },
];

for (const p of players) {
  const ficha = resolveEvidenceFicha(p.ans as never, { edadMeses: p.age * 12, questionVersion: 'v3-items-20260708', ...(p.games ? { games: p.games } : {}) } as never);
  const r = buildReportV4(ficha, { nombre: p.name, frame: sportFrame(p.sport), lang: 'es' } as never);
  const v = ficha.votes;
  console.log('\n' + '═'.repeat(78));
  console.log(`  ${p.name} · ${p.sport} · ${p.age} años   |   votos D${v.vector.D} I${v.vector.I} S${v.vector.S} C${v.vector.C}  (B=${v.B}, B2=${v.B2})`);
  console.log('═'.repeat(78));
  console.log(`  ▶ ${r.hero.arquetipoLabel}  [${r.hero.registro}]`);
  console.log(`  ${r.hero.lead}\n`);
  for (const s of r.secciones) {
    if (s.kind === 'texto') console.log(`  # ${s.titulo}\n  ${s.bloque!.cuerpo}\n`);
    else if (s.kind === 'palabras') console.log(`  # ${s.titulo}\n  conectan: ${s.palabras!.puente.join(' · ')}\n  ruido: ${s.palabras!.ruido.join(' · ')}\n`);
    else if (s.kind === 'guia') console.log(`  # ${s.titulo}\n  antes: ${s.guia!.antes}\n  durante: ${s.guia!.durante}\n  después: ${s.guia!.despues}\n`);
  }
  console.log(`  ⟳ CANDADO — se callaron (sin dato robusto): ${r.omitidas.map((o) => o.id).join(', ') || 'ninguna'}`);
}

console.log('\n\n' + '━'.repeat(78));
console.log('  CHEQUEO DE VARIEDAD (5 arquetipos, deberían ser distintos):');
for (const p of players) {
  const ficha = resolveEvidenceFicha(p.ans as never, { edadMeses: p.age * 12, questionVersion: 'v3', ...(p.games ? { games: p.games } : {}) } as never);
  const r = buildReportV4(ficha, { nombre: p.name, frame: sportFrame(p.sport), lang: 'es' } as never);
  console.log(`    ${p.name.padEnd(7)} → ${r.hero.arquetipoLabel} [${r.hero.registro}]  · contingencia: ${r.omitidas.some((o) => o.id === 'contingencia') ? 'CALLADA' : 'habla'}`);
}
