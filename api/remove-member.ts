import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

        // Verify caller is an owner
        const { data: callerRow } = await sb
            .from('tenant_members')
            .select('tenant_id, role')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        if (!callerRow) return res.status(404).json({ error: 'Tenant not found' });
        if ((callerRow as { role: string }).role !== 'owner') return res.status(403).json({ error: 'Only owners can remove members' });

        const tenantId = (callerRow as { tenant_id: string }).tenant_id;

        const { memberId } = req.body ?? {};
        if (!memberId || typeof memberId !== 'string') return res.status(400).json({ error: 'Missing memberId' });

        // Make sure the target belongs to this tenant and is not an owner
        const { data: target } = await sb
            .from('tenant_members')
            .select('id, role')
            .eq('id', memberId)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (!target) return res.status(404).json({ error: 'Member not found' });
        if ((target as { role: string }).role === 'owner') return res.status(403).json({ error: 'Cannot remove an owner' });

        const { error: deleteError } = await sb
            .from('tenant_members')
            .delete()
            .eq('id', memberId);

        if (deleteError) {
            console.error('[remove-member] Delete error:', deleteError.message);
            return res.status(500).json({ error: deleteError.message });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[remove-member] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
