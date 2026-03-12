import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { slug } = req.body;

        if (!slug) {
            return res.status(400).json({ error: 'Missing slug' });
        }

        // Find tenant by slug
        const { data: tenant, error: findError } = await sb
            .from('tenants')
            .select('id, credits_remaining, display_name')
            .eq('slug', slug)
            .single();

        if (findError || !tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (tenant.credits_remaining <= 0) {
            return res.status(403).json({ error: 'No credits remaining' });
        }

        // Deduct 1 credit
        const { error: updateError } = await sb
            .from('tenants')
            .update({ credits_remaining: tenant.credits_remaining - 1 })
            .eq('id', tenant.id);

        if (updateError) {
            console.error('[start-play] Credit deduction failed:', updateError.message);
            return res.status(500).json({ error: 'Failed to deduct credit' });
        }

        return res.status(200).json({
            ok: true,
            tenant_id: tenant.id,
            tenant_name: tenant.display_name,
            credits_remaining: tenant.credits_remaining - 1,
        });
    } catch (err) {
        console.error('[start-play] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
