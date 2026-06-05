import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statAccentClass } from './Stat';

test('green accent uses the green status palette (not emerald)', () => {
    const cls = statAccentClass('green');
    assert.ok(cls.includes('bg-green-50'), 'expected bg-green-50');
    assert.ok(cls.includes('text-green-700'), 'expected text-green-700');
    assert.ok(!cls.includes('emerald'), 'must not use emerald');
});

test('amber accent uses the amber status palette', () => {
    const cls = statAccentClass('amber');
    assert.ok(cls.includes('bg-amber-50'), 'expected bg-amber-50');
    assert.ok(cls.includes('text-amber-700'), 'expected text-amber-700');
});

test('red accent uses the red status palette', () => {
    const cls = statAccentClass('red');
    assert.ok(cls.includes('bg-red-50'), 'expected bg-red-50');
    assert.ok(cls.includes('text-red-700'), 'expected text-red-700');
});

test('no accent falls back to the neutral card style', () => {
    const cls = statAccentClass(undefined);
    assert.ok(cls.includes('bg-white'), 'expected bg-white');
    assert.ok(cls.includes('text-argo-navy'), 'expected text-argo-navy');
});
