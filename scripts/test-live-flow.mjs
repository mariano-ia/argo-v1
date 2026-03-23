/**
 * End-to-end test of the session lifecycle against the LIVE Vercel endpoints.
 * Creates a test session, updates it, verifies in DB, then cleans up.
 */
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://argomethod.com'; // production
const SB_URL = 'https://luutdozbhinfiogugjbv.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dXRkb3piaGluZmlvZ3VnamJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE1NDYyMSwiZXhwIjoyMDg4NzMwNjIxfQ.nDv9zZuAIEfeUqCdVySlUgnbAnJD3TBiCEuyS9IHLm4';
const sb = createClient(SB_URL, SB_KEY);

let ok = true;
function check(name, cond) {
    if (cond) console.log('  OK:', name);
    else { console.error('  FAIL:', name); ok = false; }
}

const TEST_EMAIL = 'qa-e2e-test@test.com';

try {
    // ── Step 1: Call start-session ─────────────────────────────────
    console.log('1. Calling /api/start-session...');
    const startRes = await fetch(`${BASE_URL}/api/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            adult_name: 'QA Test',
            adult_email: TEST_EMAIL,
            child_name: 'QA Kid',
            child_age: 10,
            sport: 'Test',
            lang: 'es',
        }),
    });
    const startData = await startRes.json();
    console.log('  Response:', startRes.status, JSON.stringify(startData));
    check('start-session returns 200', startRes.ok);
    check('start-session returns ok=true', startData.ok === true);
    check('start-session returns id', typeof startData.id === 'string' && startData.id.length > 0);

    const sessionId = startData.id;

    // Verify in DB: session exists with _pending
    const { data: started } = await sb.from('sessions').select('eje, motor, archetype_label')
        .eq('id', sessionId).single();
    console.log('  DB record:', JSON.stringify(started));
    check('DB has _pending eje', started?.eje === '_pending');
    check('DB has _pending motor', started?.motor === '_pending');
    check('DB has _pending archetype', started?.archetype_label === '_pending');

    // ── Step 2: Call update-session (profile data) ────────────────
    console.log('\n2. Calling /api/update-session (profile)...');
    const updateRes = await fetch(`${BASE_URL}/api/update-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: sessionId,
            eje: 'D',
            motor: 'Medio',
            archetype_label: 'Impulsor Decidido',
            eje_secundario: 'I',
            answers: [{ axis: 'D', responseTimeMs: 5000 }],
        }),
    });
    const updateData = await updateRes.json();
    console.log('  Response:', updateRes.status, JSON.stringify(updateData));
    check('update-session returns 200', updateRes.ok);
    check('update-session returns ok=true', updateData.ok === true);

    // Verify in DB: session now has profile data
    const { data: updated } = await sb.from('sessions').select('eje, motor, archetype_label, eje_secundario, answers')
        .eq('id', sessionId).single();
    console.log('  DB record:', JSON.stringify(updated));
    check('DB eje updated to D', updated?.eje === 'D');
    check('DB motor updated to Medio', updated?.motor === 'Medio');
    check('DB archetype updated', updated?.archetype_label === 'Impulsor Decidido');
    check('DB eje_secundario updated', updated?.eje_secundario === 'I');
    check('DB answers updated', Array.isArray(updated?.answers) && updated.answers.length === 1);

    // ── Step 3: Call update-session (AI usage) ────────────────────
    console.log('\n3. Calling /api/update-session (AI usage)...');
    const aiRes = await fetch(`${BASE_URL}/api/update-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: sessionId,
            ai_tokens_input: 500,
            ai_tokens_output: 200,
            ai_cost_usd: 0.01,
        }),
    });
    const aiData = await aiRes.json();
    console.log('  Response:', aiRes.status, JSON.stringify(aiData));
    check('AI update returns 200', aiRes.ok);

    // Verify AI usage in DB
    const { data: withAI } = await sb.from('sessions').select('ai_tokens_input, ai_tokens_output, ai_cost_usd')
        .eq('id', sessionId).single();
    console.log('  DB record:', JSON.stringify(withAI));
    check('DB ai_tokens_input = 500', withAI?.ai_tokens_input === 500);
    check('DB ai_tokens_output = 200', withAI?.ai_tokens_output === 200);

    // ── Step 4: Verify dashboard filter excludes nothing wrong ────
    console.log('\n4. Verifying dashboard filter...');
    const { data: dashVisible } = await sb.from('sessions').select('id')
        .is('deleted_at', null).not('eje', 'eq', '_pending')
        .eq('id', sessionId);
    check('Completed session visible in dashboard', dashVisible && dashVisible.length === 1);

    // ── Step 5: Test security — try to update dangerous field ─────
    console.log('\n5. Security test: try updating deleted_at...');
    const hackRes = await fetch(`${BASE_URL}/api/update-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: sessionId,
            deleted_at: new Date().toISOString(),
            adult_email: 'hacked@evil.com',
        }),
    });
    const hackData = await hackRes.json();
    console.log('  Response:', hackRes.status, JSON.stringify(hackData));
    check('Dangerous fields rejected (400)', hackRes.status === 400);

    // Verify session still intact
    const { data: intact } = await sb.from('sessions').select('adult_email, deleted_at')
        .eq('id', sessionId).single();
    check('Email unchanged', intact?.adult_email === TEST_EMAIL);
    check('deleted_at still null', intact?.deleted_at === null);

    // ── Cleanup: hard delete test session ─────────────────────────
    console.log('\n6. Cleaning up test session...');
    const { error: delErr } = await sb.from('sessions').delete().eq('id', sessionId);
    check('Test session deleted', delErr == null);

} catch (err) {
    console.error('Test error:', err);
    ok = false;
}

console.log('\n' + '='.repeat(40));
if (ok) {
    console.log('ALL E2E TESTS PASSED');
} else {
    console.log('SOME TESTS FAILED');
    process.exit(1);
}
