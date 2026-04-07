import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/delete-account
 * Auth: Bearer token (logged-in tenant user)
 *
 * Deletes the tenant's account:
 * 1. Cancels any active subscription (Stripe/MP)
 * 2. Soft-deletes tenant record (sets deleted_at)
 * 3. Removes auth user from Supabase
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

        // Find tenant (must be owner, not just member)
        const { data: tenant } = await sb.from('tenants')
            .select('id, subscription_provider, subscription_id, plan')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (!tenant) return res.status(404).json({ error: 'Tenant not found (only owner can delete)' });

        // 1. Cancel active subscription if exists
        if (tenant.plan !== 'trial' && tenant.subscription_id) {
            if (tenant.subscription_provider === 'stripe') {
                const stripeKey = process.env.STRIPE_SECRET_KEY;
                if (stripeKey) {
                    await fetch(`https://api.stripe.com/v1/subscriptions/${tenant.subscription_id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${stripeKey}` },
                    }).catch(err => console.error('[delete-account] Stripe cancel failed:', err));
                }
            } else if (tenant.subscription_provider === 'mercadopago') {
                const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
                if (mpToken) {
                    await fetch(`https://api.mercadopago.com/preapproval/${tenant.subscription_id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'cancelled' }),
                    }).catch(err => console.error('[delete-account] MP cancel failed:', err));
                }
            }
        }

        // 2. Soft-delete tenant (preserve data for audit)
        await sb.from('tenants').update({
            plan: 'deleted',
            subscription_provider: null,
            subscription_id: null,
        }).eq('id', tenant.id);

        // 3. Remove tenant members
        await sb.from('tenant_members').update({ status: 'removed' }).eq('tenant_id', tenant.id);

        // 4. Delete auth user
        const { error: deleteErr } = await sb.auth.admin.deleteUser(user.id);
        if (deleteErr) {
            console.error('[delete-account] Failed to delete auth user:', deleteErr.message);
        }

        console.info(`[delete-account] Tenant ${tenant.id} (user ${user.id}) deleted`);

        return res.status(200).json({ success: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[delete-account] Error:', msg);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
