import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-argo-one
 * Returns all Argo One purchases with their link statuses.
 */

async function verifyAdmin(req: VercelRequest, sb: ReturnType<typeof createClient>): Promise<boolean> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;
    const { data: { user }, error } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) return false;
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', user.email).maybeSingle();
    return !!admin;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);
    if (!(await verifyAdmin(req, sb))) return res.status(403).json({ error: 'Admin access required' });

    try {
        const { data: purchases } = await sb
            .from('one_purchases')
            .select('id, email, pack_size, amount_cents, currency, payment_provider, payment_status, created_at, paid_at')
            .order('created_at', { ascending: false })
            .limit(200);

        // Get link stats per purchase
        const purchaseIds = (purchases ?? []).map(p => p.id);
        const linkStats: Record<string, { available: number; sent: number; pending: number; completed: number }> = {};

        if (purchaseIds.length > 0) {
            const { data: links } = await sb
                .from('one_links')
                .select('purchase_id, status')
                .in('purchase_id', purchaseIds);

            for (const l of links ?? []) {
                if (!linkStats[l.purchase_id]) linkStats[l.purchase_id] = { available: 0, sent: 0, pending: 0, completed: 0 };
                const s = l.status as keyof typeof linkStats[string];
                if (linkStats[l.purchase_id][s] !== undefined) linkStats[l.purchase_id][s]++;
            }
        }

        const enriched = (purchases ?? []).map(p => ({
            ...p,
            amount_usd: p.amount_cents / 100,
            links: linkStats[p.id] ?? { available: 0, sent: 0, pending: 0, completed: 0 },
        }));

        const totalRevenue = enriched.filter(p => p.payment_status === 'paid').reduce((s, p) => s + p.amount_usd, 0);
        const totalPurchases = enriched.filter(p => p.payment_status === 'paid').length;

        return res.status(200).json({
            purchases: enriched,
            summary: { total_revenue: totalRevenue, total_purchases: totalPurchases },
        });
    } catch (err) {
        console.error('[admin-argo-one] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
