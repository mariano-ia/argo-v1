// Unit tests for Argo Coach pure helpers (canonical naming + name matching).
// Run: npx tsx --test scripts/qa/coach-helpers.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    canonicalArchetype,
    canonicalMotorDisplay,
    normalizeName,
    nameIsMentioned,
    unknownNameTokens,
} from '../../api/tenant-chat.ts';

test('canonicalArchetype derives from eje+motor (es)', () => {
    assert.equal(canonicalArchetype('S', 'Medio', 'es'), 'Sostenedor Rítmico');
    assert.equal(canonicalArchetype('D', 'Rápido', 'es'), 'Impulsor Dinámico');
    assert.equal(canonicalArchetype('S', 'Lento', 'es'), 'Sostenedor Sereno');
});

test('canonicalArchetype handles C+Lento = Observador', () => {
    assert.equal(canonicalArchetype('C', 'Lento', 'es'), 'Estratega Observador');
    assert.equal(canonicalMotorDisplay('C', 'Lento', 'es'), 'Observador');
    // Other axes with Lento stay "Sereno".
    assert.equal(canonicalMotorDisplay('S', 'Lento', 'es'), 'Sereno');
});

test('canonicalArchetype reverses word order in English, keeps axis-first in pt', () => {
    assert.equal(canonicalArchetype('D', 'Rápido', 'en'), 'Dynamic Driver');
    assert.equal(canonicalArchetype('C', 'Lento', 'en'), 'Observant Strategist');
    assert.equal(canonicalArchetype('S', 'Medio', 'pt'), 'Sustentador Rítmico');
});

test('normalizeName strips accents and lowercases', () => {
    assert.equal(normalizeName('Iván'), 'ivan');
    assert.equal(normalizeName('Ángel'), 'angel');
    assert.equal(normalizeName('JOSÉ'), 'jose');
});

test('nameIsMentioned: lowercase + accent-insensitive', () => {
    assert.equal(nameIsMentioned('Keven', '¿qué perfil tiene keven?'), true);
    assert.equal(nameIsMentioned('Iván', 'cómo está ivan hoy'), true);
    assert.equal(nameIsMentioned('ivan', 'cómo está Iván hoy'), true);
});

test('nameIsMentioned: no substring false positives', () => {
    assert.equal(nameIsMentioned('Ana', 'hablame de Mariana'), false);
    assert.equal(nameIsMentioned('Ana', 'qué hago con Ana'), true);
});

test('nameIsMentioned: common-word names require capitalization', () => {
    assert.equal(nameIsMentioned('Sol', 'hace mucho sol hoy'), false);
    assert.equal(nameIsMentioned('Sol', 'cómo motivo a Sol'), true);
    assert.equal(nameIsMentioned('León', 'juega como un león'), false);
    assert.equal(nameIsMentioned('León', 'qué hago con León'), true);
});

test('nameIsMentioned: real names (not common words) match in lowercase', () => {
    // Regression: "olivia" is a proper name, not an everyday word. It was
    // wrongly listed as a common-word name, so a coach typing it lowercase
    // ("crees que olivia...") failed to inject the player's report.
    assert.equal(nameIsMentioned('Olivia', 'crees que olivia puede ser buena capitana?'), true);
    assert.equal(nameIsMentioned('Olivia', '¿cómo está Olivia hoy?'), true);
});

test('nameIsMentioned: full names match', () => {
    assert.equal(nameIsMentioned('Juan Pérez', '¿qué hago con Juan Pérez?'), true);
});

test('unknownNameTokens: ignores roster vocabulary, flags real proper nouns', () => {
    assert.deepEqual(unknownNameTokens('cómo motivo a un Impulsor Dinámico'), []);
    assert.deepEqual(unknownNameTokens('qué hago con Pedro'), ['Pedro']);
    // Sentence-initial archetype word is not treated as an unknown name.
    assert.deepEqual(unknownNameTokens('Estratega es un eje analítico'), []);
});
