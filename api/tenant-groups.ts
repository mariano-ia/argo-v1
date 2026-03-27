import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Unified groups endpoint. Routes by `action` field in POST body,
 * or GET for listing groups / group detail.
 *
 * GET                         → list groups
 * GET ?id=<uuid>              → group detail with members
 * POST { action: "create", name }                          → create group
 * POST { action: "rename", id, name }                      → rename group
 * POST { action: "delete", id }                            → soft-delete group
 * POST { action: "add_members", group_id, session_ids[] }  → add sessions to group
 * POST { action: "remove_members", group_id, session_ids[] } → remove sessions from group
 */
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

        const { data: memberRow } = await sb
            .from('tenant_members')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!memberRow) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        const tenant = { id: memberRow.tenant_id };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GET: List groups or group detail
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (req.method === 'GET') {
            const groupId = req.query.id as string | undefined;

            // ── GET with id: Group detail ─────────────────────────────────
            if (groupId) {
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
                    console.error('[tenant-groups] Members query error:', memError.message);
                    return res.status(500).json({ error: 'Failed to fetch members' });
                }

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

            // ── GET without id: List groups ───────────────────────────────
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

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // POST: Route by action
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const { action } = req.body ?? {};

        // ── create ────────────────────────────────────────────────────────
        if (action === 'create') {
            const { name } = req.body;
            const trimmed = typeof name === 'string' ? name.trim() : '';
            if (!trimmed) return res.status(400).json({ error: 'El nombre del grupo es requerido' });
            if (trimmed.length > 100) return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });

            const { data: group, error: insertError } = await sb
                .from('groups')
                .insert({ tenant_id: tenant.id, name: trimmed })
                .select('id, name')
                .single();

            if (insertError) {
                if (insertError.code === '23505') return res.status(409).json({ error: 'Ya existe un grupo con ese nombre' });
                console.error('[tenant-groups] Insert error:', insertError.message);
                return res.status(500).json({ error: 'Failed to create group' });
            }

            return res.status(201).json({ ok: true, group });
        }

        // ── rename ────────────────────────────────────────────────────────
        if (action === 'rename') {
            const { id, name } = req.body;
            const trimmed = typeof name === 'string' ? name.trim() : '';
            if (!id) return res.status(400).json({ error: 'Group ID required' });
            if (!trimmed) return res.status(400).json({ error: 'El nombre es requerido' });
            if (trimmed.length > 100) return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });

            const { error: updateError } = await sb
                .from('groups')
                .update({ name: trimmed })
                .eq('id', id)
                .eq('tenant_id', tenant.id);

            if (updateError) {
                if (updateError.code === '23505') return res.status(409).json({ error: 'Ya existe un grupo con ese nombre' });
                console.error('[tenant-groups] Update error:', updateError.message);
                return res.status(500).json({ error: 'Failed to rename group' });
            }

            return res.status(200).json({ ok: true });
        }

        // ── delete ────────────────────────────────────────────────────────
        if (action === 'delete') {
            const { id } = req.body;
            if (!id) return res.status(400).json({ error: 'Group ID required' });

            const { error: delError } = await sb
                .from('groups')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('tenant_id', tenant.id);

            if (delError) {
                console.error('[tenant-groups] Delete error:', delError.message);
                return res.status(500).json({ error: 'Failed to delete group' });
            }

            return res.status(200).json({ ok: true });
        }

        // ── add_members ───────────────────────────────────────────────────
        if (action === 'add_members') {
            const { group_id, session_ids } = req.body;
            if (!group_id || !Array.isArray(session_ids) || session_ids.length === 0) {
                return res.status(400).json({ error: 'group_id and session_ids[] are required' });
            }

            // Verify group ownership
            const { data: grp, error: grpErr } = await sb
                .from('groups').select('id').eq('id', group_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (grpErr || !grp) return res.status(404).json({ error: 'Grupo no encontrado' });

            // Verify session ownership
            const { data: validSessions } = await sb
                .from('sessions').select('id').eq('tenant_id', tenant.id).is('deleted_at', null).not('eje', 'eq', '_pending').in('id', session_ids);

            const validIds = (validSessions ?? []).map((s: { id: string }) => s.id);
            if (validIds.length === 0) return res.status(400).json({ error: 'No valid sessions found' });

            const rows = validIds.map((sid: string) => ({ group_id, session_id: sid }));
            const { error: insertError } = await sb.from('group_members').upsert(rows, { onConflict: 'group_id,session_id' });

            if (insertError) {
                console.error('[tenant-groups] Add members error:', insertError.message);
                return res.status(500).json({ error: 'Failed to add members' });
            }

            return res.status(200).json({ ok: true, added: validIds.length });
        }

        // ── remove_members ────────────────────────────────────────────────
        if (action === 'remove_members') {
            const { group_id, session_ids } = req.body;
            if (!group_id || !Array.isArray(session_ids) || session_ids.length === 0) {
                return res.status(400).json({ error: 'group_id and session_ids[] are required' });
            }

            // Verify group ownership
            const { data: grp, error: grpErr } = await sb
                .from('groups').select('id').eq('id', group_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (grpErr || !grp) return res.status(404).json({ error: 'Grupo no encontrado' });

            const { error: delError } = await sb
                .from('group_members').delete().eq('group_id', group_id).in('session_id', session_ids);

            if (delError) {
                console.error('[tenant-groups] Remove members error:', delError.message);
                return res.status(500).json({ error: 'Failed to remove members' });
            }

            return res.status(200).json({ ok: true, removed: session_ids.length });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
        console.error('[tenant-groups] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
