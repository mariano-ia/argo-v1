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

        // Resolve tenant
        const { data: memberRow } = await sb
            .from('tenant_members')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        const tenantId = memberRow?.tenant_id
            ?? (await sb.from('tenants').select('id').eq('auth_user_id', user.id).maybeSingle()).data?.id;

        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        const { session_id, action } = req.body as { session_id: string; action: 'archive' | 'reactivate' };

        if (!session_id || !action) {
            return res.status(400).json({ error: 'Missing session_id or action' });
        }

        // Verify session belongs to this tenant
        const { data: session } = await sb
            .from('sessions')
            .select('id, archived_at, tenant_id')
            .eq('id', session_id)
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .maybeSingle();

        if (!session) return res.status(404).json({ error: 'Session not found' });

        if (action === 'archive') {
            if (session.archived_at) return res.status(400).json({ error: 'Already archived' });

            const { error } = await sb
                .from('sessions')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', session_id);

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true, action: 'archived' });
        }

        if (action === 'reactivate') {
            if (!session.archived_at) return res.status(400).json({ error: 'Not archived' });

            // Check roster capacity before reactivating
            const { data: tenant } = await sb
                .from('tenants')
                .select('roster_limit')
                .eq('id', tenantId)
                .single();

            const { count } = await sb
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .is('archived_at', null)
                .is('deleted_at', null);

            if ((count ?? 0) >= (tenant?.roster_limit ?? 0)) {
                return res.status(403).json({ error: 'roster_full' });
            }

            const { error } = await sb
                .from('sessions')
                .update({ archived_at: null })
                .eq('id', session_id);

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true, action: 'reactivated' });
        }

        return res.status(400).json({ error: 'Invalid action. Use "archive" or "reactivate".' });
    } catch (err) {
        console.error('[archive-player] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
