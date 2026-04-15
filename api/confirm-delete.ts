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

        // Find all matching sessions. Same matching policy as request-delete:
        // exact email, substring child_name (case-insensitive).
        let sessionQuery = sb
            .from('sessions')
            .select('id')
            .ilike('adult_email', request.adult_email);
        if (request.child_name) {
            const safe = request.child_name.replace(/[%_]/g, '\\$&');
            sessionQuery = sessionQuery.ilike('child_name', `%${safe}%`);
        }
        const { data: matchedSessions, error: matchErr } = await sessionQuery;
        if (matchErr) {
            console.error('[confirm-delete] match error:', matchErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        const sessionIds = (matchedSessions ?? []).map(s => s.id);
        let deletedCount = 0;

        if (sessionIds.length > 0) {
            // Hard delete related rows first (same order as delete-session.ts)
            await sb.from('feedback').delete().in('session_id', sessionIds);
            await sb.from('chat_messages').delete().in('session_id', sessionIds);
            await sb.from('group_members').delete().in('session_id', sessionIds);
            await sb.from('parental_consents').delete().in('session_id', sessionIds);

            const { error: delErr, count: delCount } = await sb
                .from('sessions')
                .delete({ count: 'exact' })
                .in('id', sessionIds);

            if (delErr) {
                console.error('[confirm-delete] session delete error:', delErr.message);
                return res.status(500).json({ ok: false, error: 'delete_failed' });
            }
            deletedCount = delCount ?? sessionIds.length;
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
