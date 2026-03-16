import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[save-session] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const {
            adult_name, adult_email, child_name, child_age, sport,
            eje, motor, archetype_label, eje_secundario,
            answers, tenant_id, lang,
            ai_tokens_input, ai_tokens_output, ai_cost_usd,
        } = req.body;

        if (!adult_email || !eje || !motor) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error } = await sb.from('sessions').insert({
            adult_name,
            adult_email,
            child_name,
            child_age,
            sport:            sport || null,
            eje,
            motor,
            archetype_label,
            eje_secundario:   eje_secundario ?? null,
            tenant_id:        tenant_id ?? null,
            lang:             lang ?? 'es',
            answers:          answers ?? [],
            ai_tokens_input:  ai_tokens_input ?? 0,
            ai_tokens_output: ai_tokens_output ?? 0,
            ai_cost_usd:      ai_cost_usd ?? 0,
        });

        if (error) {
            console.error('[save-session] Insert error:', error.message, error.details);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[save-session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
