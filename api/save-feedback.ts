import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const VALID_CLARITY = ['muy_claro', 'algo_claro', 'confuso'];
const VALID_HELPFULNESS = ['mucho', 'algo', 'poco'];
const VALID_IDENTIFICATION = ['identificado', 'mas_o_menos', 'nada'];

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
        const { sessionId, clarity, helpfulness, identification, openComment } = req.body;

        if (!sessionId || !clarity || !helpfulness || !identification) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!VALID_CLARITY.includes(clarity)) {
            return res.status(400).json({ error: `Invalid clarity value: ${clarity}` });
        }
        if (!VALID_HELPFULNESS.includes(helpfulness)) {
            return res.status(400).json({ error: `Invalid helpfulness value: ${helpfulness}` });
        }
        if (!VALID_IDENTIFICATION.includes(identification)) {
            return res.status(400).json({ error: `Invalid identification value: ${identification}` });
        }

        // Verify session exists
        const { data: session, error: sessionErr } = await sb
            .from('sessions')
            .select('id')
            .eq('id', sessionId)
            .single();

        if (sessionErr || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Insert feedback (unique constraint on session_id prevents duplicates)
        const { error: insertErr } = await sb.from('feedback').insert({
            session_id: sessionId,
            clarity,
            helpfulness,
            identification,
            open_comment: openComment?.trim() || null,
        });

        if (insertErr) {
            if (insertErr.code === '23505') {
                return res.status(409).json({ error: 'Feedback already submitted for this session' });
            }
            console.error('[save-feedback] Insert error:', insertErr.message);
            return res.status(500).json({ error: 'Failed to save feedback' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[save-feedback] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
