import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/delete-account
 * Auth: Bearer token (logged-in tenant user)
 *
 * Deletes the tenant's account:
 * 1. Cancels any active subscription (Stripe/MP)
 * 1.5 HARD-erases the child roster PII (children + perfilamientos + related),
 *     COPPA §312.10 / GDPR Art.17 — no minor data is retained
 * 2. Soft-deletes tenant record (keeps only non-PII billing metadata for audit)
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

        // 1.5 ERASE the child roster PII before soft-deleting the tenant.
        // COPPA §312.10 / GDPR Art.17 require REAL deletion of a minor's data.
        // The tenant row is kept (soft-deleted) for billing audit, but no
        // identifiable child data survives. Mirrors the hard-delete chain in
        // delete-session.ts, tenant-wide. (Security audit 2026-07-06.)
        const { data: kids } = await sb.from('children').select('id').eq('tenant_id', tenant.id);
        const childIds = (kids ?? []).map((k: { id: string }) => k.id);
        const { data: perfs } = await sb.from('perfilamientos').select('id').eq('tenant_id', tenant.id);
        const perfIds = (perfs ?? []).map((p: { id: string }) => p.id);

        if (perfIds.length > 0) {
            await sb.from('feedback').delete().in('session_id', perfIds);
            await sb.from('parental_consents').delete().in('session_id', perfIds);
        }
        // Coach chat + per-child assistant memory are tenant/child scoped.
        await sb.from('chat_messages').delete().eq('tenant_id', tenant.id);
        if (childIds.length > 0) {
            try { await sb.from('child_memory_events').delete().in('child_id', childIds); } catch (e) { console.warn('[delete-account] child_memory_events cleanup:', e); }
            try { await sb.from('child_memory').delete().in('child_id', childIds); } catch (e) { console.warn('[delete-account] child_memory cleanup:', e); }
            await sb.from('group_members').delete().in('child_id', childIds);
            await sb.from('chem_group_members').delete().in('child_id', childIds);
            // Deleting children cascades their perfilamientos (FK ON DELETE CASCADE).
            await sb.from('children').delete().in('id', childIds);
        }
        console.info(`[delete-account] Erased ${childIds.length} children / ${perfIds.length} perfilamientos for tenant ${tenant.id}`);

        // 2. Soft-delete tenant (keep only non-PII billing metadata for audit;
        //    the child roster PII was hard-deleted in step 1.5 above).
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
