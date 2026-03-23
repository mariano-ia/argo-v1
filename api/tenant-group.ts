import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!['GET', 'PATCH', 'DELETE'].includes(req.method ?? '')) {
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

        // Get group ID from query (GET) or body (PATCH/DELETE)
        const groupId = req.method === 'GET'
            ? (req.query.id as string)
            : req.body?.id;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID required' });
        }

        // Verify group belongs to this tenant
        const { data: group, error: grpError } = await sb
            .from('groups')
            .select('id, name, created_at')
            .eq('id', groupId)
            .eq('tenant_id', tenant.id)
            .is('deleted_at', null)
            .single();

        if (grpError || !group) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        // ── GET: Group detail with members ──────────────────────────────
        if (req.method === 'GET') {
            const { data: members, error: memError } = await sb
                .from('group_members')
                .select(`
                    id,
                    session_id,
                    added_at,
                    sessions!inner (
                        child_name,
                        child_age,
                        sport,
                        archetype_label,
                        eje,
                        motor,
                        eje_secundario
                    )
                `)
                .eq('group_id', groupId);

            if (memError) {
                console.error('[tenant-group] Members query error:', memError.message);
                return res.status(500).json({ error: 'Failed to fetch members' });
            }

            // Flatten the joined session data
            const flatMembers = (members ?? []).map((m: Record<string, unknown>) => {
                const s = m.sessions as Record<string, unknown> | null;
                return {
                    id: m.id,
                    session_id: m.session_id,
                    added_at: m.added_at,
                    child_name: s?.child_name ?? '',
                    child_age: s?.child_age ?? null,
                    sport: s?.sport ?? '',
                    archetype_label: s?.archetype_label ?? '',
                    eje: s?.eje ?? '',
                    motor: s?.motor ?? '',
                    eje_secundario: s?.eje_secundario ?? '',
                };
            });

            return res.status(200).json({ group, members: flatMembers });
        }

        // ── PATCH: Rename group ─────────────────────────────────────────
        if (req.method === 'PATCH') {
            const { name } = req.body ?? {};
            const trimmed = typeof name === 'string' ? name.trim() : '';

            if (!trimmed) {
                return res.status(400).json({ error: 'El nombre es requerido' });
            }
            if (trimmed.length > 100) {
                return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });
            }

            const { error: updateError } = await sb
                .from('groups')
                .update({ name: trimmed })
                .eq('id', groupId)
                .eq('tenant_id', tenant.id);

            if (updateError) {
                if (updateError.code === '23505') {
                    return res.status(409).json({ error: 'Ya existe un grupo con ese nombre' });
                }
                console.error('[tenant-group] Update error:', updateError.message);
                return res.status(500).json({ error: 'Failed to rename group' });
            }

            return res.status(200).json({ ok: true });
        }

        // ── DELETE: Soft-delete group ────────────────────────────────────
        if (req.method === 'DELETE') {
            const { error: delError } = await sb
                .from('groups')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', groupId)
                .eq('tenant_id', tenant.id);

            if (delError) {
                console.error('[tenant-group] Delete error:', delError.message);
                return res.status(500).json({ error: 'Failed to delete group' });
            }

            return res.status(200).json({ ok: true });
        }
    } catch (err) {
        console.error('[tenant-group] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
