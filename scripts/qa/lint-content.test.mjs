// scripts/qa/lint-content.test.mjs
import assert from 'node:assert';
import { scanContent } from './lint-content.mjs';

const bad = scanContent('const a = "que vos podés con el niño — esto";', 'fake.ts');
assert.ok(bad.some(f => f.type === 'voseo'), 'detects voseo');
assert.ok(bad.some(f => f.type === 'dash'), 'detects dash in Spanish string');

const good = scanContent('const a = "tú puedes con esto";', 'fake.ts');
assert.strictEqual(good.length, 0, 'clean text has no findings');

const code = scanContent('const x = 1 - 2;', 'fake.ts');
assert.strictEqual(code.length, 0, 'plain minus is not flagged');

// English string with a dash must NOT be flagged (Spanish-only rule).
const english = scanContent("const a = 'their energy does not wait — it needs movement';", 'fake.ts');
assert.strictEqual(english.length, 0, 'English dash is not flagged');

// Debug/log string must be skipped.
const dbg = scanContent("const a = '[Argo Dev] Email mock — would send to:';", 'fake.ts');
assert.strictEqual(dbg.length, 0, 'debug literal skipped');
console.log('lint-content.test PASS');
