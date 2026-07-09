import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin-send-puentes-invite
 * Body: { session_id }
 *
 * Admin-only: sends an ArgoPuente® invite email to the parent of a given
 * completed session, mirroring the +3 day reminder cron template. Sets
 * sessions.puentes_reminder_sent_at so the cron does not double-send.
 *
 * Returns 409 if the parent already purchased ArgoPuente® for that
 * session, or 409 if an invite was already sent.
 */

function buildHtml(args: {
    childName: string;
    sourceSessionId: string;
    lang: string;
    preferredCurrency?: 'usd' | 'ars' | null;
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.SITE_URL || 'https://argomethod.com');
    const url = `${origin}/puentes/checkout?source_session_id=${args.sourceSessionId}&lang=${args.lang}`;
    // ArgoPuente® add-on is $4.99 USD (Stripe only). The ARS / preferredCurrency
    // branching is retired with the MercadoPago path.
    const priceLine = 'USD 4.99';

    const t = args.lang === 'en' ? {
        subject: `One more idea for accompanying ${args.childName}`,
        eyebrow: 'A follow-up · ArgoPuente®',
        title: `One more idea for accompanying ${args.childName}`,
        body: `A few days ago you received ${args.childName}'s Argo report. Some parents and coaches have found ArgoPuente® useful as a follow-up: a short questionnaire about your own style and how it complements ${args.childName}'s.`,
        cta: 'Explore ArgoPuente®',
        price: priceLine,
        footer: 'You can ignore this email. We will not send another reminder.',
    } : args.lang === 'pt' ? {
        subject: `Mais uma ideia para acompanhar ${args.childName}`,
        eyebrow: 'Continuação · ArgoPuente®',
        title: `Mais uma ideia para acompanhar ${args.childName}`,
        body: `Alguns dias atrás você recebeu o relatório Argo de ${args.childName}. Alguns pais e treinadores acharam o ArgoPuente® útil como continuação: um questionário curto sobre seu próprio estilo e como ele se complementa com o de ${args.childName}.`,
        cta: 'Explorar ArgoPuente®',
        price: priceLine,
        footer: 'Você pode ignorar este email. Não enviaremos outro lembrete.',
    } : {
        subject: `Una idea más para acompañar a ${args.childName}`,
        eyebrow: 'Una continuación · ArgoPuente®',
        title: `Una idea más para acompañar a ${args.childName}`,
        body: `Hace unos días recibiste el informe Argo de ${args.childName}. Algunos padres y entrenadores encontraron útil ArgoPuente® como continuación: un cuestionario corto sobre tu propio estilo y cómo se complementa con el de ${args.childName}.`,
        cta: 'Conocer ArgoPuente®',
        price: priceLine,
        footer: 'Puedes ignorar este email. No enviaremos otro recordatorio.',
    };

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;">Method®</span>
<span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTE</span>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${t.eyebrow}</p>
<h2 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#1D1D1F;letter-spacing:-0.02em;">${t.title}</h2>
<p style="margin:0 0 22px;font-size:14px;color:#424245;line-height:1.7;">${t.body}</p>
<table cellpadding="0" cellspacing="0">
<tr><td style="vertical-align:middle;"><a href="${url}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a></td>
<td style="vertical-align:middle;padding-left:14px;"><span style="font-size:13px;color:#86868B;font-weight:500;">${t.price}</span></td></tr>
</table>
<p style="margin:24px 0 0;font-size:11px;color:#AEAEB2;line-height:1.6;">${t.footer}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
<p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · ArgoPuente®</p>
</td></tr>
</table></td></tr></table></body></html>`;

    return { subject: t.subject, html };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', user.email).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Admin access required' });

    try {
        const { session_id } = req.body as { session_id?: string };
        if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

        const { data: session, error: sErr } = await sb
            .from('perfilamientos')
            .select('id, adult_email, child_name, lang, puentes_reminder_sent_at')
            .eq('id', session_id)
            .maybeSingle();
        if (sErr || !session) return res.status(404).json({ error: 'Session not found' });
        if (!session.adult_email) return res.status(400).json({ error: 'Session has no adult_email' });
        if (session.puentes_reminder_sent_at) {
            return res.status(409).json({ error: 'Invite already sent', sent_at: session.puentes_reminder_sent_at });
        }

        // If they already purchased, do not send invite
        const { data: existing } = await sb
            .from('puentes_purchases')
            .select('id')
            .eq('source_session_id', session.id)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing) return res.status(409).json({ error: 'Already purchased' });

        // Mirror the currency the parent already paid in (ArgoOne®), so the
        // upsell price line matches their previous experience.
        let preferredCurrency: 'usd' | 'ars' | null = null;
        try {
            const { data: lastPurchase } = await sb
                .from('one_purchases')
                .select('currency')
                .eq('email', session.adult_email)
                .eq('payment_status', 'paid')
                .order('paid_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (lastPurchase?.currency === 'ars') preferredCurrency = 'ars';
            else if (lastPurchase?.currency === 'usd') preferredCurrency = 'usd';
        } catch { /* fall back to dual price */ }

        const { subject, html } = buildHtml({
            childName: session.child_name || '',
            sourceSessionId: session.id,
            lang: session.lang || 'es',
            preferredCurrency,
        });

        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [session.adult_email],
                subject,
                html,
            }),
        });
        if (!r.ok) {
            const errText = await r.text();
            console.error('[admin-send-puentes-invite] Resend error:', errText);
            return res.status(502).json({ error: 'Resend failed', detail: errText });
        }

        const sentAt = new Date().toISOString();
        await sb.from('perfilamientos').update({ puentes_reminder_sent_at: sentAt }).eq('id', session.id);

        // Audit log entry (best-effort, do not fail the request if logging fails)
        try {
            await sb.from('admin_audit_log').insert({
                admin_email: user.email,
                action: 'send_puentes_invite',
                target_type: 'session',
                target_id: session.id,
                metadata: { recipient_email: session.adult_email, lang: session.lang },
            });
        } catch { /* ignore */ }

        return res.status(200).json({ ok: true, sent_at: sentAt });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[admin-send-puentes-invite] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
