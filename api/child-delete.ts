import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/child-delete  (B15 — ArgoOne fusion)
 *
 * Deterministic, per-child data deletion by the high-entropy `deletion_id` that
 * rides in the footer of every email to the child's responsible adult and in the
 * hub. Distinct from the email-matched /api/confirm-delete flow.
 *
 *   GET  ?deletion_id=xxx   -> { ok, exists, child_name }  (confirmation read for F9)
 *   POST { deletion_id }    -> deletes the child + cascade, OR a dry-run preview.
 *
 * DESTRUCTIVE + IRREVERSIBLE. The real delete only runs when CHILD_DELETE_ENABLED
 * is 'on'; otherwise POST returns a { dry_run } preview and deletes nothing, so
 * the endpoint + the F9 page can ship inert until the owner enables execution.
 *
 * Cascade: deleting the child cascades its perfilamientos, and each perfilamiento
 * cascades (FK ON DELETE CASCADE) its bridges, bridge_invites, puentes_purchases and
 * puentes_sessions — so the ArgoPuente bridge purchases toward this child are
 * hard-deleted too (only one_purchases, the ArgoOne payment, has no child FK and is
 * preserved). We also hard-delete feedback/chat_messages/parental_consents (keyed by
 * perfilamiento), group_members/chem_group_members + child_memory (keyed by child),
 * and scrub the child's PII from one_links (kept as the buyer's slot). adult_profiles
 * are the adult's (by email), never touched. Idempotent + anti-enum. Serverless: all
 * helpers inline (no cross-api / no src import).
 */

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
        const { result } = await incr.json();
        if (result === 1) await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers: { Authorization: `Bearer ${token}` } });
        return typeof result === 'number' && result > limit;
    } catch { return false; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ ok: false, error: 'server_config' });
    const sb = createClient(supabaseUrl, serviceKey);

    const deletionId = String((req.method === 'GET' ? req.query.deletion_id : req.body?.deletion_id) || '');
    // deletion_id is a 32-hex token minted by the children.deletion_id DEFAULT.
    if (!/^[a-f0-9]{32}$/.test(deletionId)) return res.status(404).json({ ok: false, error: 'not_found' });

    if (await rateLimited(`rl:child-delete:ip:${clientIp(req)}`, 40, 3600)) {
        return res.status(429).json({ ok: false, error: 'rate_limited' });
    }

    // Resolve the (not-yet-deleted) child.
    const { data: child } = await sb
        .from('children')
        .select('id, child_name')
        .eq('deletion_id', deletionId)
        .is('deleted_at', null)
        .maybeSingle();

    // ── GET: confirmation read for F9. Anti-enum: a missing/already-deleted id
    //    just reports exists:false with no other signal. ──
    if (req.method === 'GET') {
        return res.status(200).json({ ok: true, exists: !!child, child_name: child?.child_name ?? null });
    }

    // ── POST: delete (or dry-run). Idempotent: nothing to delete => done. ──
    if (!child) return res.status(200).json({ ok: true, done: true });

    const { data: perfis } = await sb.from('perfilamientos').select('id').eq('child_id', child.id);
    const perfiIds = (perfis ?? []).map(p => p.id);

    const enabled = process.env.CHILD_DELETE_ENABLED === 'on';
    if (!enabled) {
        // Inert until the owner flips CHILD_DELETE_ENABLED. We do NOT delete, but we
        // MUST NOT silently drop a legally-sensitive request: write a durable audit
        // trace so the owner can fulfill it, and the front reports "request received"
        // (never "deleted"). Report what WOULD go for the operator.
        let bridgeCount = 0;
        if (perfiIds.length) {
            const { count } = await sb.from('bridges').select('id', { count: 'exact', head: true }).in('perfilamiento_id', perfiIds);
            bridgeCount = count ?? 0;
        }
        await sb.from('admin_audit_log').insert({
            admin_email: 'parent-self-service',
            action: 'child_delete_requested',
            target_type: 'children',
            target_id: deletionId.slice(0, 8),
            details: { child_id: child.id, perfilamientos: perfiIds.length, bridges: bridgeCount, note: 'CHILD_DELETE_ENABLED off — pending owner enablement' },
        });
        return res.status(200).json({ ok: true, dry_run: true, would_delete: { child_id: child.id, perfilamientos: perfiIds.length, bridges: bridgeCount } });
    }

    try {
        // Rows FK-referencing a perfilamiento (mirror confirm-delete / delete-session order).
        if (perfiIds.length > 0) {
            await sb.from('feedback').delete().in('session_id', perfiIds);
            await sb.from('chat_messages').delete().in('session_id', perfiIds);
            await sb.from('parental_consents').delete().in('session_id', perfiIds);
            // Scrub the child's PII from the one_links rows (kept as the buyer's slot;
            // one_purchases itself carries no child PII and is preserved).
            await sb.from('one_links').update({ session_id: null, child_name: null }).in('session_id', perfiIds);
            // NB: puentes_purchases + puentes_sessions (the bridge purchases toward
            // this child) reference the perfilamiento with ON DELETE CASCADE, so they
            // are removed automatically when the child (=> its perfilamientos) is
            // deleted — no explicit scrub needed.
        }
        // Rows keyed by the child.
        // parental_consents.child_id is a plain FK with NO ON DELETE (NO ACTION),
        // so any consent still referencing this child would ABORT the children
        // delete — clear them by child_id (covers rows the perfilamiento-id sweep
        // above might miss, e.g. a consent never linked to a resolved perfilamiento).
        await sb.from('parental_consents').delete().eq('child_id', child.id);
        await sb.from('one_links').update({ child_name: null }).eq('child_id', child.id);
        await sb.from('group_members').delete().eq('child_id', child.id);
        await sb.from('chem_group_members').delete().eq('child_id', child.id);
        await sb.from('child_memory_events').delete().eq('child_id', child.id);
        await sb.from('child_memory').delete().eq('child_id', child.id);
        // children.merged_into is a self-FK with NO ON DELETE; null out any child
        // that was merged INTO this one so the delete can't abort on it.
        await sb.from('children').update({ merged_into: null }).eq('merged_into', child.id);

        // Delete the child. perfilamientos.child_id CASCADEs, and each
        // perfilamiento CASCADEs its bridges + bridge_invites.
        const { error: delErr } = await sb.from('children').delete().eq('id', child.id);
        if (delErr) {
            console.error('[child-delete] child delete error:', delErr.message);
            return res.status(500).json({ ok: false, error: 'delete_failed' });
        }

        await sb.from('admin_audit_log').insert({
            admin_email: 'parent-self-service',
            action: 'child_delete',
            target_type: 'children',
            target_id: deletionId.slice(0, 8),
            details: { perfilamientos: perfiIds.length },
        });
        console.info('[child-delete] completed', { deletion_prefix: deletionId.slice(0, 8), perfilamientos: perfiIds.length });
        return res.status(200).json({ ok: true, done: true, deleted: true });
    } catch (err) {
        console.error('[child-delete] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
