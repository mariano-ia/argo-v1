import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/confirm-consent
 *
 * Called by the landing page /consent/:token when the adult clicks
 * the email link. Captures IP and user-agent for the COPPA audit trail.
 * Idempotent — calling twice on a confirmed record returns the same success.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        console.error('[confirm-consent] Missing Supabase env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const token = typeof req.body?.token === 'string' ? req.body.token : null;
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
        return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data, error } = await sb
            .from('parental_consents')
            .select('token, status, expires_at, child_name, lang')
            .eq('token', token)
            .maybeSingle();

        if (error) {
            console.error('[confirm-consent] select error:', error.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }
        if (!data) {
            return res.status(404).json({ ok: false, error: 'not_found' });
        }

        // Expired?
        if (new Date(data.expires_at) < new Date()) {
            if (data.status === 'pending') {
                await sb.from('parental_consents').update({ status: 'expired' }).eq('token', token);
            }
            return res.status(410).json({ ok: false, error: 'expired' });
        }

        // Idempotent: already confirmed is success.
        if (data.status === 'confirmed') {
            return res.status(200).json({ ok: true, child_name: data.child_name, lang: data.lang });
        }
        if (data.status === 'expired') {
            return res.status(410).json({ ok: false, error: 'expired' });
        }

        // Capture audit trail
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor ?? '').split(',')[0].trim() || null;
        const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

        const { error: updErr } = await sb
            .from('parental_consents')
            .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
                confirmed_ip: ip,
                confirmed_user_agent: ua ? ua.slice(0, 500) : null,
            })
            .eq('token', token);

        if (updErr) {
            console.error('[confirm-consent] update error:', updErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        console.info('[confirm-consent] ok', { token_prefix: token.slice(0, 6) });
        return res.status(200).json({ ok: true, child_name: data.child_name, lang: data.lang });
    } catch (err) {
        console.error('[confirm-consent] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
