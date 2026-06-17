import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Phase 2: resolve which tenant the caller acts on (explicit tenant_id requires
// active membership; absent keeps single-membership back-compat).
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
 * Change a member's level: 'member' (Administración) ↔ 'coach' (Entrenador).
 * Owner-only. The institution owner can never be demoted here (guarantees the
 * institution always keeps an owner); ownership transfer is a separate action.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        // Only the institution owner can change levels.
        if (ctx.role !== 'owner') return res.status(403).json({ error: 'forbidden' });

        const { member_id, role } = req.body ?? {};
        if (!member_id || typeof member_id !== 'string') return res.status(400).json({ error: 'member_id required' });
        if (role !== 'member' && role !== 'coach') return res.status(400).json({ error: 'Invalid role' });

        // Target must belong to this tenant and must NOT be the owner.
        const { data: target } = await sb
            .from('tenant_members')
            .select('id, role')
            .eq('id', member_id)
            .eq('tenant_id', ctx.tenantId)
            .maybeSingle();
        if (!target) return res.status(404).json({ error: 'Member not found' });
        if ((target as { role: string }).role === 'owner') return res.status(403).json({ error: 'cannot_change_owner' });

        const { error: updErr } = await sb
            .from('tenant_members')
            .update({ role })
            .eq('id', member_id)
            .eq('tenant_id', ctx.tenantId);
        if (updErr) {
            console.error('[update-member-role] update error:', updErr.message);
            return res.status(500).json({ error: 'Failed to update member' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[update-member-role] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
