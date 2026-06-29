import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * POST /api/puentes-checkout
 * Body: { source_session_id, recipient_email, recipient_name?, country?, lang?, consent_given }
 * Returns: { checkout_url, purchase_id, provider, currency }
 *
 * Creates an Argo Puentes purchase record (pending) linked to the child's
 * source session, and routes to Stripe (USD 9.99) or MercadoPago (ARS) based
 * on country. Mirrors the Argo One checkout pattern.
 */

const PRICE_USD_CENTS = 999;          // $9.99 USD
const PRICE_ARS = 6999;               // $6,999 ARS for Argentina
const MP_COUNTRIES = ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE'];

function getProvider(country?: string): 'mercadopago' | 'stripe' {
    if (!country) return 'stripe';
    return MP_COUNTRIES.includes(country.toUpperCase()) ? 'mercadopago' : 'stripe';
}

/* ── ARS rate cache (1 hour TTL) ─────────────────────────────────────────── */

let cachedArsRate: { venta: number; fetchedAt: number } | null = null;
const ARS_CACHE_TTL = 60 * 60 * 1000;

async function getArsRate(): Promise<number> {
    if (cachedArsRate && Date.now() - cachedArsRate.fetchedAt < ARS_CACHE_TTL) {
        return cachedArsRate.venta;
    }
    try {
        const r = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!r.ok) throw new Error(`dolarapi status ${r.status}`);
        const data = await r.json();
        const venta = data.venta;
        if (typeof venta !== 'number' || venta <= 0) throw new Error(`Invalid rate ${venta}`);
        cachedArsRate = { venta, fetchedAt: Date.now() };
        return venta;
    } catch (err) {
        console.error('[puentes-checkout] Failed to fetch ARS rate:', err);
        if (cachedArsRate) return cachedArsRate.venta;
        throw new Error('Cannot determine ARS exchange rate');
    }
}

function usdCentsToArs(usdCents: number, rate: number): number {
    return Math.ceil((usdCents / 100) * rate);
}

function genMagicToken(): string {
    return crypto.randomBytes(24).toString('base64url');
}

/* ── Stripe checkout ─────────────────────────────────────────────────────── */

async function createStripeCheckout(args: {
    email: string;
    childName: string;
    purchaseId: string;
    lang: string;
}): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

    // On Vercel previews, success/cancel URLs must redirect back to the
    // preview deploy (which is the only place puentes routes exist outside
    // of production). In production, use the public argomethod.com domain.
    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com');
    const productLabel = args.lang === 'en'
        ? `Argo Puentes — bond with ${args.childName}`
        : args.lang === 'pt'
            ? `Argo Puentes — vínculo com ${args.childName}`
            : `Argo Puentes — vínculo con ${args.childName}`;

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            mode: 'payment',
            customer_email: args.email,
            // Disable Stripe Link (the email-code auto-fill flow) — only card.
            'payment_method_types[0]': 'card',
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][unit_amount]': String(PRICE_USD_CENTS),
            'line_items[0][price_data][product_data][name]': productLabel,
            'line_items[0][quantity]': '1',
            'metadata[purchase_id]': args.purchaseId,
            'metadata[source]': 'argo_puentes',
            success_url: `${origin}/puentes/checkout/success?purchase_id=${args.purchaseId}`,
            cancel_url: `${origin}/puentes/checkout/cancel`,
        }).toString(),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[puentes-checkout] Stripe error:', err);
        throw new Error(`Stripe error: ${err}`);
    }
    const session = await res.json();
    return session.url;
}

/* ── MercadoPago checkout ────────────────────────────────────────────────── */

async function createMpCheckout(args: {
    email: string;
    childName: string;
    purchaseId: string;
    arsAmount: number;
    lang: string;
}): Promise<string> {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) throw new Error('Missing MERCADOPAGO_ACCESS_TOKEN');

    // Same preview-aware origin logic as the Stripe checkout.
    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com');
    const productLabel = args.lang === 'en'
        ? `Argo Puentes — bond with ${args.childName}`
        : args.lang === 'pt'
            ? `Argo Puentes — vínculo com ${args.childName}`
            : `Argo Puentes — vínculo con ${args.childName}`;

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${mpToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [{
                title: productLabel,
                quantity: 1,
                unit_price: args.arsAmount,
                currency_id: 'ARS',
            }],
            payer: { email: args.email },
            metadata: { purchase_id: args.purchaseId, source: 'argo_puentes' },
            back_urls: {
                success: `${origin}/puentes/checkout/success?purchase_id=${args.purchaseId}`,
                failure: `${origin}/puentes/checkout/cancel`,
                pending: `${origin}/puentes/checkout/pending`,
            },
            auto_return: 'approved',
            external_reference: `puentes_${args.purchaseId}`,
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
        const {
            source_session_id,
            recipient_email,
            recipient_name,
            country: bodyCountry,
            lang,
            consent_given,
        } = req.body as {
            source_session_id?: string;
            recipient_email?: string;
            recipient_name?: string;
            country?: string;
            lang?: string;
            consent_given?: boolean;
        };

        if (!source_session_id || !recipient_email) {
            return res.status(400).json({ error: 'Missing source_session_id or recipient_email' });
        }
        if (!consent_given) {
            return res.status(400).json({ error: 'Consent required' });
        }

        // Country detection: body > Vercel geo header > fallback US
        const country = bodyCountry?.toUpperCase()
            || (req.headers['x-vercel-ip-country'] as string)?.toUpperCase()
            || 'US';

        // Look up source perfilamiento to get child name, lang fallback, tenant_id
        const { data: srcSession, error: srcErr } = await sb
            .from('perfilamientos')
            .select('id, lang, tenant_id, child_name')
            .eq('id', source_session_id)
            .maybeSingle();
        if (srcErr || !srcSession) return res.status(404).json({ error: 'Source session not found' });

        // Block double-purchase: if this adult email already has a paid Argo
        // Puentes purchase, redirect them to their existing report instead of
        // charging them again. One purchase covers all their children.
        const { data: existing } = await sb
            .from('puentes_purchases')
            .select('id, magic_token, source')
            .eq('recipient_email', recipient_email)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing) {
            const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com');
            return res.status(409).json({
                error: 'already_purchased',
                detail: 'This email already has an active Argo Puentes account.',
                existing_magic_link: `${origin}/puentes/${existing.magic_token}`,
            });
        }

        const childName = srcSession.child_name || '';
        const provider = getProvider(country);
        const magicToken = genMagicToken();
        const finalLang = (lang || srcSession.lang || 'es') as string;

        // Compute amount
        let amountCents: number;
        let currency: 'USD' | 'ARS';
        let arsAmount = 0;

        if (provider === 'mercadopago') {
            if (country === 'AR') {
                arsAmount = PRICE_ARS;
                console.info(`[puentes-checkout] AR fixed price: $${arsAmount} ARS`);
            } else {
                const rate = await getArsRate();
                arsAmount = usdCentsToArs(PRICE_USD_CENTS, rate);
                console.info(`[puentes-checkout] ARS conversion: ${PRICE_USD_CENTS / 100} USD x ${rate} = ${arsAmount} ARS`);
            }
            amountCents = arsAmount * 100;
            currency = 'ARS';
        } else {
            amountCents = PRICE_USD_CENTS;
            currency = 'USD';
        }

        // Create pending purchase
        const { data: purchase, error: insErr } = await sb
            .from('puentes_purchases')
            .insert({
                source_session_id,
                recipient_email,
                recipient_name: recipient_name ?? null,
                child_name: childName,
                amount_cents: amountCents,
                currency,
                provider,
                status: 'pending',
                magic_token: magicToken,
                lang: finalLang,
                source: srcSession.tenant_id ? 'tenant' : 'argo_one',
                tenant_id: srcSession.tenant_id ?? null,
            })
            .select('id')
            .single();
        if (insErr || !purchase) {
            console.error('[puentes-checkout] Insert error:', insErr?.message);
            return res.status(500).json({ error: 'Failed to create purchase' });
        }

        // Create checkout
        let checkoutUrl: string;
        if (provider === 'stripe') {
            checkoutUrl = await createStripeCheckout({
                email: recipient_email,
                childName,
                purchaseId: purchase.id,
                lang: finalLang,
            });
        } else {
            checkoutUrl = await createMpCheckout({
                email: recipient_email,
                childName,
                purchaseId: purchase.id,
                arsAmount,
                lang: finalLang,
            });
        }

        return res.status(200).json({
            checkout_url: checkoutUrl,
            purchase_id: purchase.id,
            provider,
            currency,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout session', detail: msg });
    }
}
