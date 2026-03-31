import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-checkout
 * Body: { email, pack_size, country? }
 * Returns: { checkout_url, purchase_id }
 *
 * Creates an Argo One purchase record (pending) and redirects to
 * Stripe or MercadoPago checkout based on country.
 */

const PACKS: Record<number, { usd_cents: number; ars_cents: number; label_es: string; label_en: string }> = {
    1: { usd_cents: 1499, ars_cents: 1499_00, label_es: 'Argo One — 1 informe',  label_en: 'Argo One — 1 report' },
    3: { usd_cents: 3499, ars_cents: 3499_00, label_es: 'Argo One — 3 informes', label_en: 'Argo One — 3 reports' },
    5: { usd_cents: 4999, ars_cents: 4999_00, label_es: 'Argo One — 5 informes', label_en: 'Argo One — 5 reports' },
};

// Countries that use MercadoPago (local currency)
const MP_COUNTRIES = ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE'];

function getProvider(country?: string): 'mercadopago' | 'stripe' {
    if (!country) return 'stripe';
    return MP_COUNTRIES.includes(country.toUpperCase()) ? 'mercadopago' : 'stripe';
}

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

async function createMPCheckout(pack: typeof PACKS[1], email: string, purchaseId: string): Promise<string> {
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
                unit_price: pack.usd_cents / 100, // MP uses decimal, not cents
                currency_id: 'USD',
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
    // Use sandbox URL in dev, production URL in prod
    return pref.sandbox_init_point || pref.init_point;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { email, pack_size, country } = req.body as { email?: string; pack_size?: number; country?: string };

        if (!email || !pack_size || !PACKS[pack_size]) {
            return res.status(400).json({ error: 'Missing or invalid email/pack_size. Valid packs: 1, 3, 5.' });
        }

        const pack = PACKS[pack_size];
        const provider = getProvider(country);

        // Create purchase record (pending)
        const { data: purchase, error: insertErr } = await sb
            .from('one_purchases')
            .insert({
                email,
                pack_size,
                amount_cents: provider === 'mercadopago' ? pack.ars_cents : pack.usd_cents,
                currency: provider === 'mercadopago' ? 'ars' : 'usd',
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
            checkoutUrl = await createMPCheckout(pack, email, purchase.id);
        }

        return res.status(200).json({
            checkout_url: checkoutUrl,
            purchase_id: purchase.id,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[one-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout session', detail: msg });
    }
}
