import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/validate-coupon
 * Body: { code, product?: 'one' | 'puente', base_cents? }
 * Returns: { valid: true, code, discounted_cents, percent_off, amount_off_cents, free }
 *      or: { valid: false, error: 'not_found' | 'minimum' | 'invalid' }
 *
 * Live discount PREVIEW for the coupon field in our own checkout UI. It resolves
 * a customer-entered promotion code against Stripe and returns what the total
 * would become — purely for display. The real discount is re-resolved and
 * applied server-side by each checkout endpoint (one-checkout / unlock-checkout /
 * puentes-checkout); the client is never trusted for the charged amount.
 *
 * Coupons must be created in the Stripe Dashboard WITHOUT a product restriction
 * (applies_to.products): our checkouts use ad-hoc `price_data` line items with no
 * Stripe Product id, so a product-restricted coupon can never match. Order-level
 * percent-off / amount-off coupons work everywhere.
 */

// Base prices (USD cents) by product — the source of truth for the preview so a
// tampered client base_cents can't inflate the displayed discount.
const PRODUCT_BASE_CENTS: Record<string, number> = {
    one: 1299,     // ArgoOne® (report + Puente incluido)
    puente: 499,   // ArgoPuente® add-on
};

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV (Upstash REST). Fail-open if unset.
// Caps coupon-code guessing/enumeration against the Stripe lookup.
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

interface ResolvedCoupon {
    percent_off: number | null;
    amount_off: number | null;   // cents, in the coupon's currency
    currency: string | null;
    minimum_amount: number | null; // cents; order must be >= this
}

// Resolve a customer-entered promotion code to its coupon. Returns null when the
// code is unknown, inactive, expired, or exhausted (Stripe drops those from the
// active=true list, and coupon.valid guards the rest).
async function resolvePromotionCode(stripeKey: string, code: string): Promise<ResolvedCoupon | null> {
    const norm = code.trim().toUpperCase();
    if (!norm) return null;
    const url = `https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(norm)}&active=true&limit=1`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${stripeKey}` } });
    if (!r.ok) return null;
    const data = await r.json();
    const pc = Array.isArray(data?.data) ? data.data[0] : null;
    if (!pc || pc.active === false) return null;
    const coupon = pc.coupon;
    if (!coupon || coupon.valid === false) return null;
    return {
        percent_off: typeof coupon.percent_off === 'number' ? coupon.percent_off : null,
        amount_off: typeof coupon.amount_off === 'number' ? coupon.amount_off : null,
        currency: coupon.currency ?? null,
        minimum_amount: typeof pc.restrictions?.minimum_amount === 'number' ? pc.restrictions.minimum_amount : null,
    };
}

function discountedCents(base: number, c: ResolvedCoupon): number {
    let d = base;
    if (c.percent_off) d = Math.round(base * (1 - c.percent_off / 100));
    else if (c.amount_off) d = base - c.amount_off;
    return Math.max(0, d);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return res.status(500).json({ error: 'Server configuration error' });

    if (await rateLimited(`rl:validate-coupon:ip:${clientIp(req)}`, 60, 3600)) {
        return res.status(429).json({ valid: false, error: 'rate_limited' });
    }

    try {
        const { code, product, base_cents } = req.body as { code?: string; product?: string; base_cents?: number };
        const norm = String(code || '').trim();
        if (!norm) return res.status(400).json({ valid: false, error: 'invalid' });

        // Trust the product→price map first; fall back to a clamped client base for
        // any surface that only knows its own amount.
        const base = PRODUCT_BASE_CENTS[String(product || '')]
            ?? (typeof base_cents === 'number' && base_cents > 0 ? Math.min(base_cents, 100000) : 1299);

        const c = await resolvePromotionCode(stripeKey, norm);
        if (!c) return res.status(200).json({ valid: false, error: 'not_found' });

        // The order would be rejected at checkout if below the coupon's minimum —
        // surface it now instead of a confusing failure on the Stripe page.
        if (c.minimum_amount != null && base < c.minimum_amount) {
            return res.status(200).json({ valid: false, error: 'minimum' });
        }

        const discounted = discountedCents(base, c);
        return res.status(200).json({
            valid: true,
            code: norm.toUpperCase(),
            base_cents: base,
            discounted_cents: discounted,
            percent_off: c.percent_off,
            amount_off_cents: c.amount_off,
            free: discounted === 0,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[validate-coupon] Error:', msg);
        return res.status(500).json({ valid: false, error: 'server_error', detail: msg });
    }
}
