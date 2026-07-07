// src/lib/reportV4.test.ts  (run via: tsx --test)
// La máquina arma el encabezado calibrado desde la ficha real del chico.
import test from 'node:test';
import assert from 'node:assert';
import { resolveEvidenceFicha } from './profileResolver';
import { buildReportHero, buildMotorSection } from './reportV4';

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
