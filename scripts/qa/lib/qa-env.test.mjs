// scripts/qa/lib/qa-env.test.mjs
import assert from 'node:assert';
import { makeAssert } from './qa-env.mjs';

const results = [];
const check = makeAssert(results);
check('truthy passes', true);
check('falsy fails', false);

assert.strictEqual(results.filter(r => r.ok).length, 1, 'one passing');
assert.strictEqual(results.filter(r => !r.ok).length, 1, 'one failing');
console.log('qa-env.test PASS');
