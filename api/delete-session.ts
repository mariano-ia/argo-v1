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

    // ── Auth: verify JWT ────────────────────────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Find caller's tenant
        const { data: tenant, error: tenantError } = await sb
            .from('tenants')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (tenantError || !tenant) {
            return res.status(403).json({ error: 'Tenant not found' });
        }

        const { id, type } = req.body;

        if (type === 'session' && id) {
            // Verify session belongs to this tenant before deleting
            const { data: session } = await sb
                .from('sessions')
                .select('id, tenant_id')
                .eq('id', id)
                .single();

            if (!session || session.tenant_id !== tenant.id) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Soft-delete
            const { error } = await sb.from('sessions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('tenant_id', tenant.id); // double-check with tenant_id
            if (error) return res.status(500).json({ error: 'Internal server error' });
        } else if (type === 'lead' && id) {
            // Soft-delete lead by id (require id, not email)
            const { data: lead } = await sb
                .from('leads')
                .select('id, tenant_id')
                .eq('id', id)
                .single();

            if (!lead || lead.tenant_id !== tenant.id) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            const { error } = await sb.from('leads')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('tenant_id', tenant.id);
            if (error) return res.status(500).json({ error: 'Internal server error' });
        } else {
            return res.status(400).json({ error: 'Missing id and type' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[delete-session] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
