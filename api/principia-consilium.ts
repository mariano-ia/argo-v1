import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'Invalid token' });
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', userData.user.email).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    // 7-day window (org-wide). Read-only: this never mutates incidents.
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const periodStart = start.toISOString().slice(0, 10);
    const periodEnd = end.toISOString().slice(0, 10);

    const { data: opened } = await sb.from('incidents')
        .select('id, area, class_id, severity, status, first_seen_at, resolved_at')
        .gte('first_seen_at', start.toISOString());
    const rows = opened ?? [];

    const resolved = rows.filter(r => r.status === 'resolved' && r.resolved_at);
    // MTTR (minutes), only over incidents that actually resolved in-window.
    const mttrMin = resolved.length
        ? Math.round(resolved.reduce((acc, r) =>
            acc + (new Date(r.resolved_at as string).getTime() - new Date(r.first_seen_at).getTime()) / 60000, 0) / resolved.length)
        : null;

    // Approval rate from governance rows in system_activity_log over the same window.
    const { data: decisions } = await sb.from('system_activity_log')
        .select('action').in('action', ['principia_approve', 'principia_reject', 'principia_snooze'])
        .gte('recorded_at', start.toISOString());
    const approvals = (decisions ?? []).filter(d => d.action === 'principia_approve').length;
    const totalDecisions = (decisions ?? []).length;
    const approvalRate = totalDecisions ? Math.round((approvals / totalDecisions) * 100) : null;

    // Top classes by incident count.
    const byClass: Record<string, number> = {};
    for (const r of rows) { const k = String(r.class_id ?? 'sin_clase'); byClass[k] = (byClass[k] ?? 0) + 1; }
    const topClasses = Object.entries(byClass).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([class_id, count]) => ({ class_id, count }));

    const summary = {
        incidents_opened: rows.length,
        incidents_resolved: resolved.length,
        mttr_minutes: mttrMin,
        approval_rate: approvalRate,
        decisions: totalDecisions,
        top_classes: topClasses,
    };

    // Persist the read-only snapshot (spec mandates writing weekly_reviews.summary).
    // Idempotent per (area-null, period): rely on uniq_weekly_review_period.
    try {
        await sb.from('weekly_reviews').upsert(
            { area: null, period_start: periodStart, period_end: periodEnd, summary, reviewed_by: 'consilium', closed_at: new Date().toISOString() },
            { onConflict: 'area,period_start,period_end' },
        );
    } catch { /* non-blocking: the view still renders the freshly-computed summary */ }

    return res.status(200).json({ periodStart, periodEnd, summary });
}
