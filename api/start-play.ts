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

        if (!slug || typeof slug !== 'string') {
            return res.status(400).json({ error: 'Missing slug' });
        }

        // Atomic credit deduction: UPDATE only if credits > 0, return new value
        const { data, error } = await sb.rpc('deduct_credit', { tenant_slug: slug });

        if (error) {
            console.error('[start-play] RPC error:', error.message);
            // Distinguish between "not found" and "no credits"
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: 'Tenant not found' });
            }
            if (error.message.includes('no credits')) {
                return res.status(403).json({ error: 'No credits remaining' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(200).json({
            ok: true,
            tenant_id: data.tenant_id,
            tenant_name: data.tenant_name,
            credits_remaining: data.credits_remaining,
        });
    } catch (err) {
        console.error('[start-play] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
