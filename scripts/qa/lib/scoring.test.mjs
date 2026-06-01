// scripts/qa/lib/scoring.test.mjs
import assert from 'node:assert';
import { findProhibited, hasDash, hasVoseo, hasProbabilisticLanguage } from './scoring.mjs';

assert.deepStrictEqual(findProhibited('el niño tiene un trastorno'), ['trastorno']);
assert.deepStrictEqual(findProhibited('un texto sano'), []);
assert.strictEqual(hasDash('esto — aquello'), true);
assert.strictEqual(hasDash('esto, aquello'), false);
assert.strictEqual(hasVoseo('vos podés jugar'), true);
assert.strictEqual(hasVoseo('tú puedes jugar'), false);
// Regression: correct tuteo forms must NOT be flagged as voseo (accent is the differentiator).
assert.strictEqual(hasVoseo('Tú sabes cómo'), false, 'tuteo "sabes" is not voseo');
assert.strictEqual(hasVoseo('Toma tu tiempo'), false, 'tuteo "toma" is not voseo');
assert.strictEqual(hasVoseo('vos sabés'), true, 'accented "sabés" is voseo');
// Regression: a voseo form embedded inside a longer word must NOT match (JS \b + accents bug).
assert.strictEqual(hasVoseo('puede tomárselo con calma'), false, '"tomá" inside "tomárselo" is not voseo');
assert.strictEqual(hasVoseo('los venían a buscar'), false, '"vení" inside "venían" is not voseo');
assert.strictEqual(hasVoseo('vos tomá agua'), true, 'standalone "tomá" is voseo');
assert.strictEqual(hasProbabilisticLanguage('tiende a buscar el desafío'), true);
assert.strictEqual(hasProbabilisticLanguage('es agresivo y siempre falla'), false);
console.log('scoring.test PASS');
