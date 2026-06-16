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
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const requestedTenantId = typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null;

        // Phase 2: resolve the tenant the caller acts on (explicit requires active membership).
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });

        const tenantId = ctx.tenantId;
        const role = ctx.role;
        const callerMemberId = ctx.memberId;
        void callerMemberId; // resolved caller member id for coach scoping (unused by owner-only flow)

        // Verify caller is an owner
        if (role !== 'owner') return res.status(403).json({ error: 'Only owners can remove members' });

        const { memberId } = req.body ?? {};
        if (!memberId || typeof memberId !== 'string') return res.status(400).json({ error: 'Missing memberId' });

        // Make sure the target belongs to this tenant and is not an owner
        const { data: target } = await sb
            .from('tenant_members')
            .select('id, role, auth_user_id, email')
            .eq('id', memberId)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (!target) return res.status(404).json({ error: 'Member not found' });
        const tgt = target as { id: string; role: string; auth_user_id: string | null; email: string };
        if (tgt.role === 'owner') return res.status(403).json({ error: 'Cannot remove an owner' });

        // Delete the tenant_members record first
        const { error: deleteError } = await sb
            .from('tenant_members')
            .delete()
            .eq('id', memberId);

        if (deleteError) {
            console.error('[remove-member] Delete error:', deleteError.message);
            return res.status(500).json({ error: deleteError.message });
        }

        // Also delete the Supabase Auth user so the email can be re-invited later
        try {
            let authUserId = tgt.auth_user_id;
            if (!authUserId) {
                // Pending invite: user was created by generateLink but auth_user_id wasn't stored yet
                const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
                const found = users.find(u => u.email === tgt.email);
                if (found) authUserId = found.id;
            }
            if (authUserId) {
                await sb.auth.admin.deleteUser(authUserId);
            }
        } catch (err) {
            // Non-fatal: member record is already deleted, log and continue
            console.warn('[remove-member] Could not delete auth user:', err);
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[remove-member] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
