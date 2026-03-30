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

        // Get tenant by slug
        const { data: tenant } = await sb
            .from('tenants')
            .select('id, display_name, plan, trial_expires_at, roster_limit')
            .eq('slug', slug)
            .single();

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Check trial expiration
        if (tenant.plan === 'trial' && tenant.trial_expires_at) {
            if (new Date(tenant.trial_expires_at) < new Date()) {
                return res.status(403).json({ error: 'trial_expired' });
            }
        }

        // Check roster capacity via RPC (atomic, uses SELECT FOR UPDATE)
        const { data, error } = await sb.rpc('check_roster_capacity', { p_tenant_id: tenant.id });

        if (error) {
            console.error('[start-play] RPC error:', error.message);
            if (error.message.includes('trial_expired')) {
                return res.status(403).json({ error: 'trial_expired' });
            }
            if (error.message.includes('roster_full')) {
                return res.status(403).json({
                    error: 'roster_full',
                    roster_limit: tenant.roster_limit,
                });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(200).json({
            ok: true,
            tenant_id: tenant.id,
            tenant_name: tenant.display_name,
            roster_limit: data.roster_limit,
            active_count: data.active_count,
            available: data.available,
        });
    } catch (err) {
        console.error('[start-play] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
