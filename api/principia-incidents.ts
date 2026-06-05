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

    const id = req.query.id as string | undefined;
    if (id) {
        // Detail: incident + its immutable timeline from system_activity_log.
        const { data: incident } = await sb.from('incidents').select('*').eq('id', parseInt(id, 10)).maybeSingle();
        if (!incident) return res.status(404).json({ error: 'Incident not found' });
        const { data: timeline } = await sb.from('system_activity_log')
            .select('id, recorded_at, source_type, event_type, actor, action, severity, status, reason, result')
            .eq('incident_id', parseInt(id, 10))
            .order('recorded_at', { ascending: true });
        return res.status(200).json({ incident, timeline: timeline ?? [] });
    }

    // List: filterable by area + status.
    const area = req.query.area as string | undefined;
    const status = req.query.status as string | undefined;
    let q = sb.from('incidents')
        .select('id, area, loop_id, agent, kind, title, severity, status, signal_count, first_seen_at, last_seen_at, resolved_at')
        .order('last_seen_at', { ascending: false }).limit(200);
    if (area && area !== 'all') q = q.eq('area', area);
    if (status && status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ incidents: data ?? [] });
}
