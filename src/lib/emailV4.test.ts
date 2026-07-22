// src/lib/emailV4.test.ts  (run via: tsx --test)
// Verifica que buildHtmlV4 (inlineado en api/send-email.ts) renderice el diseño aprobado del email:
// arquetipo eje×veta coloreado, voz nueva con negritas, CTA, ArgoPuente USD 4.99, SIN motor legacy.
import test from 'node:test';
import assert from 'node:assert';
import { buildHtmlV4 } from '../../api/send-email';

const hero = {
  primarioLabel: 'Impulsor',
  vetaLabel: 'con veta Estratega',
  ejePrimario: 'D',
  ejeSecundario: 'C',
  lead: 'El juego de Mateo se apoya **con claridad en la acción**: fue lo que eligió en la mayoría de sus decisiones.',
};
const params = { nombreNino: 'Mateo', nombreAdulto: 'Marian', edad: 11, deporte: 'Fútbol', sessionId: 'abc', shareToken: 'tok', siteUrl: 'https://develop.argomethod.com', lang: 'es' };

test('email v4: arquetipo eje×veta coloreado + voz nueva + CTA + Puente USD 4.99', () => {
  const html = buildHtmlV4(hero, params);
  // arquetipo coloreado
  assert.match(html, /Impulsor/);
  assert.match(html, /con veta/);
  assert.match(html, /Estratega/);
  assert.match(html, /#F97316/); // color D (impulsor)
  assert.match(html, /#6366F1/); // color C (estratega, veta)
  // voz nueva: las **negritas** convertidas a <b>
  assert.match(html, /<b[^>]*>con claridad en la acción<\/b>/);
  assert.ok(!/\*\*/.test(html), 'no deben quedar marcadores **');
  // CTA al informe con token
  assert.match(html, /Ver el informe completo de Mateo/);
  assert.match(html, /\/report\/abc\?token=tok/);
  // Puente USD 4.99, no el peso
  assert.match(html, /USD 4\.99/);
  assert.ok(!/ARS 4\.999/.test(html));
  // charset (para no repetir el mojibake)
  assert.match(html, /<meta charset="utf-8">/);
});

test('email v4: SIN legacy (motor Dinámico/Rítmico/Sereno) ni la oración quitada', () => {
  const html = buildHtmlV4(hero, params);
  assert.ok(!/Din[áa]mico|R[íi]tmico|Sereno|Observador/.test(html), 'no debe tener chip de motor legacy');
  assert.ok(!/Una compra te cubre/.test(html), 'la oración se quitó');
});

test('email v4: demo bloqueado => sin bloque Puente', () => {
  const html = buildHtmlV4(hero, { ...params, suppressPuentes: true });
  assert.ok(!/Empezar mi ArgoPuente/.test(html));
});

test('email v4: ya tiene Puente => mensaje "listo" con su magic link', () => {
  const html = buildHtmlV4(hero, { ...params, existingPuentesMagicLink: 'https://x/puentes/mtok' });
  assert.match(html, /con Mateo ya está listo/);
  assert.match(html, /puentes\/mtok/);
  assert.ok(!/Empezar mi ArgoPuente/.test(html));
});
