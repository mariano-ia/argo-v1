import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/puentes-reminder-cron
 *
 * Daily cron (Vercel cron) that sends a soft reminder of ArgoPuente® to
 * adults whose child session was completed 3+ days ago but who haven't
 * purchased the upsell. Tracks via sessions.puentes_reminder_sent_at to
 * avoid double-sending.
 *
 * Multi-child aware: groups all pending sessions by adult_email and sends
 * a SINGLE reminder per parent that lists every child still without a
 * Puentes purchase. Marks all included sessions as reminded so the cron
 * never bothers the same parent twice.
 *
 * Auth: optional CRON_SECRET, mirrors the blog-cron pattern.
 */

const REMINDER_AGE_DAYS = 3;
const BATCH_LIMIT = 200;

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

function buildReminderHtml(args: {
    childrenNames: string[];
    sourceSessionId: string;
    lang: string;
    preferredCurrency?: 'usd' | 'ars' | null;
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const url = `${origin}/puentes/checkout?source_session_id=${args.sourceSessionId}&lang=${args.lang}`;
    // ArgoPuente® add-on is $4.99 USD (Stripe only). The ARS / preferredCurrency
    // branching is retired with the MercadoPago path.
    const priceLine = 'USD 4.99';

    const namesText = formatNamesList(args.childrenNames, args.lang);
    const isMulti = args.childrenNames.length > 1;

    const t = args.lang === 'en' ? {
        subject: isMulti
            ? `One more idea for accompanying ${namesText}`
            : `One more idea for accompanying ${namesText}`,
        eyebrow: 'A follow-up · ArgoPuente®',
        title: `One more idea for accompanying ${namesText}`,
        body: isMulti
            ? `A few days ago you received the Argo reports of ${namesText}. Some parents and coaches have found ArgoPuente® useful as a follow-up: a short questionnaire about your own style and how it complements each child's.`
            : `A few days ago you received ${namesText}'s Argo report. Some parents and coaches have found ArgoPuente® useful as a follow-up: a short questionnaire about your own style and how it complements ${namesText}'s.`,
        cta: 'Explore ArgoPuente®',
        price: priceLine,
        footer: 'You can ignore this email. We will not send another reminder.',
    } : args.lang === 'pt' ? {
        subject: `Mais uma ideia para acompanhar ${namesText}`,
        eyebrow: 'Continuação · ArgoPuente®',
        title: `Mais uma ideia para acompanhar ${namesText}`,
        body: isMulti
            ? `Alguns dias atrás você recebeu os relatórios Argo de ${namesText}. Alguns pais e treinadores acharam o ArgoPuente® útil como continuação: um questionário curto sobre seu próprio estilo e como ele se complementa com o de cada criança.`
            : `Alguns dias atrás você recebeu o relatório Argo de ${namesText}. Alguns pais e treinadores acharam o ArgoPuente® útil como continuação: um questionário curto sobre seu próprio estilo e como ele se complementa com o de ${namesText}.`,
        cta: 'Explorar ArgoPuente®',
        price: priceLine,
        footer: 'Você pode ignorar este email. Não enviaremos outro lembrete.',
    } : {
        subject: `Una idea más para acompañar a ${namesText}`,
        eyebrow: 'Una continuación · ArgoPuente®',
        title: `Una idea más para acompañar a ${namesText}`,
        body: isMulti
            ? `Hace unos días recibiste los informes Argo de ${namesText}. Algunos padres y entrenadores encontraron útil ArgoPuente® como continuación: un cuestionario corto sobre tu propio estilo y cómo se complementa con el de cada niño.`
            : `Hace unos días recibiste el informe Argo de ${namesText}. Algunos padres y entrenadores encontraron útil ArgoPuente® como continuación: un cuestionario corto sobre tu propio estilo y cómo se complementa con el de ${namesText}.`,
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
<h2 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#1D1D1F;letter-spacing:-0.02em;line-height:1.3;">${t.title}</h2>
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

interface CandidateSession {
    id: string;
    adult_email: string;
    adult_name: string | null;
    child_name: string | null;
    lang: string | null;
    created_at: string;
}

/* ── ArgoOne fusion (B16): renewal reminder by EXPIRY, per child ─────────────
 * Behind RENEWAL_CRON_V2. Replaces the 3-days-post-creation upsell with a
 * renewal nudge when the perfilamiento's expires_at passes (R7: soft, the
 * report stays readable). Granularity is PER CHILD (keyed on the perfilamiento
 * + renewal_reminder_sent_at), which fixes debt #3: one paid bridge for one
 * child no longer suppresses reminders for the siblings. Satellites (other
 * adults with a paid puente toward the child) get the nudge too, with their
 * own bridge link. Supports ?dry=1 (report without sending or marking). */

function buildRenewalHtml(args: {
    childName: string | null;
    lang: string;
    satellite: boolean;
    magicToken?: string | null;
}): { subject: string; html: string } {
    const violet = '#955FB5';
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const child = args.childName || (args.lang === 'en' ? 'the child' : args.lang === 'pt' ? 'a criança' : 'el niño');
    const url = args.satellite && args.magicToken ? `${origin}/puentes/${args.magicToken}` : `${origin}/one`;

    const t = args.lang === 'en' ? {
        subject: `${child}'s Argo profile is 6 months old`,
        eyebrow: 'A gentle note · ArgoOne®',
        title: `${child}'s profile turned 6 months old`,
        body: args.satellite
            ? `The report behind your bridge with ${child} is now over 6 months old. Children change fast at this age, so it may be outdated. You can keep consulting your bridge as always; when ${child} plays again, you will be able to refresh it.`
            : `${child}'s report is now over 6 months old. Children change fast at this age, so it may be outdated. You can keep consulting it as always, and if you want today's snapshot, ${child} can play again (USD 12.99).`,
        cta: args.satellite ? 'View my bridge' : 'Update the profile',
        footer: 'You can ignore this email. We will not send another reminder for this profile.',
    } : args.lang === 'pt' ? {
        subject: `O perfil Argo de ${child} completou 6 meses`,
        eyebrow: 'Uma nota · ArgoOne®',
        title: `O perfil de ${child} completou 6 meses`,
        body: args.satellite
            ? `O relatório por trás da sua ponte com ${child} tem mais de 6 meses. As crianças mudam rápido nesta idade, então pode estar desatualizado. Você pode continuar consultando sua ponte como sempre; quando ${child} jogar de novo, poderá atualizá-la.`
            : `O relatório de ${child} tem mais de 6 meses. As crianças mudam rápido nesta idade, então pode estar desatualizado. Você pode continuar consultando como sempre, e se quiser a foto de hoje, ${child} pode jogar de novo (USD 12.99).`,
        cta: args.satellite ? 'Ver minha ponte' : 'Atualizar o perfil',
        footer: 'Você pode ignorar este email. Não enviaremos outro lembrete para este perfil.',
    } : {
        subject: `El perfil Argo de ${child} cumplió 6 meses`,
        eyebrow: 'Una nota · ArgoOne®',
        title: `El perfil de ${child} cumplió 6 meses`,
        body: args.satellite
            ? `El informe detrás de tu puente con ${child} ya tiene más de 6 meses. Los niños cambian rápido a esta edad, así que puede estar desactualizado. Puedes seguir consultando tu puente como siempre; cuando ${child} vuelva a jugar, vas a poder refrescarlo.`
            : `El informe de ${child} ya tiene más de 6 meses. Los niños cambian rápido a esta edad, así que puede estar desactualizado. Puedes seguir consultándolo como siempre, y si quieres la foto de hoy, ${child} puede volver a jugar (USD 12.99).`,
        cta: args.satellite ? 'Ver mi puente' : 'Actualizar el perfil',
        footer: 'Puedes ignorar este email. No enviaremos otro recordatorio por este perfil.',
    };

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One®</span>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${t.eyebrow}</p>
<h2 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#1D1D1F;letter-spacing:-0.02em;line-height:1.3;">${t.title}</h2>
<p style="margin:0 0 22px;font-size:14px;color:#424245;line-height:1.7;">${t.body}</p>
<a href="${url}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a>
<p style="margin:24px 0 0;font-size:11px;color:#AEAEB2;line-height:1.6;">${t.footer}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
<p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · ArgoOne®</p>
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
    if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

    const sb = createClient(supabaseUrl, serviceKey);

    // Liveness heartbeat for qa-monitor's dead-man's-switch (best-effort, never throws).
    try {
        const _hbAt = new Date().toISOString();
        await sb.from('health_checks').insert({
            area: 'sistema', signal_key: 'puentes-reminder-cron_heartbeat', source_type: 'cron', source_ref: 'puentes-reminder-cron',
            shape: 'threshold', measured_value: 0, setpoint_value: 0, comparator: '>=', unit: 'runs',
            breached: false, severity: 'sano', checked_at: _hbAt, last_successful_check_at: _hbAt,
        });
    } catch (e) { console.warn('[puentes-reminder-cron] heartbeat failed:', e); }

    // ── B16: RENEWAL_CRON_V2 branch (expiry-based renewal, per child) ────────
    if (process.env.RENEWAL_CRON_V2 === 'on') {
        const dryRun = req.query.dry === '1';
        try {
            const nowIso = new Date().toISOString();
            const { data: cands, error: candErr } = await sb
                .from('perfilamientos')
                .select('id, child_id, adult_email, child_name, lang, expires_at')
                .is('tenant_id', null)  // ArgoOne only; tenant renewals live in the dashboard
                .eq('status', 'resolved')
                .is('deleted_at', null)
                .eq('is_demo', false)   // demo plays never had a consultable report — no nudge
                .lt('expires_at', nowIso)
                .is('renewal_reminder_sent_at', null)
                .not('adult_email', 'is', null)
                .order('expires_at', { ascending: true })
                .limit(BATCH_LIMIT);
            if (candErr) return res.status(500).json({ error: candErr.message });

            // Only the child's CURRENT perfilamiento may nudge. Perfilamientos are
            // append-only: a replay leaves the old expired row behind, and nudging
            // it would tell a family that already renewed to renew again. Superseded
            // rows are neutralized (marked) so they never re-qualify.
            const candList = cands ?? [];
            const childIds = [...new Set(candList.map(c => c.child_id).filter(Boolean))] as string[];
            const latestByChild = new Map<string, string>();
            if (childIds.length) {
                const { data: allPerfs } = await sb
                    .from('perfilamientos')
                    .select('id, child_id, created_at')
                    .in('child_id', childIds)
                    .eq('status', 'resolved')
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });
                for (const p of allPerfs ?? []) {
                    if (p.child_id && !latestByChild.has(p.child_id)) latestByChild.set(p.child_id, p.id);
                }
            }
            const toSend: typeof candList = [];
            const superseded: string[] = [];
            for (const c of candList) {
                const latestId = c.child_id ? latestByChild.get(c.child_id) : null;
                if (!latestId || latestId === c.id) toSend.push(c);
                else superseded.push(c.id);
            }
            if (superseded.length && !dryRun) {
                // Neutralize (the column doubles as the never-again marker).
                await sb.from('perfilamientos').update({ renewal_reminder_sent_at: nowIso }).in('id', superseded);
            }

            let sent = 0;
            let satellitesSent = 0;
            const preview: Array<{ perfilamiento_id: string; to: string; satellites: string[] }> = [];
            const errors: string[] = [];

            for (const c of toSend) {
                const lang = c.lang || 'es';
                const responsible = (c.adult_email || '').trim();
                if (!responsible) continue;
                // Satellites: other adults with a PAID puente toward THIS child.
                const { data: sats } = await sb
                    .from('puentes_purchases')
                    .select('recipient_email, magic_token, lang')
                    .eq('source_session_id', c.id)
                    .eq('status', 'paid');
                const satellites = (sats ?? []).filter(s =>
                    s.recipient_email && s.recipient_email.trim().toLowerCase() !== responsible.toLowerCase());

                if (dryRun) {
                    preview.push({ perfilamiento_id: c.id, to: responsible, satellites: satellites.map(s => s.recipient_email as string) });
                    continue;
                }

                try {
                    const { subject, html } = buildRenewalHtml({ childName: c.child_name, lang, satellite: false });
                    const r = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [responsible], subject, html }),
                    });
                    if (!r.ok) { errors.push(`${responsible}: ${await r.text()}`); continue; }
                    sent++;

                    // Satellites are best-effort; the responsible send drives the mark.
                    for (const s of satellites) {
                        try {
                            // Each satellite gets THEIR purchase language, not the child's.
                            const se = buildRenewalHtml({ childName: c.child_name, lang: (s as { lang?: string }).lang || lang, satellite: true, magicToken: s.magic_token });
                            const rr = await fetch('https://api.resend.com/emails', {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [s.recipient_email], subject: se.subject, html: se.html }),
                            });
                            if (rr.ok) satellitesSent++;
                        } catch { /* satellite failure never blocks */ }
                    }

                    // Per-child mark: only THIS perfilamiento (fixes debt #3). A
                    // failed mark leaves the row a candidate — surface it.
                    const { error: markErr } = await sb.from('perfilamientos').update({ renewal_reminder_sent_at: new Date().toISOString() }).eq('id', c.id);
                    if (markErr) errors.push(`mark ${c.id}: ${markErr.message}`);
                } catch (e: any) {
                    errors.push(`${responsible}: ${e?.message || String(e)}`);
                }
            }

            return res.status(200).json({
                ok: true,
                mode: 'renewal_v2',
                dry_run: dryRun,
                candidates: candList.length,
                superseded: superseded.length,
                sent,
                satellites_sent: satellitesSent,
                ...(dryRun ? { preview } : {}),
                errors,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[puentes-reminder-cron] renewal_v2 error:', msg);
            return res.status(500).json({ error: 'Internal error', detail: msg });
        }
    }

    const threshold = new Date(Date.now() - REMINDER_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    try {
        const { data: candidates, error: candErr } = await sb
            .from('perfilamientos')
            .select('id, adult_email, adult_name, child_name, lang, created_at')
            .lt('created_at', threshold)
            .is('puentes_reminder_sent_at', null)
            .not('adult_email', 'is', null)
            .order('created_at', { ascending: false })
            .limit(BATCH_LIMIT);
        if (candErr) {
            console.error('[puentes-reminder-cron] query error:', candErr.message);
            return res.status(500).json({ error: candErr.message });
        }
        if (!candidates || candidates.length === 0) {
            return res.status(200).json({ ok: true, sent: 0 });
        }

        // Group candidates by adult_email (lowercased for safety)
        const groups: Record<string, CandidateSession[]> = {};
        for (const s of candidates as CandidateSession[]) {
            if (!s.adult_email) continue;
            const key = s.adult_email.toLowerCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        }

        let sent = 0;
        let skippedPaid = 0;
        const errors: string[] = [];

        for (const [, group] of Object.entries(groups)) {
            const adultEmail = group[0].adult_email;
            const sessionIds = group.map(s => s.id);
            try {
                // Skip the whole group if this email already has a paid puentes purchase
                const { data: existing } = await sb
                    .from('puentes_purchases')
                    .select('id')
                    .eq('recipient_email', adultEmail)
                    .eq('status', 'paid')
                    .maybeSingle();
                if (existing) {
                    await sb.from('perfilamientos').update({ puentes_reminder_sent_at: new Date().toISOString() }).in('id', sessionIds);
                    skippedPaid++;
                    continue;
                }

                // Preferred currency from prior ArgoOne® purchases (if any)
                let preferredCurrency: 'usd' | 'ars' | null = null;
                try {
                    const { data: lastPurchase } = await sb
                        .from('one_purchases')
                        .select('currency')
                        .eq('email', adultEmail)
                        .eq('payment_status', 'paid')
                        .order('paid_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (lastPurchase?.currency === 'ars') preferredCurrency = 'ars';
                    else if (lastPurchase?.currency === 'usd') preferredCurrency = 'usd';
                } catch { /* fall back to dual price */ }

                // Unique child names preserving order (newest first)
                const seen = new Set<string>();
                const childrenNames: string[] = [];
                for (const s of group) {
                    const name = (s.child_name || '').trim();
                    if (name && !seen.has(name.toLowerCase())) {
                        seen.add(name.toLowerCase());
                        childrenNames.push(name);
                    }
                }
                const lang = group[0].lang || 'es';

                const { subject, html } = buildReminderHtml({
                    childrenNames,
                    sourceSessionId: group[0].id, // newest session id seeds the CTA URL
                    lang,
                    preferredCurrency,
                });

                const r = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: 'Argo Method <hola@argomethod.com>',
                        to: [adultEmail],
                        subject,
                        html,
                    }),
                });
                if (!r.ok) {
                    const err = await r.text();
                    errors.push(`${adultEmail}: ${err}`);
                    continue;
                }

                // Mark ALL of this parent's pending perfilamientos as reminded
                await sb.from('perfilamientos').update({ puentes_reminder_sent_at: new Date().toISOString() }).in('id', sessionIds);
                sent++;
            } catch (e: any) {
                errors.push(`${adultEmail}: ${e?.message || String(e)}`);
            }
        }

        return res.status(200).json({
            ok: true,
            parents_emailed: sent,
            parents_skipped_already_paid: skippedPaid,
            candidate_sessions: candidates.length,
            errors,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-reminder-cron] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
