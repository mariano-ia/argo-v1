import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const VALID_CLARITY = ['muy_claro', 'algo_claro', 'confuso'];
const VALID_HELPFULNESS = ['mucho', 'algo', 'poco'];
const VALID_IDENTIFICATION = ['identificado', 'mas_o_menos', 'nada'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // ── POST: save feedback (public) ─────────────────────────────────────────
    if (req.method === 'POST') {
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

            const { data: session, error: sessionErr } = await sb
                .from('sessions')
                .select('id')
                .eq('id', sessionId)
                .single();

            if (sessionErr || !session) {
                return res.status(404).json({ error: 'Session not found' });
            }

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
                console.error('[feedback] Insert error:', insertErr.message);
                return res.status(500).json({ error: 'Failed to save feedback' });
            }

            return res.status(200).json({ ok: true });
        } catch (err) {
            console.error('[feedback] POST error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ── GET: admin feedback list (authenticated) ─────────────────────────────
    if (req.method === 'GET') {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing auth token' });
        }

        try {
            const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
            if (authError || !user) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            const { data: admin } = await sb
                .from('admin_users')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();

            if (!admin) {
                return res.status(403).json({ error: 'Not an admin' });
            }

            const { data: rows, error: queryErr } = await sb
                .from('feedback')
                .select(`
                    id, session_id, clarity, helpfulness, identification, open_comment, created_at,
                    sessions!inner ( adult_name, child_name, archetype_label, sport )
                `)
                .order('created_at', { ascending: false })
                .limit(200);

            if (queryErr) {
                console.error('[feedback] Query error:', queryErr.message);
                return res.status(500).json({ error: 'Failed to fetch feedback' });
            }

            const totals = {
                clarity: { muy_claro: 0, algo_claro: 0, confuso: 0 },
                helpfulness: { mucho: 0, algo: 0, poco: 0 },
                identification: { identificado: 0, mas_o_menos: 0, nada: 0 },
            };

            for (const row of rows ?? []) {
                const c = row.clarity as keyof typeof totals.clarity;
                const h = row.helpfulness as keyof typeof totals.helpfulness;
                const i = row.identification as keyof typeof totals.identification;
                if (totals.clarity[c] !== undefined) totals.clarity[c]++;
                if (totals.helpfulness[h] !== undefined) totals.helpfulness[h]++;
                if (totals.identification[i] !== undefined) totals.identification[i]++;
            }

            return res.status(200).json({
                feedback: rows ?? [],
                total: rows?.length ?? 0,
                totals,
            });
        } catch (err) {
            console.error('[feedback] GET error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
