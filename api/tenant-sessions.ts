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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify caller owns this tenant via their auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // Validate the JWT and get user
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Resolve caller scope: tenant + role + member id (coaches are scoped to teams)
        const requestedTenantId = typeof req.query.tenant_id === 'string' && req.query.tenant_id ? req.query.tenant_id : null;
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const tenantId = ctx.tenantId;
        const role = ctx.role;
        const memberId = ctx.memberId;

        const showArchived = req.query.archived === '1';
        const teamFilter = typeof req.query.team === 'string' && req.query.team ? req.query.team : null;
        const isCoach = role === 'coach';

        // Visibility bound: coaches only see players in the teams they're assigned to.
        // null = unbounded (owner/member see all tenant players).
        let boundGroupIds: string[] | null = null;
        if (isCoach && memberId) {
            const { data: gc } = await sb.from('group_coaches').select('group_id').eq('member_id', memberId);
            boundGroupIds = (gc ?? []).map((r: { group_id: string }) => r.group_id);
        }

        // Apply an explicit "filter by team" (must respect the coach's bound).
        let effectiveGroupIds: string[] | null = boundGroupIds;
        if (teamFilter) {
            if (boundGroupIds && !boundGroupIds.includes(teamFilter)) {
                return res.status(200).json({ sessions: [], total: 0 });
            }
            effectiveGroupIds = [teamFilter];
        }

        // If bounded to specific teams, resolve the child ids inside those teams.
        // Members are children now (group_members.child_id), and the
        // current_perfilamiento view's id IS the child id, so these ids filter it.
        let boundedSessionIds: string[] | null = null;
        if (effectiveGroupIds !== null) {
            if (effectiveGroupIds.length === 0) {
                return res.status(200).json({ sessions: [], total: 0 });
            }
            const { data: gm } = await sb.from('group_members').select('child_id').in('group_id', effectiveGroupIds);
            boundedSessionIds = Array.from(new Set((gm ?? []).map((r: { child_id: string }) => r.child_id)));
            if (boundedSessionIds.length === 0) {
                return res.status(200).json({ sessions: [], total: 0 });
            }
        }

        // Fetch the current profile per child for this tenant (one row per child).
        // current_perfilamiento.id is the CHILD id; it only surfaces resolved
        // profiles, so the prior _pending guard is implicit in the view.
        let query = sb
            .from('current_perfilamiento')
            .select('id, perfilamiento_id, child_name, child_age, adult_name, adult_email, sport, archetype_label, eje, motor, eje_secundario, current_profile_date, lang, answers, ai_sections, share_token, reprofile_token, full_access, email_sent_at, perfilamiento_count, archived_at')
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .order('current_profile_date', { ascending: false })
            .limit(100);

        if (boundedSessionIds) {
            query = query.in('id', boundedSessionIds);
        }

        // Filter by archived status
        if (showArchived) {
            query = query.not('archived_at', 'is', null);
        } else {
            query = query.is('archived_at', null);
        }

        const { data: sessions, error: sessError } = await query;

        if (sessError) {
            console.error('[tenant-sessions] Query error:', sessError.message);
            return res.status(500).json({ error: 'Failed to fetch sessions' });
        }

        // Attach team membership per player so the dashboard can show the team
        // column and filter. Coaches only see the teams within their own bound.
        // Membership is keyed on the child id (= current_perfilamiento.id).
        const sessIds = (sessions ?? []).map((s: { id: string }) => s.id);
        const teamsBySession: Record<string, string[]> = {};
        const historyByChild: Record<string, unknown[]> = {};
        if (sessIds.length > 0) {
            const { data: gm2 } = await sb.from('group_members').select('child_id, group_id').in('child_id', sessIds);
            for (const r of (gm2 ?? []) as { child_id: string; group_id: string }[]) {
                if (boundGroupIds && !boundGroupIds.includes(r.group_id)) continue;
                (teamsBySession[r.child_id] ??= []).push(r.group_id);
            }
            // Per-child perfilamiento history (resolved assessments, newest first) for
            // the dashboard timeline. The current one is the first entry per child.
            const { data: hist } = await sb
                .from('perfilamientos')
                .select('id, child_id, eje, motor, archetype_label, created_at, email_sent_at, share_token, answers')
                .in('child_id', sessIds)
                .eq('status', 'resolved')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            for (const h of (hist ?? []) as { child_id: string }[]) {
                (historyByChild[h.child_id] ??= []).push(h);
            }
        }
        const withTeams = (sessions ?? []).map((s: Record<string, unknown>) => ({
            ...s,
            // Preserve the prior response shape: the view exposes the current
            // profile date as current_profile_date; expose it as created_at too.
            created_at: s.current_profile_date,
            team_ids: teamsBySession[s.id as string] ?? [],
            history: historyByChild[s.id as string] ?? [],
        }));

        return res.status(200).json({ sessions: withTeams, total: withTeams.length });
    } catch (err) {
        console.error('[tenant-sessions] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
