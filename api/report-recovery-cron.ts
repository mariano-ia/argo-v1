import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
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
        .select('id, child_name, child_age, sport, adult_name, adult_email, eje, motor, eje_secundario, archetype_label, lang, ai_sections, share_token, answers')
        .eq('status', 'resolved')
        .not('is_demo', 'is', true) // never generate/send for demo or canary sessions
        .is('email_sent_at', null)
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
        try {
            let aiSections = s.ai_sections as { palabrasPuente?: string[] } | null;

            // Defense: if the answers clearly disagree with the stored eje, do NOT
            // author a report from a contested axis — skip and flag to Principia.
            const derivedEje = ejeFromAnswers(s.answers);
            if (!aiSections && derivedEje && derivedEje !== s.eje) {
                await logActivity(sb, {
                    area: 'producto', action: 'report_axis_mismatch_skipped', sourceType: 'cron',
                    severity: 'degradado', resourceType: 'session', resourceId: String(s.id),
                    reason: { session_id: s.id, stored_eje: s.eje, answers_eje: derivedEje },
                    relatedLogs: [`perfilamientos.${s.id}`],
                });
                r.error = 'axis_mismatch';
                results.push(r);
                continue;
            }

            // 1. Regenerate AI sections if missing (same minimal payload shape as
            //    admin-grant-access — generate-ai fills the rest from the archetype).
            if (!aiSections) {
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
                results.push(r);
                continue; // retry on next run
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
        }
        results.push(r);
    }

    const delivered = results.filter(x => x.emailed).length;
    const failed = results.filter(x => !x.emailed).length;
    console.info(`[report-recovery] processed ${results.length}: ${delivered} delivered, ${failed} pending/failed`);
    return res.status(200).json({ ok: true, processed: results.length, delivered, failed, results });
}
