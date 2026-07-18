import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/unlock-checkout
 * Body: { session_id, country?, lang? }
 * Returns: { checkout_url }
 *
 * One-time $12.99 ArgoOne® checkout that unlocks the FULL report for an existing
 * (demo) perfilamiento AND delivers the buyer's included Puente. On payment,
 * one-webhook (source='unlock') sets full_access=true, mints the comp Puente
 * toward that perfilamiento for the payer, and emails both links. Provider
 * routing (Stripe USD / MercadoPago ARS) mirrors one-checkout.ts. No
 * one_purchases row: the unlocked session itself is the deliverable.
 */

const PRICE_USD_CENTS = 1299; // $12.99 — unified ArgoOne® (report + Puente incluido)

const MP_COUNTRIES = ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE'];

function getProvider(country?: string): 'mercadopago' | 'stripe' {
    // Fase 0: consumer payments go through Stripe (USD) only for now. Set
    // STRIPE_ONLY='false' to re-enable MercadoPago/ARS routing in Fase 1.
    if (process.env.STRIPE_ONLY !== 'false') return 'stripe';
    if (!country) return 'stripe';
    const cc = country.toUpperCase();
    if (cc === 'AR' && process.env.AR_VIA_STRIPE === 'true') return 'stripe';
    return MP_COUNTRIES.includes(cc) ? 'mercadopago' : 'stripe';
}

function webhookBaseUrl(): string {
    if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.SITE_URL || 'https://argomethod.com';
}

let cachedArsRate: { venta: number; fetchedAt: number } | null = null;
const ARS_CACHE_TTL = 60 * 60 * 1000;
async function getArsRate(): Promise<number> {
    if (cachedArsRate && Date.now() - cachedArsRate.fetchedAt < ARS_CACHE_TTL) return cachedArsRate.venta;
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!res.ok) throw new Error(`dolarapi status ${res.status}`);
        const data = await res.json();
        const venta = data.venta;
        if (typeof venta !== 'number' || venta <= 0) throw new Error(`Invalid rate: ${venta}`);
        cachedArsRate = { venta, fetchedAt: Date.now() };
        return venta;
    } catch (err) {
        console.error('[unlock-checkout] Failed to fetch ARS rate:', err);
        if (cachedArsRate) return cachedArsRate.venta;
        throw new Error('Cannot determine ARS exchange rate');
    }
}

const LABELS: Record<string, string> = {
    es: 'ArgoOne® · Informe completo',
    en: 'ArgoOne® · Full report',
    pt: 'ArgoOne® · Relatório completo',
};

// Resolve a customer-entered promotion code to its Stripe id, re-validated
// server-side. Returns null when unknown/inactive/expired/exhausted. Inlined per
// endpoint — Vercel functions can't import shared helpers between api/ files.
async function resolvePromotionCodeId(stripeKey: string, code: string): Promise<string | null> {
    const norm = code.trim().toUpperCase();
    if (!norm) return null;
    const r = await fetch(`https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(norm)}&active=true&limit=1`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const pc = Array.isArray(data?.data) ? data.data[0] : null;
    if (!pc || pc.active === false || typeof pc.id !== 'string') return null;
    // The coupon lives under `promotion.coupon` (newer Stripe API, an id) or
    // `coupon` (older API, a nested object or id). Verify it is still valid.
    const inlineCoupon = pc.coupon && typeof pc.coupon === 'object' ? pc.coupon : null;
    if (inlineCoupon) return inlineCoupon.valid === false ? null : pc.id;
    const couponId = (pc.promotion && pc.promotion.coupon) || (typeof pc.coupon === 'string' ? pc.coupon : null);
    if (!couponId) return null;
    const cr = await fetch(`https://api.stripe.com/v1/coupons/${encodeURIComponent(couponId)}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (!cr.ok) return null;
    const coupon = await cr.json();
    if (!coupon || coupon.valid === false) return null;
    return pc.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { session_id, country: bodyCountry, lang: bodyLang, coupon_code: bodyCoupon } = req.body as { session_id?: string; country?: string; lang?: string; coupon_code?: string };
        if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

        const { data: session } = await sb
            .from('perfilamientos')
            .select('id, adult_email, share_token, full_access, lang')
            .eq('id', session_id)
            .maybeSingle();
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.full_access) return res.status(400).json({ error: 'Already unlocked' });

        const lang = typeof bodyLang === 'string' && ['es', 'en', 'pt'].includes(bodyLang)
            ? bodyLang
            : (typeof session.lang === 'string' && ['es', 'en', 'pt'].includes(session.lang) ? session.lang : 'es');
        const label = LABELS[lang] ?? LABELS.es;

        const country = bodyCountry?.toUpperCase()
            || (req.headers['x-vercel-ip-country'] as string)?.toUpperCase()
            || 'US';
        const provider = getProvider(country);

        const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com';
        const shareToken = session.share_token || '';
        const reportUrl = shareToken
            ? `${origin}/report/${session_id}?token=${encodeURIComponent(shareToken)}`
            : `${origin}/report/${session_id}`;
        // Build the success URL with URLSearchParams so a share_token containing a
        // reserved char can never corrupt the query (which would 403 the report the
        // buyer just paid to unlock).
        const successParams = new URLSearchParams();
        if (shareToken) successParams.set('token', shareToken);
        successParams.set('unlocked', '1');
        const successUrl = `${origin}/report/${session_id}?${successParams.toString()}`;

        let checkoutUrl: string | undefined;

        if (provider === 'stripe') {
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
            const params: Record<string, string> = {
                'mode': 'payment',
                'line_items[0][price_data][currency]': 'usd',
                'line_items[0][price_data][unit_amount]': String(PRICE_USD_CENTS),
                'line_items[0][price_data][product_data][name]': label,
                'line_items[0][quantity]': '1',
                'metadata[source]': 'unlock',
                'metadata[session_id]': session_id,
                'success_url': successUrl,
                'cancel_url': reportUrl,
            };
            if (session.adult_email) params['customer_email'] = session.adult_email;
            // Optional discount coupon (re-validated server-side; the webhook is the
            // source of truth for the actually charged amount).
            if (typeof bodyCoupon === 'string' && bodyCoupon.trim()) {
                const promotionCodeId = await resolvePromotionCodeId(stripeKey, bodyCoupon);
                if (!promotionCodeId) return res.status(400).json({ error: 'invalid_coupon' });
                params['discounts[0][promotion_code]'] = promotionCodeId;
            }
            const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(params).toString(),
            });
            if (!r.ok) { const e = await r.text(); console.error('[unlock-checkout] Stripe error:', e); throw new Error(`Stripe error: ${e}`); }
            const s = await r.json();
            checkoutUrl = s.url;
        } else {
            const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!mpToken) throw new Error('Missing MERCADOPAGO_ACCESS_TOKEN');
            const arsRate = await getArsRate();
            const arsAmount = Math.ceil((PRICE_USD_CENTS / 100) * arsRate);
            const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{ title: label, quantity: 1, unit_price: arsAmount, currency_id: 'ARS' }],
                    ...(session.adult_email ? { payer: { email: session.adult_email } } : {}),
                    metadata: { source: 'unlock', session_id },
                    notification_url: `${webhookBaseUrl()}/api/one-webhook`,
                    back_urls: { success: successUrl, failure: reportUrl, pending: reportUrl },
                    auto_return: 'approved',
                    external_reference: `unlock_${session_id}`,
                }),
            });
            if (!r.ok) { const e = await r.text(); throw new Error(`MercadoPago error: ${e}`); }
            const pref = await r.json();
            checkoutUrl = pref.init_point || pref.sandbox_init_point;
        }

        if (!checkoutUrl) throw new Error('No checkout URL returned');
        return res.status(200).json({ checkout_url: checkoutUrl, provider });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[unlock-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout', detail: msg });
    }
}
