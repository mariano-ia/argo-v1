import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '../src/lib/principia/activityLog';

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
    const origin = process.env.SITE_URL || 'https://www.argomethod.com';

    // Hard floor: never recover any session created before this fix shipped.
    // This guarantees we only act "from now forward" and never back-email the
    // existing/test plays. The rolling window then bounds how far back we look
    // once enough time has passed.
    const FORWARD_FROM = Date.parse('2026-06-01T22:35:00Z');
    const windowStart = Date.now() - RECOVERY_WINDOW_HOURS * 60 * 60 * 1000;
    const cutoff = new Date(Math.max(FORWARD_FROM, windowStart)).toISOString();

    // Resolved sessions (real profile) that were never emailed, within the window.
    const { data: sessions, error } = await sb
        .from('sessions')
        .select('id, child_name, child_age, sport, adult_name, adult_email, eje, motor, eje_secundario, archetype_label, lang, ai_sections, share_token')
        .neq('eje', '_pending')
        .is('email_sent_at', null)
        .gte('created_at', cutoff)
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
                await sb.from('sessions').update({
                    ai_sections: aiData.sections,
                    ai_cost_usd: aiData.usage?.costUsd ?? 0,
                    ai_tokens_input: aiData.usage?.inputTokens ?? 0,
                    ai_tokens_output: aiData.usage?.outputTokens ?? 0,
                }).eq('id', s.id);
                r.aiGenerated = true;
            }

            // 2. Send the report email. /api/send-email is idempotent (stamps
            //    email_sent_at) so this won't double-send.
            const arquetipo = s.eje_secundario
                ? `${s.archetype_label}`
                : s.archetype_label;
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
                relatedLogs: [`sessions.${s.id}`],
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
