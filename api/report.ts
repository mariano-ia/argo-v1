import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { id, token } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing session id' });
    }

    // Basic UUID format validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
        return res.status(400).json({ error: 'Invalid session id format' });
    }

    // Require share token for public access (prevents UUID brute-force)
    if (!token || typeof token !== 'string' || token.length < 8) {
        return res.status(403).json({ error: 'Missing or invalid access token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const { data, error } = await sb
        .from('sessions')
        .select('id, child_name, child_age, sport, adult_name, eje, motor, eje_secundario, lang, answers, created_at, ai_sections, tenant_id, full_access, share_token')
        .eq('id', id)
        .not('eje', 'eq', '_pending')
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Report not found' });
    }

    // Validate share token
    if (data.share_token && data.share_token !== token) {
        return res.status(403).json({ error: 'Invalid access token' });
    }

    // Resolve tenant plan — sessions without a tenant (legacy MVP) show full report
    let tenantPlan: string | null = null;
    if (data.tenant_id) {
        const { data: tenant } = await sb
            .from('tenants')
            .select('plan')
            .eq('id', data.tenant_id)
            .maybeSingle();
        tenantPlan = tenant?.plan ?? null;
    }

    // Set noindex header so crawlers respect it even without the meta tag
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).json({ ...data, tenant_plan: tenantPlan, full_access: data.full_access ?? false });
}
