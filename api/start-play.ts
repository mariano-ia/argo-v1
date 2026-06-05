import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// Issues a short-lived, signed token that authorizes creating ONE tenant
// session. /api/session verifies it before attaching a session to a tenant,
// so a session can't be created in an arbitrary tenant by spoofing tenant_id.
// HMAC key = service role key (server-only secret; avoids a new env var).
function signPlayToken(tenantId: string, secret: string): string {
    const exp = Date.now() + 60 * 60 * 1000; // 1 hour — long enough to play
    const payload = Buffer.from(JSON.stringify({ t: tenantId, exp })).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV (Upstash REST). No-ops if KV isn't
// configured (KV_REST_API_URL / KV_REST_API_TOKEN). The limit is intentionally
// HIGH so a club running many kids behind one NAT IP isn't blocked, while
// runaway automated abuse (hundreds/thousands per minute) is still capped.
async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    // Accept either the Vercel KV or the Upstash Redis env var names, depending
    // on which Marketplace integration provisions the store.
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const { result } = await incr.json();
        if (result === 1) {
            await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        }
        return typeof result === 'number' && result > limit;
    } catch {
        return false; // fail open — never block legit traffic on a KV hiccup
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
        // 80 plays/min per IP — generous for a club event, caps abuse.
        if (await rateLimited(`rl:start-play:${clientIp(req)}`, 80, 60)) {
            return res.status(429).json({ error: 'rate_limited' });
        }

        const { slug } = req.body;

        if (!slug || typeof slug !== 'string') {
            return res.status(400).json({ error: 'Missing slug' });
        }

        // Get tenant by slug
        const { data: tenant } = await sb
            .from('tenants')
            .select('id, display_name, sport, plan, trial_expires_at, roster_limit')
            .eq('slug', slug)
            .single();

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Check trial expiration
        if (tenant.plan === 'trial' && tenant.trial_expires_at) {
            if (new Date(tenant.trial_expires_at) < new Date()) {
                return res.status(403).json({ error: 'trial_expired' });
            }
        }

        // Check roster capacity via RPC (atomic, uses SELECT FOR UPDATE)
        const { data, error } = await sb.rpc('check_roster_capacity', { p_tenant_id: tenant.id });

        if (error) {
            console.error('[start-play] RPC error:', error.message);
            if (error.message.includes('trial_expired')) {
                return res.status(403).json({ error: 'trial_expired' });
            }
            if (error.message.includes('roster_full')) {
                return res.status(403).json({
                    error: 'roster_full',
                    roster_limit: tenant.roster_limit,
                });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(200).json({
            ok: true,
            tenant_id: tenant.id,
            tenant_name: tenant.display_name,
            tenant_sport: tenant.sport,
            roster_limit: data.roster_limit,
            active_count: data.active_count,
            available: data.available,
            play_token: signPlayToken(tenant.id, serviceKey),
        });
    } catch (err) {
        console.error('[start-play] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
