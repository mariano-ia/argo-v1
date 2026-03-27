import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // Validate caller
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Get caller's tenant — try tenant_members first, fall back to tenants.auth_user_id
        let tenantId: string | null = null;
        const { data: callerRow } = await sb
            .from('tenant_members')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
        if (callerRow) {
            tenantId = callerRow.tenant_id;
        } else {
            const { data: tenantRow } = await sb
                .from('tenants')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            if (tenantRow) tenantId = tenantRow.id;
        }
        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        // Validate email
        const { email } = req.body ?? {};
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        const normalizedEmail = email.toLowerCase().trim();

        // Check not already a member
        const { data: existing } = await sb
            .from('tenant_members')
            .select('id, status')
            .eq('tenant_id', tenantId)
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existing) {
            if (existing.status === 'active') return res.status(409).json({ error: 'already_member' });
            if (existing.status === 'pending') return res.status(409).json({ error: 'already_invited' });
        }

        // Insert pending record
        const { error: insertError } = await sb
            .from('tenant_members')
            .insert({ tenant_id: tenantId, email: normalizedEmail, role: 'member', status: 'pending' });
        if (insertError) {
            console.error('[invite-user] Insert error:', insertError.message);
            return res.status(500).json({ error: 'Failed to create invite record' });
        }

        // Build redirect URL dynamically from request host
        const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
        const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'argomethod.com';
        const redirectTo = `${proto}://${host}/set-password`;

        // Send Supabase invite email
        const { error: inviteError } = await sb.auth.admin.inviteUserByEmail(normalizedEmail, {
            redirectTo,
            data: { tenant_id: tenantId },
        });

        if (inviteError) {
            // Roll back pending record
            await sb.from('tenant_members').delete()
                .eq('tenant_id', tenantId).eq('email', normalizedEmail).eq('status', 'pending');
            console.error('[invite-user] Supabase invite error:', inviteError.message);
            return res.status(500).json({ error: inviteError.message });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[invite-user] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
