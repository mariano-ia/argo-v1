import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
// Inlined Principia activity logger (best-effort, never throws). Vercel serverless
// functions here don't bundle cross-directory imports, so importing ../src/lib
// throws ERR_MODULE_NOT_FOUND at runtime (this broke this cron in prod).
type ActivityInput = { area: string; action: string; sourceType?: string; eventType?: string; actor?: string; resourceType?: string; resourceId?: string; severity?: string; status?: string; reason?: Record<string, unknown>; result?: Record<string, unknown>; relatedLogs?: string[]; incidentId?: number; occurredAt?: string };
async function logActivity(sb: { from: (table: string) => { insert: (values: unknown) => unknown } }, input: ActivityInput): Promise<void> {
    try {
        await sb.from('system_activity_log').insert({
            area: input.area, source_type: input.sourceType ?? 'system', event_type: input.eventType ?? null,
            actor: input.actor ?? null, action: input.action, resource_type: input.resourceType ?? null,
            resource_id: input.resourceId ?? null, severity: input.severity ?? 'info', status: input.status ?? null,
            reason: input.reason ?? null, result: input.result ?? null, related_logs: input.relatedLogs ?? [],
            incident_id: input.incidentId ?? null, occurred_at: input.occurredAt ?? null,
        });
    } catch (err) { console.warn('[principia:logActivity] non-blocking write failed:', err); }
}

// Abandoned-play reminder (#3): a play started on a One link but never finished.
// Nudge the BUYER once, buyer-neutral ("el niño", never "tu hijo"), deep-linking to
// their panel where they can retomar OR reasignar. Inlined (no cross-dir imports).
async function sendAbandonReminderEmail(email: string, accessToken: string, childName: string | null, lang: string, origin: string): Promise<boolean> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return false;
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;
    const nombre = childName && childName.trim() ? childName.trim() : (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
    const PL = lang === 'en' ? {
        subject: `${nombre}'s profile is halfway there`,
        heading: 'A profile stayed halfway through',
        body: `${nombre} started the odyssey but did not finish it. From your panel you can resume it, or reassign the link to another child.`,
        cta: 'Open my panel',
        note: 'If it is already done, you can ignore this email.',
    } : lang === 'pt' ? {
        subject: `O perfil de ${nombre} ficou pela metade`,
        heading: 'Um perfil ficou pela metade',
        body: `${nombre} começou a odisseia mas não terminou. No seu painel você pode retomá-la, ou reatribuir o link a outra criança.`,
        cta: 'Abrir meu painel',
        note: 'Se já estiver pronto, pode ignorar este email.',
    } : {
        subject: `El perfil de ${nombre} quedó a mitad de camino`,
        heading: 'Un perfil quedó a mitad de camino',
        body: `${nombre} empezó la odisea pero no la terminó. Desde tu panel puedes retomarla, o reasignar el link a otro niño.`,
        cta: 'Abrir mi panel',
        note: 'Si ya está listo, puedes ignorar este email.',
    };
    try {
        const r = await fetch('https://api.resend.com/emails', {
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
        return r.ok;
    } catch { return false; }
}

// Defense-in-depth (post-split): re-derive ONLY the primary eje from the stored
// answers tally and compare to the stored eje. If they clearly disagree we SKIP the
// row and flag it, never authoring a contested report and NEVER recalculating motor
// (motor needs game metrics not always present). Returns the answers-derived eje, or
// null when there is no clear single winner (a tie — trust the stored eje then).
// api/ cannot import src/lib (ERR_MODULE_NOT_FOUND), so the tally is inlined.
function ejeFromAnswers(answers: unknown): string | null {
    if (!Array.isArray(answers)) return null;
    const tally: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    for (const a of answers) {
        const ax = a && typeof a === 'object' && 'axis' in a ? String((a as { axis: unknown }).axis) : null;
        if (ax && ax in tally) tally[ax]++;
    }
    if (tally.D + tally.I + tally.S + tally.C === 0) return null;
    const max = Math.max(tally.D, tally.I, tally.S, tally.C);
    const winners = Object.keys(tally).filter(k => tally[k] === max);
    return winners.length === 1 ? winners[0] : null;
}

// Record a failed recovery attempt. Populates retry_count/last_error (observability). For a v4 row
// (report_v4 present) that has failed MAX times, transition it to 'held' for human review + fire a
// one-shot alert. LEGACY (NULL) rows are NEVER held here — they keep retrying (unchanged behavior).
type SbLoose = { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, val: unknown) => unknown }; insert: (v: unknown) => unknown } };
async function bumpRetry(
    sb: SbLoose,
    s: { id: string; retry_count?: number | null; report_status?: string | null; report_v4?: unknown },
    errCode: string,
    isV4: boolean,
): Promise<void> {
    try {
        const next = (s.retry_count ?? 0) + 1;
        const patch: Record<string, unknown> = { retry_count: next, last_error: errCode };
        const held = isV4 && next >= MAX_RECOVERY_RETRIES && s.report_status !== 'held';
        if (held) {
            patch.report_status = 'held';
            patch.held_reason = 'recovery_failed';
            patch.held_at = new Date().toISOString();
        }
        await sb.from('perfilamientos').update(patch).eq('id', s.id);
        if (held) {
            await sendAlert('[Argo] Informe retenido tras reintentos', `perfilamiento ${s.id} retenido (recovery_failed): ${errCode}, intento ${next}. Revisar en /admin/held.`);
            await logActivity(sb, {
                area: 'producto', action: 'report_held', sourceType: 'cron', severity: 'degradado',
                resourceType: 'session', resourceId: String(s.id),
                reason: { session_id: s.id, held_reason: 'recovery_failed', last_error: errCode, retry_count: next },
                relatedLogs: [`perfilamientos.${s.id}`],
            });
        }
    } catch (e) { console.warn('[report-recovery] bumpRetry failed:', e); }
}

/**
 * GET/POST /api/report-recovery-cron
 *
 * Guarantees report delivery. The live (in-browser) AI generation at the end of
 * the odyssey is best-effort and can fail (slow model, closed tab, network).
 * This cron is the durable safety net: it finds recent sessions that have a
 * resolved profile but were never emailed, regenerates the AI report if missing,
 * and sends it. It retries every run until the email actually goes out
 * (email_sent_at gets stamped by /api/send-email, which is idempotent).
 *
 * Scope: only plays from the last RECOVERY_WINDOW_HOURS — i.e. "from now
 * forward". We deliberately do NOT back-email the historical batch: that older
 * data is test/demo plays and emailing months-old reports unprompted would be
 * spam. The short window is wide enough to catch a fresh play whose live
 * generation just failed, but never reaches the old data.
 *
 * Core product value: a user must never be left without their report.
 */

export const maxDuration = 120; // several sequential AI generations per run

const RECOVERY_WINDOW_HOURS = 6;
const BATCH_SIZE = 5; // sessions processed per run; cron runs frequently
const MAX_RECOVERY_RETRIES = 5; // after this many failed attempts, a v4 row is held for human review

// One-shot alert (Resend + Telegram) — inlined from qa-monitor (api/ can't import). Best-effort.
async function sendAlert(subject: string, body: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (key) {
        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: 'Argo QA <qa@argomethod.com>', to: ['hola@argomethod.com'], subject, text: body }),
            });
        } catch (e) { console.warn('[report-recovery] alert email failed:', e); }
    }
    const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
    if (tok && chat) {
        try {
            await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chat, text: `${subject}\n${body}` }),
            });
        } catch (e) { console.warn('[report-recovery] alert telegram failed:', e); }
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Protect like the other crons.
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.authorization || '';
    const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
    if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    // Liveness heartbeat for qa-monitor's dead-man's-switch (best-effort, never throws).
    try {
        const _hbAt = new Date().toISOString();
        await sb.from('health_checks').insert({
            area: 'sistema', signal_key: 'report-recovery-cron_heartbeat', source_type: 'cron', source_ref: 'report-recovery-cron',
            shape: 'threshold', measured_value: 0, setpoint_value: 0, comparator: '>=', unit: 'runs',
            breached: false, severity: 'sano', checked_at: _hbAt, last_successful_check_at: _hbAt,
        });
    } catch (e) { console.warn('[report-recovery-cron] heartbeat failed:', e); }
    const origin = process.env.SITE_URL || 'https://www.argomethod.com';

    // ── ArgoOne® completion SWEEP (fusion; flag-gated, best-effort) ───────────
    // The browser-driven one-complete can die with the tab. session.ts binds
    // one_links.session_id at START; this sweep finds bound links whose play
    // RESOLVED but whose completion never landed, and finishes it server-side
    // (mirror of one-complete's V2 LINK path). Idempotent; a 10-minute age floor
    // avoids racing the browser's own early completion. No user is ever left
    // needing manual repair.
    if (process.env.ONE_V2_COMPLETE === 'on' || process.env.ONE_UNIFIED_SKU === 'on') {
        try {
            const { data: staleLinks } = await sb
                .from('one_links')
                .select('id, session_id, purchase_id')
                .in('status', ['pending', 'sent'])
                .not('session_id', 'is', null)
                .limit(10);
            const ageFloor = Date.now() - 10 * 60 * 1000;
            for (const l of staleLinks ?? []) {
                const { data: perf } = await sb
                    .from('perfilamientos')
                    .select('id, status, child_id, adult_name, adult_email, child_name, lang, expires_at, created_at')
                    .eq('id', l.session_id)
                    .maybeSingle();
                if (!perf || perf.status !== 'resolved') continue;
                if (Date.parse(perf.created_at) > ageFloor) continue; // too fresh — browser may still complete it

                await sb.from('one_links').update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    ...(perf.child_id ? { child_id: perf.child_id } : {}),
                }).eq('id', l.id).neq('status', 'completed');

                if (perf.child_id) {
                    await sb.from('children').update({
                        responsible_adult_email: perf.adult_email,
                    }).eq('id', perf.child_id).is('responsible_adult_email', null);
                }
                if (!perf.expires_at) {
                    const d = new Date(perf.created_at);
                    const day = d.getDate();
                    d.setMonth(d.getMonth() + 6);
                    if (d.getDate() !== day) d.setDate(0);
                    await sb.from('perfilamientos').update({ expires_at: d.toISOString() }).eq('id', perf.id);
                }
                // Included comp puente → the BUYER (R4), idempotent per (email × perfilamiento).
                const { data: op } = await sb.from('one_purchases').select('email, includes_puente').eq('id', l.purchase_id).maybeSingle();
                if (op?.includes_puente && op.email) {
                    const { data: existingComp } = await sb.from('puentes_purchases').select('id')
                        .eq('recipient_email', op.email)
                        .eq('source_session_id', perf.id)
                        .eq('status', 'paid')
                        .maybeSingle();
                    if (!existingComp) {
                        const { data: mintedComp } = await sb.from('puentes_purchases').insert({
                            source_session_id: perf.id,
                            recipient_email: op.email,
                            recipient_name: null,
                            child_name: perf.child_name,
                            amount_cents: 0,
                            currency: 'USD',
                            provider: 'comp',
                            provider_payment_id: `combo_${l.purchase_id}`,
                            status: 'paid',
                            paid_at: new Date().toISOString(),
                            magic_token: randomBytes(24).toString('base64url'),
                            lang: perf.lang || 'es',
                            source: 'argo_one',
                            tenant_id: null,
                        }).select('id').maybeSingle();
                        if (mintedComp) {
                            // The comp's bridge session must exist at mint time
                            // (same gap as b4c56fc; puentes-start also self-heals).
                            const { error: sessErr } = await sb.from('puentes_sessions').insert({
                                purchase_id: mintedComp.id,
                                source_session_id: perf.id,
                                lang: perf.lang || 'es',
                                status: 'created',
                            });
                            if (sessErr) console.warn('[report-recovery] comp session insert failed (self-heal covers):', sessErr.message);
                        }
                    }
                }
                console.info('[report-recovery] argoone completion swept for link', l.id);
            }
        } catch (e) { console.warn('[report-recovery] argoone sweep failed (non-blocking):', e); }
    }

    // ── ArgoOne® abandoned-play REMINDER (#3, best-effort) ───────────────────
    // A play started on a link but never finished. After 3 days, nudge the BUYER
    // once ("retomá o reasigná desde tu panel"). Stamped via reminder_sent_at so it
    // fires at most once per link. Reset on reassign, so a re-abandon re-reminds.
    if (process.env.ONE_V2_COMPLETE === 'on' || process.env.ONE_UNIFIED_SKU === 'on') {
        try {
            const reminderCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            const { data: pendingLinks } = await sb
                .from('one_links')
                .select('id, session_id, purchase_id')
                .eq('status', 'pending')
                .not('session_id', 'is', null)
                .is('reminder_sent_at', null)
                .limit(20);
            for (const l of pendingLinks ?? []) {
                const { data: perf } = await sb
                    .from('perfilamientos')
                    .select('status, child_name, created_at')
                    .eq('id', l.session_id)
                    .maybeSingle();
                if (!perf || perf.status !== 'in_flight') continue;   // resolved → completion sweep; missing → skip
                if (perf.created_at > reminderCutoff) continue;       // too fresh (< 3 days)

                const { data: op } = await sb.from('one_purchases')
                    .select('email, lang, access_token').eq('id', l.purchase_id).maybeSingle();
                if (!op?.email || !op.access_token) continue;

                const sent = await sendAbandonReminderEmail(op.email, op.access_token as string, perf.child_name || null, (op.lang as string) || 'es', origin);
                // Stamp regardless of outcome so a hard-failing address can't loop daily.
                await sb.from('one_links').update({ reminder_sent_at: new Date().toISOString() }).eq('id', l.id);
                if (sent) console.info('[report-recovery] abandon reminder sent for link', l.id);
            }
        } catch (e) { console.warn('[report-recovery] abandon reminder failed (non-blocking):', e); }
    }

    // Hard floor: never recover any session created before this fix shipped.
    // This guarantees we only act "from now forward" and never back-email the
    // existing/test plays. The rolling window then bounds how far back we look
    // once enough time has passed.
    const FORWARD_FROM = Date.parse('2026-06-01T22:35:00Z');
    const windowStart = Date.now() - RECOVERY_WINDOW_HOURS * 60 * 60 * 1000;
    const cutoff = new Date(Math.max(FORWARD_FROM, windowStart)).toISOString();

    // Resolved perfilamientos (real profile) that were never emailed, within the
    // window. The 2-minute age floor skips rows mid two-phase write (profile saved,
    // ai_sections about to land) so the cron never races a live generation.
    const { data: sessions, error } = await sb
        .from('perfilamientos')
        .select('id, child_name, child_age, sport, adult_name, adult_email, eje, motor, eje_secundario, archetype_label, lang, ai_sections, share_token, answers, report_status, retry_count, report_v4')
        .eq('status', 'resolved')
        .not('is_demo', 'is', true) // never generate/send for demo or canary sessions
        .is('email_sent_at', null)
        // Fail-closed: NEVER auto-work a 'held' row (human-in-loop) — it would 409 at send-email
        // and re-hammer forever. Keep NULL (legacy) + ready/pending (v4). 'sent' is already excluded
        // by email_sent_at IS NULL. This is inert while V4_SEAL is off (every row is NULL).
        .or('report_status.is.null,report_status.in.(ready,pending)')
        .gte('created_at', cutoff)
        .lt('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

    if (error) {
        console.error('[report-recovery] query error:', error.message);
        return res.status(500).json({ error: error.message });
    }

    const results: Array<{ id: string; aiGenerated: boolean; emailed: boolean; error?: string }> = [];

    for (const s of sessions ?? []) {
        const r = { id: s.id, aiGenerated: false, emailed: false, error: undefined as string | undefined };
        // "v4 delivery" is decided by REPORT_STATUS, not by report_v4 presence: the client shadow persists
        // report_v4 on EVERY play (even with V4_SEAL off), so a NULL-status legacy row usually HAS a
        // report_v4. Only a sealed v4 status ('ready'/'pending') delivers via buildHtmlV4 and can be held;
        // NULL rows take the unchanged LEGACY path (regenerate ai_sections + legacy email + axis defense).
        const isV4 = s.report_status === 'ready' || s.report_status === 'pending';
        try {
            let aiSections = s.ai_sections as { palabrasPuente?: string[] } | null;

            // Defense (LEGACY path only): if the answers clearly disagree with the stored eje, do NOT
            // author a report from a contested axis — skip and flag to Principia.
            const derivedEje = ejeFromAnswers(s.answers);
            if (!isV4 && !aiSections && derivedEje && derivedEje !== s.eje) {
                await logActivity(sb, {
                    area: 'producto', action: 'report_axis_mismatch_skipped', sourceType: 'cron',
                    severity: 'degradado', resourceType: 'session', resourceId: String(s.id),
                    reason: { session_id: s.id, stored_eje: s.eje, answers_eje: derivedEje },
                    relatedLogs: [`perfilamientos.${s.id}`],
                });
                r.error = 'axis_mismatch';
                await bumpRetry(sb, s, 'axis_mismatch', isV4);
                results.push(r);
                continue;
            }

            // 1. Regenerate AI sections if missing (LEGACY only; a v4 row skips this).
            //    Same minimal payload shape as admin-grant-access — generate-ai fills the rest.
            if (!isV4 && !aiSections) {
                const aiRes = await fetch(`${origin}/api/generate-ai`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        report: {
                            nombre: s.child_name,
                            arquetipo: { id: `${s.eje}-${s.motor}`, eje: s.eje, motor: s.motor, label: s.archetype_label },
                            perfil: '', bienvenida: '', wow: '', motorDesc: '', combustible: '',
                            grupoEspacio: '', corazon: '', reseteo: '', ecos: '',
                            checklist: { antes: '', durante: '', despues: '' },
                            palabrasPuente: [], palabrasRuido: [], guia: [],
                            ejeSecundario: s.eje_secundario,
                        },
                        context: {
                            nombre: s.child_name,
                            deporte: s.sport ?? '',
                            edad: s.child_age,
                            destinatario: 'padre',
                            lang: s.lang || 'es',
                        },
                    }),
                });
                if (!aiRes.ok) {
                    r.error = `generate-ai ${aiRes.status}`;
                    await bumpRetry(sb, s, r.error, isV4);
                    results.push(r);
                    continue; // retry on next run
                }
                const aiData = await aiRes.json();
                aiSections = aiData.sections;
                await sb.from('perfilamientos').update({
                    ai_sections: aiData.sections,
                    ai_cost_usd: aiData.usage?.costUsd ?? 0,
                    ai_tokens_input: aiData.usage?.inputTokens ?? 0,
                    ai_tokens_output: aiData.usage?.outputTokens ?? 0,
                }).eq('id', s.id);
                r.aiGenerated = true;
            }

            // 2. Send the report email. /api/send-email is idempotent (stamps
            //    email_sent_at on the perfilamiento) so this won't double-send.
            const arquetipo = s.archetype_label;
            const emailRes = await fetch(`${origin}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toEmail: s.adult_email,
                    nombreAdulto: s.adult_name ?? '',
                    nombreNino: s.child_name,
                    deporte: s.sport ?? '',
                    edad: s.child_age,
                    eje: s.eje,
                    motor: s.motor,
                    arquetipo,
                    perfil: '',
                    palabrasPuente: aiSections?.palabrasPuente ?? [],
                    sessionId: s.id,
                    shareToken: s.share_token,
                    lang: s.lang || 'es',
                }),
            });
            if (!emailRes.ok) {
                r.error = `send-email ${emailRes.status}`;
                // A 409 means the choke-point withheld it (held/pending) — do not treat as transient.
                await bumpRetry(sb, s, r.error, isV4);
                results.push(r);
                continue; // retry on next run (unless now held)
            }
            r.emailed = true;
            // Principia ingestion (area=producto): a stuck report was auto-recovered.
            await logActivity(sb, {
                area: 'producto',
                action: 'report_recovered',
                sourceType: 'cron',
                severity: 'sano',
                resourceType: 'session',
                resourceId: String(s.id),
                reason: { session_id: s.id, ai_generated: r.aiGenerated },
                relatedLogs: [`perfilamientos.${s.id}`],
            });
        } catch (err) {
            r.error = err instanceof Error ? err.message : String(err);
            await bumpRetry(sb, s, r.error, isV4);
        }
        results.push(r);
    }

    const delivered = results.filter(x => x.emailed).length;
    const failed = results.filter(x => !x.emailed).length;
    console.info(`[report-recovery] processed ${results.length}: ${delivered} delivered, ${failed} pending/failed`);
    return res.status(200).json({ ok: true, processed: results.length, delivered, failed, results });
}
