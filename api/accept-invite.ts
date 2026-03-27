import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // tenant_id was stored in user metadata at invite time
        const tenantId = user.user_metadata?.tenant_id as string | undefined;
        if (!tenantId) return res.status(400).json({ error: 'No tenant_id in user metadata' });

        // Activate the pending record — match by tenant + email
        const { error: updateError } = await sb
            .from('tenant_members')
            .update({ auth_user_id: user.id, status: 'active' })
            .eq('tenant_id', tenantId)
            .eq('email', (user.email ?? '').toLowerCase())
            .eq('status', 'pending');

        if (updateError) {
            console.error('[accept-invite] Update error:', updateError.message);
            return res.status(500).json({ error: updateError.message });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[accept-invite] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
