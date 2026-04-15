import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-revenue
 * Returns revenue metrics: MRR from subscriptions + Argo One sales.
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

const PLAN_MRR: Record<string, number> = {
    pro: 49,
    academy: 89,
    enterprise: 0, // custom, tracked separately
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);
    if (!(await verifyAdmin(req, sb))) return res.status(403).json({ error: 'Admin access required' });

    try {
        // Get tenant plan distribution
        const { data: tenants } = await sb
            .from('tenants')
            .select('id, plan, display_name, created_at');

        const planCounts: Record<string, number> = {};
        let mrrEstimate = 0;
        for (const t of tenants ?? []) {
            planCounts[t.plan] = (planCounts[t.plan] ?? 0) + 1;
            // Estimate MRR (assume monthly for now, could track billing cycle)
            mrrEstimate += PLAN_MRR[t.plan] ?? 0;
        }

        // Argo One revenue
        const { data: purchases } = await sb
            .from('one_purchases')
            .select('id, pack_size, amount_cents, currency, payment_status, created_at, paid_at')
            .eq('payment_status', 'paid');

        let oneRevenueUsd = 0;
        let onePurchaseCount = 0;
        let oneProfilesSold = 0;
        const oneByMonth: Record<string, number> = {};

        for (const p of purchases ?? []) {
            const amount = p.amount_cents / 100;
            oneRevenueUsd += amount;
            onePurchaseCount += 1;
            oneProfilesSold += p.pack_size;

            const month = new Date(p.paid_at ?? p.created_at).toISOString().slice(0, 7); // YYYY-MM
            oneByMonth[month] = (oneByMonth[month] ?? 0) + amount;
        }

        // Tenant signups by month
        const signupsByMonth: Record<string, number> = {};
        for (const t of tenants ?? []) {
            const month = new Date(t.created_at).toISOString().slice(0, 7);
            signupsByMonth[month] = (signupsByMonth[month] ?? 0) + 1;
        }

        // Conversion rate: trial → paid
        const totalTrials = tenants?.filter(t => t.plan === 'trial').length ?? 0;
        const totalPaid = tenants?.filter(t => t.plan !== 'trial').length ?? 0;
        const conversionRate = (tenants?.length ?? 0) > 0
            ? Math.round((totalPaid / (tenants?.length ?? 1)) * 100)
            : 0;

        return res.status(200).json({
            mrr: {
                estimate: mrrEstimate,
                by_plan: planCounts,
            },
            argo_one: {
                total_revenue_usd: oneRevenueUsd,
                purchase_count: onePurchaseCount,
                profiles_sold: oneProfilesSold,
                by_month: oneByMonth,
            },
            signups: {
                total: tenants?.length ?? 0,
                by_month: signupsByMonth,
            },
            conversion: {
                total_trials: totalTrials,
                total_paid: totalPaid,
                rate_percent: conversionRate,
            },
        });
    } catch (err) {
        console.error('[admin-revenue] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
