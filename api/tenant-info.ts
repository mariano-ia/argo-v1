import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

        // Try tenant_members first (works for both owners and invited members)
        let tenantId: string | null = null;
        let memberProfile: { full_name: string | null; role_in_institution: string | null } | null = null;
        const { data: memberRow } = await sb
            .from('tenant_members')
            .select('tenant_id, full_name, role_in_institution')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        if (memberRow) {
            tenantId = (memberRow as { tenant_id: string }).tenant_id;
            memberProfile = {
                full_name: (memberRow as { full_name: string | null }).full_name ?? null,
                role_in_institution: (memberRow as { role_in_institution: string | null }).role_in_institution ?? null,
            };
        } else {
            // Fallback: owner who predates the tenant_members migration
            const { data: tenantRow } = await sb
                .from('tenants')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            if (tenantRow) {
                tenantId = (tenantRow as { id: string }).id;
                // Also try to load owner profile (may exist even if auth_user_id wasn't indexed)
                const { data: ownerMember } = await sb
                    .from('tenant_members')
                    .select('full_name, role_in_institution')
                    .eq('tenant_id', tenantId)
                    .eq('role', 'owner')
                    .maybeSingle();
                if (ownerMember) {
                    memberProfile = {
                        full_name: (ownerMember as { full_name: string | null }).full_name ?? null,
                        role_in_institution: (ownerMember as { role_in_institution: string | null }).role_in_institution ?? null,
                    };
                }
            }
        }

        if (!tenantId) return res.status(200).json({ tenant: null });

        const { data: tenant } = await sb
            .from('tenants')
            .select('id, slug, display_name, plan, roster_limit, institution_type, sport, country, city, logo_url, onboarding_completed, trial_expires_at, ai_queries_count, ai_queries_reset_at')
            .eq('id', tenantId)
            .single();

        // Count active players for this tenant
        let activePlayersCount = 0;
        if (tenant) {
            const { count } = await sb
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .is('archived_at', null)
                .is('deleted_at', null);
            activePlayersCount = count ?? 0;
        }

        return res.status(200).json({
            tenant: tenant ? { ...tenant, active_players_count: activePlayersCount } : null,
            memberProfile,
        });
    } catch (err) {
        console.error('[tenant-info] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
