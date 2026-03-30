import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface SetupBody {
    // Institution (step 1)
    display_name?: string;
    institution_type?: string;
    sport?: string;
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

        // Get caller's tenant + verify they are the owner
        let tenantId: string | null = null;
        let memberRowId: string | null = null;

        const { data: memberRow } = await sb
            .from('tenant_members')
            .select('id, tenant_id, role')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        if (memberRow) {
            tenantId = (memberRow as { tenant_id: string }).tenant_id;
            memberRowId = (memberRow as { id: string }).id;
            if ((memberRow as { role: string }).role !== 'owner') {
                return res.status(403).json({ error: 'Only the owner can update institution settings' });
            }
        } else {
            const { data: tenantRow } = await sb
                .from('tenants').select('id').eq('auth_user_id', user.id).maybeSingle();
            if (tenantRow) tenantId = (tenantRow as { id: string }).id;
        }
        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        const body = req.body as SetupBody;

        // Update tenant institution fields
        const tenantUpdate: Record<string, unknown> = {};
        if (body.display_name        !== undefined) tenantUpdate.display_name        = body.display_name.trim();
        if (body.institution_type    !== undefined) tenantUpdate.institution_type    = body.institution_type;
        if (body.sport               !== undefined) tenantUpdate.sport               = body.sport;
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
