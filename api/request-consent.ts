import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { getConsentEmailTemplate } from './lib/consent-email-templates';

/**
 * POST /api/request-consent
 *
 * Called from the frontend when an adult submits the registration form
 * with child_age < 13. Creates a parental_consents row (pending, 24h TTL)
 * and sends the verification email via Resend.
 *
 * Returns: { ok: true, token } on success.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.SITE_URL || 'https://argomethod.com';

    if (!serviceKey || !supabaseUrl) {
        console.error('[request-consent] Missing Supabase env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }
    if (!resendKey) {
        console.error('[request-consent] Missing RESEND_API_KEY');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const {
        adult_name, adult_email, child_name, child_age, sport,
        flow_type, tenant_id, one_link_id, lang,
    } = req.body ?? {};

    // Basic validation
    if (
        typeof adult_name !== 'string' || !adult_name.trim() ||
        typeof adult_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adult_email) ||
        typeof child_name !== 'string' || !child_name.trim() ||
        typeof child_age !== 'number' || child_age < 8 || child_age >= 13 ||
        typeof flow_type !== 'string' || !['auth', 'tenant', 'one'].includes(flow_type)
    ) {
        return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    const langSafe: 'es' | 'en' | 'pt' = lang === 'en' || lang === 'pt' ? lang : 'es';
    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { error: insertErr } = await sb.from('parental_consents').insert({
            token,
            adult_name: adult_name.trim(),
            adult_email: adult_email.trim().toLowerCase(),
            child_name: child_name.trim(),
            child_age,
            sport: typeof sport === 'string' && sport.trim() ? sport.trim() : null,
            flow_type,
            tenant_id: typeof tenant_id === 'string' ? tenant_id : null,
            one_link_id: typeof one_link_id === 'string' ? one_link_id : null,
            lang: langSafe,
            expires_at: expiresAt,
        });

        if (insertErr) {
            console.error('[request-consent] insert error:', insertErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        // Send email via Resend
        const confirmUrl = `${siteUrl}/consent/${token}`;
        const tpl = getConsentEmailTemplate(langSafe, {
            adultName: adult_name.trim(),
            childName: child_name.trim(),
            confirmUrl,
        });

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [adult_email.trim()],
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
            }),
        });

        if (!resendRes.ok) {
            const errText = await resendRes.text().catch(() => '');
            console.error('[request-consent] Resend failed:', resendRes.status, errText.slice(0, 200));
            // Don't expose Resend details to client
            return res.status(500).json({ ok: false, error: 'email_send_failed' });
        }

        // Minimal structured log (no PII)
        console.info('[request-consent] ok', {
            flow_type,
            lang: langSafe,
            token_prefix: token.slice(0, 6),
        });

        return res.status(200).json({ ok: true, token });
    } catch (err) {
        console.error('[request-consent] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
