import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Resolve which tenant the caller acts on (inlined — api/ functions can't import
// across files). An explicit tenant_id requires ACTIVE membership of THAT tenant;
// absent tenant_id keeps the single-membership back-compat path. Any active member
// may merge (owner decision 2026-06-29).
async function resolveTenantContext(
    sb: any,
    userId: string,
    requestedTenantId: string | null,
): Promise<{ tenantId: string } | null> {
    if (requestedTenantId) {
        const { data: m } = await sb.from('tenant_members')
            .select('tenant_id').eq('auth_user_id', userId).eq('tenant_id', requestedTenantId).eq('status', 'active').maybeSingle();
        if (m) return { tenantId: (m as { tenant_id: string }).tenant_id };
        const { data: t } = await sb.from('tenants').select('id').eq('id', requestedTenantId).eq('auth_user_id', userId).maybeSingle();
        if (t) return { tenantId: (t as { id: string }).id };
        return null;
    }
    const { data: m } = await sb.from('tenant_members')
        .select('tenant_id').eq('auth_user_id', userId).eq('status', 'active').maybeSingle();
    if (m) return { tenantId: (m as { tenant_id: string }).tenant_id };
    const { data: t } = await sb.from('tenants').select('id').eq('auth_user_id', userId).maybeSingle();
    if (t) return { tenantId: (t as { id: string }).id };
    return null;
}

// Map a merge_children() RAISE message to an HTTP status + stable error code.
function mergeErrorStatus(msg: string): { status: number; error: string } {
    const known = ['merge_same_child', 'child_not_found', 'already_merged', 'survivor_already_merged',
        'not_mergeable', 'cross_tenant', 'is_demo_mismatch', 'reprofile_in_progress', 'dangling_puentes'];
    const hit = known.find(k => msg.includes(k));
    if (hit === 'reprofile_in_progress') return { status: 409, error: hit };
    if (hit === 'child_not_found' || hit === 'already_merged') return { status: 404, error: hit };
    if (hit) return { status: 400, error: hit };
    return { status: 500, error: 'merge_failed' };
}

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

        const { survivor_id, absorbed_id } = req.body as { survivor_id?: string; absorbed_id?: string };
        if (!survivor_id || !absorbed_id) return res.status(400).json({ error: 'Missing survivor_id or absorbed_id' });
        if (survivor_id === absorbed_id) return res.status(400).json({ error: 'merge_same_child' });

        // Both children must belong to the caller's tenant (defense-in-depth; the
        // RPC re-checks tenant equality inside the lock too).
        const { data: kids } = await sb.from('children')
            .select('id, tenant_id').in('id', [survivor_id, absorbed_id]);
        const owned = (kids ?? []).filter((c: { tenant_id: string | null }) => c.tenant_id === ctx.tenantId);
        if (owned.length !== 2) return res.status(404).json({ error: 'child_not_found' });

        const { data, error } = await sb.rpc('merge_children', {
            p_survivor: survivor_id,
            p_absorbed: absorbed_id,
            p_actor: user.email ?? user.id,
        });

        if (error) {
            console.error('[merge-players] RPC error:', error.message);
            const { status, error: code } = mergeErrorStatus(error.message);
            return res.status(status).json({ error: code });
        }

        return res.status(200).json({ ok: true, ...data });
    } catch (err) {
        console.error('[merge-players] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
