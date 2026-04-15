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

            // HARD DELETE: remove related rows first, then the session itself.
            // COPPA §312.10 requires that deletion of a child's data is real
            // (not a soft-delete where the row stays in the database).
            //
            // Order matters: delete things that FK-reference the session before
            // the session row itself, otherwise Postgres rejects the delete.

            // 1. Delete feedback tied to this session (if any)
            await sb.from('feedback').delete().eq('session_id', id);

            // 2. Delete chat_messages that reference this session (if any)
            await sb.from('chat_messages').delete().eq('session_id', id);

            // 3. Delete group_members entries for this session
            await sb.from('group_members').delete().eq('session_id', id);

            // 4. Delete the parental_consents row that created this session
            //    (audit trail is preserved via the admin_audit_log entry below)
            await sb.from('parental_consents').delete().eq('session_id', id);

            // 5. Delete the session row itself
            const { error } = await sb.from('sessions')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant.id); // double-check with tenant_id
            if (error) {
                console.error('[delete-session] session delete error:', error.message);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // 6. Audit log (kept — no PII, only the fact that a delete happened)
            await sb.from('admin_audit_log').insert({
                admin_email: user.email ?? 'unknown',
                action: 'hard_delete_session',
                target_type: 'session',
                target_id: id,
                details: { tenant_id: tenant.id, reason: 'tenant_request' },
            });
        } else if (type === 'lead' && id) {
            // HARD DELETE for leads as well
            const { data: lead } = await sb
                .from('leads')
                .select('id, tenant_id')
                .eq('id', id)
                .single();

            if (!lead || lead.tenant_id !== tenant.id) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            const { error } = await sb.from('leads')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant.id);
            if (error) {
                console.error('[delete-session] lead delete error:', error.message);
                return res.status(500).json({ error: 'Internal server error' });
            }
        } else {
            return res.status(400).json({ error: 'Missing id and type' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[delete-session] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
