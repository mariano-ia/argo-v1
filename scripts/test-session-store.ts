/**
 * Tests the sessionStore functions: startSession, updateSession, saveSession
 * and localStorage recovery functions.
 *
 * Since we're in Node (not browser), we mock localStorage and import.meta.env.DEV.
 */

// Mock localStorage for Node
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
};

// The sessionStore module checks import.meta.env.DEV — in tsx it's undefined by default.
// The functions will try to fetch() in non-DEV mode, so we need to mock fetch for that path.
// But let's test the localStorage functions directly since they don't need fetch.

import {
    saveProgressToLocal,
    getRecoverableSession,
    clearRecoveryData,
    RecoverableSession,
} from '../src/lib/sessionStore';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, msg = '') => {
    if (cond) { pass++; }
    else { fail++; console.error('FAIL:', name, msg ? '— ' + msg : ''); }
};

const mockAdultData = {
    nombreAdulto: 'Test Parent',
    email: 'test@test.com',
    nombreNino: 'TestKid',
    edad: 10,
    deporte: 'Fútbol',
};

const mockAnswers = [
    { axis: 'D' as const, responseTimeMs: 5000 },
    { axis: 'I' as const, responseTimeMs: 6000 },
    { axis: 'C' as const, responseTimeMs: 7000 },
];

// ── Test localStorage save/get/clear cycle ────────────────────────────

console.log('--- localStorage recovery tests ---');

// T1: No recovery data initially
const r1 = getRecoverableSession();
check('T1 no initial data', r1 === null, 'expected null got ' + JSON.stringify(r1));

// T2: Save and retrieve
const sessionData: RecoverableSession = {
    adultData: mockAdultData,
    answers: mockAnswers,
    screenIndex: 15,
    sessionId: 'test-session-123',
    lang: 'es',
    timestamp: Date.now(),
};
saveProgressToLocal(sessionData);
const r2 = getRecoverableSession();
check('T2 retrieves saved data', r2 !== null);
check('T2 child name', r2?.adultData.nombreNino === 'TestKid');
check('T2 answers count', r2?.answers.length === 3);
check('T2 screenIndex', r2?.screenIndex === 15);
check('T2 sessionId', r2?.sessionId === 'test-session-123');

// T3: Clear and verify gone
clearRecoveryData();
const r3 = getRecoverableSession();
check('T3 cleared', r3 === null, 'expected null after clear');

// T4: Expired data (> 2 hours old)
const expiredData: RecoverableSession = {
    adultData: mockAdultData,
    answers: mockAnswers,
    screenIndex: 10,
    timestamp: Date.now() - (3 * 60 * 60 * 1000), // 3 hours ago
};
saveProgressToLocal(expiredData);
const r4 = getRecoverableSession();
check('T4 expired data ignored', r4 === null, 'expected null for expired data');

// T5: Empty answers → not recoverable
const emptyAnswers: RecoverableSession = {
    adultData: mockAdultData,
    answers: [],
    screenIndex: 5,
    timestamp: Date.now(),
};
saveProgressToLocal(emptyAnswers);
const r5 = getRecoverableSession();
check('T5 empty answers ignored', r5 === null, 'expected null for empty answers');

// T6: Progressive save (simulate answering questions one by one)
clearRecoveryData();
for (let i = 0; i < 12; i++) {
    const progressiveAnswers = Array.from({ length: i + 1 }, (_, j) => ({
        axis: (['D', 'I', 'S', 'C'] as const)[j % 4],
        responseTimeMs: 5000 + j * 500,
    }));
    saveProgressToLocal({
        adultData: mockAdultData,
        answers: progressiveAnswers,
        screenIndex: 10 + i,
        sessionId: 'prog-session',
        timestamp: Date.now(),
    });
}
const r6 = getRecoverableSession();
check('T6 progressive save', r6 !== null);
check('T6 has 12 answers', r6?.answers.length === 12, 'got ' + r6?.answers.length);
check('T6 last screenIndex', r6?.screenIndex === 21, 'got ' + r6?.screenIndex);
clearRecoveryData();

// ── Summary ─────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(40));
console.log(`Passed: ${pass} | Failed: ${fail}`);
if (fail > 0) process.exit(1);
console.log('ALL TESTS PASSED');
