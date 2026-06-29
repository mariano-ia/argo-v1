import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/confirm-delete
 *
 * Called by /delete/:token landing after the adult clicks the confirmation
 * link in their email. Hard-deletes all matching sessions plus related rows
 * (feedback, chat_messages, group_members, parental_consents) and marks the
 * deletion_requests row as completed.
 *
 * Idempotent: calling twice on an already-completed token returns the same
 * success response with the same deleted_count.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        console.error('[confirm-delete] Missing Supabase env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const token = typeof req.body?.token === 'string' ? req.body.token : null;
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
        return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: request, error: selectErr } = await sb
            .from('deletion_requests')
            .select('token, status, expires_at, adult_email, child_name, deleted_count')
            .eq('token', token)
            .maybeSingle() as {
                data: {
                    token: string;
                    status: string;
                    expires_at: string;
                    adult_email: string;
                    child_name: string | null;
                    deleted_count: number | null;
                } | null;
                error: { message: string } | null;
            };

        if (selectErr) {
            console.error('[confirm-delete] select error:', selectErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }
        if (!request) {
            return res.status(404).json({ ok: false, error: 'not_found' });
        }

        // Expired
        if (new Date(request.expires_at) < new Date()) {
            if (request.status === 'pending') {
                await sb.from('deletion_requests')
                    .update({ status: 'expired' })
                    .eq('token', token);
            }
            return res.status(410).json({ ok: false, error: 'expired' });
        }

        // Idempotent: already completed
        if (request.status === 'completed') {
            return res.status(200).json({
                ok: true,
                deleted_count: request.deleted_count ?? 0,
            });
        }
        if (request.status === 'expired') {
            return res.status(410).json({ ok: false, error: 'expired' });
        }

        // Capture audit trail
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : (forwardedFor ?? '').split(',')[0].trim() || null;
        const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

        // Mark as confirmed (locks it in so retries are safe)
        await sb.from('deletion_requests')
            .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
                confirmed_ip: ip,
                confirmed_user_agent: ua ? ua.slice(0, 500) : null,
            })
            .eq('token', token);

        // Find all matching children (the persistent identity to erase). Same
        // matching policy as request-delete: exact email, substring child_name
        // (case-insensitive). Identity columns live on `children` now.
        // Escape LIKE wildcards in the stored email so a crafted value can never
        // mass-match (and mass-delete) other parents' data via ILIKE.
        const emailPattern = request.adult_email.replace(/([\\%_])/g, '\\$1');
        let childQuery = sb
            .from('children')
            .select('id')
            .ilike('adult_email', emailPattern);
        if (request.child_name) {
            const safe = request.child_name.replace(/[%_]/g, '\\$&');
            childQuery = childQuery.ilike('child_name', `%${safe}%`);
        }
        const { data: matchedChildren, error: matchErr } = await childQuery;
        if (matchErr) {
            console.error('[confirm-delete] match error:', matchErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        const childIds = (matchedChildren ?? []).map(c => c.id);
        let deletedCount = 0;

        if (childIds.length > 0) {
            // Collect the perfilamiento ids for these children so we can hard
            // delete the rows that FK-reference a PERFILAMIENTO (feedback,
            // chat_messages, parental_consents still key off a perfilamiento id).
            const { data: perfis } = await sb
                .from('perfilamientos')
                .select('id')
                .in('child_id', childIds);
            const perfiIds = (perfis ?? []).map(p => p.id);

            // Hard delete related rows first (same order as delete-session.ts)
            if (perfiIds.length > 0) {
                await sb.from('feedback').delete().in('session_id', perfiIds);
                await sb.from('chat_messages').delete().in('session_id', perfiIds);
                await sb.from('parental_consents').delete().in('session_id', perfiIds);
            }
            // group_members keys on the child now.
            await sb.from('group_members').delete().in('child_id', childIds);

            // Delete the children. perfilamientos.child_id is ON DELETE CASCADE,
            // so every matching child's perfilamientos are erased with it.
            const { error: delErr, count: delCount } = await sb
                .from('children')
                .delete({ count: 'exact' })
                .in('id', childIds);

            if (delErr) {
                console.error('[confirm-delete] child delete error:', delErr.message);
                return res.status(500).json({ ok: false, error: 'delete_failed' });
            }
            deletedCount = delCount ?? childIds.length;
        }

        // Mark as completed
        await sb.from('deletion_requests')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                deleted_count: deletedCount,
            })
            .eq('token', token);

        // Audit log (no PII)
        await sb.from('admin_audit_log').insert({
            admin_email: 'parent-self-service',
            action: 'parent_delete_request',
            target_type: 'sessions',
            target_id: token.slice(0, 6),
            details: {
                deleted_count: deletedCount,
                scope: request.child_name ? 'single_child' : 'all_for_email',
            },
        });

        console.info('[confirm-delete] completed', {
            token_prefix: token.slice(0, 6),
            deleted_count: deletedCount,
        });

        return res.status(200).json({ ok: true, deleted_count: deletedCount });
    } catch (err) {
        console.error('[confirm-delete] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
