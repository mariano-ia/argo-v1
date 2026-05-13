import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/send-puentes-email
 * Body: { puentes_session_id }
 *
 * Sends the final Argo Puentes report to the recipient_email. Uses Resend
 * (same provider as the child report email). HTML template inlined for the
 * three supported languages.
 */

interface PuenteBlock {
    titulo: string;
    como_esta_el: string;
    lo_que_traes: string;
    el_puente: string;
    pregunta_reflexion: string;
}

interface AiSections {
    saludo: string;
    perfil_adulto_breve: string;
    puentes: PuenteBlock[];
    cierre: string;
}

function getCopy(lang: string) {
    if (lang === 'en') return {
        eyebrow: 'Argo Puentes · Navigation Chart',
        subjectPrefix: 'Your Argo Puentes — bond with',
        welcome: 'Welcome',
        yourStyle: 'Your natural style',
        bridge: (n: number) => `Bridge ${n}`,
        childState: 'How they tend to feel',
        adultStrength: 'What you bring',
        theBridge: 'The bridge',
        reflection: 'A question to take with you',
        closing: 'To carry with you',
        cta: 'View report online',
        footer: 'Argo Method · Navigation Chart',
        disclaimer: 'This report is not a clinical or therapeutic service. It is an invitation to reflect.',
    };
    if (lang === 'pt') return {
        eyebrow: 'Argo Puentes · Carta de Navegação',
        subjectPrefix: 'Seu Argo Puentes — vínculo com',
        welcome: 'Bem-vindo',
        yourStyle: 'Seu estilo natural',
        bridge: (n: number) => `Ponte ${n}`,
        childState: 'Como tende a estar',
        adultStrength: 'O que você traz',
        theBridge: 'A ponte',
        reflection: 'Uma pergunta para levar',
        closing: 'Para levar',
        cta: 'Ver relatório online',
        footer: 'Argo Method · Carta de Navegação',
        disclaimer: 'Este relatório não é um serviço clínico nem terapêutico. É um convite à reflexão.',
    };
    return {
        eyebrow: 'Argo Puentes · Carta de Navegación',
        subjectPrefix: 'Tu Argo Puentes — vínculo con',
        welcome: 'Bienvenida',
        yourStyle: 'Tu estilo natural',
        bridge: (n: number) => `Puente ${n}`,
        childState: 'Cómo tiende a estar',
        adultStrength: 'Lo que tú traes',
        theBridge: 'El puente',
        reflection: 'Una pregunta para llevarte',
        closing: 'Para llevar',
        cta: 'Ver informe en línea',
        footer: 'Argo Method · Carta de Navegación',
        disclaimer: 'Este informe no es un servicio clínico ni terapéutico. Es una invitación a la reflexión.',
    };
}

function buildHtml(args: {
    aiSections: AiSections;
    childName: string;
    magicLink: string;
    lang: string;
}): string {
    const t = getCopy(args.lang);
    const violet = '#955FB5';
    const subject = `${t.subjectPrefix} ${args.childName}`;

    const puentesBlocks = args.aiSections.puentes.map((p, i) => `
        <tr><td style="padding:0 28px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${violet};background:#F9F5FC;border-radius:14px;">
                <tr><td style="padding:22px 22px 18px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${t.bridge(i + 1)}</p>
                    <h3 style="margin:0 0 18px;font-size:18px;font-weight:600;color:#1D1D1F;letter-spacing:-0.01em;">${p.titulo}</h3>

                    <p style="margin:14px 0 4px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.childState}</p>
                    <p style="margin:0;font-size:14px;line-height:1.65;color:#424245;">${p.como_esta_el}</p>

                    <p style="margin:14px 0 4px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.adultStrength}</p>
                    <p style="margin:0;font-size:14px;line-height:1.65;color:#424245;">${p.lo_que_traes}</p>

                    <p style="margin:14px 0 4px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.theBridge}</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#1D1D1F;font-weight:500;">${p.el_puente}</p>

                    <p style="margin:14px 0 4px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.reflection}</p>
                    <p style="margin:0;font-size:14px;line-height:1.65;color:#424245;font-style:italic;">${p.pregunta_reflexion}</p>
                </td></tr>
            </table>
        </td></tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="${args.lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

    <!-- HEADER -->
    <tr><td style="background:#1D1D1F;padding:28px;">
        <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
        <span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTES</span>
        <p style="margin:18px 0 0;font-size:11px;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.eyebrow}</p>
        <p style="margin:6px 0 0;font-size:24px;font-weight:300;color:#fff;letter-spacing:-0.02em;line-height:1.25;">${subject}</p>
    </td></tr>

    <!-- SALUDO -->
    <tr><td style="padding:28px 28px 16px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${t.welcome}</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1D1D1F;">${args.aiSections.saludo}</p>
    </td></tr>

    <!-- PERFIL ADULTO -->
    <tr><td style="padding:0 28px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:14px;">
            <tr><td style="padding:20px 22px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.yourStyle}</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#424245;">${args.aiSections.perfil_adulto_breve}</p>
            </td></tr>
        </table>
    </td></tr>

    <!-- SEPARATOR -->
    <tr><td style="padding:0 28px 8px;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

    <!-- 4 PUENTES -->
    ${puentesBlocks}

    <!-- CIERRE -->
    <tr><td style="padding:0 28px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:14px;">
            <tr><td style="padding:22px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.closing}</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#424245;">${args.aiSections.cierre}</p>
            </td></tr>
        </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:0 28px 28px;text-align:center;">
        <a href="${args.magicLink}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a>
        <p style="margin:16px auto 0;max-width:420px;font-size:11px;color:#AEAEB2;line-height:1.6;">${t.disclaimer}</p>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#F5F5F7;border-top:1px solid #E8E8ED;padding:18px 28px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">${t.footer}</p>
    </td></tr>

</table></td></tr></table>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY missing' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { puentes_session_id } = req.body as { puentes_session_id?: string };
        if (!puentes_session_id) return res.status(400).json({ error: 'Missing puentes_session_id' });

        const { data: pSession, error } = await sb
            .from('puentes_sessions')
            .select('id, status, ai_sections, lang, purchase:puentes_purchases!purchase_id(id, magic_token, recipient_email, recipient_name, child_name, lang)')
            .eq('id', puentes_session_id)
            .maybeSingle();
        if (error || !pSession) return res.status(404).json({ error: 'Puentes session not found' });
        if (!pSession.ai_sections) return res.status(400).json({ error: 'No ai_sections to send' });

        const purchase: any = Array.isArray(pSession.purchase) ? pSession.purchase[0] : pSession.purchase;
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

        const lang = pSession.lang || purchase.lang || 'es';
        const t = getCopy(lang);
        const origin = process.env.SITE_URL || 'https://argomethod.com';
        const magicLink = `${origin}/puentes/${purchase.magic_token}`;

        const html = buildHtml({
            aiSections: pSession.ai_sections as AiSections,
            childName: purchase.child_name || '',
            magicLink,
            lang,
        });

        const subject = `${t.subjectPrefix} ${purchase.child_name}`;

        const sendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [purchase.recipient_email],
                subject,
                html,
            }),
        });

        if (!sendRes.ok) {
            const err = await sendRes.text();
            console.error('[send-puentes-email] Resend error:', err);
            return res.status(502).json({ error: 'Resend failed', detail: err });
        }

        await sb.from('puentes_sessions').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
        }).eq('id', puentes_session_id);

        return res.status(200).json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[send-puentes-email] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
