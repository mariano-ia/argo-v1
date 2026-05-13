import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/puentes-start
 * Body: { magic_token }
 *
 * Validates the magic link token, returns the puentes_session shell for the
 * adult to begin the questionnaire. If the report is already generated,
 * returns the ai_sections so the page can render the report directly.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { magic_token } = req.body as { magic_token?: string };
        if (!magic_token) return res.status(400).json({ error: 'Missing magic_token' });

        const { data: purchase, error } = await sb
            .from('puentes_purchases')
            .select('id, status, source_session_id, recipient_email, recipient_name, child_name, lang')
            .eq('magic_token', magic_token)
            .maybeSingle();
        if (error || !purchase) return res.status(404).json({ error: 'Invalid token' });
        if (purchase.status !== 'paid') return res.status(402).json({ error: 'Purchase not paid yet' });

        // Find the matching puentes_session (created on webhook confirm)
        const { data: pSession } = await sb
            .from('puentes_sessions')
            .select('id, status, ai_sections, adult_profile')
            .eq('purchase_id', purchase.id)
            .maybeSingle();

        // Fetch the source child session for cross-profile context in the report
        // (axis colors of the child, sport, archetype label).
        const { data: childSession } = await sb
            .from('sessions')
            .select('eje, motor, archetype_label, sport, child_name')
            .eq('id', purchase.source_session_id)
            .maybeSingle();

        return res.status(200).json({
            purchase_id: purchase.id,
            puentes_session_id: pSession?.id ?? null,
            status: pSession?.status || 'created',
            recipient_email: purchase.recipient_email,
            recipient_name: purchase.recipient_name,
            child_name: purchase.child_name,
            lang: purchase.lang,
            already_generated: pSession?.status === 'generated' || pSession?.status === 'sent',
            ai_sections: pSession?.ai_sections ?? null,
            adult_profile: pSession?.adult_profile ?? null,
            child_profile: childSession ? {
                eje: childSession.eje,
                motor: childSession.motor,
                archetype_label: childSession.archetype_label,
                sport: childSession.sport,
            } : null,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-start] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
