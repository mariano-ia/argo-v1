import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Temporary QA endpoint — DELETE after testing.
 * Tests the full chain: find tenant → save session with tenant_id → read back → cleanup.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Missing env vars' });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const results: Record<string, unknown> = {};

    try {
        // 1. Find any tenant
        const { data: tenants, error: tErr } = await sb
            .from('tenants')
            .select('id, slug, display_name, credits_remaining')
            .limit(1);

        results.tenants = { data: tenants, error: tErr?.message };

        if (!tenants || tenants.length === 0) {
            return res.status(200).json({ ...results, summary: 'No tenants found — cannot test full chain' });
        }

        const tenant = tenants[0];

        // 2. Insert a test session with tenant_id
        const testSession = {
            adult_name: '__QA_TEST__',
            adult_email: 'qa-test@argomethod.com',
            child_name: 'QA Child',
            child_age: 10,
            sport: 'Test',
            eje: 'D',
            motor: 'Rápido',
            archetype_label: 'El Capitán Relámpago',
            eje_secundario: 'I',
            tenant_id: tenant.id,
            answers: [{ axis: 'D', responseTimeMs: 3000 }],
            ai_tokens_input: 0,
            ai_tokens_output: 0,
            ai_cost_usd: 0,
        };

        const { data: inserted, error: insertErr } = await sb
            .from('sessions')
            .insert(testSession)
            .select('id, child_name, tenant_id, created_at')
            .single();

        results.insert = { data: inserted, error: insertErr?.message };

        // 3. Read back sessions for this tenant
        const { data: sessions, error: readErr } = await sb
            .from('sessions')
            .select('id, child_name, adult_name, archetype_label, tenant_id, created_at')
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(5);

        results.tenant_sessions = { count: sessions?.length, data: sessions, error: readErr?.message };

        // 4. Cleanup: delete the test session
        if (inserted?.id) {
            const { error: delErr } = await sb
                .from('sessions')
                .delete()
                .eq('id', inserted.id);
            results.cleanup = { deleted: !delErr, error: delErr?.message };
        }

        // 5. Also check for any old QA test sessions without tenant_id and clean them
        const { data: orphans } = await sb
            .from('sessions')
            .select('id')
            .eq('adult_name', '__QA_TEST__');

        if (orphans && orphans.length > 0) {
            await sb.from('sessions').delete().eq('adult_name', '__QA_TEST__');
            results.orphan_cleanup = { count: orphans.length };
        }

        // Also clean the "QA Test" session from earlier curl test
        const { data: oldTests } = await sb
            .from('sessions')
            .select('id')
            .eq('adult_name', 'QA Test');

        if (oldTests && oldTests.length > 0) {
            await sb.from('sessions').delete().eq('adult_name', 'QA Test');
            results.old_test_cleanup = { count: oldTests.length };
        }

        results.summary = 'ALL CHECKS PASSED';
        return res.status(200).json(results);
    } catch (err) {
        results.error = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json(results);
    }
}
