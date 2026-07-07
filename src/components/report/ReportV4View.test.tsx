// src/components/report/ReportV4View.test.tsx  (run via: tsx --test)
// Renderiza el informe v4 real a HTML estático y verifica la estructura aprobada.
import test from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportV4View } from './ReportV4View';
import { buildReportV4, sportFrame } from '../../lib/reportV4';
import { resolveEvidenceFicha } from '../../lib/profileResolver';

const a = (n: number, axis: 'D' | 'I' | 'S' | 'C', rt: number) => ({ axis, responseTimeMs: rt, question_id: `q${n}` });
function mateoReport() {
  const answers = [
    a(1, 'D', 720), a(2, 'D', 690), a(3, 'D', 780), a(4, 'D', 700),
    a(5, 'C', 1620), a(6, 'C', 1540), a(7, 'D', 810),
    a(8, 'D', 700), a(9, 'C', 1500), a(10, 'I', 1480), a(11, 'D', 730), a(12, 'D', 760),
  ];
  const ficha = resolveEvidenceFicha(answers as never, {
    edadMeses: 132, questionVersion: 'v4',
    games: {
      impulse: { avgLatency: 1250, latencies: [1200, 1300] } as never,
      rhythm: { avgReaction: 355, reactionTimes: [350, 360] } as never,
    },
  });
  return buildReportV4(ficha, { nombre: 'Mateo', genero: 'm', frame: sportFrame('Fútbol') } as never);
}

test('ReportV4View renderiza el informe real: hero, negritas, ejemplos, chips, pasos, footer', () => {
  const html = renderToStaticMarkup(
    React.createElement(ReportV4View, { report: mateoReport(), edad: 11, deporte: 'Fútbol' }),
  );
  // Hero: perfil + veta coloreados
  assert.match(html, /Impulsor/);
  assert.match(html, /con veta/);
  assert.match(html, /Estratega/);
  assert.match(html, /Mateo · 11 años · Fútbol/);
  // Negritas: al menos un <strong> del **markdown**
  assert.match(html, /<strong[^>]*>[^<]+<\/strong>/);
  assert.ok(!/\*\*/.test(html), 'no deben quedar marcadores ** sin convertir');
  // Ejemplo (bajada a tierra), sin el rótulo "Por ejemplo"
  assert.ok(!/Por ejemplo/.test(html));
  // Palabras: columnas + un chip puente
  assert.match(html, /Conectan/);
  assert.match(html, /Hacen ruido/);
  assert.match(html, /Arranca tú con esto/);
  // Guía: los tres momentos
  assert.match(html, /Antes/);
  assert.match(html, /Durante/);
  assert.match(html, /Después/);
  // Grupos
  assert.match(html, /Quién es Mateo hoy/);
  assert.match(html, /Cómo acompañar a Mateo/);
  // Footer: dos registros (potencial + taxativo)
  assert.match(html, /cómo tiende a elegir Mateo hoy/);
  assert.match(html, /cada 6 meses/);
  // Motor presente (había juegos)
  assert.match(html, /Su motor/);
});

test('ReportV4View omite grupos vacíos (sin motor/contingencia)', () => {
  // ficha sin juegos y sin desvío => motor y contingencia omitidos
  const answers = Array.from({ length: 12 }, (_, i) => a(i + 1, 'D', 1000));
  const ficha = resolveEvidenceFicha(answers as never, { edadMeses: 132, questionVersion: 'v4' });
  const report = buildReportV4(ficha, { nombre: 'Lucas', genero: 'm', frame: 'equipo' } as never);
  const html = renderToStaticMarkup(React.createElement(ReportV4View, { report, edad: 10, deporte: 'Básquet' }));
  assert.ok(!/Su motor/.test(html));   // sin juegos
  assert.match(html, /Su mezcla/);      // data-driven sí
  assert.match(html, /Quién es Lucas hoy/);
});
