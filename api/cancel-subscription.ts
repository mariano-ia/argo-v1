import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/cancel-subscription
 * Auth: Bearer token (logged-in tenant user)
 *
 * Cancels the tenant's active subscription (Stripe or MercadoPago).
 * Downgrades tenant to trial plan with 8 player roster.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Find tenant
        const { data: memberRow } = await sb.from('tenant_members').select('tenant_id').eq('auth_user_id', user.id).eq('status', 'active').maybeSingle();
        let tenantId = memberRow?.tenant_id ?? null;
        if (!tenantId) {
            const { data: tenantRow } = await sb.from('tenants').select('id').eq('auth_user_id', user.id).maybeSingle();
            tenantId = tenantRow?.id ?? null;
        }
        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        // Get subscription info
        const { data: tenant } = await sb.from('tenants')
            .select('subscription_provider, subscription_id, plan')
            .eq('id', tenantId)
            .single();

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        if (tenant.plan === 'trial') return res.status(400).json({ error: 'No active subscription to cancel' });

        const { subscription_provider, subscription_id } = tenant;

        // Cancel on the payment provider
        if (subscription_provider === 'stripe' && subscription_id) {
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeKey) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });

            const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${stripeKey}` },
            });

            if (!stripeRes.ok) {
                const err = await stripeRes.text();
                console.error('[cancel-subscription] Stripe cancel error:', err);
                // If subscription not found on Stripe, proceed with local cleanup
                if (stripeRes.status !== 404) {
                    return res.status(502).json({ error: 'Failed to cancel Stripe subscription' });
                }
            }
        } else if (subscription_provider === 'mercadopago' && subscription_id) {
            const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!mpToken) return res.status(500).json({ error: 'Missing MERCADOPAGO_ACCESS_TOKEN' });

            const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${subscription_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${mpToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'cancelled' }),
            });

            if (!mpRes.ok) {
                const err = await mpRes.text();
                console.error('[cancel-subscription] MP cancel error:', err);
                if (mpRes.status !== 404) {
                    return res.status(502).json({ error: 'Failed to cancel MercadoPago subscription' });
                }
            }
        }

        // Downgrade tenant locally
        await sb.from('tenants').update({
            plan: 'trial',
            roster_limit: 8,
            subscription_provider: null,
            subscription_id: null,
        }).eq('id', tenantId);

        console.info(`[cancel-subscription] Tenant ${tenantId} cancelled (was ${tenant.plan} via ${subscription_provider})`);

        return res.status(200).json({ success: true, plan: 'trial' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[cancel-subscription] Error:', msg);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
