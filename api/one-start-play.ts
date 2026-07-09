import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-start-play
 * Body: { slug }
 * Validates an ArgoOne® link slug is valid and not used.
 * Returns: { ok, link_id, purchase_email }
 */

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV / Upstash REST. No-ops if KV isn't
// configured. Caps enumeration/abuse of this unauthenticated endpoint that
// returns child + recipient PII for a valid slug. (Security audit 2026-07-06.)
async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { slug } = req.body as { slug?: string };
        if (!slug) return res.status(400).json({ error: 'Missing slug' });

        // 60/min per IP — caps slug enumeration / abuse of this public endpoint.
        if (await rateLimited(`rl:one-start-play:${clientIp(req)}`, 60, 60)) {
            return res.status(429).json({ error: 'rate_limited' });
        }

        // Find the link. child_id is set only for a replay link (ArgoOne fusion: a
        // $12.99 re-juego bound to an existing child); null for a first-play link.
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, purchase_id, recipient_email, child_name, sport, child_id')
            .eq('slug', slug)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status === 'completed') return res.status(403).json({ error: 'link_already_used' });

        // Verify the purchase is paid
        const { data: purchase } = await sb
            .from('one_purchases')
            .select('payment_status')
            .eq('id', link.purchase_id)
            .single();

        if (!purchase || purchase.payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment not confirmed' });
        }

        // Mark as pending (in progress)
        if (link.status !== 'pending') {
            await sb.from('one_links').update({ status: 'pending' }).eq('id', link.id);
        }

        return res.status(200).json({
            ok: true,
            link_id: link.id,
            recipient_email: link.recipient_email,
            child_name: link.child_name,
            sport: link.sport,
            child_id: link.child_id ?? null,   // set = replay of this existing child
        });
    } catch (err) {
        console.error('[one-start-play] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
