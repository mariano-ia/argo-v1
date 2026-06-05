import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 100;

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

    const page = Math.max(0, parseInt((req.query.page as string) ?? '0', 10) || 0);
    const area = req.query.area as string | undefined;
    const severity = req.query.severity as string | undefined;
    const eventType = req.query.event_type as string | undefined;
    const incidentId = req.query.incident_id as string | undefined;

    let q = sb.from('system_activity_log')
        .select('id, recorded_at, area, source_type, event_type, actor, action, resource_type, resource_id, severity, status, incident_id', { count: 'exact' })
        .order('recorded_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (area && area !== 'all') q = q.eq('area', area);
    if (severity && severity !== 'all') q = q.eq('severity', severity);
    if (eventType && eventType !== 'all') q = q.eq('event_type', eventType);
    if (incidentId) q = q.eq('incident_id', parseInt(incidentId, 10));

    const { data, count, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
        rows: data ?? [],
        page,
        pageSize: PAGE_SIZE,
        total: count ?? 0,
        hasMore: (count ?? 0) > (page + 1) * PAGE_SIZE,
    });
}
