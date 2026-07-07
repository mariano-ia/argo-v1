// src/lib/reportV4.test.ts  (run via: tsx --test)
// La máquina arma el informe en la VOZ APROBADA (owner 2026-07-07): bloques desarrollados con **negritas**
// + un ejemplo, por la positiva, con la capa equipo/individual y concordancia de género.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import {
  buildReportHero, buildMotorSection, buildRecetaSection, buildContingenciaSection,
  buildTormentaSection, buildGrupoSection, buildLogroSection, buildPatronSection,
  buildCombustibleSection, buildPalabrasSection, buildGuiaSection, buildResetSection,
  buildEcosSection, buildReportV4, sportFrame,
} from './reportV4';

// Contexto de render (nombre / género / marco de deporte).
const CTX = (nombre = 'Mateo', genero = 'm', frame = 'equipo') => ({ nombre, genero, frame } as never);

function answersFrom(vec: Record<'D' | 'I' | 'S' | 'C', number>) {
  const out: { axis: 'D' | 'I' | 'S' | 'C'; responseTimeMs: number }[] = [];
  (['D', 'I', 'S', 'C'] as const).forEach((ax) => {
    for (let i = 0; i < vec[ax]; i++) out.push({ axis: ax, responseTimeMs: 1200 });
  });
  return out;
}
const fichaFor = (vec: Record<'D' | 'I' | 'S' | 'C', number>, edadMeses = 132) =>
  resolveEvidenceFicha(answersFrom(vec) as never, { edadMeses, questionVersion: 'q1' });

const ordered = (pairs: [number, 'D' | 'I' | 'S' | 'C'][]) =>
  pairs.map(([n, ax]) => ({ axis: ax, responseTimeMs: 1000, question_id: `q${n}` }));
const orderedFicha = (pairs: [number, 'D' | 'I' | 'S' | 'C'][]) =>
  resolveEvidenceFicha(ordered(pairs) as never, { edadMeses: 132, questionVersion: 'v4-2026-07' });

// Chico D con desvío a Estratega en la adversidad (9-2-1-0).
const DESVIO: [number, 'D' | 'I' | 'S' | 'C'][] = [
  [1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'C'], [6, 'C'], [7, 'D'], [8, 'D'], [9, 'D'], [10, 'I'], [11, 'D'], [12, 'D'],
];

// ── Encabezado ──
test('hero (8-3-1-0): registro claro, perfil + veta, tono "con claridad", cita 8 de 12', () => {
  const h = buildReportHero(fichaFor({ D: 8, C: 3, I: 1, S: 0 }), CTX('Mateo'));
  assert.strictEqual(h.arquetipoLabel, 'Impulsor con veta Estratega');
  assert.strictEqual(h.primarioLabel, 'Impulsor');
  assert.strictEqual(h.vetaLabel, 'con veta Estratega');
  assert.strictEqual(h.registro, 'claro');
  assert.strictEqual(h.meter.level, 3);
  assert.match(h.lead, /\*\*con claridad en la acción\*\*/);
  assert.match(h.lead, /8 de sus 12/);
  assert.match(h.lead, /veta estratega/);
});

test('hero rotundo (10-1-1-0): "de lleno" y cita el número', () => {
  const h = buildReportHero(fichaFor({ D: 10, I: 1, S: 1, C: 0 }), CTX('Lucas'));
  assert.strictEqual(h.registro, 'rotundo');
  assert.strictEqual(h.meter.level, 4);
  assert.match(h.lead, /\*\*de lleno en la acción\*\*/);
  assert.match(h.lead, /10 de sus 12/);
});

test('hero parejo (6-6-0-0): igual da perfil + veta, nombra los dos motores', () => {
  const h = buildReportHero(fichaFor({ D: 6, I: 6, S: 0, C: 0 }), CTX('Sofi', 'f'));
  assert.strictEqual(h.registro, 'parejo');
  assert.strictEqual(h.arquetipoLabel, 'Impulsor con veta Conector');
  assert.match(h.lead, /dos motores bien parejos/);
});

// ── Secciones data-driven ──
test('receta: describe su mezcla con la cifra + ejemplo, sin placeholders', () => {
  const b = buildRecetaSection(orderedFicha(DESVIO), CTX('Mateo'));
  assert.match(b.cuerpo, /se destaca un ingrediente: \*\*la acción\*\*/);
  assert.match(b.cuerpo, /9 de sus 12/);
  assert.ok(b.ejemplo && b.ejemplo.includes('Mateo'));
  assert.ok(!/\{nombre\}/.test(b.cuerpo + b.ejemplo));
});

test('contingencia: narra el desvío en presente ("se inclina por"), no en pasado deportivo', () => {
  const b = buildContingenciaSection(orderedFicha(DESVIO), CTX('Mateo'));
  assert.ok(b);
  assert.match(b!.cuerpo, /cambia de registro/);
  assert.match(b!.cuerpo, /se inclina por \*\*mirar el plan antes de actuar\*\*/);
  assert.ok(b!.ejemplo);
});

test('contingencia: sin patrones robustos => null (se omite)', () => {
  const sinPatron: [number, 'D' | 'I' | 'S' | 'C'][] = [
    [1, 'D'], [2, 'C'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'I'], [7, 'S'], [8, 'D'], [9, 'D'], [10, 'D'], [11, 'C'], [12, 'D'],
  ];
  assert.strictEqual(buildContingenciaSection(orderedFicha(sinPatron), CTX('X')), null);
});

test('patrón: ritmo uniforme => consistencia ("ritmo bastante parejo")', () => {
  const b = buildPatronSection(orderedFicha(DESVIO), CTX('Mateo'));
  assert.match(b.cuerpo, /ritmo bastante parejo/);
});

test('patrón: género femenino concuerda (rápida)', () => {
  // acople rápido: D rápido, resto lento
  const a = (n: number, axis: 'D' | 'I' | 'S' | 'C', rt: number) => ({ axis, responseTimeMs: rt, question_id: `q${n}` });
  const ans = [a(1, 'D', 600), a(2, 'D', 600), a(3, 'D', 650), a(4, 'D', 620), a(5, 'C', 1600), a(6, 'C', 1500), a(7, 'D', 640), a(8, 'D', 630), a(9, 'C', 1550), a(10, 'I', 1500), a(11, 'D', 660), a(12, 'D', 610)];
  const f = resolveEvidenceFicha(ans as never, { edadMeses: 132, questionVersion: 'v4' });
  const b = buildPatronSection(f, CTX('Delfina', 'f'));
  assert.match(b.cuerpo, /decidió en ritmos diversos/);
  assert.match(b.cuerpo, /más rápida/);
});

test('tormenta 2/3: preferencia tentativa nombrando las dos + ejemplo', () => {
  const b = buildTormentaSection(orderedFicha(DESVIO), CTX('Mateo')); // Q5 C, Q6 C, Q7 D
  assert.match(b.cuerpo, /dos de las tres escenas de tormenta/);
  assert.match(b.cuerpo, /mirar el plan antes de actuar/);
  assert.ok(b.ejemplo);
});

test('tormenta 3/3 firme; 1-1-1 caso por caso (positiva)', () => {
  const tres = buildTormentaSection(orderedFicha([[1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'D'], [7, 'D'], [8, 'D'], [9, 'D'], [10, 'D'], [11, 'D'], [12, 'D']]), CTX('Lucas'));
  assert.match(tres.cuerpo, /una y otra vez/);
  const disp = buildTormentaSection(orderedFicha([[1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'I'], [7, 'S'], [8, 'D'], [9, 'D'], [10, 'D'], [11, 'D'], [12, 'D']]), CTX('Sofi', 'f'));
  assert.match(disp.cuerpo, /leyó cada escena por separado/);
});

test('grupo (equipo): I/S bajos => positiva, marco equipo', () => {
  const b = buildGrupoSection(orderedFicha(DESVIO), CTX('Mateo', 'm', 'equipo'));
  assert.match(b.cuerpo, /no dice nada de su vida social/);
  assert.match(b.cuerpo, /tenga impacto en el equipo/);
  assert.ok(!/grupo con el que comparte la actividad/.test(b.cuerpo)); // marco equipo, no individual
});

test('grupo (individual): reencuadra el "equipo" al grupo de la actividad', () => {
  const b = buildGrupoSection(orderedFicha(DESVIO), CTX('Delfina', 'f', 'individual'));
  assert.match(b.cuerpo, /En un deporte individual/);
  assert.match(b.cuerpo, /el grupo con el que comparte la actividad/);
  assert.match(b.cuerpo, /se note dentro del grupo/);
});

test('logro: anclado al perfil + ejemplo de la meta (Q12)', () => {
  const b = buildLogroSection(orderedFicha(DESVIO), CTX('Mateo')); // prim D, Q12 D
  assert.match(b.cuerpo, /próximo objetivo/);
  assert.match(b.cuerpo, /al llegar a la meta eligió \*\*mirar ya hacia el próximo reto\*\*/);
  assert.ok(b.ejemplo && b.ejemplo.includes('Mateo'));
});

// ── Contenido de eje (D) ──
test('contenido eje D: combustible, palabras, guía, reset y ecos con nombre inyectado', () => {
  const f = orderedFicha(DESVIO);
  const comb = buildCombustibleSection(f, CTX('Mateo'));
  assert.ok(comb && comb.cuerpo.includes('Mateo') && !/\{nombre\}/.test(comb.cuerpo));
  const pal = buildPalabrasSection(f, CTX('Mateo'));
  assert.ok(pal && pal.puente.length >= 3 && pal.ruido.length >= 2);
  assert.match(pal!.puente[0], /Arranca tú/);
  const guia = buildGuiaSection(f, CTX('Mateo'));
  assert.ok(guia && guia.lead && guia.antes && guia.durante && guia.despues && guia.ejemplo);
  const reset = buildResetSection(f, CTX('Mateo'));
  assert.ok(reset && reset.cuerpo.includes('Mateo'));
  const ecos = buildEcosSection(f, CTX('Mateo'));
  assert.ok(ecos && ecos.cuerpo.includes('Mateo'));
});

// ── Motor ──
test('motor: con juegos rápidos narra bloque; sin juegos null (se omite)', () => {
  const sinJuegos = fichaFor({ D: 8, C: 3, I: 1, S: 0 });
  assert.strictEqual(buildMotorSection(sinJuegos, CTX('Mateo')), null);

  const ficha = resolveEvidenceFicha(answersFrom({ D: 8, C: 3, I: 1, S: 0 }) as never, {
    edadMeses: 132, questionVersion: 'q1',
    games: {
      impulse: { avgLatency: 1400, latencies: [1400, 1400] } as never,
      rhythm: { avgReaction: 380, reactionTimes: [380, 380] } as never,
    },
  });
  const motor = buildMotorSection(ficha, CTX('Mateo'));
  assert.ok(motor && motor.cuerpo.includes('Mateo'));
  assert.ok(!/\{nombre\}/.test(motor!.cuerpo));
});

// ── Ensamblador ──
test('buildReportV4: ensambla hero + secciones ordenadas; omite lo no narratable', () => {
  const r = buildReportV4(orderedFicha(DESVIO), CTX('Mateo'));
  assert.strictEqual(r.hero.arquetipoLabel, 'Impulsor con veta Estratega');
  const ids = r.secciones.map((s) => s.id);
  ['receta', 'contingencia', 'patron', 'tormenta', 'grupo', 'logro', 'combustible', 'palabras', 'guia', 'reset', 'ecos'].forEach((id) =>
    assert.ok(ids.includes(id), `falta sección ${id}`));
  assert.ok(!ids.includes('motor'));
  assert.ok(r.omitidas.some((o) => o.id === 'motor' && o.motivo === 'sin_datos'));
  const pal = r.secciones.find((s) => s.id === 'palabras');
  assert.strictEqual(pal?.kind, 'palabras');
  assert.ok(pal?.palabras && pal.palabras.puente.length >= 3);
  const receta = r.secciones.find((s) => s.id === 'receta');
  assert.strictEqual(receta?.kind, 'texto');
  assert.ok(receta?.bloque?.cuerpo && receta.bloque.ejemplo);
});

test('buildReportV4: los 4 ejes tienen contenido (I/S/C también) => secciones de contenido presentes', () => {
  const primarios: ('D' | 'I' | 'S' | 'C')[] = ['I', 'S', 'C'];
  for (const prim of primarios) {
    const otros = (['D', 'I', 'S', 'C'] as const).filter((x) => x !== prim);
    const seq: [number, 'D' | 'I' | 'S' | 'C'][] = [];
    for (let i = 1; i <= 8; i++) seq.push([i, prim]);
    seq.push([9, otros[0]], [10, otros[1]], [11, otros[2]], [12, prim]);
    const r = buildReportV4(orderedFicha(seq), CTX('Alex', 'm'));
    const ids = r.secciones.map((s) => s.id);
    ['combustible', 'palabras', 'guia', 'reset', 'ecos'].forEach((id) =>
      assert.ok(ids.includes(id), `eje ${prim}: falta contenido ${id}`));
    assert.ok(!r.omitidas.some((o) => o.motivo === 'sin_contenido'), `eje ${prim}: no debería omitir contenido`);
  }
});

// ── Marco de deporte ──
test('sportFrame: equipo vs individual, default seguro individual', () => {
  assert.strictEqual(sportFrame('Fútbol'), 'equipo');
  assert.strictEqual(sportFrame('basquet'), 'equipo');
  assert.strictEqual(sportFrame('Natación'), 'individual');
  assert.strictEqual(sportFrame('tenis'), 'individual');
  assert.strictEqual(sportFrame(null), 'individual');
  assert.strictEqual(sportFrame('deporte raro nuevo'), 'individual');
});
