import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Get caller's tenant
        const { data: callerRow } = await sb
            .from('tenant_members')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .single();
        if (!callerRow) return res.status(404).json({ error: 'Tenant not found' });

        const { data: members, error } = await sb
            .from('tenant_members')
            .select('id, email, role, status, invited_at, auth_user_id')
            .eq('tenant_id', callerRow.tenant_id)
            .order('invited_at', { ascending: true });

        if (error) {
            console.error('[tenant-members] Query error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        const mapped = (members ?? []).map(m => ({
            ...m,
            isCurrentUser: m.auth_user_id === user.id,
            auth_user_id: undefined, // don't expose auth IDs to client
        }));

        return res.status(200).json({ members: mapped });
    } catch (err) {
        console.error('[tenant-members] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
