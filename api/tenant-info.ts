import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const TENANT_COLS = 'id, slug, display_name, plan, roster_limit, institution_type, sport, country, city, logo_url, onboarding_completed, trial_expires_at, ai_queries_count, ai_queries_reset_at';

type MemberDescriptor = {
    member_id: string | null;
    tenant_id: string;
    role: string;
    full_name: string | null;
    role_in_institution: string | null;
};

/**
 * Derive a per-institution plan/block status from the tenant. Blocking is
 * per-tenant by design (see docs/CONTEXT-SWITCHER.md): a person can have one
 * membership live and another blocked. Phase 1 only RETURNS this; gating is
 * applied later (Phase 4). Mirrors the trialExpired logic in TenantDashboard.
 */
function planStatus(plan: string | null, trialExpiresAt: string | null): { status: string; blocked: boolean } {
    const isTrial = plan === 'trial';
    const expired = isTrial && !!trialExpiresAt && new Date(trialExpiresAt) < new Date();
    if (expired) return { status: 'trial_expired', blocked: true };
    if (isTrial) return { status: 'trial', blocked: false };
    return { status: 'active', blocked: false };
}

// Stable default ordering: owner first, then member/admin, then coach; ties by name.
const ROLE_RANK: Record<string, number> = { owner: 0, member: 1, admin: 1, coach: 2 };

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

        // 1. ALL active memberships for this identity (one per institution).
        const { data: memberRows } = await sb
            .from('tenant_members')
            .select('id, tenant_id, role, full_name, role_in_institution')
            .eq('auth_user_id', user.id)
            .eq('status', 'active');

        let descriptors: MemberDescriptor[] = (memberRows ?? []).map((r) => ({
            member_id: (r as { id: string }).id,
            tenant_id: (r as { tenant_id: string }).tenant_id,
            role: (r as { role: string }).role ?? 'owner',
            full_name: (r as { full_name: string | null }).full_name ?? null,
            role_in_institution: (r as { role_in_institution: string | null }).role_in_institution ?? null,
        }));

        // 2. Legacy fallback: owner predating the tenant_members migration.
        //    Only when there are no member rows (preserves current behavior).
        if (descriptors.length === 0) {
            const { data: tenantRow } = await sb
                .from('tenants')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            if (tenantRow) {
                const tId = (tenantRow as { id: string }).id;
                const { data: ownerMember } = await sb
                    .from('tenant_members')
                    .select('id, full_name, role_in_institution')
                    .eq('tenant_id', tId)
                    .eq('role', 'owner')
                    .maybeSingle();
                descriptors = [{
                    member_id: (ownerMember as { id: string } | null)?.id ?? null,
                    tenant_id: tId,
                    role: 'owner',
                    full_name: (ownerMember as { full_name: string | null } | null)?.full_name ?? null,
                    role_in_institution: (ownerMember as { role_in_institution: string | null } | null)?.role_in_institution ?? null,
                }];
            }
        }

        if (descriptors.length === 0) return res.status(200).json({ tenant: null, memberships: [] });

        // 3. Batch-fetch the tenants.
        const tenantIds = [...new Set(descriptors.map((d) => d.tenant_id))];
        const { data: tenantsData } = await sb.from('tenants').select(TENANT_COLS).in('id', tenantIds);
        const tenantMap = new Map((tenantsData ?? []).map((t) => [(t as { id: string }).id, t]));

        // 4. Build one membership object per descriptor.
        const memberships = await Promise.all(descriptors.map(async (d) => {
            const t = tenantMap.get(d.tenant_id) as Record<string, unknown> | undefined;
            if (!t) return null; // tenant deleted/missing

            // Active players in this tenant. A roster slot = a CHILD, so count
            // active children (not perfilamientos): not archived, not deleted,
            // and not merged into another child.
            const { count } = await sb
                .from('children')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', d.tenant_id)
                .is('archived_at', null)
                .is('deleted_at', null)
                .is('merged_into', null);

            // Planteles this member is assigned to (coach scope; owners manage all).
            let teams: { id: string; name: string; slug: string }[] = [];
            if (d.member_id) {
                const { data: gc } = await sb.from('group_coaches').select('group_id').eq('member_id', d.member_id);
                const gids = (gc ?? []).map((r: { group_id: string }) => r.group_id);
                if (gids.length > 0) {
                    const { data: teamRows } = await sb
                        .from('groups')
                        .select('id, name, slug')
                        .in('id', gids)
                        .is('deleted_at', null);
                    teams = (teamRows ?? []) as { id: string; name: string; slug: string }[];
                }
            }

            const { status, blocked } = planStatus(t.plan as string | null, t.trial_expires_at as string | null);

            return {
                tenant: { ...t, active_players_count: count ?? 0 },
                role: d.role,
                member_id: d.member_id,
                memberProfile: { full_name: d.full_name, role_in_institution: d.role_in_institution },
                teams,
                status,
                blocked,
            };
        }));

        const valid = memberships.filter((m): m is NonNullable<typeof m> => m !== null);
        if (valid.length === 0) return res.status(200).json({ tenant: null, memberships: [] });

        valid.sort((a, b) => {
            const ra = ROLE_RANK[a.role] ?? 9;
            const rb = ROLE_RANK[b.role] ?? 9;
            if (ra !== rb) return ra - rb;
            return String((a.tenant as { display_name?: string }).display_name ?? '').localeCompare(String((b.tenant as { display_name?: string }).display_name ?? ''));
        });

        // Back-compat: top-level fields mirror the primary (first) membership so
        // single-membership clients behave exactly as before.
        const primary = valid[0];
        return res.status(200).json({
            tenant: primary.tenant,
            memberProfile: primary.memberProfile,
            role: primary.role,
            member_id: primary.member_id,
            teams: primary.teams,
            memberships: valid,
        });
    } catch (err) {
        console.error('[tenant-info] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
