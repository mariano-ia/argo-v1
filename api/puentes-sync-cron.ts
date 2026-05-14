import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/puentes-sync-cron (Vercel Cron)
 *
 * Catches three multi-child scenarios that the synchronous flows (webhook,
 * send-email) might miss:
 *
 *   1. New sibling: a parent who already has paid Argo Puentes has a new
 *      child who completed an Argo session. Auto-generates the bridge for
 *      that child silently.
 *   2. Re-profile: a child whose puentes_session already exists plays again
 *      and produces a different perfil. We regenerate the bridge with the
 *      newest source_session_id.
 *   3. Stuck generation: any puentes_session left in 'generating' or
 *      'answered' for more than 1h gets a retry.
 *
 * Auth: optional CRON_SECRET (same pattern as the other crons).
 */

const LOOKBACK_HOURS = 48; // sessions completed in last 48h are eligible
const STUCK_THRESHOLD_MIN = 60; // generations stuck for 1h get retried
const BATCH_LIMIT = 200;
const MAX_CHILDREN_PER_PURCHASE = 5;

function buildSiblingEmail(args: {
    childName: string;
    magicLink: string;
    lang: string;
    kind: 'new_sibling' | 'reprofile';
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const t = args.lang === 'en' ? (args.kind === 'new_sibling' ? {
        subject: `${args.childName} has been added to your Argo Puentes`,
        eyebrow: 'Your Argo Puentes now includes more',
        title: `${args.childName} has been added`,
        body: `Since you already have Argo Puentes active, we just generated the bridges with ${args.childName}. Your report now covers them too, no extra charge.`,
        cta: 'View updated report',
    } : {
        subject: `${args.childName} is growing, and so are their bridges`,
        eyebrow: 'Updated · Argo Puentes',
        title: `${args.childName} is growing, and so are their bridges`,
        body: `We updated the bridges with ${args.childName} based on their latest Argo profile. Children evolve, and so do the conversations.`,
        cta: 'View updated bridges',
    }) : args.lang === 'pt' ? (args.kind === 'new_sibling' ? {
        subject: `${args.childName} foi adicionado(a) ao seu Argo Puentes`,
        eyebrow: 'Seu Argo Puentes agora inclui mais',
        title: `${args.childName} foi adicionado(a)`,
        body: `Como você já tem Argo Puentes ativo, geramos automaticamente as pontes com ${args.childName}. Seu relatório agora cobre todos sem cobrança adicional.`,
        cta: 'Ver relatório atualizado',
    } : {
        subject: `${args.childName} está crescendo, e as pontes com você também`,
        eyebrow: 'Atualizado · Argo Puentes',
        title: `${args.childName} está crescendo, e as pontes com você também`,
        body: `Atualizamos as pontes com ${args.childName} com base em seu perfil Argo mais recente. As crianças evoluem, e as conversas também.`,
        cta: 'Ver pontes atualizadas',
    }) : (args.kind === 'new_sibling' ? {
        subject: `Sumamos a ${args.childName} a tu Argo Puentes`,
        eyebrow: 'Tu Argo Puentes ahora incluye más',
        title: `${args.childName} se sumó a tu informe`,
        body: `Como ya tienes Argo Puentes activo, acabamos de generar los puentes con ${args.childName}. Tu informe ahora los incluye a todos, sin cobrarte de nuevo.`,
        cta: 'Ver informe actualizado',
    } : {
        subject: `${args.childName} está creciendo, y sus puentes contigo también`,
        eyebrow: 'Actualizado · Argo Puentes',
        title: `${args.childName} está creciendo, y sus puentes contigo también`,
        body: `Actualizamos los puentes con ${args.childName} usando su perfil Argo más reciente. Los chicos evolucionan, y las conversaciones también.`,
        cta: 'Ver puentes actualizados',
    });

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
<a href="${args.magicLink}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
<p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Carta de Navegación</p>
</td></tr>
</table></td></tr></table></body></html>`;

    return { subject: t.subject, html };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);
    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.SITE_URL || 'https://argomethod.com');
    const sinceIso = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

    let newSiblings = 0;
    let reprofiles = 0;
    let retried = 0;
    const errors: string[] = [];

    try {
        // ── 1. Find recently-completed sessions whose adult_email has a paid purchase ──
        const { data: recentSessions } = await sb
            .from('sessions')
            .select('id, adult_email, child_name, lang, eje, created_at')
            .gte('created_at', sinceIso)
            .not('adult_email', 'is', null)
            .not('eje', 'eq', '_pending')
            .is('deleted_at', null)
            .limit(BATCH_LIMIT);

        for (const session of recentSessions ?? []) {
            try {
                const { data: paidPurchase } = await sb
                    .from('puentes_purchases')
                    .select('id, magic_token, lang')
                    .eq('recipient_email', session.adult_email)
                    .eq('status', 'paid')
                    .maybeSingle();
                if (!paidPurchase) continue;

                // Cap children per purchase
                const { count: childCount } = await sb
                    .from('puentes_sessions')
                    .select('id', { count: 'exact', head: true })
                    .eq('purchase_id', paidPurchase.id);

                // Existing puentes_session for same (purchase, child_name)?
                const { data: existingByName } = await sb
                    .from('puentes_sessions')
                    .select('id, source_session_id, status, ai_sections, source:sessions!source_session_id(child_name)')
                    .eq('purchase_id', paidPurchase.id);
                const matching = (existingByName ?? []).find((e: any) => {
                    const name = Array.isArray(e.source) ? e.source[0]?.child_name : e.source?.child_name;
                    return (name ?? '').toLowerCase().trim() === (session.child_name ?? '').toLowerCase().trim();
                });

                const isNewSibling = !matching;
                const isReprofile = matching && matching.source_session_id !== session.id;
                if (!isNewSibling && !isReprofile) continue;

                // Cap check
                if (isNewSibling && (childCount ?? 0) >= MAX_CHILDREN_PER_PURCHASE) {
                    console.warn(`[puentes-sync-cron] Purchase ${paidPurchase.id} reached cap of ${MAX_CHILDREN_PER_PURCHASE} children; skipping new sibling ${session.id}`);
                    continue;
                }

                // Inherit adult_profile from a sibling that has it
                const sibling: any = (existingByName ?? []).find((e: any) => !!e.ai_sections) ?? null;

                let targetSessionId: string | null = null;
                if (isNewSibling) {
                    const insertPayload: any = {
                        purchase_id: paidPurchase.id,
                        source_session_id: session.id,
                        lang: paidPurchase.lang,
                        status: sibling ? 'answered' : 'created',
                    };
                    if (sibling) {
                        const { data: siblingFull } = await sb
                            .from('puentes_sessions')
                            .select('adult_answers, adult_profile')
                            .eq('id', sibling.id)
                            .maybeSingle();
                        if (siblingFull?.adult_profile) {
                            insertPayload.adult_answers = siblingFull.adult_answers;
                            insertPayload.adult_profile = siblingFull.adult_profile;
                        }
                    }
                    const { data: inserted } = await sb
                        .from('puentes_sessions')
                        .insert(insertPayload)
                        .select('id')
                        .single();
                    targetSessionId = inserted?.id ?? null;
                    if (targetSessionId) newSiblings++;
                } else if (isReprofile && matching) {
                    await sb
                        .from('puentes_sessions')
                        .update({ source_session_id: session.id, status: 'answered', ai_sections: null })
                        .eq('id', matching.id);
                    targetSessionId = matching.id;
                    reprofiles++;
                }

                if (!targetSessionId) continue;

                // Trigger generation
                const genRes = await fetch(`${origin}/api/generate-puentes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ puentes_session_id: targetSessionId }),
                });
                if (!genRes.ok) {
                    errors.push(`gen failed for ${targetSessionId}`);
                    continue;
                }

                // Send celebratory email
                if (resendKey) {
                    const magicLink = `${origin}/puentes/${paidPurchase.magic_token}`;
                    const { subject, html } = buildSiblingEmail({
                        childName: session.child_name || '',
                        magicLink,
                        lang: session.lang || paidPurchase.lang || 'es',
                        kind: isNewSibling ? 'new_sibling' : 'reprofile',
                    });
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'Argo Method <hola@argomethod.com>',
                            to: [session.adult_email],
                            subject,
                            html,
                        }),
                    });
                }
            } catch (e: any) {
                errors.push(`session ${session.id}: ${e?.message || String(e)}`);
            }
        }

        // ── 2. Retry stuck generations (status 'answered' for more than 1h) ──
        const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MIN * 60 * 1000).toISOString();
        const { data: stuckRows } = await sb
            .from('puentes_sessions')
            .select('id, status, created_at')
            .in('status', ['answered', 'generating', 'failed'])
            .lt('created_at', stuckThreshold)
            .is('ai_sections', null)
            .limit(20);
        for (const row of stuckRows ?? []) {
            try {
                const r = await fetch(`${origin}/api/generate-puentes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ puentes_session_id: row.id }),
                });
                if (r.ok) retried++;
            } catch (e: any) {
                errors.push(`retry ${row.id}: ${e?.message || String(e)}`);
            }
        }

        return res.status(200).json({
            ok: true,
            new_siblings: newSiblings,
            reprofiles,
            retried,
            errors,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-sync-cron] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
