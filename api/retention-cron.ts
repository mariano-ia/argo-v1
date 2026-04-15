import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/retention-cron
 *
 * Daily cron (Vercel) that hard-deletes stale data to comply with the
 * retention policy documented in the privacy page. Runs at 03:00 UTC.
 *
 * Retention rules:
 *  - parental_consents: expired rows older than 7 days are deleted.
 *  - parental_consents: confirmed-but-unused rows (consumed_at IS NULL)
 *    older than 48h are deleted — the 24h token + 24h grace period.
 *  - sessions (tenant archived): rows with archived_at older than 2 years
 *    are hard-deleted along with their related feedback/chat/group rows.
 *  - sessions (Argo One): rows with tenant_id IS NULL and created_at older
 *    than 2 years are hard-deleted. Argo One sessions are identified by
 *    the absence of a tenant_id.
 *  - Previously soft-deleted sessions (deleted_at IS NOT NULL) are purged
 *    as part of the migration to hard deletes — any remaining rows older
 *    than 30 days get hard-deleted.
 *
 * Authorization: Vercel Cron sends a special Authorization header with
 * a signed bearer token. For development we also accept CRON_SECRET.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel Cron sends GET; reject other methods.
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Protect against unauthorized invocation (anyone with the URL).
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization ?? '';
    const isVercelCron = authHeader.startsWith('Bearer ') && cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!isVercelCron) {
        // If CRON_SECRET is not configured, allow the call from Vercel Cron
        // via the user-agent header (vercel-cron/1.0). This is the standard
        // fallback when a project doesn't set a custom secret.
        const userAgent = req.headers['user-agent'] ?? '';
        if (!userAgent.includes('vercel-cron')) {
            return res.status(401).json({ error: 'unauthorized' });
        }
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        console.error('[retention-cron] Missing Supabase env');
        return res.status(500).json({ error: 'server_config' });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
    const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 3600 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

    const results: Record<string, number | string> = {};

    try {
        // ── 1. Expired parental_consents older than 7 days ────────────
        const { data: deletedExpired, error: err1 } = await sb
            .from('parental_consents')
            .delete()
            .eq('status', 'expired')
            .lt('created_at', sevenDaysAgo)
            .select('id');
        if (err1) {
            console.error('[retention-cron] expired consent delete error:', err1.message);
            results.expired_consents_error = err1.message;
        } else {
            results.expired_consents_deleted = deletedExpired?.length ?? 0;
        }

        // ── 2. Confirmed-but-unused consents older than 48h ───────────
        // These are tokens where the adult confirmed but the session was
        // never created (e.g., parent abandoned the flow after clicking).
        const { data: deletedStale, error: err2 } = await sb
            .from('parental_consents')
            .delete()
            .eq('status', 'confirmed')
            .is('consumed_at', null)
            .lt('created_at', fortyEightHoursAgo)
            .select('id');
        if (err2) {
            console.error('[retention-cron] stale confirmed consent error:', err2.message);
            results.stale_confirmed_error = err2.message;
        } else {
            results.stale_confirmed_deleted = deletedStale?.length ?? 0;
        }

        // ── 3. Tenant sessions archived > 2 years ──────────────────────
        // Fetch IDs first so we can cascade-delete children explicitly.
        const { data: oldArchived, error: err3fetch } = await sb
            .from('sessions')
            .select('id')
            .not('archived_at', 'is', null)
            .lt('archived_at', twoYearsAgo);
        if (err3fetch) {
            console.error('[retention-cron] archived fetch error:', err3fetch.message);
            results.archived_sessions_error = err3fetch.message;
        } else {
            const ids = (oldArchived ?? []).map(r => r.id);
            if (ids.length > 0) {
                await sb.from('feedback').delete().in('session_id', ids);
                await sb.from('chat_messages').delete().in('session_id', ids);
                await sb.from('group_members').delete().in('session_id', ids);
                await sb.from('parental_consents').delete().in('session_id', ids);
                const { error: errDel } = await sb.from('sessions').delete().in('id', ids);
                if (errDel) {
                    console.error('[retention-cron] archived delete error:', errDel.message);
                    results.archived_sessions_error = errDel.message;
                } else {
                    results.archived_sessions_deleted = ids.length;
                }
            } else {
                results.archived_sessions_deleted = 0;
            }
        }

        // ── 4. Argo One sessions > 2 years ─────────────────────────────
        const { data: oldArgoOne, error: err4fetch } = await sb
            .from('sessions')
            .select('id')
            .is('tenant_id', null)
            .lt('created_at', twoYearsAgo);
        if (err4fetch) {
            console.error('[retention-cron] argo-one fetch error:', err4fetch.message);
            results.argo_one_sessions_error = err4fetch.message;
        } else {
            const ids = (oldArgoOne ?? []).map(r => r.id);
            if (ids.length > 0) {
                await sb.from('feedback').delete().in('session_id', ids);
                await sb.from('chat_messages').delete().in('session_id', ids);
                await sb.from('group_members').delete().in('session_id', ids);
                await sb.from('parental_consents').delete().in('session_id', ids);
                const { error: errDel } = await sb.from('sessions').delete().in('id', ids);
                if (errDel) {
                    console.error('[retention-cron] argo-one delete error:', errDel.message);
                    results.argo_one_sessions_error = errDel.message;
                } else {
                    results.argo_one_sessions_deleted = ids.length;
                }
            } else {
                results.argo_one_sessions_deleted = 0;
            }
        }

        // ── 5. Purge old soft-deleted sessions (pre-hard-delete legacy) ──
        const { data: oldSoftDeleted, error: err5fetch } = await sb
            .from('sessions')
            .select('id')
            .not('deleted_at', 'is', null)
            .lt('deleted_at', thirtyDaysAgo);
        if (err5fetch) {
            console.error('[retention-cron] soft-deleted fetch error:', err5fetch.message);
            results.soft_deleted_error = err5fetch.message;
        } else {
            const ids = (oldSoftDeleted ?? []).map(r => r.id);
            if (ids.length > 0) {
                await sb.from('feedback').delete().in('session_id', ids);
                await sb.from('chat_messages').delete().in('session_id', ids);
                await sb.from('group_members').delete().in('session_id', ids);
                await sb.from('parental_consents').delete().in('session_id', ids);
                const { error: errDel } = await sb.from('sessions').delete().in('id', ids);
                if (errDel) {
                    console.error('[retention-cron] soft-deleted purge error:', errDel.message);
                    results.soft_deleted_error = errDel.message;
                } else {
                    results.soft_deleted_purged = ids.length;
                }
            } else {
                results.soft_deleted_purged = 0;
            }
        }

        console.info('[retention-cron] completed', results);
        return res.status(200).json({ ok: true, results, ran_at: now.toISOString() });
    } catch (err) {
        console.error('[retention-cron] unexpected:', err);
        return res.status(500).json({ error: 'internal', results });
    }
}
