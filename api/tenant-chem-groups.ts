import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * "Química de grupos" — analytical tool. A chem_group is a PERSONAL grouping of a
 * member's own players to analyze chemistry/dynamics. Separate from planteles
 * (which own the play link). Both admin and coach use this; each sees only the
 * groups they created, built from the players they can see.
 *
 * GET                         → list my groups (with member counts)
 * GET ?id=<uuid>              → group detail with members
 * POST { action: "create", name }
 * POST { action: "rename", id, name }
 * POST { action: "delete", id }
 * POST { action: "add_members", group_id, session_ids[] }
 * POST { action: "remove_members", group_id, session_ids[] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Resolve caller scope: tenant + role + member id
        let tenantId: string | null = null;
        let role = 'owner';
        let memberId: string | null = null;
        const { data: memberRow } = await sb
            .from('tenant_members').select('id, tenant_id, role')
            .eq('auth_user_id', user.id).eq('status', 'active').maybeSingle();
        if (memberRow) {
            tenantId = memberRow.tenant_id;
            role = memberRow.role ?? 'owner';
            memberId = memberRow.id;
        } else {
            const { data: tenantRow } = await sb.from('tenants').select('id').eq('auth_user_id', user.id).maybeSingle();
            if (tenantRow) tenantId = tenantRow.id;
        }
        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });
        const isCoach = role === 'coach';

        // The set of players the caller may put into a chem group: a coach is bound
        // to their planteles' players; admin/owner can use any tenant player.
        // null = unbounded.
        const playerScope = async (): Promise<string[] | null> => {
            if (!isCoach || !memberId) return null;
            const { data: gc } = await sb.from('group_coaches').select('group_id').eq('member_id', memberId);
            const plantelIds = (gc ?? []).map((r: { group_id: string }) => r.group_id);
            if (plantelIds.length === 0) return [];
            const { data: gm } = await sb.from('group_members').select('session_id').in('group_id', plantelIds);
            return Array.from(new Set((gm ?? []).map((r: { session_id: string }) => r.session_id)));
        };

        // ── GET ──────────────────────────────────────────────────────────────
        if (req.method === 'GET') {
            const groupId = req.query.id as string | undefined;

            if (groupId) {
                const { data: group, error: grpErr } = await sb
                    .from('chem_groups')
                    .select('id, name, created_at')
                    .eq('id', groupId)
                    .eq('tenant_id', tenantId)
                    .eq('owner_member_id', memberId)
                    .is('deleted_at', null)
                    .single();
                if (grpErr || !group) return res.status(404).json({ error: 'Grupo no encontrado' });

                const { data: members, error: memErr } = await sb
                    .from('chem_group_members')
                    .select('id, session_id, added_at, sessions!inner ( child_name, child_age, sport, archetype_label, eje, motor, eje_secundario )')
                    .eq('group_id', groupId);
                if (memErr) {
                    console.error('[tenant-chem-groups] members error:', memErr.message);
                    return res.status(500).json({ error: 'Failed to fetch members' });
                }
                const flat = (members ?? []).map((m: Record<string, unknown>) => {
                    const s = m.sessions as Record<string, unknown> | null;
                    return {
                        id: m.id, session_id: m.session_id, added_at: m.added_at,
                        child_name: s?.child_name ?? '', child_age: s?.child_age ?? null, sport: s?.sport ?? '',
                        archetype_label: s?.archetype_label ?? '', eje: s?.eje ?? '', motor: s?.motor ?? '', eje_secundario: s?.eje_secundario ?? '',
                    };
                });
                return res.status(200).json({ group, members: flat });
            }

            const { data: groups, error: grpErr } = await sb
                .from('chem_groups')
                .select('id, name, created_at, chem_group_members(count)')
                .eq('tenant_id', tenantId)
                .eq('owner_member_id', memberId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            if (grpErr) {
                console.error('[tenant-chem-groups] list error:', grpErr.message);
                return res.status(500).json({ error: 'Failed to fetch groups' });
            }
            const mapped = (groups ?? []).map((g: Record<string, unknown>) => ({
                id: g.id, name: g.name, created_at: g.created_at,
                member_count: Array.isArray(g.chem_group_members) && g.chem_group_members[0]
                    ? (g.chem_group_members[0] as { count: number }).count : 0,
            }));
            return res.status(200).json({ groups: mapped });
        }

        // ── POST ─────────────────────────────────────────────────────────────
        if (!memberId) return res.status(403).json({ error: 'forbidden' });
        const { action } = req.body ?? {};

        if (action === 'create') {
            const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
            if (!name) return res.status(400).json({ error: 'El nombre del grupo es requerido' });
            if (name.length > 100) return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });
            const { data: group, error } = await sb
                .from('chem_groups')
                .insert({ tenant_id: tenantId, owner_member_id: memberId, name })
                .select('id, name')
                .single();
            if (error) {
                console.error('[tenant-chem-groups] create error:', error.message);
                return res.status(500).json({ error: 'Failed to create group' });
            }
            return res.status(201).json({ ok: true, group });
        }

        if (action === 'rename') {
            const { id } = req.body;
            const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
            if (!id) return res.status(400).json({ error: 'Group ID required' });
            if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
            const { error } = await sb.from('chem_groups').update({ name })
                .eq('id', id).eq('tenant_id', tenantId).eq('owner_member_id', memberId);
            if (error) return res.status(500).json({ error: 'Failed to rename group' });
            return res.status(200).json({ ok: true });
        }

        if (action === 'delete') {
            const { id } = req.body;
            if (!id) return res.status(400).json({ error: 'Group ID required' });
            const { error } = await sb.from('chem_groups').update({ deleted_at: new Date().toISOString() })
                .eq('id', id).eq('tenant_id', tenantId).eq('owner_member_id', memberId);
            if (error) return res.status(500).json({ error: 'Failed to delete group' });
            return res.status(200).json({ ok: true });
        }

        if (action === 'add_members' || action === 'remove_members') {
            const { group_id, session_ids } = req.body;
            if (!group_id || !Array.isArray(session_ids) || session_ids.length === 0) {
                return res.status(400).json({ error: 'group_id and session_ids[] are required' });
            }
            // Verify the group belongs to the caller
            const { data: grp } = await sb.from('chem_groups')
                .select('id').eq('id', group_id).eq('tenant_id', tenantId).eq('owner_member_id', memberId).is('deleted_at', null).single();
            if (!grp) return res.status(404).json({ error: 'Grupo no encontrado' });

            if (action === 'remove_members') {
                const { error } = await sb.from('chem_group_members').delete().eq('group_id', group_id).in('session_id', session_ids);
                if (error) return res.status(500).json({ error: 'Failed to remove players' });
                return res.status(200).json({ ok: true, removed: session_ids.length });
            }

            // add_members — only players the caller can actually see
            const scope = await playerScope();
            let validQuery = sb.from('sessions').select('id')
                .eq('tenant_id', tenantId).is('deleted_at', null).not('eje', 'eq', '_pending').in('id', session_ids);
            const { data: valid } = await validQuery;
            let validIds = (valid ?? []).map((s: { id: string }) => s.id);
            if (scope !== null) validIds = validIds.filter(id => scope.includes(id));
            if (validIds.length === 0) return res.status(400).json({ error: 'No valid players found' });
            const rows = validIds.map((sid: string) => ({ group_id, session_id: sid }));
            const { error } = await sb.from('chem_group_members').upsert(rows, { onConflict: 'group_id,session_id' });
            if (error) return res.status(500).json({ error: 'Failed to add players' });
            return res.status(200).json({ ok: true, added: validIds.length });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
        console.error('[tenant-chem-groups] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
