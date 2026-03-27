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
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const normalizedEmail = (user.email ?? '').toLowerCase();

        // Build query — filter by email + pending status. Optionally narrow by tenant_id
        // from user metadata (set at invite time), but don't require it — metadata can be
        // unreliable after password update.
        const tenantId = user.user_metadata?.tenant_id as string | undefined;

        let query = sb
            .from('tenant_members')
            .select('id')
            .eq('email', normalizedEmail)
            .eq('status', 'pending');

        if (tenantId) query = (query as typeof query).eq('tenant_id', tenantId);

        const { data: pendingRow, error: lookupError } = await (query as ReturnType<typeof sb.from>).maybeSingle();

        if (lookupError) {
            console.error('[accept-invite] Lookup error:', lookupError.message);
            return res.status(500).json({ error: lookupError.message });
        }
        if (!pendingRow) {
            console.warn('[accept-invite] No pending invite found for', normalizedEmail);
            // Nothing to do — user might have already been activated (e.g. page refresh)
            return res.status(200).json({ ok: true, note: 'no_pending_record' });
        }

        const { error: updateError } = await sb
            .from('tenant_members')
            .update({ auth_user_id: user.id, status: 'active' })
            .eq('id', (pendingRow as { id: string }).id);

        if (updateError) {
            console.error('[accept-invite] Update error:', updateError.message);
            return res.status(500).json({ error: updateError.message });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[accept-invite] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
