import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { id, type, email } = req.body;

        if (type === 'session' && id) {
            // Soft-delete session
            const { error } = await sb.from('sessions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) return res.status(500).json({ error: error.message });
        } else if (type === 'lead' && email) {
            // Hard-delete lead
            const { error } = await sb.from('leads')
                .delete()
                .eq('email', email);
            if (error) return res.status(500).json({ error: error.message });
        } else {
            return res.status(400).json({ error: 'Missing id/type or email' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[delete-session] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
