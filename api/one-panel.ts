import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * ArgoOne® mini-panel API.
 * Auth: via access_token query param (magic link, no Supabase auth).
 *
 * GET  /api/one-panel?token=xxx  → ALL paid purchases + links for the token's email
 * POST /api/one-panel?token=xxx  { action: "generate-link", link_id, recipient_email, child_name?, sport }
 * POST /api/one-panel            { action: "request-access", email }  → emails a fresh magic link (no token needed)
 *
 * The panel is unified by EMAIL: any of a buyer's access tokens resolves to the
 * full set of their purchases, so "buy more" adds slots to the same panel.
 */

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV (Upstash REST). Fail-open if KV isn't
// configured (KV_REST_API_URL / KV_REST_API_TOKEN).
async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
        const { result } = await incr.json();
        if (result === 1) {
            await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        return typeof result === 'number' && result > limit;
    } catch {
        return false; // fail open — never block legit traffic on a KV hiccup
    }
}

// Emails a fresh magic link to the buyer's panel (access recovery).
async function sendAccessLinkEmail(email: string, accessToken: string, lang: string): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;
    const PL = lang === 'en' ? {
        subject: 'Your ArgoOne® access link',
        heading: 'Here is your access link',
        body: 'Open your panel to see your reports, the delivery status of each one, and to generate new play links.',
        cta: 'Open my reports',
        note: 'This link is personal. If you did not request it, you can ignore this email.',
    } : lang === 'pt' ? {
        subject: 'Seu link de acesso ao ArgoOne®',
        heading: 'Aqui está seu link de acesso',
        body: 'Abra seu painel para ver seus relatórios, o status de envio de cada um e gerar novos links de jogo.',
        cta: 'Abrir meus relatórios',
        note: 'Este link é pessoal. Se você não o solicitou, pode ignorar este email.',
    } : {
        subject: 'Tu link de acceso a ArgoOne®',
        heading: 'Aquí está tu link de acceso',
        body: 'Abre tu panel para ver tus informes, el estado de envío de cada uno y generar nuevos links de juego.',
        cta: 'Abrir mis informes',
        note: 'Este link es personal. Si no lo solicitaste, puedes ignorar este email.',
    };
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [email],
            subject: PL.subject,
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One®</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 8px;">${PL.heading}</h2>
    <p style="font-size:14px;color:#86868B;margin:0 0 24px;line-height:1.6;">${PL.body}</p>
    <div style="text-align:center;">
    <a href="${panelUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">${PL.cta}</a>
    </div>
    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">${PL.note}</p>
</td></tr>
</table></td></tr></table></body></html>`,
        }),
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    // ── POST request-access: email a fresh magic link (NO token needed) ──────
    // Anti-enumeration: ALWAYS return { ok: true } whether or not the email has
    // purchases, so this endpoint can't be used to probe who bought.
    if (req.method === 'POST' && req.body?.action === 'request-access') {
        const email = String(req.body.email || '').trim().toLowerCase();
        const ip = clientIp(req);
        // Cap per IP and per email to prevent spamming a victim's inbox.
        const capped = (await rateLimited(`rl:one-access:ip:${ip}`, 20, 3600))
            || (email && await rateLimited(`rl:one-access:email:${email}`, 5, 3600));
        if (!capped && email && /.+@.+\..+/.test(email)) {
            const { data: p } = await sb
                .from('one_purchases')
                .select('access_token, lang')
                .ilike('email', email.replace(/([\\%_])/g, '\\$1'))
                .eq('payment_status', 'paid')
                .order('paid_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (p?.access_token) {
                await sendAccessLinkEmail(email, p.access_token, (p.lang as string) || 'es');
            }
        }
        return res.status(200).json({ ok: true });
    }

    const token = req.query.token as string;
    if (!token) return res.status(401).json({ error: 'Missing access token' });

    // Validate token → the owning purchase → its email.
    const { data: purchase } = await sb
        .from('one_purchases')
        .select('id, email, payment_status, lang')
        .eq('access_token', token)
        .single();

    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    if (purchase.payment_status !== 'paid') return res.status(403).json({ error: 'Payment not confirmed' });

    // Unify by email: every PAID purchase for this buyer's email.
    // Escape LIKE metacharacters so a stored email containing % or _ can't widen
    // this into a cross-buyer match; ilike on the escaped value is a case-
    // insensitive EXACT match (mirrors invite-user.ts / request-delete.ts).
    const emailPattern = purchase.email.replace(/([\\%_])/g, '\\$1');
    const { data: purchases } = await sb
        .from('one_purchases')
        .select('id, pack_size, paid_at')
        .ilike('email', emailPattern)
        .eq('payment_status', 'paid')
        .order('paid_at', { ascending: true });
    const purchaseIds = (purchases ?? []).map(p => p.id);
    const totalPack = (purchases ?? []).reduce((s, p) => s + (p.pack_size || 0), 0);
    const earliestPaid = (purchases ?? [])[0]?.paid_at ?? null;

    // ── GET: return aggregated purchase + links ──────────────────────────────
    if (req.method === 'GET') {
        const { data: links } = await sb
            .from('one_links')
            .select('id, slug, status, recipient_email, child_name, sport, completed_at, session_id')
            .in('purchase_id', purchaseIds)
            .order('created_at', { ascending: true });
        const L = links ?? [];

        // Attach report_token (perfilamiento.share_token) to completed links so the
        // panel can build a tokenized /report link. report.ts fails closed on a null
        // token, so the bare /report/:id link no longer works. (Audit 2026-07-06.)
        const sessionIds = L.filter(l => l.status === 'completed' && l.session_id).map(l => l.session_id);
        if (sessionIds.length > 0) {
            const { data: reports } = await sb
                .from('perfilamientos')
                .select('id, share_token')
                .in('id', sessionIds);
            const tokenById = new Map((reports ?? []).map(r => [r.id, r.share_token as string | null]));
            for (const l of L) {
                (l as Record<string, unknown>).report_token = l.session_id ? (tokenById.get(l.session_id) ?? null) : null;
            }
        }

        return res.status(200).json({
            purchase: {
                email: purchase.email,
                pack_size: totalPack,
                paid_at: earliestPaid,
            },
            links: L,
            summary: {
                total: totalPack,
                completed: L.filter(l => l.status === 'completed').length,
                pending: L.filter(l => l.status === 'pending' || l.status === 'sent').length,
                available: L.filter(l => l.status === 'available').length,
            },
        });
    }

    // ── POST: generate link ─────────────────────────────────────────────
    const { action, link_id, recipient_email, child_name, sport } = req.body ?? {};

    if (action === 'generate-link') {
        if (!link_id) return res.status(400).json({ error: 'Missing link_id' });
        if (!recipient_email) return res.status(400).json({ error: 'Missing recipient_email' });
        if (!sport || !String(sport).trim()) return res.status(400).json({ error: 'Missing sport' });

        // The link must belong to one of THIS email's purchases and be available.
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, slug, purchase_id')
            .eq('id', link_id)
            .single();

        if (!link || !purchaseIds.includes(link.purchase_id)) return res.status(404).json({ error: 'Link not found' });
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
                subject: `ArgoMethod®: ${childDisplay}'s experience is ready`,
                heading: `${childDisplay}'s experience is ready`,
                body1: `Someone invited ${childDisplay} to play an interactive adventure of under 10 minutes. When it ends, you'll receive a personalized behavioral profile report at this email.`,
                body2: 'Complete the registration, hand the device to the athlete, and you are done.',
                cta: 'Start the experience',
                note: 'This link is single-use. Once the experience is completed, it cannot be used again.',
            } : pl === 'pt' ? {
                subject: `ArgoMethod®: a experiência de ${childDisplay} está pronta`,
                heading: `A experiência de ${childDisplay} está pronta`,
                body1: `Alguém convidou ${childDisplay} para jogar uma aventura interativa de menos de 10 minutos. Ao terminar, você receberá um relatório de perfil comportamental personalizado neste email.`,
                body2: 'Complete o registro, passe o dispositivo ao atleta, e pronto.',
                cta: 'Começar a experiência',
                note: 'Este link é de uso único. Uma vez completada a experiência, não poderá ser usado novamente.',
            } : {
                subject: `ArgoMethod®: la experiencia de ${childDisplay} está lista`,
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
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One®</span>
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
    <p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · Perfilamiento conductual para deportistas jóvenes</p>
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
