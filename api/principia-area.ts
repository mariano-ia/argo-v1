import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Maps area -> agent for the Acta filter (actor column in system_activity_log).
const AREA_AGENT: Record<string, string> = {
    producto: 'vigia', marketing: 'praeco', ventas: 'mercator', personas: 'tribunus', finanzas: 'quaestor',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const area = (req.query.area as string) || (req.body?.area as string);
    if (!area || !AREA_AGENT[area]) return res.status(400).json({ error: 'Unknown area' });
    const agent = AREA_AGENT[area];

    // POST: append an Ordo (the centurion's backlog writer).
    if (req.method === 'POST') {
        const { kind, description, scheduled_for, origin } = req.body ?? {};
        if (!kind || !description) return res.status(400).json({ error: 'kind and description are required' });
        const { data, error } = await sb.from('agent_ordines')
            .insert({ area, agent, kind, description, scheduled_for: scheduled_for ?? null, origin: origin ?? 'self' })
            .select('id').single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ ok: true, id: data.id });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Acta: the rows this centurion wrote (actor = agent), most recent first.
    const { data: acta } = await sb.from('system_activity_log')
        .select('id, recorded_at, event_type, action, resource_type, resource_id, severity, status')
        .eq('actor', agent).order('recorded_at', { ascending: false }).limit(50);

    // Ordines: open backlog.
    const { data: ordines } = await sb.from('agent_ordines')
        .select('id, kind, description, status, scheduled_for, origin, created_at')
        .eq('area', area).eq('agent', agent).neq('status', 'dropped')
        .order('created_at', { ascending: false }).limit(50);

    return res.status(200).json({ area, agent, acta: acta ?? [], ordines: ordines ?? [] });
}
