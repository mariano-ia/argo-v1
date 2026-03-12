import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Temporary cleanup endpoint — DELETE after testing.
 * Restores credits and removes QA test data.
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
        // 1. Restore credits to 3 for the test tenant
        const { data: tenant, error: tErr } = await sb
            .from('tenants')
            .update({ credits_remaining: 3 })
            .eq('slug', 'martin-bruno-31y0ah')
            .select('id, slug, credits_remaining')
            .single();

        results.credits_restored = { data: tenant, error: tErr?.message };

        // 2. Delete all QA test sessions
        const testNames = ['__QA_TEST__', 'QA Test', 'QA Final'];
        for (const name of testNames) {
            const { data } = await sb.from('sessions').select('id').eq('adult_name', name);
            if (data && data.length > 0) {
                await sb.from('sessions').delete().eq('adult_name', name);
                results[`cleanup_${name}`] = { deleted: data.length };
            }
        }

        // 3. Show current state
        const { data: sessions } = await sb
            .from('sessions')
            .select('id, adult_name, child_name, tenant_id')
            .eq('tenant_id', tenant?.id ?? '')
            .is('deleted_at', null);

        results.remaining_tenant_sessions = sessions?.length ?? 0;
        results.summary = 'CLEANUP DONE';

        return res.status(200).json(results);
    } catch (err) {
        results.error = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json(results);
    }
}
