import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/confirm-consent
 *
 * Called by the landing page /consent/:token when the adult clicks
 * the email link. Captures IP and user-agent for the COPPA audit trail.
 * Idempotent — calling twice on a confirmed record returns the same success.
 *
 * On success returns the full consent_data (adult + child + flow context)
 * so the frontend can resume the play flow directly in the same browser
 * without forcing the user to switch tabs.
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

    // Helper: fetch slug info for tenant/one flows so the frontend can build
    // the resume URL without a second round trip.
    async function buildResume(data: {
        adult_name: string;
        adult_email: string;
        child_name: string;
        child_age: number;
        sport: string | null;
        flow_type: string;
        tenant_id: string | null;
        one_link_id: string | null;
        lang: string;
    }) {
        let tenantSlug: string | null = null;
        let oneLinkSlug: string | null = null;
        if (data.flow_type === 'tenant' && data.tenant_id) {
            const { data: tenant } = await sb
                .from('tenants')
                .select('slug')
                .eq('id', data.tenant_id)
                .maybeSingle() as { data: { slug: string | null } | null };
            tenantSlug = tenant?.slug ?? null;
        }
        if (data.flow_type === 'one' && data.one_link_id) {
            const { data: link } = await sb
                .from('one_links')
                .select('slug')
                .eq('id', data.one_link_id)
                .maybeSingle() as { data: { slug: string | null } | null };
            oneLinkSlug = link?.slug ?? null;
        }
        return {
            adult_name: data.adult_name,
            adult_email: data.adult_email,
            child_name: data.child_name,
            child_age: data.child_age,
            sport: data.sport,
            flow_type: data.flow_type,
            lang: data.lang,
            tenant_slug: tenantSlug,
            one_link_slug: oneLinkSlug,
        };
    }

    try {
        const { data, error } = await sb
            .from('parental_consents')
            .select('token, status, expires_at, adult_name, adult_email, child_name, child_age, sport, flow_type, tenant_id, one_link_id, lang')
            .eq('token', token)
            .maybeSingle() as {
                data: {
                    token: string;
                    status: string;
                    expires_at: string;
                    adult_name: string;
                    adult_email: string;
                    child_name: string;
                    child_age: number;
                    sport: string | null;
                    flow_type: string;
                    tenant_id: string | null;
                    one_link_id: string | null;
                    lang: string;
                } | null;
                error: { message: string } | null;
            };

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
            const consent_data = await buildResume(data);
            return res.status(200).json({
                ok: true,
                child_name: data.child_name,
                lang: data.lang,
                consent_data,
            });
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

        const consent_data = await buildResume(data);
        console.info('[confirm-consent] ok', { token_prefix: token.slice(0, 6) });
        return res.status(200).json({
            ok: true,
            child_name: data.child_name,
            lang: data.lang,
            consent_data,
        });
    } catch (err) {
        console.error('[confirm-consent] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
