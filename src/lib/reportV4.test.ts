// src/lib/reportV4.test.ts  (run via: tsx --test)
// La máquina arma el encabezado calibrado desde la ficha real del chico.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportHero, buildMotorSection, buildRecetaSection, buildContingenciaSection, buildTormentaSection, buildGrupoSection, buildLogroSection, buildPatronSection, buildCombustibleSection, buildPalabrasSection, buildGuiaSection, buildResetSection, buildEcosSection, buildReportV4 } from './reportV4';

// Construye respuestas con un vector de votos dado (para simular el cuestionario).
function answersFrom(vec: Record<'D' | 'I' | 'S' | 'C', number>) {
  const out: { axis: 'D' | 'I' | 'S' | 'C'; responseTimeMs: number }[] = [];
  (['D', 'I', 'S', 'C'] as const).forEach((ax) => {
    for (let i = 0; i < vec[ax]; i++) out.push({ axis: ax, responseTimeMs: 1200 });
  });
  return out;
}
const fichaFor = (vec: Record<'D' | 'I' | 'S' | 'C', number>, edadMeses = 132) =>
  resolveEvidenceFicha(answersFrom(vec) as never, { edadMeses, questionVersion: 'q1' });

test('Mateo (8-3-1-0): encabezado "claro", perfil + veta, cita 8 de 12', () => {
  const h = buildReportHero(fichaFor({ D: 8, C: 3, I: 1, S: 0 }), 'Mateo');
  assert.strictEqual(h.arquetipoLabel, 'Impulsor con veta Estratega');
  assert.strictEqual(h.primarioLabel, 'Impulsor');
  assert.strictEqual(h.vetaLabel, 'con veta Estratega');
  assert.strictEqual(h.registro, 'claro');
  assert.strictEqual(h.meter.level, 3);
  assert.match(h.lead, /se define con claridad por la acción/);
  assert.match(h.lead, /8 de sus 12/);
  assert.match(h.lead, /algo de estratega/);
});

test('caso rotundo (10-1-1-0): suena fuerte y cita el número', () => {
  const h = buildReportHero(fichaFor({ D: 10, I: 1, S: 1, C: 0 }), 'Lucas');
  assert.strictEqual(h.registro, 'rotundo');
  assert.strictEqual(h.meter.level, 4);
  assert.match(h.lead, /se apoya de lleno/);
  assert.match(h.lead, /10 de sus 12/);
});

test('caso parejo (6-6-0-0): igual da perfil + veta, nombra los dos motores', () => {
  const h = buildReportHero(fichaFor({ D: 6, I: 6, S: 0, C: 0 }), 'Sofi');
  assert.strictEqual(h.registro, 'parejo');
  assert.strictEqual(h.meter.level, 1);
  assert.strictEqual(h.arquetipoLabel, 'Impulsor con veta Conector'); // nunca "no pudimos"
  assert.match(h.lead, /dos motores bien parejos/);
});

// Respuestas EN ORDEN de escena (con question_id) para que la contingencia funcione.
const ordered = (pairs: [number, 'D' | 'I' | 'S' | 'C'][]) =>
  pairs.map(([n, ax]) => ({ axis: ax, responseTimeMs: 1000, question_id: `q${n}` }));
const orderedFicha = (pairs: [number, 'D' | 'I' | 'S' | 'C'][]) =>
  resolveEvidenceFicha(ordered(pairs) as never, { edadMeses: 132, questionVersion: 'v4-2026-07' });

// Chico D con desvío a Estratega en la adversidad (9-2-1-0).
const DESVIO: [number, 'D' | 'I' | 'S' | 'C'][] = [
  [1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'C'], [6, 'C'], [7, 'D'], [8, 'D'], [9, 'D'], [10, 'I'], [11, 'D'], [12, 'D'],
];

test('receta section: describe su mezcla con la cifra, sin placeholders', () => {
  const s = buildRecetaSection(orderedFicha(DESVIO), 'Mateo');
  assert.match(s, /Lo que más mueve a Mateo es la acción/);
  assert.match(s, /9 de sus 12/);
  assert.ok(!/\{nombre\}/.test(s));
});

test('contingencia section: narra el desvío ("cambia de registro")', () => {
  const s = buildContingenciaSection(orderedFicha(DESVIO), 'Mateo');
  assert.ok(s);
  assert.match(s!, /cuando la cosa se complica cambia de registro/);
  assert.match(s!, /mirar el plan antes de actuar/); // conducta Estratega
});

test('contingencia section: sin patrones robustos => null (se omite, no inventa)', () => {
  // inicio dividido, adversidad 1-1-1, esfuerzo dividido => ningún patrón
  const sinPatron: [number, 'D' | 'I' | 'S' | 'C'][] = [
    [1, 'D'], [2, 'C'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'I'], [7, 'S'], [8, 'D'], [9, 'D'], [10, 'D'], [11, 'C'], [12, 'D'],
  ];
  assert.strictEqual(buildContingenciaSection(orderedFicha(sinPatron), 'X'), null);
});

test('tormenta: 2/3 => lectura tentativa nombrando las dos', () => {
  const s = buildTormentaSection(orderedFicha(DESVIO), 'Mateo'); // Q5 C, Q6 C, Q7 D
  assert.match(s, /dos de las tres escenas de tormenta/);
  assert.match(s, /mirar el plan antes de actuar/); // C mayoritario
});

test('tormenta: 3/3 => firme; 1-1-1 => caso por caso', () => {
  const tres = buildTormentaSection(orderedFicha([[1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'D'], [7, 'D'], [8, 'D'], [9, 'D'], [10, 'D'], [11, 'D'], [12, 'D']]), 'Lucas');
  assert.match(tres, /tendió a lo mismo/);
  const disp = buildTormentaSection(orderedFicha([[1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'D'], [6, 'I'], [7, 'S'], [8, 'D'], [9, 'D'], [10, 'D'], [11, 'D'], [12, 'D']]), 'Sofi');
  assert.match(disp, /no aplicó una sola receta/);
});

test('grupo: I y S bajos => lectura positiva, sin "poco sociable"', () => {
  const s = buildGrupoSection(orderedFicha(DESVIO), 'Mateo'); // I=1, S=0
  assert.match(s, /no dice nada de su capacidad social/);
  assert.match(s, /roles donde su fortaleza tenga impacto/);
});

test('cuando le sale bien: anclado al perfil + ejemplo de la meta (Q12)', () => {
  const s = buildLogroSection(orderedFicha(DESVIO), 'Mateo'); // prim D, Q12 D
  assert.match(s, /perfil de impulsor/);
  assert.match(s, /próximo objetivo/);            // anchor del perfil
  assert.match(s, /al llegar a la meta, eligió mirar ya hacia el próximo reto/); // ejemplo Q12
});

test('patrón de decisión: ritmo uniforme => lectura de consistencia (parejo)', () => {
  const s = buildPatronSection(orderedFicha(DESVIO), 'Mateo'); // rt uniforme => ritmoAcople null
  assert.match(s, /ritmo bastante parejo/);
});

test('contenido eje D (Mateo): combustible, palabras, guía, reset y ecos con nombre inyectado', () => {
  const f = orderedFicha(DESVIO); // prim D
  const comb = buildCombustibleSection(f, 'Mateo');
  assert.ok(comb && comb.includes('Mateo') && !/\{nombre\}/.test(comb));
  const pal = buildPalabrasSection(f, 'Mateo');
  assert.ok(pal && pal.puente.length >= 3 && pal.ruido.length >= 2);
  assert.match(pal!.puente[0], /Arranca tú/);
  const guia = buildGuiaSection(f, 'Mateo');
  assert.ok(guia && guia.antes && guia.durante && guia.despues);
  const reset = buildResetSection(f, 'Mateo');
  assert.ok(reset && reset.includes('Mateo') && /reset/.test(reset));
  const ecos = buildEcosSection(f, 'Mateo');
  assert.ok(ecos && ecos.includes('Mateo'));
});

test('buildReportV4: ensambla hero + secciones ordenadas; omite lo no narratable', () => {
  const r = buildReportV4(orderedFicha(DESVIO), 'Mateo');
  assert.strictEqual(r.hero.arquetipoLabel, 'Impulsor con veta Estratega');
  const ids = r.secciones.map((s) => s.id);
  // data-driven siempre presentes + contenido D presente
  ['receta', 'contingencia', 'patron', 'tormenta', 'grupo', 'logro', 'combustible', 'palabras', 'guia', 'reset', 'ecos'].forEach((id) =>
    assert.ok(ids.includes(id), `falta sección ${id}`));
  // motor se omite (sin juegos) y queda registrado
  assert.ok(!ids.includes('motor'));
  assert.ok(r.omitidas.some((o) => o.id === 'motor' && o.motivo === 'sin_datos'));
  // la sección palabras trae el objeto estructurado
  const pal = r.secciones.find((s) => s.id === 'palabras');
  assert.strictEqual(pal?.kind, 'palabras');
  assert.ok(pal?.palabras && pal.palabras.puente.length >= 3);
});

test('buildReportV4: eje sin contenido redactado (I) omite las secciones de contenido, NO las inventa', () => {
  // 8 votos I => primario Conector, que aún no tiene EJE_BASE => secciones de contenido null
  const soloI: [number, 'D' | 'I' | 'S' | 'C'][] = [
    [1, 'I'], [2, 'I'], [3, 'I'], [4, 'I'], [5, 'I'], [6, 'I'], [7, 'I'], [8, 'I'], [9, 'D'], [10, 'D'], [11, 'S'], [12, 'C'],
  ];
  const r = buildReportV4(orderedFicha(soloI), 'Sofi');
  const ids = r.secciones.map((s) => s.id);
  assert.ok(ids.includes('receta') && ids.includes('logro')); // data-driven sí
  ['combustible', 'palabras', 'guia', 'reset', 'ecos'].forEach((id) => {
    assert.ok(!ids.includes(id), `no debería estar ${id} sin contenido`);
    assert.ok(r.omitidas.some((o) => o.id === id && o.motivo === 'sin_contenido'));
  });
});

test('Su motor: con juegos rápidos narra; sin juegos devuelve null (se omite)', () => {
  const sinJuegos = fichaFor({ D: 8, C: 3, I: 1, S: 0 });
  assert.strictEqual(buildMotorSection(sinJuegos, 'Mateo'), null); // no narratable => omitir

  const ficha = resolveEvidenceFicha(answersFrom({ D: 8, C: 3, I: 1, S: 0 }) as never, {
    edadMeses: 132, questionVersion: 'q1',
    games: {
      impulse: { avgLatency: 1400, latencies: [1400, 1400] } as never,
      rhythm: { avgReaction: 380, reactionTimes: [380, 380] } as never,
    },
  });
  const motor = buildMotorSection(ficha, 'Mateo');
  assert.ok(motor && motor.includes('Mateo'));
  assert.ok(!/\{nombre\}/.test(motor)); // el placeholder se reemplazó
});
