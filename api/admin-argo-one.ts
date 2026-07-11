import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-argo-one
 * Returns all ArgoOne® purchases with their link statuses.
 */

async function verifyAdmin(req: VercelRequest, sb: ReturnType<typeof createClient<any, any>>): Promise<boolean> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;
    const { data: { user }, error } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) return false;
    if (!user.email) return false;
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
            .select('id, email, pack_size, amount_cents, currency, payment_provider, payment_status, created_at, paid_at, kind, includes_puente')
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

        const oneRows = (purchases ?? []).map(p => ({
            ...p,
            amount_usd: p.amount_cents / 100,
            product: p.kind === 'reprofile' ? 'reprofile' : (p.includes_puente ? 'combo' : 'one'),
            links: linkStats[p.id] ?? { available: 0, sent: 0, pending: 0, completed: 0 },
        }));

        // ArgoPuente® add-on purchases: standalone bridges bought by an extra adult.
        // provider='stripe' excludes the comp/$0 puentes shipped with a combo or
        // admin-granted. Shaped to match the one_purchases rows so they render in the
        // same table tagged product='puente'.
        const { data: addonRows } = await sb
            .from('puentes_purchases')
            .select('id, recipient_email, amount_cents, currency, provider, status, created_at, paid_at')
            .eq('provider', 'stripe')
            .order('created_at', { ascending: false })
            .limit(200);

        const puenteRows = (addonRows ?? []).map(a => ({
            id: a.id,
            email: a.recipient_email,
            pack_size: 1,
            amount_cents: a.amount_cents,
            currency: a.currency,
            payment_provider: a.provider,
            payment_status: a.status,
            created_at: a.created_at,
            paid_at: a.paid_at,
            kind: null,
            includes_puente: false,
            amount_usd: a.amount_cents / 100,
            product: 'puente',
            links: { available: 0, sent: 0, pending: 0, completed: 0 },
        }));

        const enriched = [...oneRows, ...puenteRows]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 200);

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
