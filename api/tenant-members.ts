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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const requestedTenantId = typeof req.query.tenant_id === 'string' && req.query.tenant_id ? req.query.tenant_id : null;

        // Get caller's tenant (Phase 2: explicit tenant_id requires active membership)
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const tenantId = ctx.tenantId;
        const role = ctx.role;
        const memberId = ctx.memberId;
        void memberId;
        // The staff roster is an admin view (Usuarios / Planteles are admin-only).
        if (role === 'coach') return res.status(403).json({ error: 'forbidden' });

        const { data: members, error } = await sb
            .from('tenant_members')
            .select('id, email, role, status, invited_at, auth_user_id')
            .eq('tenant_id', tenantId)
            .order('invited_at', { ascending: true });

        if (error) {
            console.error('[tenant-members] Query error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        // Attach assigned teams per member (coach -> team M:N via group_coaches)
        const memberIds = (members ?? []).map(m => m.id);
        const teamsByMember: Record<string, { id: string; name: string }[]> = {};
        if (memberIds.length > 0) {
            const { data: assignments } = await sb
                .from('group_coaches')
                .select('member_id, groups!inner ( id, name, deleted_at )')
                .in('member_id', memberIds);
            for (const a of (assignments ?? []) as Record<string, unknown>[]) {
                const g = a.groups as { id: string; name: string; deleted_at: string | null } | null;
                if (!g || g.deleted_at) continue;
                (teamsByMember[a.member_id as string] ??= []).push({ id: g.id, name: g.name });
            }
        }

        const mapped = (members ?? []).map(m => ({
            ...m,
            isCurrentUser: m.auth_user_id === user.id,
            auth_user_id: undefined, // don't expose auth IDs to client
            teams: teamsByMember[m.id] ?? [],
        }));

        return res.status(200).json({ members: mapped });
    } catch (err) {
        console.error('[tenant-members] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
