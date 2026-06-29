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
            // `id` is now a CHILD id (the roster slot the dashboard lists).
            // Verify the child belongs to this tenant before deleting.
            const { data: child } = await sb
                .from('children')
                .select('id, tenant_id')
                .eq('id', id)
                .single();

            if (!child || child.tenant_id !== tenant.id) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Collect this child's perfilamiento ids so we can hard-delete the
            // rows that FK-reference a PERFILAMIENTO (feedback, chat_messages,
            // parental_consents) — those FKs still point at a perfilamiento id.
            const { data: perfis } = await sb
                .from('perfilamientos')
                .select('id')
                .eq('child_id', id);
            const perfiIds = (perfis ?? []).map(p => p.id);

            // HARD DELETE: remove related rows first, then the child itself.
            // COPPA §312.10 requires that deletion of a child's data is real
            // (not a soft-delete where the row stays in the database).
            //
            // Order matters: delete things that FK-reference the perfilamientos
            // before the child row, otherwise Postgres rejects the delete.

            if (perfiIds.length > 0) {
                // 1. Delete feedback tied to this child's perfilamientos (if any)
                await sb.from('feedback').delete().in('session_id', perfiIds);

                // 2. Delete chat_messages that reference these perfilamientos (if any)
                await sb.from('chat_messages').delete().in('session_id', perfiIds);

                // 3. Delete the parental_consents rows bound to these perfilamientos
                //    (audit trail is preserved via the admin_audit_log entry below)
                await sb.from('parental_consents').delete().in('session_id', perfiIds);
            }

            // 4. Delete group_members entries for this child (membership is by child)
            await sb.from('group_members').delete().eq('child_id', id);

            // 5. Delete the child row itself. The FK on perfilamientos.child_id is
            //    ON DELETE CASCADE, so all of this child's perfilamientos go with it.
            const { error } = await sb.from('children')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant.id); // double-check with tenant_id
            if (error) {
                console.error('[delete-session] child delete error:', error.message);
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
