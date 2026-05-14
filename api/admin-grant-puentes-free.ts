import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * POST /api/admin-grant-puentes-free
 * Body: { session_id }
 *
 * Admin-only: creates a complimentary (comp) Argo Puentes purchase for the
 * adult_email of the given session, including all their already-perfilados
 * children (multi-child rule, cap 5). Sends an "invitación free" email
 * with the magic link directly into the questionnaire — no paywall.
 *
 * Used by the "Invitar free a Puentes" button on /admin/sessions and as
 * infrastructure for the upcoming free-trial phase.
 *
 * Responses:
 *   200 — created, returns purchase_id + magic_link
 *   409 — already has a paid purchase (paid or comped); returns existing magic link
 *   404 — session not found / no adult_email
 *   401 / 403 — auth issues
 */

const MAX_CHILDREN_PER_PURCHASE = 5;

function genMagicToken(): string {
    return crypto.randomBytes(24).toString('base64url');
}

function buildFreeInviteEmail(args: {
    childName: string;
    siblingsNames: string[];
    magicLink: string;
    lang: string;
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const navy = '#1D1D1F';

    const t = args.lang === 'en' ? {
        subject: `An Argo Puentes invitation for you, no cost`,
        eyebrow: 'An invitation · Argo Puentes',
        title: `We have a companion piece for you, on us.`,
        intro: `A few days ago you received the Argo report for ${args.childName}. As a thank-you, we want to invite you to Argo Puentes — completely free.`,
        what: `Argo Puentes is a short questionnaire (about five minutes) that reveals your own DISC style as an adult and proposes four specific bridges to better accompany ${args.childName} in sport.`,
        highlight: args.siblingsNames.length > 0
            ? `Your invitation also covers ${args.siblingsNames.join(', ')}.`
            : 'Includes all your children profiled with this email, at no cost.',
        cta: 'Start Argo Puentes',
        note: 'This invitation is personal. No payment is required at any step.',
        footer: 'Argo Method · Navigation Chart',
    } : args.lang === 'pt' ? {
        subject: `Um convite Argo Puentes para você, sem custo`,
        eyebrow: 'Um convite · Argo Puentes',
        title: `Temos um complemento para você, por nossa conta.`,
        intro: `Há alguns dias você recebeu o relatório Argo de ${args.childName}. Como agradecimento, queremos convidá-lo para o Argo Puentes — totalmente gratuito.`,
        what: `Argo Puentes é um questionário curto (cerca de cinco minutos) que revela seu próprio estilo DISC como adulto e propõe quatro pontes específicas para acompanhar ${args.childName} melhor no esporte.`,
        highlight: args.siblingsNames.length > 0
            ? `Seu convite também inclui ${args.siblingsNames.join(', ')}.`
            : 'Inclui todos os seus filhos perfilados com este email, sem custo.',
        cta: 'Começar Argo Puentes',
        note: 'Este convite é pessoal. Não é necessário nenhum pagamento em nenhum momento.',
        footer: 'Argo Method · Carta de Navegação',
    } : {
        subject: `Una invitación a Argo Puentes para ti, sin costo`,
        eyebrow: 'Una invitación · Argo Puentes',
        title: `Tenemos un complemento para ti, sin costo.`,
        intro: `Hace unos días recibiste el informe Argo de ${args.childName}. Como agradecimiento, queremos invitarte a Argo Puentes, totalmente gratis.`,
        what: `Argo Puentes es un cuestionario corto (unos cinco minutos) que revela tu propio estilo DISC como adulto y propone cuatro puentes específicos para acompañar a ${args.childName} mejor en su deporte.`,
        highlight: args.siblingsNames.length > 0
            ? `Tu invitación también incluye a ${args.siblingsNames.join(', ')}.`
            : 'Incluye a todos tus hijos perfilados con este email, sin costo.',
        cta: 'Empezar Argo Puentes',
        note: 'Esta invitación es personal. No es necesario ningún pago en ningún paso.',
        footer: 'Argo Method · Carta de Navegación',
    };

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:${navy};padding:24px 28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
<span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTES</span>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${t.eyebrow}</p>
<h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${navy};letter-spacing:-0.015em;line-height:1.3;">${t.title}</h2>
<p style="margin:0 0 14px;font-size:14px;color:#424245;line-height:1.7;">${t.intro}</p>
<p style="margin:0 0 14px;font-size:14px;color:#424245;line-height:1.7;">${t.what}</p>
<p style="margin:0 0 22px;font-size:13px;color:${violet};font-weight:600;line-height:1.55;">${t.highlight}</p>
<a href="${args.magicLink}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a>
<p style="margin:20px 0 0;font-size:11px;color:#86868B;line-height:1.6;">${t.note}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
<p style="font-size:11px;color:#AEAEB2;margin:0;letter-spacing:0.07em;text-transform:uppercase;">${t.footer}</p>
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
            .from('sessions')
            .select('id, adult_email, child_name, lang, tenant_id')
            .eq('id', session_id)
            .maybeSingle();
        if (sErr || !session) return res.status(404).json({ error: 'Session not found' });
        if (!session.adult_email) return res.status(400).json({ error: 'Session has no adult_email' });

        const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : (process.env.SITE_URL || 'https://argomethod.com');

        // If this email already has a paid purchase (real or comp), just
        // return the existing magic link instead of creating a duplicate.
        const { data: existing } = await sb
            .from('puentes_purchases')
            .select('id, magic_token, provider')
            .eq('recipient_email', session.adult_email)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing) {
            return res.status(409).json({
                error: 'already_active',
                detail: `This email already has an active Argo Puentes (${existing.provider}).`,
                magic_link: `${origin}/puentes/${existing.magic_token}`,
            });
        }

        // Create the comp purchase
        const magicToken = genMagicToken();
        const lang = session.lang || 'es';
        const { data: purchase, error: pErr } = await sb
            .from('puentes_purchases')
            .insert({
                source_session_id: session.id,
                recipient_email: session.adult_email,
                recipient_name: null,
                child_name: session.child_name,
                amount_cents: 0,
                currency: 'USD',
                provider: 'comp',
                provider_payment_id: `comp_${user.email}_${Date.now()}`,
                status: 'paid',
                paid_at: new Date().toISOString(),
                magic_token: magicToken,
                lang,
                source: session.tenant_id ? 'tenant' : 'argo_one',
                tenant_id: session.tenant_id ?? null,
            })
            .select('id')
            .single();
        if (pErr || !purchase) {
            console.error('[admin-grant-puentes-free] Insert error:', pErr?.message);
            return res.status(500).json({ error: 'Could not create comp purchase' });
        }

        // Multi-child: include all siblings of the same email, capped at 5.
        const { data: siblings } = await sb
            .from('sessions')
            .select('id, child_name, created_at')
            .eq('adult_email', session.adult_email)
            .is('deleted_at', null)
            .not('eje', 'eq', '_pending')
            .order('created_at', { ascending: false });
        const uniqueIds = Array.from(new Set([
            session.id,
            ...((siblings ?? []).map((s: any) => s.id)),
        ])).slice(0, MAX_CHILDREN_PER_PURCHASE);

        const sessionRows = uniqueIds.map(sid => ({
            purchase_id: purchase.id,
            source_session_id: sid,
            lang,
            status: 'created' as const,
        }));
        if (sessionRows.length > 0) {
            await sb.from('puentes_sessions').insert(sessionRows);
        }

        // Build sibling names list (excluding the triggering session) for the email
        const siblingsNames: string[] = [];
        const triggeringName = (session.child_name || '').toLowerCase().trim();
        for (const s of siblings ?? []) {
            const n = (s.child_name || '').toLowerCase().trim();
            if (n && n !== triggeringName && !siblingsNames.includes(s.child_name)) {
                siblingsNames.push(s.child_name);
            }
            if (siblingsNames.length >= MAX_CHILDREN_PER_PURCHASE - 1) break;
        }

        const magicLink = `${origin}/puentes/${magicToken}`;

        // Send invite email
        if (resendKey) {
            const { subject, html } = buildFreeInviteEmail({
                childName: session.child_name || '',
                siblingsNames,
                magicLink,
                lang,
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
                console.warn('[admin-grant-puentes-free] Resend error (purchase already created):', errText);
            }
        } else {
            console.warn('[admin-grant-puentes-free] RESEND_API_KEY missing — email not sent (purchase was created)');
        }

        // Audit log
        try {
            await sb.from('admin_audit_log').insert({
                admin_email: user.email,
                action: 'grant_puentes_free',
                target_type: 'session',
                target_id: session.id,
                metadata: {
                    recipient_email: session.adult_email,
                    purchase_id: purchase.id,
                    children_included: sessionRows.length,
                    lang,
                },
            });
        } catch { /* non-blocking */ }

        return res.status(200).json({
            ok: true,
            purchase_id: purchase.id,
            magic_link: magicLink,
            children_included: sessionRows.length,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[admin-grant-puentes-free] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
