import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-complete
 * Body: { link_id, session_data }
 *
 * Called when an Argo One odyssey is completed.
 * Saves session to sessions table (no tenant_id), marks link as completed,
 * and triggers the report email to the recipient.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { link_id, session_data } = req.body as {
            link_id?: string;
            session_data?: {
                adult_name: string;
                adult_email: string;
                child_name: string;
                child_age: number;
                sport: string;
                eje: string;
                motor: string;
                eje_secundario?: string;
                archetype_label: string;
                answers: unknown[];
                ai_sections?: unknown;
                ai_tokens_input?: number;
                ai_tokens_output?: number;
                ai_cost_usd?: number;
                lang?: string;
            };
        };

        if (!link_id || !session_data) {
            return res.status(400).json({ error: 'Missing link_id or session_data' });
        }

        // Verify link exists and is not already completed
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, purchase_id')
            .eq('id', link_id)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status === 'completed') return res.status(400).json({ error: 'Already completed' });

        // Save session (no tenant_id — this is Argo One)
        const { data: session, error: sessErr } = await sb
            .from('sessions')
            .insert({
                adult_name: session_data.adult_name,
                adult_email: session_data.adult_email,
                child_name: session_data.child_name,
                child_age: session_data.child_age,
                sport: session_data.sport,
                eje: session_data.eje,
                motor: session_data.motor,
                eje_secundario: session_data.eje_secundario || null,
                archetype_label: session_data.archetype_label,
                answers: session_data.answers,
                ai_sections: session_data.ai_sections || null,
                ai_tokens_input: session_data.ai_tokens_input || 0,
                ai_tokens_output: session_data.ai_tokens_output || 0,
                ai_cost_usd: session_data.ai_cost_usd || 0,
                lang: session_data.lang || 'es',
                tenant_id: null,  // Argo One: no tenant
                last_profiled_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (sessErr) {
            console.error('[one-complete] Session insert error:', sessErr.message);
            return res.status(500).json({ error: 'Failed to save session' });
        }

        // Mark link as completed
        await sb.from('one_links').update({
            status: 'completed',
            session_id: session!.id,
            completed_at: new Date().toISOString(),
        }).eq('id', link_id);

        return res.status(200).json({
            ok: true,
            session_id: session!.id,
        });
    } catch (err) {
        console.error('[one-complete] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
