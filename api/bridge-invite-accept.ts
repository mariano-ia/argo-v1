import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/bridge-invite-accept
 * Body: { invite_token }
 *
 * ArgoOne fusion (B14). Validates a bridge-invite token and returns the child
 * context so the /puente/invite/:token page (F8) can render the offer for the
 * invited adult. Read-only: it does NOT create the bridge or the purchase — the
 * invited adult then pays $4.99 via puentes-checkout with the same invite_token
 * (B13), which is where the invite becomes the authorization (R1).
 *
 * Anti-enumeration: any invalid/expired/revoked token returns the SAME generic
 * 404, and the responsible adult's email is never leaked (only the invited email,
 * which the invitee already knows, is echoed so the front can lock the field).
 * Serverless: all helpers inline (no cross-api / no src import).
 */

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV (Upstash REST). Fail-open if unset.
async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
        const { result } = await incr.json();
        if (result === 1) {
            await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        return typeof result === 'number' && result > limit;
    } catch {
        return false;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    const token = String(req.body?.invite_token || '');
    if (!token) return res.status(400).json({ error: 'Missing invite_token' });

    // Throttle token guessing per IP (tokens are 64-hex, so this is belt-and-braces).
    if (await rateLimited(`rl:invite-accept:ip:${clientIp(req)}`, 60, 3600)) {
        return res.status(429).json({ error: 'rate_limited' });
    }

    const { data: inv } = await sb
        .from('bridge_invites')
        .select('id, perfilamiento_id, invited_email, relation, status, expires_at')
        .eq('token', token)
        .maybeSingle();

    const fresh = inv && (!inv.expires_at || new Date(inv.expires_at) > new Date());
    const open = inv && (inv.status === 'pending' || inv.status === 'accepted');
    if (!inv || !fresh || !open) {
        return res.status(404).json({ error: 'invalid_invite' });
    }

    // Load the child context. The perfilamiento may have been cascade-deleted
    // (child removed by the responsible adult) — fail closed the same way.
    const { data: perf } = await sb
        .from('perfilamientos')
        .select('id, child_name, child_age, sport, eje, archetype_label, report_v4, report_status, lang, deleted_at')
        .eq('id', inv.perfilamiento_id)
        .maybeSingle();
    if (!perf || perf.deleted_at) {
        return res.status(404).json({ error: 'invalid_invite' });
    }

    const ready = perf.report_status == null || perf.report_status === 'ready' || perf.report_status === 'sent';
    const label = (perf.report_v4 as { hero?: { arquetipoLabel?: string } } | null)?.hero?.arquetipoLabel
        || (perf as { archetype_label?: string }).archetype_label
        || null;

    return res.status(200).json({
        ok: true,
        perfilamiento_id: perf.id,
        invited_email: inv.invited_email,
        relation: inv.relation ?? null,
        child_name: perf.child_name ?? null,
        child_age: perf.child_age ?? null,
        sport: perf.sport ?? null,
        eje: perf.eje ?? null,
        archetype_label: ready ? label : null,
        lang: perf.lang || 'es',
    });
}
