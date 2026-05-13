import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/puentes-reminder-cron
 *
 * Daily cron (Vercel cron) that sends a soft reminder of Argo Puentes to
 * adults whose child session was completed 3+ days ago but who haven't
 * purchased the upsell. Tracks via sessions.puentes_reminder_sent_at to
 * avoid double-sending.
 *
 * Auth: optional CRON_SECRET, mirrors the blog-cron pattern.
 */

const REMINDER_AGE_DAYS = 3;
const BATCH_LIMIT = 100;

function buildReminderHtml(args: {
    childName: string;
    sourceSessionId: string;
    lang: string;
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const url = `${origin}/puentes/checkout?source_session_id=${args.sourceSessionId}&lang=${args.lang}`;

    const t = args.lang === 'en' ? {
        subject: `One more idea for accompanying ${args.childName}`,
        eyebrow: 'A follow-up · Argo Puentes',
        title: `One more idea for accompanying ${args.childName}`,
        body: `A few days ago you received ${args.childName}'s Argo report. Some parents and coaches have found Argo Puentes useful as a follow-up: a short questionnaire about your own style and how it complements ${args.childName}'s.`,
        cta: 'Explore Argo Puentes',
        price: 'USD 9.99',
        footer: 'You can ignore this email. We will not send another reminder.',
    } : args.lang === 'pt' ? {
        subject: `Mais uma ideia para acompanhar ${args.childName}`,
        eyebrow: 'Continuação · Argo Puentes',
        title: `Mais uma ideia para acompanhar ${args.childName}`,
        body: `Alguns dias atrás você recebeu o relatório Argo de ${args.childName}. Alguns pais e treinadores acharam o Argo Puentes útil como continuação: um questionário curto sobre seu próprio estilo e como ele se complementa com o de ${args.childName}.`,
        cta: 'Explorar Argo Puentes',
        price: 'USD 9.99 / ARS 6.999',
        footer: 'Você pode ignorar este email. Não enviaremos outro lembrete.',
    } : {
        subject: `Una idea más para acompañar a ${args.childName}`,
        eyebrow: 'Una continuación · Argo Puentes',
        title: `Una idea más para acompañar a ${args.childName}`,
        body: `Hace unos días recibiste el informe Argo de ${args.childName}. Algunos padres y entrenadores encontraron útil Argo Puentes como continuación: un cuestionario corto sobre tu propio estilo y cómo se complementa con el de ${args.childName}.`,
        cta: 'Conocer Argo Puentes',
        price: 'USD 9.99 / ARS 6.999',
        footer: 'Puedes ignorar este email. No enviaremos otro recordatorio.',
    };

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
<span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTES</span>
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
<p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Carta de Navegación</p>
</td></tr>
</table></td></tr></table></body></html>`;

    return { subject: t.subject, html };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Optional auth: same pattern as blog-cron
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

    const sb = createClient(supabaseUrl, serviceKey);
    const threshold = new Date(Date.now() - REMINDER_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    try {
        // Candidates: sessions created 3+ days ago, never reminded, with an adult_email
        const { data: candidates, error: candErr } = await sb
            .from('sessions')
            .select('id, adult_email, adult_name, child_name, lang, created_at, puentes_reminder_sent_at')
            .lt('created_at', threshold)
            .is('puentes_reminder_sent_at', null)
            .not('adult_email', 'is', null)
            .limit(BATCH_LIMIT);
        if (candErr) {
            console.error('[puentes-reminder-cron] query error:', candErr.message);
            return res.status(500).json({ error: candErr.message });
        }
        if (!candidates || candidates.length === 0) {
            return res.status(200).json({ ok: true, sent: 0 });
        }

        let sent = 0;
        const errors: string[] = [];

        for (const s of candidates) {
            try {
                // Skip if any paid puentes purchase exists
                const { data: existing } = await sb
                    .from('puentes_purchases')
                    .select('id')
                    .eq('source_session_id', s.id)
                    .eq('status', 'paid')
                    .maybeSingle();
                if (existing) {
                    // Mark as reminded anyway to avoid re-querying daily
                    await sb.from('sessions').update({ puentes_reminder_sent_at: new Date().toISOString() }).eq('id', s.id);
                    continue;
                }

                const { subject, html } = buildReminderHtml({
                    childName: s.child_name || '',
                    sourceSessionId: s.id,
                    lang: s.lang || 'es',
                });

                const r = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: 'Argo Method <hola@argomethod.com>',
                        to: [s.adult_email],
                        subject,
                        html,
                    }),
                });
                if (!r.ok) {
                    const err = await r.text();
                    errors.push(`${s.id}: ${err}`);
                    continue;
                }

                await sb.from('sessions').update({ puentes_reminder_sent_at: new Date().toISOString() }).eq('id', s.id);
                sent++;
            } catch (e: any) {
                errors.push(`${s.id}: ${e?.message || String(e)}`);
            }
        }

        return res.status(200).json({ ok: true, sent, candidates: candidates.length, errors });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-reminder-cron] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
