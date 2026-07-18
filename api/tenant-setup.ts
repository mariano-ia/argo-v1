import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Same slug format as create-tenant: slugified name + random suffix. Inlined
// because Vercel serverless functions can't import between api/ files.
function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
    return `${base || 'institucion'}-${randomBytes(4).toString('hex')}`;
}

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

interface SetupBody {
    // Institution (step 1)
    display_name?: string;
    institution_type?: string;
    // Sport left the institution on 2026-07-14: it is now set per plantel
    // (groups.sport). tenants.sport is no longer written from here.
    country?: string;
    city?: string;
    // Owner profile (step 2)
    full_name?: string;
    role_in_institution?: string;
    // Mark onboarding complete
    onboarding_completed?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Resolve caller's tenant + role. Institution fields are owner-only; any
        // active member (incl. coaches) may still update their OWN profile below.
        const requestedTenantId = typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null;

        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });

        const tenantId: string = ctx.tenantId;
        const memberRowId: string | null = ctx.memberId;
        const isOwner = ctx.role === 'owner';

        const body = req.body as SetupBody;

        // Update tenant institution fields — OWNER ONLY (coaches can't touch the
        // institution; their institution-field changes are silently ignored).
        if (isOwner) {
            const tenantUpdate: Record<string, unknown> = {};
            if (body.display_name !== undefined) {
                const newName = body.display_name.trim();
                tenantUpdate.display_name = newName;
                // Renaming regenerates the slug so the play link reflects the new
                // name. Only when the name actually changes (don't churn the slug
                // — and break links — on every Save).
                const { data: current } = await sb.from('tenants').select('display_name').eq('id', tenantId).maybeSingle();
                if (current && (current as { display_name: string | null }).display_name !== newName) {
                    tenantUpdate.slug = generateSlug(newName);
                }
            }
            if (body.institution_type    !== undefined) tenantUpdate.institution_type    = body.institution_type;
            if (body.country             !== undefined) tenantUpdate.country             = body.country;
            if (body.city                !== undefined) tenantUpdate.city                = body.city?.trim() ?? null;
            if (body.onboarding_completed !== undefined) tenantUpdate.onboarding_completed = body.onboarding_completed;

            if (Object.keys(tenantUpdate).length > 0) {
                const { error } = await sb.from('tenants').update(tenantUpdate).eq('id', tenantId);
                if (error) {
                    console.error('[tenant-setup] Tenant update error:', error.message);
                    return res.status(500).json({ error: error.message });
                }
            }
        }

        // Update owner profile on tenant_members
        if (body.full_name !== undefined || body.role_in_institution !== undefined) {
            const memberUpdate: Record<string, unknown> = {};
            if (body.full_name           !== undefined) memberUpdate.full_name           = body.full_name ? (body.full_name as string).trim() : null;
            if (body.role_in_institution !== undefined) memberUpdate.role_in_institution = body.role_in_institution;

            if (memberRowId) {
                const { error: updateErr } = await sb.from('tenant_members').update(memberUpdate).eq('id', memberRowId);
                if (updateErr) {
                    console.error('[tenant-setup] Member update error:', updateErr.message);
                    return res.status(500).json({ error: updateErr.message });
                }
            } else {
                // Owner predates tenant_members — create their row now
                const { error: upsertErr } = await sb.from('tenant_members').upsert(
                    { tenant_id: tenantId, auth_user_id: user.id, email: user.email, role: 'owner', status: 'active', ...memberUpdate },
                    { onConflict: 'tenant_id,auth_user_id' },
                );
                if (upsertErr) {
                    console.error('[tenant-setup] Member upsert error:', upsertErr.message);
                    return res.status(500).json({ error: upsertErr.message });
                }
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[tenant-setup] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
