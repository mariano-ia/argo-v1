import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { data: tenant, error: tenantError } = await sb
            .from('tenants')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (tenantError || !tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // ── GET: List groups with member counts ─────────────────────────
        if (req.method === 'GET') {
            const { data: groups, error: grpError } = await sb
                .from('groups')
                .select('id, name, created_at, group_members(count)')
                .eq('tenant_id', tenant.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (grpError) {
                console.error('[tenant-groups] Query error:', grpError.message);
                return res.status(500).json({ error: 'Failed to fetch groups' });
            }

            const mapped = (groups ?? []).map((g: Record<string, unknown>) => ({
                id: g.id,
                name: g.name,
                created_at: g.created_at,
                member_count: Array.isArray(g.group_members) && g.group_members[0]
                    ? (g.group_members[0] as { count: number }).count
                    : 0,
            }));

            return res.status(200).json({ groups: mapped });
        }

        // ── POST: Create group ──────────────────────────────────────────
        if (req.method === 'POST') {
            const { name } = req.body ?? {};
            const trimmed = typeof name === 'string' ? name.trim() : '';

            if (!trimmed) {
                return res.status(400).json({ error: 'El nombre del grupo es requerido' });
            }
            if (trimmed.length > 100) {
                return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });
            }

            const { data: group, error: insertError } = await sb
                .from('groups')
                .insert({ tenant_id: tenant.id, name: trimmed })
                .select('id, name')
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    return res.status(409).json({ error: 'Ya existe un grupo con ese nombre' });
                }
                console.error('[tenant-groups] Insert error:', insertError.message);
                return res.status(500).json({ error: 'Failed to create group' });
            }

            return res.status(201).json({ ok: true, group });
        }
    } catch (err) {
        console.error('[tenant-groups] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
