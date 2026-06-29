import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/puentes-start
 * Body: { magic_token }
 *
 * Validates the magic link token and returns the full purchase state with
 * all children's puentes_sessions. One Argo Puentes purchase covers every
 * child of the same adult (multi-child support).
 *
 * Response shape:
 *   {
 *     purchase_id, lang, recipient_email, recipient_name,
 *     adult_profile: AdultProfile | null,  // shared across all children
 *     overall_status: 'created' | 'answered' | 'generating' | 'generated' | 'sent',
 *     children: [
 *       { puentes_session_id, child_name, child_profile, status, ai_sections }
 *     ]
 *   }
 *
 * overall_status reflects the most advanced status across all children
 * (e.g. if any child has ai_sections we consider it "generated").
 */

type SessionStatus = 'created' | 'answered' | 'generating' | 'generated' | 'sent' | 'failed';

const STATUS_RANK: Record<SessionStatus, number> = {
    created: 0,
    answered: 1,
    generating: 2,
    failed: 2,
    generated: 3,
    sent: 4,
};

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

        // All puentes_sessions for this purchase (one per child)
        const { data: pSessions } = await sb
            .from('puentes_sessions')
            .select('id, status, ai_sections, adult_profile, source_session_id, created_at')
            .eq('purchase_id', purchase.id)
            .order('created_at', { ascending: true });

        const sessions = pSessions ?? [];

        // Fetch all referenced source sessions in one query
        const sourceIds = sessions.map(s => s.source_session_id).filter(Boolean) as string[];
        const childMap: Record<string, any> = {};
        if (sourceIds.length > 0) {
            const { data: childRows } = await sb
                .from('perfilamientos')
                .select('id, child_name, eje, motor, archetype_label, sport, lang')
                .in('id', sourceIds);
            for (const c of childRows ?? []) {
                childMap[c.id] = c;
            }
        }

        const children = sessions.map(s => {
            const child = s.source_session_id ? childMap[s.source_session_id] : null;
            return {
                puentes_session_id: s.id,
                source_session_id: s.source_session_id,
                child_name: child?.child_name ?? null,
                child_profile: child ? {
                    eje: child.eje,
                    motor: child.motor,
                    archetype_label: child.archetype_label,
                    sport: child.sport,
                } : null,
                status: s.status,
                ai_sections: s.ai_sections ?? null,
            };
        });

        // The adult_profile is the same for all children of a purchase. Use
        // whichever has it (the questionnaire writes it to all sessions).
        const adultProfile = sessions.find(s => !!s.adult_profile)?.adult_profile ?? null;

        // Overall status: the lowest rank wins (we need ALL children
        // generated before we declare 'generated'), but if at least one
        // child has 'sent' that beats nothing.
        let overall: SessionStatus = 'created';
        if (sessions.length > 0) {
            const ranks = sessions.map(s => STATUS_RANK[s.status as SessionStatus] ?? 0);
            const minRank = Math.min(...ranks);
            const rankToStatus: Record<number, SessionStatus> = {
                0: 'created',
                1: 'answered',
                2: 'generating',
                3: 'generated',
                4: 'sent',
            };
            overall = rankToStatus[minRank] ?? 'created';
        }

        const alreadyAnswered = overall !== 'created';
        const allGenerated = sessions.length > 0 && sessions.every(s => !!s.ai_sections);

        return res.status(200).json({
            purchase_id: purchase.id,
            recipient_email: purchase.recipient_email,
            recipient_name: purchase.recipient_name,
            lang: purchase.lang,
            adult_profile: adultProfile,
            overall_status: overall,
            already_answered: alreadyAnswered,
            all_generated: allGenerated,
            children,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-start] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
