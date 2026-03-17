import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify caller is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { data: admin } = await sb
            .from('admin_users')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return res.status(403).json({ error: 'Not an admin' });
        }

        // Fetch feedback with session data
        const { data: rows, error: queryErr } = await sb
            .from('feedback')
            .select(`
                id, session_id, clarity, helpfulness, identification, open_comment, created_at,
                sessions!inner ( adult_name, child_name, archetype_label, sport )
            `)
            .order('created_at', { ascending: false })
            .limit(200);

        if (queryErr) {
            console.error('[admin-feedback] Query error:', queryErr.message);
            return res.status(500).json({ error: 'Failed to fetch feedback' });
        }

        // Compute aggregated totals
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
        console.error('[admin-feedback] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
