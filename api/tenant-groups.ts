import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Phase 2: resolve which tenant the caller acts on. An explicit tenant_id
// requires ACTIVE membership of THAT tenant; absent tenant_id keeps the
// single-membership back-compat path. Returns null when the caller may not act.
async function resolveTenantContext(
    sb: any,
    userId: string,
    requestedTenantId: string | null,
): Promise<{ tenantId: string; role: string; memberId: string | null } | null> {
    if (requestedTenantId) {
        const { data: m } = await sb
            .from('tenant_members')
            .select('id, tenant_id, role')
            .eq('auth_user_id', userId)
            .eq('tenant_id', requestedTenantId)
            .eq('status', 'active')
            .maybeSingle();
        if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
        const { data: t } = await sb
            .from('tenants')
            .select('id')
            .eq('id', requestedTenantId)
            .eq('auth_user_id', userId)
            .maybeSingle();
        if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
        return null;
    }
    const { data: m } = await sb
        .from('tenant_members')
        .select('id, tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
    const { data: t } = await sb
        .from('tenants')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
    if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
    return null;
}

/**
 * Unified teams endpoint (table is still named `groups` for backward-compat).
 * A "team" = a group with a play-link slug + assigned coaches. Players belong to
 * teams via group_members (M:N, so a player can be shared across teams).
 *
 * Read scope: the institution admin (owner) sees all teams; a coach sees only the
 * teams they're assigned to. All mutations are admin-only.
 *
 * GET                          → list teams (scoped by role)
 * GET ?id=<uuid>               → team detail: players + coaches
 * POST { action: "create", name }                              → create team
 * POST { action: "rename", id, name }                          → rename team
 * POST { action: "delete", id }                                → soft-delete team
 * POST { action: "add_members", group_id, session_ids[] }      → add players to team
 * POST { action: "remove_members", group_id, session_ids[] }   → remove players from team
 * POST { action: "assign_coach", group_id, member_id }         → assign coach to team
 * POST { action: "unassign_coach", group_id, member_id }       → unassign coach from team
 * POST { action: "set_player_teams", session_id, team_ids[] }  → move/share a player (replace memberships)
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

        // Resolve caller scope: tenant + role + member id (Phase 2: explicit tenant_id supported)
        const requestedTenantId = (typeof req.query.tenant_id === 'string' && req.query.tenant_id ? req.query.tenant_id : null) ?? (typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null);
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const tenantId = ctx.tenantId;
        const role = ctx.role;
        const memberId = ctx.memberId;
        const tenant = { id: tenantId };
        const isCoach = role === 'coach';
        const isAdmin = !isCoach; // owner (and legacy 'member') manage teams

        // For coaches, the set of teams they may see.
        let coachGroupIds: string[] = [];
        if (isCoach && memberId) {
            const { data: gc } = await sb.from('group_coaches').select('group_id').eq('member_id', memberId);
            coachGroupIds = (gc ?? []).map((r: { group_id: string }) => r.group_id);
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GET: List teams or team detail
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (req.method === 'GET') {
            const groupId = req.query.id as string | undefined;

            // ── GET with id: Team detail ──────────────────────────────────
            if (groupId) {
                if (isCoach && !coachGroupIds.includes(groupId)) {
                    return res.status(404).json({ error: 'Equipo no encontrado' });
                }
                const { data: group, error: grpError } = await sb
                    .from('groups')
                    .select('id, name, slug, created_at')
                    .eq('id', groupId)
                    .eq('tenant_id', tenant.id)
                    .is('deleted_at', null)
                    .single();

                if (grpError || !group) {
                    return res.status(404).json({ error: 'Equipo no encontrado' });
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

                // Assigned coaches
                const { data: coachRows } = await sb
                    .from('group_coaches')
                    .select('member_id, tenant_members!inner ( id, email, full_name, status )')
                    .eq('group_id', groupId);
                const coaches = (coachRows ?? []).map((c: Record<string, unknown>) => {
                    const tm = c.tenant_members as { id: string; email: string; full_name: string | null; status: string } | null;
                    return { member_id: c.member_id, email: tm?.email ?? '', full_name: tm?.full_name ?? null, status: tm?.status ?? 'active' };
                });

                return res.status(200).json({ group, members: flatMembers, coaches });
            }

            // ── GET without id: List teams ────────────────────────────────
            let listQuery = sb
                .from('groups')
                .select('id, name, slug, created_at, group_members(count)')
                .eq('tenant_id', tenant.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            if (isCoach) {
                if (coachGroupIds.length === 0) return res.status(200).json({ groups: [] });
                listQuery = listQuery.in('id', coachGroupIds);
            }
            const { data: groups, error: grpError } = await listQuery;

            if (grpError) {
                console.error('[tenant-groups] Query error:', grpError.message);
                return res.status(500).json({ error: 'Failed to fetch groups' });
            }

            const mapped = (groups ?? []).map((g: Record<string, unknown>) => ({
                id: g.id,
                name: g.name,
                slug: g.slug,
                created_at: g.created_at,
                member_count: Array.isArray(g.group_members) && g.group_members[0]
                    ? (g.group_members[0] as { count: number }).count
                    : 0,
            }));

            return res.status(200).json({ groups: mapped });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // POST: Route by action — admin only
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (!isAdmin) return res.status(403).json({ error: 'forbidden' });
        const { action } = req.body ?? {};

        // ── create ────────────────────────────────────────────────────────
        if (action === 'create') {
            const { name } = req.body;
            const trimmed = typeof name === 'string' ? name.trim() : '';
            if (!trimmed) return res.status(400).json({ error: 'El nombre del equipo es requerido' });
            if (trimmed.length > 100) return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });

            const { data: group, error: insertError } = await sb
                .from('groups')
                .insert({ tenant_id: tenant.id, name: trimmed })
                .select('id, name, slug')
                .single();

            if (insertError) {
                if (insertError.code === '23505') return res.status(409).json({ error: 'Ya existe un equipo con ese nombre' });
                console.error('[tenant-groups] Insert error:', insertError.message);
                return res.status(500).json({ error: 'Failed to create team' });
            }

            return res.status(201).json({ ok: true, group });
        }

        // ── rename ────────────────────────────────────────────────────────
        if (action === 'rename') {
            const { id, name } = req.body;
            const trimmed = typeof name === 'string' ? name.trim() : '';
            if (!id) return res.status(400).json({ error: 'Team ID required' });
            if (!trimmed) return res.status(400).json({ error: 'El nombre es requerido' });
            if (trimmed.length > 100) return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });

            const { error: updateError } = await sb
                .from('groups')
                .update({ name: trimmed })
                .eq('id', id)
                .eq('tenant_id', tenant.id);

            if (updateError) {
                if (updateError.code === '23505') return res.status(409).json({ error: 'Ya existe un equipo con ese nombre' });
                console.error('[tenant-groups] Update error:', updateError.message);
                return res.status(500).json({ error: 'Failed to rename team' });
            }

            return res.status(200).json({ ok: true });
        }

        // ── delete ────────────────────────────────────────────────────────
        if (action === 'delete') {
            const { id } = req.body;
            if (!id) return res.status(400).json({ error: 'Team ID required' });

            const { error: delError } = await sb
                .from('groups')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('tenant_id', tenant.id);

            if (delError) {
                console.error('[tenant-groups] Delete error:', delError.message);
                return res.status(500).json({ error: 'Failed to delete team' });
            }

            return res.status(200).json({ ok: true });
        }

        // ── add_members ───────────────────────────────────────────────────
        if (action === 'add_members') {
            const { group_id, session_ids } = req.body;
            if (!group_id || !Array.isArray(session_ids) || session_ids.length === 0) {
                return res.status(400).json({ error: 'group_id and session_ids[] are required' });
            }

            const { data: grp, error: grpErr } = await sb
                .from('groups').select('id').eq('id', group_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (grpErr || !grp) return res.status(404).json({ error: 'Equipo no encontrado' });

            const { data: validSessions } = await sb
                .from('sessions').select('id').eq('tenant_id', tenant.id).is('deleted_at', null).not('eje', 'eq', '_pending').in('id', session_ids);

            const validIds = (validSessions ?? []).map((s: { id: string }) => s.id);
            if (validIds.length === 0) return res.status(400).json({ error: 'No valid players found' });

            const rows = validIds.map((sid: string) => ({ group_id, session_id: sid }));
            const { error: insertError } = await sb.from('group_members').upsert(rows, { onConflict: 'group_id,session_id' });

            if (insertError) {
                console.error('[tenant-groups] Add members error:', insertError.message);
                return res.status(500).json({ error: 'Failed to add players' });
            }

            return res.status(200).json({ ok: true, added: validIds.length });
        }

        // ── remove_members ────────────────────────────────────────────────
        if (action === 'remove_members') {
            const { group_id, session_ids } = req.body;
            if (!group_id || !Array.isArray(session_ids) || session_ids.length === 0) {
                return res.status(400).json({ error: 'group_id and session_ids[] are required' });
            }

            const { data: grp, error: grpErr } = await sb
                .from('groups').select('id').eq('id', group_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (grpErr || !grp) return res.status(404).json({ error: 'Equipo no encontrado' });

            const { error: delError } = await sb
                .from('group_members').delete().eq('group_id', group_id).in('session_id', session_ids);

            if (delError) {
                console.error('[tenant-groups] Remove members error:', delError.message);
                return res.status(500).json({ error: 'Failed to remove players' });
            }

            return res.status(200).json({ ok: true, removed: session_ids.length });
        }

        // ── assign_coach ──────────────────────────────────────────────────
        if (action === 'assign_coach') {
            const { group_id, member_id } = req.body;
            if (!group_id || !member_id) return res.status(400).json({ error: 'group_id and member_id are required' });

            const { data: grp } = await sb
                .from('groups').select('id').eq('id', group_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (!grp) return res.status(404).json({ error: 'Equipo no encontrado' });

            const { data: mem } = await sb
                .from('tenant_members').select('id').eq('id', member_id).eq('tenant_id', tenant.id).single();
            if (!mem) return res.status(404).json({ error: 'Entrenador no encontrado' });

            const { error: assignErr } = await sb
                .from('group_coaches').upsert({ group_id, member_id }, { onConflict: 'group_id,member_id' });
            if (assignErr) {
                console.error('[tenant-groups] Assign coach error:', assignErr.message);
                return res.status(500).json({ error: 'Failed to assign coach' });
            }
            return res.status(200).json({ ok: true });
        }

        // ── unassign_coach ────────────────────────────────────────────────
        if (action === 'unassign_coach') {
            const { group_id, member_id } = req.body;
            if (!group_id || !member_id) return res.status(400).json({ error: 'group_id and member_id are required' });

            const { data: grp } = await sb
                .from('groups').select('id').eq('id', group_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (!grp) return res.status(404).json({ error: 'Equipo no encontrado' });

            const { error: unErr } = await sb
                .from('group_coaches').delete().eq('group_id', group_id).eq('member_id', member_id);
            if (unErr) {
                console.error('[tenant-groups] Unassign coach error:', unErr.message);
                return res.status(500).json({ error: 'Failed to unassign coach' });
            }
            return res.status(200).json({ ok: true });
        }

        // ── set_player_teams (move / share) ───────────────────────────────
        // Replace a player's team memberships with the given set.
        // [] = remove from all teams; [A] = move to A only; [A,B] = shared across A and B.
        if (action === 'set_player_teams') {
            const { session_id, team_ids } = req.body;
            if (!session_id || !Array.isArray(team_ids)) {
                return res.status(400).json({ error: 'session_id and team_ids[] are required' });
            }

            // Verify the player belongs to this tenant
            const { data: sess } = await sb
                .from('sessions').select('id').eq('id', session_id).eq('tenant_id', tenant.id).is('deleted_at', null).single();
            if (!sess) return res.status(404).json({ error: 'Jugador no encontrado' });

            // Keep only teams that belong to this tenant
            let validTeamIds: string[] = [];
            if (team_ids.length > 0) {
                const { data: validTeams } = await sb
                    .from('groups').select('id').eq('tenant_id', tenant.id).is('deleted_at', null).in('id', team_ids);
                validTeamIds = (validTeams ?? []).map((g: { id: string }) => g.id);
            }

            // Replace memberships: drop existing, insert the new set
            const { error: delErr } = await sb.from('group_members').delete().eq('session_id', session_id);
            if (delErr) {
                console.error('[tenant-groups] set_player_teams delete error:', delErr.message);
                return res.status(500).json({ error: 'Failed to update player teams' });
            }
            if (validTeamIds.length > 0) {
                const { error: insErr } = await sb.from('group_members').insert(
                    validTeamIds.map((gid: string) => ({ group_id: gid, session_id }))
                );
                if (insErr) {
                    console.error('[tenant-groups] set_player_teams insert error:', insErr.message);
                    return res.status(500).json({ error: 'Failed to update player teams' });
                }
            }
            return res.status(200).json({ ok: true, teams: validTeamIds.length });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
        console.error('[tenant-groups] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
