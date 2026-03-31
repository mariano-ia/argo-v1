import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/create-subscription
 * Body: { plan, billing } (plan: 'pro'|'academy', billing: 'monthly'|'annual')
 * Auth: Bearer token (logged-in tenant user)
 *
 * Creates a Stripe Checkout session for a subscription and returns the URL.
 */

const PLANS: Record<string, { monthly_cents: number; annual_cents: number; roster_limit: number; label: string }> = {
    pro:     { monthly_cents: 4900, annual_cents: 48000, roster_limit: 50,  label: 'Argo PRO' },
    academy: { monthly_cents: 8900, annual_cents: 84000, roster_limit: 100, label: 'Argo Academy' },
};

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
        if (!tenantId) {
            const { data: tenantRow } = await sb.from('tenants').select('id').eq('auth_user_id', user.id).maybeSingle();
            tenantId = tenantRow?.id ?? null;
        }
        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        const { plan, billing } = req.body as { plan?: string; billing?: string };
        if (!plan || !PLANS[plan]) return res.status(400).json({ error: 'Invalid plan. Use: pro, academy' });
        if (billing !== 'monthly' && billing !== 'annual') return res.status(400).json({ error: 'Invalid billing. Use: monthly, annual' });

        const planConfig = PLANS[plan];
        const isAnnual = billing === 'annual';
        const origin = process.env.SITE_URL || 'https://argomethod.com';

        // Create Stripe Checkout session for subscription
        const interval = isAnnual ? 'year' : 'month';
        const amount = isAnnual ? planConfig.annual_cents : planConfig.monthly_cents;

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'mode': 'subscription',
                'customer_email': user.email ?? '',
                'line_items[0][price_data][currency]': 'usd',
                'line_items[0][price_data][unit_amount]': String(amount),
                'line_items[0][price_data][recurring][interval]': interval,
                'line_items[0][price_data][product_data][name]': `${planConfig.label} (${isAnnual ? 'Annual' : 'Monthly'})`,
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
            return res.status(502).json({ error: 'Failed to create checkout session' });
        }

        const session = await stripeRes.json();
        return res.status(200).json({ checkout_url: session.url });
    } catch (err) {
        console.error('[create-subscription] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
