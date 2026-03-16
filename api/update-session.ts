import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Updates an existing session by ID.
 * Used to progressively fill in profile data and AI usage
 * after the initial "started" record was created.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[update-session] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { id, ...fields } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing required field: id' });
        }

        // Only allow updating known safe fields
        const allowed: Record<string, unknown> = {};
        const safeKeys = [
            'eje', 'motor', 'archetype_label', 'eje_secundario',
            'answers', 'ai_tokens_input', 'ai_tokens_output', 'ai_cost_usd',
        ];
        for (const key of safeKeys) {
            if (fields[key] !== undefined) allowed[key] = fields[key];
        }

        if (Object.keys(allowed).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { error } = await sb.from('sessions').update(allowed).eq('id', id);

        if (error) {
            console.error('[update-session] Update error:', error.message, error.details);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[update-session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
