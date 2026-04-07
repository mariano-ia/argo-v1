import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-checkout
 * Body: { email, pack_size, country? }
 * Returns: { checkout_url, purchase_id }
 *
 * Creates an Argo One purchase record (pending) and redirects to
 * Stripe or MercadoPago checkout based on country.
 * Country auto-detected from Vercel x-vercel-ip-country header.
 * ARS price calculated dynamically from official BCRA rate.
 */

const PACKS: Record<number, { usd_cents: number; label_es: string; label_en: string }> = {
    1: { usd_cents: 1499, label_es: 'Argo One — 1 informe',  label_en: 'Argo One — 1 report' },
    3: { usd_cents: 3499, label_es: 'Argo One — 3 informes', label_en: 'Argo One — 3 reports' },
    5: { usd_cents: 4999, label_es: 'Argo One — 5 informes', label_en: 'Argo One — 5 reports' },
};

// Countries that use MercadoPago (local currency)
const MP_COUNTRIES = ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE'];

function getProvider(country?: string): 'mercadopago' | 'stripe' {
    if (!country) return 'stripe';
    return MP_COUNTRIES.includes(country.toUpperCase()) ? 'mercadopago' : 'stripe';
}

/* ── ARS rate cache (1 hour TTL) ─────────────────────────────────────────── */

let cachedArsRate: { venta: number; fetchedAt: number } | null = null;
const ARS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getArsRate(): Promise<number> {
    if (cachedArsRate && Date.now() - cachedArsRate.fetchedAt < ARS_CACHE_TTL) {
        return cachedArsRate.venta;
    }
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!res.ok) throw new Error(`dolarapi status ${res.status}`);
        const data = await res.json();
        const venta = data.venta;
        if (typeof venta !== 'number' || venta <= 0) throw new Error(`Invalid rate: ${venta}`);
        cachedArsRate = { venta, fetchedAt: Date.now() };
        return venta;
    } catch (err) {
        console.error('[one-checkout] Failed to fetch ARS rate:', err);
        // Fallback: if we have a stale cache, use it
        if (cachedArsRate) return cachedArsRate.venta;
        throw new Error('Cannot determine ARS exchange rate');
    }
}

function usdCentsToArs(usdCents: number, arsRate: number): number {
    // Convert USD cents to ARS (decimal, not cents — MP uses decimal)
    return Math.ceil((usdCents / 100) * arsRate);
}

/* ── Stripe checkout ─────────────────────────────────────────────────────── */

async function createStripeCheckout(pack: typeof PACKS[1], email: string, purchaseId: string, accessToken: string): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com';

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'mode': 'payment',
            'customer_email': email,
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][unit_amount]': String(pack.usd_cents),
            'line_items[0][price_data][product_data][name]': pack.label_en,
            'line_items[0][quantity]': '1',
            'metadata[purchase_id]': purchaseId,
            'metadata[source]': 'argo_one',
            'success_url': `${origin}/one/panel?token=${accessToken}&success=1`,
            'cancel_url': `${origin}/pricing`,
        }).toString(),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[one-checkout] Stripe API error:', err);
        throw new Error(`Stripe error: ${err}`);
    }

    const session = await res.json();
    return session.url;
}

/* ── MercadoPago checkout ────────────────────────────────────────────────── */

async function createMPCheckout(pack: typeof PACKS[1], email: string, purchaseId: string, arsAmount: number): Promise<string> {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) throw new Error('Missing MERCADOPAGO_ACCESS_TOKEN');

    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com';

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${mpToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [{
                title: pack.label_es,
                quantity: 1,
                unit_price: arsAmount,
                currency_id: 'ARS',
            }],
            payer: { email },
            metadata: { purchase_id: purchaseId, source: 'argo_one' },
            back_urls: {
                success: `${origin}/one/panel?success=1`,
                failure: `${origin}/pricing`,
                pending: `${origin}/one/panel?pending=1`,
            },
            auto_return: 'approved',
            external_reference: purchaseId,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`MercadoPago error: ${err}`);
    }

    const pref = await res.json();
    return pref.init_point || pref.sandbox_init_point;
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { email, pack_size, country: bodyCountry } = req.body as { email?: string; pack_size?: number; country?: string };

        if (!email || !pack_size || !PACKS[pack_size]) {
            return res.status(400).json({ error: 'Missing or invalid email/pack_size. Valid packs: 1, 3, 5.' });
        }

        // Auto-detect country: body param > Vercel geo header > fallback to US
        const country = bodyCountry?.toUpperCase()
            || (req.headers['x-vercel-ip-country'] as string)?.toUpperCase()
            || 'US';

        const pack = PACKS[pack_size];
        const provider = getProvider(country);

        let amountCents: number;
        let currency: string;
        let arsAmount = 0;

        if (provider === 'mercadopago') {
            const arsRate = await getArsRate();
            arsAmount = usdCentsToArs(pack.usd_cents, arsRate);
            amountCents = arsAmount * 100; // store in cents for DB consistency
            currency = 'ars';
            console.info(`[one-checkout] ARS conversion: $${pack.usd_cents / 100} USD x ${arsRate} = $${arsAmount} ARS`);
        } else {
            amountCents = pack.usd_cents;
            currency = 'usd';
        }

        // Create purchase record (pending)
        const { data: purchase, error: insertErr } = await sb
            .from('one_purchases')
            .insert({
                email,
                pack_size,
                amount_cents: amountCents,
                currency,
                payment_provider: provider,
                payment_status: 'pending',
            })
            .select('id, access_token')
            .single();

        if (insertErr || !purchase) {
            console.error('[one-checkout] Insert error:', insertErr?.message);
            return res.status(500).json({ error: 'Failed to create purchase' });
        }

        // Pre-create the link slots (available)
        const links = Array.from({ length: pack_size }, () => ({
            purchase_id: purchase.id,
            status: 'available',
        }));
        await sb.from('one_links').insert(links);

        // Create checkout session with the chosen provider
        let checkoutUrl: string;
        if (provider === 'stripe') {
            checkoutUrl = await createStripeCheckout(pack, email, purchase.id, purchase.access_token);
        } else {
            checkoutUrl = await createMPCheckout(pack, email, purchase.id, arsAmount);
        }

        return res.status(200).json({
            checkout_url: checkoutUrl,
            purchase_id: purchase.id,
            provider,
            currency,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[one-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout session', detail: msg });
    }
}
