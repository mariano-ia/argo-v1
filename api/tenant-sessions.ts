import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify caller owns this tenant via their auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // Validate the JWT and get user
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Find their tenant via tenant_members (supports owner + invited members)
        const { data: memberRow } = await sb
            .from('tenant_members')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!memberRow) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        const tenant = { id: memberRow.tenant_id };

        // Fetch sessions for this tenant
        const { data: sessions, error: sessError } = await sb
            .from('sessions')
            .select('id, child_name, child_age, adult_name, adult_email, sport, archetype_label, eje, motor, eje_secundario, created_at, lang, answers, ai_sections')
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .not('eje', 'eq', '_pending')
            .order('created_at', { ascending: false })
            .limit(100);

        if (sessError) {
            console.error('[tenant-sessions] Query error:', sessError.message);
            return res.status(500).json({ error: 'Failed to fetch sessions' });
        }

        return res.status(200).json({ sessions: sessions ?? [], total: sessions?.length ?? 0 });
    } catch (err) {
        console.error('[tenant-sessions] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
