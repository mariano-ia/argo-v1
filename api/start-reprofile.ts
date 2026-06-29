import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// Issues a short-lived signed token that authorizes appending ONE new perfilamiento
// to a SPECIFIC existing child (re-profile). /api/session honors the child_id ONLY from
// this signed token (never the body), so a re-profile can't be redirected onto an
// arbitrary child. Unlike /api/start-play, this SKIPS the roster gate (re-profiling an
// existing child never consumes a slot) and enforces the 6-month cadence.
function signReprofileToken(tenantId: string, childId: string, secret: string): string {
    const exp = Date.now() + 60 * 60 * 1000; // 1 hour
    const payload = Buffer.from(JSON.stringify({ t: tenantId, tm: null, cid: childId, m: 'r', exp })).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV / Upstash. No-ops if not configured. Keyed on
// the reprofile_token so a leaked link can't be spammed into endless perfilamientos.
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { reprofile_token } = req.body ?? {};
        if (!reprofile_token || typeof reprofile_token !== 'string' || !/^[a-f0-9]{32}$/.test(reprofile_token)) {
            return res.status(400).json({ error: 'invalid_reprofile_token' });
        }

        // 30 re-profile starts/min per token — generous for retries, caps leak-spam.
        if (await rateLimited(`rl:reprofile:${reprofile_token}`, 30, 60)) {
            return res.status(429).json({ error: 'rate_limited' });
        }

        // Resolve the child by its capability token.
        const { data: child } = await sb.from('children')
            .select('id, tenant_id, adult_name, adult_email, child_name, child_age, sport, lang, archived_at, deleted_at, merged_into')
            .eq('reprofile_token', reprofile_token)
            .maybeSingle();
        if (!child) {
            return res.status(404).json({ error: 'reprofile_link_invalid' });
        }

        // If this child was absorbed by a merge, transparently redirect to the survivor.
        let target = child;
        if (child.merged_into) {
            const { data: survivor } = await sb.from('children')
                .select('id, tenant_id, adult_name, adult_email, child_name, child_age, sport, lang, archived_at, deleted_at, merged_into')
                .eq('id', child.merged_into)
                .maybeSingle();
            if (!survivor || survivor.merged_into) {
                return res.status(410).json({ error: 'child_inactive' });
            }
            target = survivor;
        }

        if (target.archived_at || target.deleted_at) {
            return res.status(410).json({ error: 'child_inactive' });
        }
        if (!target.tenant_id) {
            // Argo One children don't re-profile through the tenant flow.
            return res.status(400).json({ error: 'reprofile_not_supported' });
        }

        // Tenant + trial check.
        const { data: tenant } = await sb.from('tenants')
            .select('id, display_name, sport, plan, trial_expires_at')
            .eq('id', target.tenant_id)
            .single();
        if (!tenant) {
            return res.status(404).json({ error: 'tenant_not_found' });
        }
        if (tenant.plan === 'trial' && tenant.trial_expires_at && new Date(tenant.trial_expires_at) < new Date()) {
            return res.status(403).json({ error: 'trial_expired' });
        }

        // 6-month cadence — hard gate (server-enforced, not just UI).
        const { data: cd, error: cdErr } = await sb.rpc('check_reprofile_cooldown', { p_child_id: target.id });
        if (cdErr) {
            console.error('[start-reprofile] cooldown RPC error:', cdErr.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (cd && cd.allowed === false) {
            return res.status(403).json({
                error: 'reprofile_too_soon',
                months_remaining: cd.months_remaining,
                available_at: cd.available_at,
            });
        }

        return res.status(200).json({
            ok: true,
            reprofile: true,
            tenant_id: tenant.id,
            tenant_name: tenant.display_name,
            tenant_sport: tenant.sport,
            child_id: target.id,
            child_name: target.child_name,
            child_age: target.child_age,
            adult_name: target.adult_name,
            adult_email: target.adult_email,
            sport: tenant.sport ?? target.sport,
            lang: target.lang ?? 'es',
            play_token: signReprofileToken(tenant.id, target.id, serviceKey),
        });
    } catch (err) {
        console.error('[start-reprofile] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
