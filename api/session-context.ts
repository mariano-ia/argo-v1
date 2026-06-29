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

    // Distribution sample of recent CURRENT profiles (one row per child) used only
    // as a tie-breaker during profile resolution. The view surfaces resolved
    // profiles only, so the prior _pending guard is implicit; it exposes the
    // profile date as current_profile_date (the renamed table has no created_at
    // semantics here for "current").
    const { data, error } = await supabase
        .from('current_perfilamiento')
        .select('eje,motor')
        .is('deleted_at', null)
        .order('current_profile_date', { ascending: false })
        .limit(50);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
        ejes:   (data ?? []).map((s: { eje: string }) => s.eje),
        motors: (data ?? []).map((s: { motor: string }) => s.motor),
    });
}
