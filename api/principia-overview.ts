import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// NOTE: Vercel /api cannot import from /src. Admin gate + activity shape are inlined.

const DEAD_MAN_DETECT_MINUTES = 20; // 2x the detect cron cadence (10 min)

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

    // 1) Open incidents + pending approvals per area.
    const { data: incRows } = await sb.from('incidents')
        .select('id, area, severity, status, title, last_seen_at')
        .neq('status', 'resolved')
        .order('last_seen_at', { ascending: false });
    const incidents = incRows ?? [];
    const awaitingApproval = incidents.filter(i => i.status === 'awaiting_approval').length;
    const openByArea: Record<string, number> = {};
    for (const i of incidents) openByArea[i.area] = (openByArea[i.area] ?? 0) + 1;

    // 2) Dead-man's-switch: is the detect cron silent?
    const detectCutoff = new Date(Date.now() - DEAD_MAN_DETECT_MINUTES * 60 * 1000).toISOString();
    const { data: lastDetect } = await sb.from('health_checks')
        .select('checked_at')
        .eq('area', 'producto').eq('source_ref', 'principia-detect')
        .order('checked_at', { ascending: false }).limit(1).maybeSingle();
    const detectorSilent = !lastDetect || lastDetect.checked_at < detectCutoff;

    // 3) Org verdict. grey if detector silent (no lying green); amber if open incidents; green otherwise.
    const hasAlto = incidents.some(i => i.severity === 'alto');
    const verdict: 'sano' | 'medio' | 'alto' | 'offline' =
        detectorSilent ? 'offline' : hasAlto ? 'alto' : incidents.length ? 'medio' : 'sano';

    // 4) Recent activity (15 rows).
    const { data: activity } = await sb.from('system_activity_log')
        .select('id, recorded_at, area, source_type, event_type, action, resource_id, severity, status, incident_id')
        .order('recorded_at', { ascending: false }).limit(15);

    return res.status(200).json({
        verdict,
        detectorSilent,
        lastDetectAt: lastDetect?.checked_at ?? null,
        awaitingApproval,
        openByArea,
        incidents: incidents.slice(0, 10),
        recentActivity: activity ?? [],
    });
}
