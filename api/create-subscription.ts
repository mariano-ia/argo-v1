import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/create-subscription
 * Body: { plan, billing }
 *   plan: 'pro' | 'academy'
 *   billing: 'monthly' | 'annual'
 * Auth: Bearer token (logged-in tenant user)
 *
 * Creates a Stripe or MercadoPago checkout/preapproval based on
 * the tenant's country. Returns checkout_url.
 *
 * Country detection: tenant.country > x-vercel-ip-country > 'US'
 */

const PLANS: Record<string, { monthly_usd_cents: number; annual_usd_cents: number; roster_limit: number; label_en: string; label_es: string }> = {
    pro:     { monthly_usd_cents: 4900, annual_usd_cents: 48000, roster_limit: 50,  label_en: 'Argo PRO',     label_es: 'Argo PRO' },
    academy: { monthly_usd_cents: 8900, annual_usd_cents: 84000, roster_limit: 100, label_en: 'Argo Academy', label_es: 'Argo Academy' },
};

const MP_COUNTRIES = ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE'];
const COUNTRY_MAP: Record<string, string> = {
    argentina: 'AR', mexico: 'MX', brazil: 'BR', usa: 'US', spain: 'ES',
};

/* ── ARS rate cache (1 hour TTL) ─────────────────────────────────────────── */

let cachedArsRate: { venta: number; fetchedAt: number } | null = null;
const ARS_CACHE_TTL = 60 * 60 * 1000;

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
        console.error('[create-subscription] Failed to fetch ARS rate:', err);
        if (cachedArsRate) return cachedArsRate.venta;
        throw new Error('Cannot determine ARS exchange rate');
    }
}

/* ── Stripe subscription checkout ────────────────────────────────────────── */

async function createStripeCheckout(
    plan: string,
    planConfig: typeof PLANS['pro'],
    billing: string,
    tenantId: string,
    email: string,
): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const isAnnual = billing === 'annual';
    const interval = isAnnual ? 'year' : 'month';
    const amount = isAnnual ? planConfig.annual_usd_cents : planConfig.monthly_usd_cents;

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'mode': 'subscription',
            'customer_email': email,
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][unit_amount]': String(amount),
            'line_items[0][price_data][recurring][interval]': interval,
            'line_items[0][price_data][product_data][name]': `${planConfig.label_en} (${isAnnual ? 'Annual' : 'Monthly'})`,
            'line_items[0][quantity]': '1',
            'metadata[tenant_id]': tenantId,
            'metadata[plan]': plan,
            'metadata[billing]': billing,
            'metadata[source]': 'argo_subscription',
            'subscription_data[metadata][tenant_id]': tenantId,
            'subscription_data[metadata][plan]': plan,
            'success_url': `${origin}/dashboard?upgraded=1`,
            'cancel_url': `${origin}/dashboard/pricing`,
        }).toString(),
    });

    if (!stripeRes.ok) {
        const err = await stripeRes.text();
        console.error('[create-subscription] Stripe error:', err);
        throw new Error(`Stripe error: ${err}`);
    }

    const session = await stripeRes.json();
    return session.url;
}

/* ── MercadoPago preapproval (subscription) ──────────────────────────────── */

async function createMPPreapproval(
    _plan: string,
    planConfig: typeof PLANS['pro'],
    billing: string,
    tenantId: string,
    email: string,
    arsRate: number,
): Promise<{ checkoutUrl: string; preapprovalId: string }> {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) throw new Error('Missing MERCADOPAGO_ACCESS_TOKEN');

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const isAnnual = billing === 'annual';
    const usdCents = isAnnual ? planConfig.annual_usd_cents : planConfig.monthly_usd_cents;
    const arsAmount = Math.ceil((usdCents / 100) * arsRate);
    const frequency = isAnnual ? 12 : 1;
    const label = `${planConfig.label_es} (${isAnnual ? 'Anual' : 'Mensual'})`;

    console.info(`[create-subscription] MP: $${usdCents / 100} USD x ${arsRate} = $${arsAmount} ARS (${billing})`);

    const res = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${mpToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reason: label,
            external_reference: tenantId,
            payer_email: email,
            back_url: `${origin}/dashboard?upgraded=1`,
            auto_recurring: {
                frequency,
                frequency_type: 'months',
                transaction_amount: arsAmount,
                currency_id: 'ARS',
            },
            status: 'pending',
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[create-subscription] MP preapproval error:', err);
        throw new Error(`MercadoPago error: ${err}`);
    }

    const preapproval = await res.json();
    return {
        checkoutUrl: preapproval.init_point,
        preapprovalId: preapproval.id,
    };
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!stripeKey) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // Authenticate user
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Get tenant
        const { data: memberRow } = await sb.from('tenant_members').select('tenant_id').eq('auth_user_id', user.id).eq('status', 'active').maybeSingle();
        let tenantId = memberRow?.tenant_id ?? null;
        let tenantCountry: string | null = null;

        if (!tenantId) {
            const { data: tenantRow } = await sb.from('tenants').select('id, country').eq('auth_user_id', user.id).maybeSingle();
            tenantId = tenantRow?.id ?? null;
            tenantCountry = tenantRow?.country ?? null;
        } else {
            const { data: tenantRow } = await sb.from('tenants').select('country').eq('id', tenantId).maybeSingle();
            tenantCountry = tenantRow?.country ?? null;
        }

        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        const { plan, billing } = req.body as { plan?: string; billing?: string };
        if (!plan || !PLANS[plan]) return res.status(400).json({ error: 'Invalid plan. Use: pro, academy' });
        if (billing !== 'monthly' && billing !== 'annual') return res.status(400).json({ error: 'Invalid billing. Use: monthly, annual' });

        const planConfig = PLANS[plan];

        // Determine payment provider from tenant country > Vercel geo > fallback US
        const countryCode = COUNTRY_MAP[tenantCountry ?? '']
            || (req.headers['x-vercel-ip-country'] as string)?.toUpperCase()
            || 'US';
        const useMercadoPago = MP_COUNTRIES.includes(countryCode);

        let checkoutUrl: string;

        if (useMercadoPago) {
            const arsRate = await getArsRate();
            const { checkoutUrl: mpUrl, preapprovalId } = await createMPPreapproval(
                plan, planConfig, billing, tenantId, user.email ?? '', arsRate,
            );
            checkoutUrl = mpUrl;

            // Store preapproval reference for future cancellation
            await sb.from('tenants').update({
                subscription_provider: 'mercadopago',
                subscription_id: preapprovalId,
            }).eq('id', tenantId);
        } else {
            checkoutUrl = await createStripeCheckout(plan, planConfig, billing, tenantId, user.email ?? '');
        }

        return res.status(200).json({
            checkout_url: checkoutUrl,
            provider: useMercadoPago ? 'mercadopago' : 'stripe',
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[create-subscription] Error:', msg);
        return res.status(500).json({ error: 'Internal server error', detail: msg });
    }
}
