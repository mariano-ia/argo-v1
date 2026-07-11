import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/bridge-link-resolve
 * Body: { link_token }
 *
 * ArgoOne® fusion Fase 1 (frozen model, docs/ARGOONE-DECISIONES.md §4): resolves
 * a child's shareable bridges-link so the /puente/:token onboarding page can
 * render the offer. The link is freely re-shareable BECAUSE the $4.99 buys ONLY
 * the buyer's own bridge, never the child's individual report.
 *
 * Pre-payment PII rule (§ pre-pay first-name-only): a token bearer learns ONLY
 * the child's first name. Age, sport, axis and archetype never leave before
 * onboarding + payment.
 *
 * Anti-enumeration: any unknown/rotated token returns the same generic 404.
 * Serverless: helpers inline (no cross-api / no src imports).
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

function bridgesV2On(): boolean {
    return ['1', 'on', 'true'].includes((process.env.VITE_BRIDGES_V2 || '').trim().toLowerCase());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!bridgesV2On()) return res.status(404).json({ error: 'not_found' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    const token = String(req.body?.link_token || '');
    if (!token) return res.status(400).json({ error: 'Missing link_token' });

    if (await rateLimited(`rl:bridge-link:ip:${clientIp(req)}`, 60, 3600)) {
        return res.status(429).json({ error: 'rate_limited' });
    }

    const { data: child } = await sb
        .from('children')
        .select('id, child_name')
        .eq('bridge_link_token', token)
        .is('deleted_at', null)
        .maybeSingle();
    if (!child) return res.status(404).json({ error: 'invalid_link' });

    // The offer needs a CURRENT resolved perfilamiento (the bridge is built on
    // the child's current photo). Mirror the current_perfilamiento view: latest
    // resolved, not deleted, by created_at DESC.
    const { data: perf } = await sb
        .from('perfilamientos')
        .select('id, lang')
        .eq('child_id', child.id)
        .eq('status', 'resolved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (!perf) return res.status(404).json({ error: 'invalid_link' });

    const firstName = ((child.child_name as string | null) ?? '').trim().split(/\s+/)[0] || null;

    return res.status(200).json({
        ok: true,
        child_first_name: firstName,
        lang: perf.lang || 'es',
    });
}
