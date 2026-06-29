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
 * Multi-child aware: events for the same purchase (parent) are aggregated
 * across a single cron run and notified via ONE combined email — rather
 * than one email per new sibling or per re-profile — so the parent gets
 * a single, clean update.
 *
 * Auth: optional CRON_SECRET (same pattern as the other crons).
 */

const LOOKBACK_HOURS = 48;
const STUCK_THRESHOLD_MIN = 60;
const BATCH_LIMIT = 200;
const MAX_CHILDREN_PER_PURCHASE = 5;

function formatNamesList(names: string[], lang: string): string {
    const clean = names.filter(Boolean);
    if (clean.length === 0) return '';
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) {
        const and = lang === 'en' ? 'and' : lang === 'pt' ? 'e' : 'y';
        return `${clean[0]} ${and} ${clean[1]}`;
    }
    const last = clean[clean.length - 1];
    const head = clean.slice(0, -1).join(', ');
    const and = lang === 'en' ? 'and' : lang === 'pt' ? 'e' : (/^[ie]/i.test(last) ? 'e' : 'y');
    return `${head} ${and} ${last}`;
}

function buildCombinedEmail(args: {
    newSiblings: string[];
    reprofiles: string[];
    magicLink: string;
    lang: string;
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const navy = '#1D1D1F';
    const newNames = formatNamesList(args.newSiblings, args.lang);
    const repNames = formatNamesList(args.reprofiles, args.lang);
    const hasNew = args.newSiblings.length > 0;
    const hasRep = args.reprofiles.length > 0;

    const t = args.lang === 'en' ? (() => {
        if (hasNew && hasRep) {
            return {
                subject: `Your Argo Puentes has been updated`,
                eyebrow: 'Updated · Argo Puentes',
                title: `Your Argo Puentes has been updated`,
                body: `${newNames} ${args.newSiblings.length > 1 ? 'have' : 'has'} been added to your report, and we refreshed the bridges with ${repNames} using their latest Argo profile${args.reprofiles.length > 1 ? 's' : ''}.`,
                cta: 'View updated report',
            };
        }
        if (hasNew) {
            const verb = args.newSiblings.length > 1 ? 'have' : 'has';
            return {
                subject: `${newNames} ${verb} been added to your Argo Puentes`,
                eyebrow: 'Your Argo Puentes now includes more',
                title: `${newNames} ${verb} been added`,
                body: `Since you already have Argo Puentes active, we just generated the bridges with ${newNames}. Your report now covers ${args.newSiblings.length > 1 ? 'them all too' : 'them too'}, no extra charge.`,
                cta: 'View updated report',
            };
        }
        // only reprofile
        const verb = args.reprofiles.length > 1 ? 'are' : 'is';
        return {
            subject: `${repNames} ${verb} growing, and so are their bridges`,
            eyebrow: 'Updated · Argo Puentes',
            title: `${repNames} ${verb} growing, and so are their bridges`,
            body: `We refreshed the bridges with ${repNames} based on their latest Argo profile${args.reprofiles.length > 1 ? 's' : ''}. Children evolve, and so do the conversations.`,
            cta: 'View updated bridges',
        };
    })() : args.lang === 'pt' ? (() => {
        if (hasNew && hasRep) {
            return {
                subject: `Seu Argo Puentes foi atualizado`,
                eyebrow: 'Atualizado · Argo Puentes',
                title: `Seu Argo Puentes foi atualizado`,
                body: `${newNames} ${args.newSiblings.length > 1 ? 'foram adicionados' : 'foi adicionado(a)'} ao seu relatório, e atualizamos as pontes com ${repNames} com base em seu${args.reprofiles.length > 1 ? 's' : ''} perfil${args.reprofiles.length > 1 ? 's' : ''} Argo mais recente${args.reprofiles.length > 1 ? 's' : ''}.`,
                cta: 'Ver relatório atualizado',
            };
        }
        if (hasNew) {
            return {
                subject: `${newNames} foi adicionado(a) ao seu Argo Puentes`,
                eyebrow: 'Seu Argo Puentes agora inclui mais',
                title: `${newNames} ${args.newSiblings.length > 1 ? 'foram adicionados' : 'foi adicionado(a)'}`,
                body: `Como você já tem Argo Puentes ativo, geramos automaticamente as pontes com ${newNames}. Seu relatório agora cobre ${args.newSiblings.length > 1 ? 'todos eles' : 'mais um(a)'} sem cobrança adicional.`,
                cta: 'Ver relatório atualizado',
            };
        }
        return {
            subject: `${repNames} está crescendo, e as pontes com você também`,
            eyebrow: 'Atualizado · Argo Puentes',
            title: `${repNames} está crescendo, e as pontes com você também`,
            body: `Atualizamos as pontes com ${repNames} com base em seu${args.reprofiles.length > 1 ? 's' : ''} perfil${args.reprofiles.length > 1 ? 's' : ''} Argo mais recente${args.reprofiles.length > 1 ? 's' : ''}. As crianças evoluem, e as conversas também.`,
            cta: 'Ver pontes atualizadas',
        };
    })() : (() => {
        if (hasNew && hasRep) {
            return {
                subject: `Tu Argo Puentes se actualizó`,
                eyebrow: 'Actualizado · Argo Puentes',
                title: `Tu Argo Puentes se actualizó`,
                body: `Sumamos a ${newNames} a tu informe y actualizamos los puentes con ${repNames} usando su${args.reprofiles.length > 1 ? 's' : ''} perfil${args.reprofiles.length > 1 ? 'es' : ''} más reciente${args.reprofiles.length > 1 ? 's' : ''}.`,
                cta: 'Ver informe actualizado',
            };
        }
        if (hasNew) {
            return {
                subject: `Sumamos a ${newNames} a tu Argo Puentes`,
                eyebrow: 'Tu Argo Puentes ahora incluye más',
                title: `Sumamos a ${newNames} a tu informe`,
                body: `Como ya tienes Argo Puentes activo, acabamos de generar los puentes con ${newNames}. Tu informe ahora ${args.newSiblings.length > 1 ? 'los' : 'lo'} incluye ${args.newSiblings.length > 1 ? 'a todos' : ''}, sin cobrarte de nuevo.`,
                cta: 'Ver informe actualizado',
            };
        }
        const verb = args.reprofiles.length > 1 ? 'están' : 'está';
        const possessive = args.reprofiles.length > 1 ? 'sus' : 'sus';
        return {
            subject: `${repNames} ${verb} creciendo, y sus puentes contigo también`,
            eyebrow: 'Actualizado · Argo Puentes',
            title: `${repNames} ${verb} creciendo, y ${possessive} puentes contigo también`,
            body: `Actualizamos los puentes con ${repNames} usando su${args.reprofiles.length > 1 ? 's' : ''} perfil${args.reprofiles.length > 1 ? 'es' : ''} Argo más reciente${args.reprofiles.length > 1 ? 's' : ''}. Los chicos evolucionan, y las conversaciones también.`,
            cta: 'Ver puentes actualizados',
        };
    })();

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:${navy};padding:24px 28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
<span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTES</span>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${t.eyebrow}</p>
<h2 style="margin:0 0 16px;font-size:22px;font-weight:300;color:${navy};letter-spacing:-0.02em;line-height:1.3;">${t.title}</h2>
<p style="margin:0 0 22px;font-size:14px;color:#424245;line-height:1.7;">${t.body}</p>
<a href="${args.magicLink}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
<p style="font-size:11px;color:#AEAEB2;margin:0;letter-spacing:0.07em;text-transform:uppercase;">Argo Method · Carta de Navegación</p>
</td></tr>
</table></td></tr></table></body></html>`;

    return { subject: t.subject, html };
}

interface PurchaseEvents {
    purchaseId: string;
    magicToken: string;
    adultEmail: string;
    lang: string;
    newSiblings: string[];
    reprofiles: string[];
    sessionIds: string[];
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

    // Liveness heartbeat for qa-monitor's dead-man's-switch (best-effort, never throws).
    try {
        const _hbAt = new Date().toISOString();
        await sb.from('health_checks').insert({
            area: 'sistema', signal_key: 'puentes-sync-cron_heartbeat', source_type: 'cron', source_ref: 'puentes-sync-cron',
            shape: 'threshold', measured_value: 0, setpoint_value: 0, comparator: '>=', unit: 'runs',
            breached: false, severity: 'sano', checked_at: _hbAt, last_successful_check_at: _hbAt,
        });
    } catch (e) { console.warn('[puentes-sync-cron] heartbeat failed:', e); }

    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.SITE_URL || 'https://argomethod.com');
    const sinceIso = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

    let newSiblings = 0;
    let reprofiles = 0;
    let retried = 0;
    let parentsEmailed = 0;
    const errors: string[] = [];

    // Aggregated events per purchase, drained after the loop into a single email each
    const eventsByPurchase: Record<string, PurchaseEvents> = {};

    try {
        const { data: recentSessions } = await sb
            .from('perfilamientos')
            .select('id, adult_email, child_name, lang, eje, created_at')
            .gte('created_at', sinceIso)
            .not('adult_email', 'is', null)
            .not('eje', 'eq', '_pending')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
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

                const { count: childCount } = await sb
                    .from('puentes_sessions')
                    .select('id', { count: 'exact', head: true })
                    .eq('purchase_id', paidPurchase.id);

                const { data: existingByName } = await sb
                    .from('puentes_sessions')
                    .select('id, source_session_id, status, ai_sections, source:perfilamientos!source_session_id(child_name)')
                    .eq('purchase_id', paidPurchase.id);
                const matching = (existingByName ?? []).find((e: any) => {
                    const name = Array.isArray(e.source) ? e.source[0]?.child_name : e.source?.child_name;
                    return (name ?? '').toLowerCase().trim() === (session.child_name ?? '').toLowerCase().trim();
                });

                const isNewSibling = !matching;
                const isReprofile = matching && matching.source_session_id !== session.id;
                if (!isNewSibling && !isReprofile) continue;

                if (isNewSibling && (childCount ?? 0) >= MAX_CHILDREN_PER_PURCHASE) {
                    console.warn(`[puentes-sync-cron] Purchase ${paidPurchase.id} reached cap of ${MAX_CHILDREN_PER_PURCHASE} children; skipping new sibling ${session.id}`);
                    continue;
                }

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

                const genRes = await fetch(`${origin}/api/generate-puentes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ puentes_session_id: targetSessionId }),
                });
                if (!genRes.ok) {
                    errors.push(`gen failed for ${targetSessionId}`);
                    continue;
                }

                // Aggregate event under this purchase (don't email yet)
                if (!eventsByPurchase[paidPurchase.id]) {
                    eventsByPurchase[paidPurchase.id] = {
                        purchaseId: paidPurchase.id,
                        magicToken: paidPurchase.magic_token,
                        adultEmail: session.adult_email,
                        lang: session.lang || paidPurchase.lang || 'es',
                        newSiblings: [],
                        reprofiles: [],
                        sessionIds: [],
                    };
                }
                const bucket = eventsByPurchase[paidPurchase.id];
                bucket.sessionIds.push(targetSessionId);
                const name = (session.child_name || '').trim();
                if (name) {
                    const target = isNewSibling ? bucket.newSiblings : bucket.reprofiles;
                    if (!target.some(n => n.toLowerCase() === name.toLowerCase())) {
                        target.push(name);
                    }
                }
            } catch (e: any) {
                errors.push(`session ${session.id}: ${e?.message || String(e)}`);
            }
        }

        // Now drain aggregated events into a single combined email per parent
        if (resendKey) {
            for (const events of Object.values(eventsByPurchase)) {
                try {
                    if (events.newSiblings.length === 0 && events.reprofiles.length === 0) continue;
                    const magicLink = `${origin}/puentes/${events.magicToken}`;
                    const { subject, html } = buildCombinedEmail({
                        newSiblings: events.newSiblings,
                        reprofiles: events.reprofiles,
                        magicLink,
                        lang: events.lang,
                    });
                    const r = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'Argo Method <hola@argomethod.com>',
                            to: [events.adultEmail],
                            subject,
                            html,
                        }),
                    });
                    if (!r.ok) {
                        errors.push(`email failed for ${events.adultEmail}: ${await r.text()}`);
                    } else {
                        parentsEmailed++;
                        // Stamp the just-notified sessions so the unsent-report
                        // backstop below doesn't re-send them a full report.
                        if (events.sessionIds.length > 0) {
                            await sb.from('puentes_sessions')
                                .update({ status: 'sent', sent_at: new Date().toISOString() })
                                .in('id', events.sessionIds);
                        }
                    }
                } catch (e: any) {
                    errors.push(`email ${events.adultEmail}: ${e?.message || String(e)}`);
                }
            }
        }

        // Retry stuck generations (still per-session, no email)
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

        // Backstop: reports that generated but whose email never sent. The
        // primary path (/api/puentes-complete) awaits the send, but a transient
        // Resend/network failure there (or a legacy fire-and-forget drop) can
        // leave a session at status='generated' with ai_sections set yet
        // sent_at NULL. Re-trigger send-puentes-email, which aggregates all
        // children of the purchase and marks them sent, so we call it once per
        // purchase. Scoped to the lookback window and to rows older than 10 min
        // to avoid racing the live completion flow.
        let emailsRecovered = 0;
        const unsentBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: unsentRows } = await sb
            .from('puentes_sessions')
            .select('id, purchase_id, created_at')
            .eq('status', 'generated')
            .is('sent_at', null)
            .not('ai_sections', 'is', null)
            .gte('created_at', sinceIso)
            .lt('created_at', unsentBefore)
            .order('created_at', { ascending: false })
            .limit(BATCH_LIMIT);
        const recoveredPurchases = new Set<string>();
        for (const row of unsentRows ?? []) {
            if (row.purchase_id && recoveredPurchases.has(row.purchase_id)) continue;
            if (row.purchase_id) recoveredPurchases.add(row.purchase_id);
            try {
                const r = await fetch(`${origin}/api/send-puentes-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ puentes_session_id: row.id }),
                });
                if (r.ok) emailsRecovered++;
                else errors.push(`unsent resend failed for ${row.id}: ${await r.text()}`);
            } catch (e: any) {
                errors.push(`unsent resend ${row.id}: ${e?.message || String(e)}`);
            }
        }

        return res.status(200).json({
            ok: true,
            new_siblings: newSiblings,
            reprofiles,
            parents_emailed: parentsEmailed,
            retried,
            emails_recovered: emailsRecovered,
            errors,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-sync-cron] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
