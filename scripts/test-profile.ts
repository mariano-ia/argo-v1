import { resolveFromAnswers, QuestionAnswer } from '../src/lib/profileResolver';

const mkAnswers = (axes: string[], avgMs = 7000): QuestionAnswer[] =>
    axes.map(axis => ({ axis: axis as 'D'|'I'|'S'|'C', responseTimeMs: avgMs }));

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, msg: string) => {
    if (cond) { pass++; }
    else { fail++; console.error('FAIL:', name, '—', msg); }
};

// Test 1: Clear D dominant (5D, 3I, 2S, 2C) — Medio range
const t1 = resolveFromAnswers(mkAnswers(['D','D','D','D','D','I','I','I','S','S','C','C']));
console.log('T1:', t1.eje, t1.motor, t1.arquetipoLabel);
check('T1 eje', t1.eje === 'D', 'expected D got ' + t1.eje);
check('T1 motor', t1.motor === 'Medio', 'expected Medio got ' + t1.motor);

// Test 2: Exact tie 3-3-3-3
const t2 = resolveFromAnswers(mkAnswers(['D','D','D','I','I','I','S','S','S','C','C','C']));
console.log('T2:', t2.eje, t2.motor, t2.arquetipoLabel);
check('T2 motor', t2.motor === 'Lento', 'expected Lento got ' + t2.motor);

// Test 3: Exact tie with tiebreaker (D overrepresented in context)
const ctx = { priorEjes: ['D','D','D','I','S'], priorMotors: ['Medio','Medio','Medio','Rápido','Lento'] };
const t3 = resolveFromAnswers(mkAnswers(['D','D','D','I','I','I','S','S','S','C','C','C']), ctx);
console.log('T3:', t3.eje, t3.motor, '| tiebreaker:', t3.tiebreakerApplied);
check('T3 tiebreaker', t3.tiebreakerApplied === true, 'expected tiebreaker applied');
check('T3 not D', t3.eje !== 'D', 'expected not D, got ' + t3.eje);

// Test 4: Fast responses → Rápido
const t4 = resolveFromAnswers(mkAnswers(['D','D','D','D','D','I','I','I','S','S','C','C'], 3000));
console.log('T4:', t4.eje, t4.motor);
check('T4 motor', t4.motor === 'Rápido', 'expected Rápido got ' + t4.motor);

// Test 5: Slow responses → Lento
const t5 = resolveFromAnswers(mkAnswers(['I','I','I','I','I','D','D','D','S','S','C','C'], 15000));
console.log('T5:', t5.eje, t5.motor);
check('T5 eje', t5.eje === 'I', 'expected I got ' + t5.eje);
check('T5 motor', t5.motor === 'Lento', 'expected Lento got ' + t5.motor);

// Test 6: Isabella (C=4,D=3,S=3,I=2) — must be C now (not D)
const isabella: QuestionAnswer[] = [
    { axis: 'C', responseTimeMs: 14000 },
    { axis: 'D', responseTimeMs: 13000 },
    { axis: 'S', responseTimeMs: 15000 },
    { axis: 'I', responseTimeMs: 12000 },
    { axis: 'C', responseTimeMs: 16000 },
    { axis: 'D', responseTimeMs: 11000 },
    { axis: 'S', responseTimeMs: 14000 },
    { axis: 'C', responseTimeMs: 13000 },
    { axis: 'D', responseTimeMs: 15000 },
    { axis: 'I', responseTimeMs: 12000 },
    { axis: 'C', responseTimeMs: 14000 },
    { axis: 'S', responseTimeMs: 16000 },
];
const t6 = resolveFromAnswers(isabella);
console.log('T6 Isabella:', t6.eje, t6.motor, t6.arquetipoLabel, '| sec:', t6.ejeSecundario);
check('T6 eje', t6.eje === 'C', 'expected C got ' + t6.eje);
check('T6 motor', t6.motor === 'Lento', 'expected Lento got ' + t6.motor);

// Test 7: Isabella + context — diff=1, tiebreaker must NOT fire
const t7 = resolveFromAnswers(isabella, ctx);
console.log('T7 Isabella+ctx:', t7.eje, t7.motor, '| tiebreaker:', t7.tiebreakerApplied);
check('T7 eje', t7.eje === 'C', 'expected C even with context');
check('T7 no tiebreaker', t7.tiebreakerApplied === false, 'tiebreaker should not apply for diff=1');

// Test 8: Motor tiebreaker (>60% Medio in context)
const medioCtx = { priorEjes: ['D','I','S','C'], priorMotors: ['Medio','Medio','Medio','Medio','Rápido'] };
const t8 = resolveFromAnswers(mkAnswers(['D','D','D','D','I','I','I','S','S','S','C','C'], 7000), medioCtx);
console.log('T8 motor tiebreaker:', t8.eje, t8.motor, '| tiebreaker:', t8.tiebreakerApplied);
check('T8 not Medio', t8.motor !== 'Medio', 'expected motor tiebreaker away from Medio');

// Test 9: ejeSecundario correct
const t9 = resolveFromAnswers(mkAnswers(['D','D','D','D','D','I','I','I','I','S','S','C']));
console.log('T9 secundario:', t9.eje, 'sec:', t9.ejeSecundario, 'tendencia:', t9.tendenciaLabel);
check('T9 eje', t9.eje === 'D', 'expected D got ' + t9.eje);
check('T9 sec', t9.ejeSecundario === 'I', 'expected secondary I got ' + t9.ejeSecundario);

// Test 10: All 12 archetypes producible (each eje x motor)
for (const eje of ['D','I','S','C'] as const) {
    for (const motor of ['Rápido','Medio','Lento'] as const) {
        const axes = Array(6).fill(eje).concat(['D','I','S','C'].filter(a => a !== eje).flatMap(a => [a, a]));
        const avgMs = motor === 'Rápido' ? 3000 : motor === 'Lento' ? 15000 : 7500;
        const r = resolveFromAnswers(mkAnswers(axes, avgMs));
        check(`T10 ${eje}-${motor}`, r.eje === eje, `expected ${eje} got ${r.eje}`);
    }
}

console.log('\n' + '='.repeat(40));
console.log(`Passed: ${pass} | Failed: ${fail}`);
if (fail > 0) process.exit(1);
console.log('ALL TESTS PASSED');
