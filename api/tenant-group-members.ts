import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

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

        const { data: tenant, error: tenantError } = await sb
            .from('tenants')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (tenantError || !tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        const { group_id, session_ids } = req.body ?? {};

        if (!group_id || !Array.isArray(session_ids) || session_ids.length === 0) {
            return res.status(400).json({ error: 'group_id and session_ids[] are required' });
        }

        // Verify group belongs to this tenant
        const { data: group, error: grpError } = await sb
            .from('groups')
            .select('id')
            .eq('id', group_id)
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .single();

        if (grpError || !group) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        // ── POST: Add sessions to group ─────────────────────────────────
        if (req.method === 'POST') {
            // Verify all sessions belong to this tenant
            const { data: validSessions, error: sessError } = await sb
                .from('sessions')
                .select('id')
                .eq('tenant_id', tenant.id)
                .is('deleted_at', null)
                .not('eje', 'eq', '_pending')
                .in('id', session_ids);

            if (sessError) {
                console.error('[tenant-group-members] Session validation error:', sessError.message);
                return res.status(500).json({ error: 'Failed to validate sessions' });
            }

            const validIds = (validSessions ?? []).map((s: { id: string }) => s.id);

            if (validIds.length === 0) {
                return res.status(400).json({ error: 'No valid sessions found' });
            }

            const rows = validIds.map((sid: string) => ({
                group_id,
                session_id: sid,
            }));

            const { error: insertError } = await sb
                .from('group_members')
                .upsert(rows, { onConflict: 'group_id,session_id' });

            if (insertError) {
                console.error('[tenant-group-members] Insert error:', insertError.message);
                return res.status(500).json({ error: 'Failed to add members' });
            }

            return res.status(200).json({ ok: true, added: validIds.length });
        }

        // ── DELETE: Remove sessions from group ──────────────────────────
        if (req.method === 'DELETE') {
            const { error: delError } = await sb
                .from('group_members')
                .delete()
                .eq('group_id', group_id)
                .in('session_id', session_ids);

            if (delError) {
                console.error('[tenant-group-members] Delete error:', delError.message);
                return res.status(500).json({ error: 'Failed to remove members' });
            }

            return res.status(200).json({ ok: true, removed: session_ids.length });
        }
    } catch (err) {
        console.error('[tenant-group-members] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
