import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const CREDIT_PACKS: Record<string, { credits: number; priceUsd: number; label: string }> = {
    starter: { credits: 10, priceUsd: 2900, label: 'Starter — 10 créditos' },
    team:    { credits: 30, priceUsd: 6900, label: 'Team — 30 créditos' },
    club:    { credits: 100, priceUsd: 17900, label: 'Club — 100 créditos' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!stripeKey || !serviceKey || !supabaseUrl) {
        console.error('[create-checkout] Missing env vars');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const stripe = new Stripe(stripeKey);

    try {
        const { pack_id } = req.body as { pack_id: string };
        const pack = CREDIT_PACKS[pack_id];

        if (!pack) {
            return res.status(400).json({ error: 'Invalid pack_id' });
        }

        // Validate JWT and get user
        const { data: { user }, error: authError } = await sb.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Find tenant
        const { data: tenant, error: tenantError } = await sb
            .from('tenants')
            .select('id, email, display_name, stripe_customer_id')
            .eq('auth_user_id', user.id)
            .single();

        if (tenantError || !tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Get or create Stripe customer
        let customerId = tenant.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: tenant.email,
                name: tenant.display_name,
                metadata: { tenant_id: tenant.id },
            });
            customerId = customer.id;

            await sb.from('tenants')
                .update({ stripe_customer_id: customerId })
                .eq('id', tenant.id);
        }

        // Determine origin for redirect URLs
        const origin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '') || 'https://argomethod.com';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: pack.label,
                        description: `${pack.credits} créditos para Argo Method`,
                    },
                    unit_amount: pack.priceUsd,
                },
                quantity: 1,
            }],
            metadata: {
                tenant_id: tenant.id,
                pack_id,
                credits: String(pack.credits),
            },
            success_url: `${origin}/dashboard?payment=success`,
            cancel_url: `${origin}/dashboard?payment=cancel`,
        });

        return res.status(200).json({ url: session.url });
    } catch (err) {
        console.error('[create-checkout] Error:', err);
        return res.status(500).json({ error: 'Failed to create checkout session' });
    }
}
