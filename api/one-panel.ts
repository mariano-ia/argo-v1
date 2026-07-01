import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Argo One mini-panel API.
 * Auth: via access_token query param (magic link, no Supabase auth).
 *
 * GET  /api/one-panel?token=xxx                → purchase info + links
 * POST /api/one-panel?token=xxx  { action: "generate-link", link_id, recipient_email, child_name? }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);
    const token = req.query.token as string;

    if (!token) return res.status(401).json({ error: 'Missing access token' });

    // Validate token and get purchase
    const { data: purchase } = await sb
        .from('one_purchases')
        .select('id, email, pack_size, payment_status, created_at, paid_at, lang')
        .eq('access_token', token)
        .single();

    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    if (purchase.payment_status !== 'paid') return res.status(403).json({ error: 'Payment not confirmed' });

    // ── GET: return purchase + links ────────────────────────────────────
    if (req.method === 'GET') {
        const { data: links } = await sb
            .from('one_links')
            .select('id, slug, status, recipient_email, child_name, sport, completed_at, session_id')
            .eq('purchase_id', purchase.id)
            .order('created_at', { ascending: true });

        const completed = (links ?? []).filter(l => l.status === 'completed').length;

        return res.status(200).json({
            purchase: {
                email: purchase.email,
                pack_size: purchase.pack_size,
                paid_at: purchase.paid_at,
            },
            links: links ?? [],
            summary: {
                total: purchase.pack_size,
                completed,
                pending: (links ?? []).filter(l => l.status === 'pending' || l.status === 'sent').length,
                available: (links ?? []).filter(l => l.status === 'available').length,
            },
        });
    }

    // ── POST: generate link ─────────────────────────────────────────────
    const { action, link_id, recipient_email, child_name, sport } = req.body ?? {};

    if (action === 'generate-link') {
        if (!link_id) return res.status(400).json({ error: 'Missing link_id' });
        if (!recipient_email) return res.status(400).json({ error: 'Missing recipient_email' });
        if (!sport || !String(sport).trim()) return res.status(400).json({ error: 'Missing sport' });

        // Verify link belongs to this purchase and is available
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, slug')
            .eq('id', link_id)
            .eq('purchase_id', purchase.id)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status !== 'available') return res.status(400).json({ error: 'Link already used or sent' });

        // Update link with recipient info
        await sb.from('one_links').update({
            status: 'sent',
            recipient_email: recipient_email.trim(),
            child_name: child_name?.trim() || null,
            sport: String(sport).trim(),
            sent_at: new Date().toISOString(),
        }).eq('id', link_id);

        // Send play link email to recipient
        const origin = process.env.SITE_URL || 'https://argomethod.com';
        const playUrl = `${origin}/one/${link.slug}`;

        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const childDisplay = child_name?.trim() || 'el niño';
            const pl = (purchase.lang as string) || 'es';
            const PL = pl === 'en' ? {
                subject: `Argo Method: ${childDisplay}'s experience is ready`,
                heading: `${childDisplay}'s experience is ready`,
                body1: `Someone invited ${childDisplay} to play an interactive adventure of under 10 minutes. When it ends, you'll receive a personalized behavioral profile report at this email.`,
                body2: 'Complete the registration, hand the device to the athlete, and you are done.',
                cta: 'Start the experience',
                note: 'This link is single-use. Once the experience is completed, it cannot be used again.',
            } : pl === 'pt' ? {
                subject: `Argo Method: a experiência de ${childDisplay} está pronta`,
                heading: `A experiência de ${childDisplay} está pronta`,
                body1: `Alguém convidou ${childDisplay} para jogar uma aventura interativa de menos de 10 minutos. Ao terminar, você receberá um relatório de perfil comportamental personalizado neste email.`,
                body2: 'Complete o registro, passe o dispositivo ao atleta, e pronto.',
                cta: 'Começar a experiência',
                note: 'Este link é de uso único. Uma vez completada a experiência, não poderá ser usado novamente.',
            } : {
                subject: `Argo Method: la experiencia de ${childDisplay} está lista`,
                heading: `La experiencia de ${childDisplay} está lista`,
                body1: `Alguien te invitó a que ${childDisplay} juegue una aventura interactiva de menos de 10 minutos. Al terminar, recibirás un informe de perfil conductual personalizado en este email.`,
                body2: 'Completa el registro, pásale el dispositivo al deportista, y listo.',
                cta: 'Comenzar la experiencia',
                note: 'Este link es de un solo uso. Una vez completada la experiencia, no podrá volver a usarse.',
            };
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'Argo Method <hola@argomethod.com>',
                    to: [recipient_email.trim()],
                    subject: PL.subject,
                    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 8px;">${PL.heading}</h2>
    <p style="font-size:14px;color:#86868B;margin:0 0 8px;">${PL.body1}</p>
    <p style="font-size:14px;color:#86868B;margin:0 0 24px;">${PL.body2}</p>
    <a href="${playUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
        ${PL.cta}
    </a>
    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;">${PL.note}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jóvenes</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
                }),
            });
        }

        return res.status(200).json({
            ok: true,
            slug: link.slug,
            play_url: `${origin}/one/${link.slug}`,
        });
    }

    return res.status(400).json({ error: 'Unknown action' });
}
