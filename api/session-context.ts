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

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
        .from('sessions')
        .select('eje,motor')
        .is('deleted_at', null)
        .not('eje', 'eq', '_pending')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
        ejes:   (data ?? []).map((s: { eje: string }) => s.eje),
        motors: (data ?? []).map((s: { motor: string }) => s.motor),
    });
}
