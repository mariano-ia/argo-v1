import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-ai-usage
 * Returns AI consumption data per tenant + global totals.
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
        // ── Period filter (optional: ?period=YYYY-MM or ?period=all) ────
        const period = (req.query.period as string) ?? 'all';
        let periodStart: string | null = null;
        let periodEnd: string | null = null;
        if (period !== 'all' && /^\d{4}-\d{2}$/.test(period)) {
            const [year, month] = period.split('-').map(Number);
            periodStart = new Date(year, month - 1, 1).toISOString();
            periodEnd = new Date(year, month, 1).toISOString(); // first day of next month
        }

        // Get all tenants with AI data
        const { data: tenants } = await sb
            .from('tenants')
            .select('id, display_name, email, plan, ai_queries_count, ai_queries_reset_at')
            .order('ai_queries_count', { ascending: false });

        // Get AI costs from sessions (report generation) per tenant
        let sessionsQuery = sb
            .from('sessions')
            .select('tenant_id, ai_cost_usd, ai_tokens_input, ai_tokens_output, created_at')
            .is('deleted_at', null)
            .not('ai_cost_usd', 'is', null);
        if (periodStart && periodEnd) {
            sessionsQuery = sessionsQuery.gte('created_at', periodStart).lt('created_at', periodEnd);
        }
        const { data: sessions } = await sessionsQuery;

        // Aggregate report costs per tenant
        const reportCosts: Record<string, { cost: number; tokens_in: number; tokens_out: number; count: number }> = {};
        let totalReportCost = 0;
        let totalReportTokensIn = 0;
        let totalReportTokensOut = 0;

        for (const s of sessions ?? []) {
            const tid = s.tenant_id ?? '_no_tenant';
            if (!reportCosts[tid]) reportCosts[tid] = { cost: 0, tokens_in: 0, tokens_out: 0, count: 0 };
            reportCosts[tid].cost += s.ai_cost_usd ?? 0;
            reportCosts[tid].tokens_in += s.ai_tokens_input ?? 0;
            reportCosts[tid].tokens_out += s.ai_tokens_output ?? 0;
            reportCosts[tid].count += 1;
            totalReportCost += s.ai_cost_usd ?? 0;
            totalReportTokensIn += s.ai_tokens_input ?? 0;
            totalReportTokensOut += s.ai_tokens_output ?? 0;
        }

        // Get chat token usage from chat_messages
        let chatQuery = sb
            .from('chat_messages')
            .select('tenant_id, tokens_in, tokens_out')
            .eq('role', 'assistant');
        if (periodStart && periodEnd) {
            chatQuery = chatQuery.gte('created_at', periodStart).lt('created_at', periodEnd);
        }
        const { data: chatStats } = await chatQuery;

        const chatCosts: Record<string, { tokens_in: number; tokens_out: number; count: number; est_cost: number }> = {};
        let totalChatTokensIn = 0;
        let totalChatTokensOut = 0;
        const CHAT_COST_PER_TOKEN_IN = 0.15 / 1_000_000;
        const CHAT_COST_PER_TOKEN_OUT = 0.60 / 1_000_000;

        for (const m of chatStats ?? []) {
            const tid = m.tenant_id ?? '_no_tenant';
            if (!chatCosts[tid]) chatCosts[tid] = { tokens_in: 0, tokens_out: 0, count: 0, est_cost: 0 };
            chatCosts[tid].tokens_in += m.tokens_in ?? 0;
            chatCosts[tid].tokens_out += m.tokens_out ?? 0;
            chatCosts[tid].count += 1;
            chatCosts[tid].est_cost += (m.tokens_in ?? 0) * CHAT_COST_PER_TOKEN_IN + (m.tokens_out ?? 0) * CHAT_COST_PER_TOKEN_OUT;
            totalChatTokensIn += m.tokens_in ?? 0;
            totalChatTokensOut += m.tokens_out ?? 0;
        }

        const totalChatCost = Object.values(chatCosts).reduce((sum, c) => sum + c.est_cost, 0);

        // Get blog generation costs
        let blogQuery = sb
            .from('blog_posts')
            .select('ai_tokens_input, ai_tokens_output, ai_cost_usd, generated_by, lang, created_at')
            .not('ai_cost_usd', 'is', null)
            .gt('ai_cost_usd', 0);
        if (periodStart && periodEnd) {
            blogQuery = blogQuery.gte('created_at', periodStart).lt('created_at', periodEnd);
        }
        const { data: blogPosts } = await blogQuery;

        let totalBlogCost = 0;
        let totalBlogTokensIn = 0;
        let totalBlogTokensOut = 0;
        let totalBlogPosts = 0;
        const blogByType: Record<string, number> = { 'ai-cron': 0, 'ai-demand': 0, human: 0 };

        for (const bp of blogPosts ?? []) {
            totalBlogCost += bp.ai_cost_usd ?? 0;
            totalBlogTokensIn += bp.ai_tokens_input ?? 0;
            totalBlogTokensOut += bp.ai_tokens_output ?? 0;
            totalBlogPosts++;
            blogByType[bp.generated_by ?? 'human'] = (blogByType[bp.generated_by ?? 'human'] ?? 0) + 1;
        }

        // Soft cap thresholds
        const SOFT_CAPS: Record<string, number> = { trial: 10, pro: 500, academy: 1000, enterprise: 999999 };

        // Build per-tenant data
        const perTenant = (tenants ?? []).map(t => {
            const rc = reportCosts[t.id] ?? { cost: 0, tokens_in: 0, tokens_out: 0, count: 0 };
            const cc = chatCosts[t.id] ?? { tokens_in: 0, tokens_out: 0, count: 0, est_cost: 0 };
            const softCap = SOFT_CAPS[t.plan] ?? 500;
            const capPercent = softCap > 0 ? Math.round((t.ai_queries_count / softCap) * 100) : 0;

            return {
                id: t.id,
                display_name: t.display_name,
                email: t.email,
                plan: t.plan,
                // Chat
                chat_queries_this_period: t.ai_queries_count,
                chat_soft_cap: softCap,
                chat_cap_percent: capPercent,
                chat_tokens_in: cc.tokens_in,
                chat_tokens_out: cc.tokens_out,
                chat_total_messages: cc.count,
                chat_est_cost: cc.est_cost,
                // Reports
                report_count: rc.count,
                report_cost: rc.cost,
                report_tokens_in: rc.tokens_in,
                report_tokens_out: rc.tokens_out,
                // Total
                total_est_cost: rc.cost + cc.est_cost,
            };
        });

        return res.status(200).json({
            period,
            tenants: perTenant,
            global: {
                total_tenants: (tenants ?? []).length,
                total_report_cost: totalReportCost,
                total_chat_est_cost: totalChatCost,
                total_blog_cost: totalBlogCost,
                total_cost: totalReportCost + totalChatCost + totalBlogCost,
                total_report_tokens: totalReportTokensIn + totalReportTokensOut,
                total_chat_tokens: totalChatTokensIn + totalChatTokensOut,
                total_blog_tokens: totalBlogTokensIn + totalBlogTokensOut,
                total_reports: Object.values(reportCosts).reduce((s, r) => s + r.count, 0),
                total_chat_messages: Object.values(chatCosts).reduce((s, c) => s + c.count, 0),
                total_blog_posts: totalBlogPosts,
                blog_by_type: blogByType,
            },
        });
    } catch (err) {
        console.error('[admin-ai-usage] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
