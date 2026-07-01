import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-checkout
 * Body: { email, kind?: 'one' | 'one_puente', lang? }
 * Returns: { checkout_url, purchase_id }
 *
 * Single-price Argo One checkout in USD via Stripe. No packs, no ARS for now.
 *   - one        → $9.99   (child profile report)
 *   - one_puente → $12.99  (report + a prepaid Puente for the responsible adult)
 *
 * The combo is recorded with includes_puente=true on the purchase; delivering the
 * prepaid Puente after the child plays is a separate (next) step.
 */

const PRICES: Record<string, { usd_cents: number; label: string; includes_puente: boolean }> = {
    one:        { usd_cents: 999,  label: 'Argo One',          includes_puente: false },
    one_puente: { usd_cents: 1299, label: 'Argo One +', includes_puente: true },
};

async function createStripeCheckout(price: typeof PRICES['one'], email: string, purchaseId: string, accessToken: string): Promise<string> {
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
            'line_items[0][price_data][unit_amount]': String(price.usd_cents),
            'line_items[0][price_data][product_data][name]': price.label,
            'line_items[0][quantity]': '1',
            'metadata[purchase_id]': purchaseId,
            'metadata[source]': 'argo_one',
            'success_url': `${origin}/one/panel?token=${accessToken}&success=1`,
            'cancel_url': `${origin}/one`,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { email, kind: bodyKind, lang: bodyLang } = req.body as { email?: string; kind?: string; lang?: string };
        // Prefer the language the client sent; otherwise fall back to the browser's
        // Accept-Language header so an English (or Portuguese) visitor gets emails in
        // their language even if the /one page did not pass lang. 'es' is the last resort.
        const headerLang = (() => {
            const al = (req.headers['accept-language'] || '').toString().toLowerCase();
            if (al.startsWith('en')) return 'en';
            if (al.startsWith('pt')) return 'pt';
            return 'es';
        })();
        const lang = typeof bodyLang === 'string' && ['es', 'en', 'pt'].includes(bodyLang) ? bodyLang : headerLang;
        const kind = bodyKind === 'one_puente' ? 'one_puente' : 'one';
        const price = PRICES[kind];

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        // Create purchase record (pending). pack_size is always 1 (no packs for now).
        const { data: purchase, error: insertErr } = await sb
            .from('one_purchases')
            .insert({
                email,
                pack_size: 1,
                amount_cents: price.usd_cents,
                currency: 'usd',
                payment_provider: 'stripe',
                payment_status: 'pending',
                includes_puente: price.includes_puente,
                lang,
            })
            .select('id, access_token')
            .single();

        if (insertErr || !purchase) {
            console.error('[one-checkout] Insert error:', insertErr?.message);
            return res.status(500).json({ error: 'Failed to create purchase' });
        }

        // One play-link slot for the single report.
        await sb.from('one_links').insert([{ purchase_id: purchase.id, status: 'available' }]);

        const checkoutUrl = await createStripeCheckout(price, email, purchase.id, purchase.access_token);

        return res.status(200).json({
            checkout_url: checkoutUrl,
            purchase_id: purchase.id,
            kind,
            currency: 'usd',
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[one-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout session', detail: msg });
    }
}
