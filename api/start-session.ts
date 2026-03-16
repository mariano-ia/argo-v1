import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a "started" session when the child begins the odyssey.
 * Returns the session ID so the client can update it on completion.
 * This ensures we always have a DB record, even if the user abandons.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[start-session] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { adult_name, adult_email, child_name, child_age, sport, tenant_id, lang } = req.body;

        if (!adult_email || !child_name) {
            return res.status(400).json({ error: 'Missing required fields: adult_email, child_name' });
        }

        const { data, error } = await sb.from('sessions').insert({
            adult_name,
            adult_email,
            child_name,
            child_age,
            sport:           sport || null,
            tenant_id:       tenant_id ?? null,
            lang:            lang ?? 'es',
            eje:             '_pending',
            motor:           '_pending',
            archetype_label: '_pending',
            answers:         [],
        }).select('id').single();

        if (error) {
            console.error('[start-session] Insert error:', error.message, error.details);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ ok: true, id: data.id });
    } catch (err) {
        console.error('[start-session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
