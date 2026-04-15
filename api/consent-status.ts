import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/consent-status?token=xxx
 *
 * Polled by the frontend waiting screen every 5s. Lazily marks
 * pending-but-expired records as expired. Always safe to call.
 *
 * Responses:
 *   { status: 'pending' }
 *   { status: 'confirmed', token }
 *   { status: 'expired' }
 *   { status: 'not_found' }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ status: 'not_found' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        console.error('[consent-status] Missing Supabase env');
        return res.status(500).json({ status: 'not_found' });
    }

    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
        return res.status(200).json({ status: 'not_found' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data, error } = await sb
            .from('parental_consents')
            .select('token, status, expires_at')
            .eq('token', token)
            .maybeSingle();

        if (error) {
            console.error('[consent-status] select error:', error.message);
            return res.status(500).json({ status: 'not_found' });
        }
        if (!data) {
            return res.status(200).json({ status: 'not_found' });
        }

        // Lazy expiration for pending rows past their deadline
        if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
            await sb.from('parental_consents')
                .update({ status: 'expired' })
                .eq('token', token);
            return res.status(200).json({ status: 'expired' });
        }

        if (data.status === 'confirmed') {
            return res.status(200).json({ status: 'confirmed', token });
        }
        if (data.status === 'expired') {
            return res.status(200).json({ status: 'expired' });
        }
        return res.status(200).json({ status: 'pending' });
    } catch (err) {
        console.error('[consent-status] unexpected:', err);
        return res.status(500).json({ status: 'not_found' });
    }
}
