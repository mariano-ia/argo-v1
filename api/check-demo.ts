import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * One demo per email. Returns whether this email already completed a demo,
 * so the /demo form can show a "ya jugaste con este email" notice before the
 * person spends 10 minutes playing again.
 *
 * Fail-open by design: a transient DB error must never block the funnel.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const email = (req.body?.email ?? '').toString().trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    // Escape LIKE wildcards so an email with '_' or '%' is matched literally.
    const pattern = email.replace(/[%_\\]/g, (m: string) => '\\' + m);

    const { data, error } = await sb
        .from('perfilamientos')
        .select('id')
        .eq('is_demo', true)
        .is('deleted_at', null)
        .not('eje', 'eq', '_pending') // only count demos that actually produced a profile
        .ilike('adult_email', pattern)
        .limit(1);

    if (error) {
        console.error('[check-demo] query error', error);
        return res.status(200).json({ already_played: false });
    }

    return res.status(200).json({ already_played: (data?.length ?? 0) > 0 });
}
