import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60;

// Inlined Producto signal definitions (Vercel /api cannot import src/lib/principia/areas).
// Keep in sync with the registry's Producto signalSources + setpoint.
type Breach = {
    classKey: string; loopId: string; signalKey: string; sourceRef: string;
    measured: number; setpoint: number; comparator: '>' | '<';
    severity: 'alto' | 'medio'; title: string; summary: string;
    diagnosis: Record<string, unknown>;
    proposed: { type: string; executable: boolean; confidence: number; blast_radius?: string };
    actionKey: string; entityRefs?: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (iso: string) => iso.slice(0, 10);

// Inlined copy of detectLogic.buildActionKey (keep in sync).
function buildActionKey(classKey: string, entityRefs: string[] = [], dayBucket?: string): string {
    if (entityRefs.length > 0) return `${classKey}:${[...entityRefs].sort().join(',')}`;
    return `${classKey}:${dayBucket ?? new Date().toISOString().slice(0, 10)}`;
}

async function alert(severity: 'alto' | 'medio', title: string, detail: string) {
    // Resend floor (mandatory) + Telegram (optional enhancement).
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
    if (apiKey) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'Argo Vigia <qa@argomethod.com>', to,
                subject: `[Argo Vigia] ${severity.toUpperCase()} - ${title}`,
                text: `${detail}\n\nRevisa la Bandeja: https://www.argomethod.com/admin/principia/bandeja`,
            }),
        }).catch(() => {});
    }
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: tgChat, text: `[Vigia ${severity.toUpperCase()}] ${title}\n${detail}` }),
        }).catch(() => {});
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.authorization || '';
    const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
    if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    const sb = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - DAY_MS).toISOString();
    const breaches: Breach[] = [];

    // SIGNAL 1: client_errors > 5/day (technical loop).
    {
        const { data } = await sb.from('client_errors').select('created_at').gte('created_at', since);
        const today = (data ?? []).filter(r => dayKey(r.created_at) === dayKey(new Date().toISOString())).length;
        await writeHealthCheck(sb, 'tecnica', 'client_errors_per_day', 'client_errors', today, 5, '<', today >= 5);
        if (today > 5) breaches.push({
            classKey: 'client_error_spike', loopId: 'tecnica', signalKey: 'client_errors_per_day', sourceRef: 'client_errors',
            measured: today, setpoint: 5, comparator: '>', severity: today >= 14 ? 'alto' : 'medio',
            title: 'Pico de errores de cliente', summary: `${today} errores de cliente hoy (umbral 5).`,
            diagnosis: { likely: 'revisar client_errors.by_msg en /admin/health', metric: 'client_errors_per_day', current: today },
            proposed: { type: 'open_pr', executable: false, confidence: 0.6 },
            actionKey: buildActionKey('client_error_spike', [], dayKey(new Date().toISOString())),
        });
    }

    // SIGNAL 2: audio recovery surge — DISTINCT sessions with a real audio fault today.
    // A surge means MANY players hit audio problems, not one device looping. We count
    // distinct session_id (so a single long testing/QA session can never trip it) and
    // exclude 'visibility_recover' (benign: the watchdog resuming audio after a tab
    // switch, expected behavior, not a fault). Threshold: > 3 distinct affected sessions.
    {
        const { data } = await sb.from('audio_events')
            .select('created_at, session_id, recovery_type').gte('created_at', since);
        const todayKey = dayKey(new Date().toISOString());
        const faultSessions = new Set(
            (data ?? [])
                .filter(r => dayKey(r.created_at) === todayKey && r.recovery_type !== 'visibility_recover' && r.session_id)
                .map(r => r.session_id as string),
        );
        const affected = faultSessions.size;
        await writeHealthCheck(sb, 'tecnica', 'audio_recovery_sessions_per_day', 'audio_events', affected, 3, '<', affected > 3);
        if (affected > 3) breaches.push({
            classKey: 'audio_recovery_surge', loopId: 'tecnica', signalKey: 'audio_recovery_sessions_per_day', sourceRef: 'audio_events',
            measured: affected, setpoint: 3, comparator: '>', severity: 'medio',
            title: 'Surge de recuperacion de audio', summary: `${affected} sesiones con recuperacion de audio hoy (umbral 3).`,
            diagnosis: { likely: 'investigar codec / EffectPlayer', metric: 'audio_recovery_sessions_per_day', current: affected },
            proposed: { type: 'open_pr', executable: false, confidence: 0.5 },
            actionKey: buildActionKey('audio_recovery_surge', [], todayKey),
        });
    }

    // SIGNAL 3: sessions with ai_sections null > 4h (delivery loop).
    {
        const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        // Only flag RECENT stalls (last 72h). A months-old session without a report is
        // legacy backlog, not an actionable delivery stall — baseline it out so the
        // monitor analyses from now on instead of re-alerting on an old, settled pile.
        const floor = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        // ai_sections is stamped per perfilamiento (the play); the recovery action
        // below acts by perfilamiento id. The signalKey/sourceRef labels stay
        // 'sessions' to keep health-check identity in sync with the Producto registry.
        const { data } = await sb.from('perfilamientos')
            .select('id, created_at').is('ai_sections', null).neq('eje', '_pending')
            // V4 candado (2026-07-08): a HELD/PENDING report is withheld ON PURPOSE by the
            // fail-closed gate, not a delivery stall. Exclude them so this signal only sees
            // genuine stalls (legacy=null, or v4 ready/sent). Otherwise a held report with a
            // null ai_sections would propose report-recovery, which SKIPS held => stuck loop.
            .or('report_status.is.null,report_status.in.(ready,sent)')
            .lt('created_at', cutoff).gte('created_at', floor).is('deleted_at', null).limit(50);
        const stalled = data ?? [];
        await writeHealthCheck(sb, 'entrega', 'sessions_without_report', 'sessions', stalled.length, 1, '<', stalled.length > 0);
        if (stalled.length > 0) breaches.push({
            classKey: 'session_delivery_stall', loopId: 'entrega', signalKey: 'sessions_without_report', sourceRef: 'sessions',
            measured: stalled.length, setpoint: 1, comparator: '>', severity: stalled.length >= 3 ? 'alto' : 'medio',
            title: 'Sesiones sin reporte', summary: `${stalled.length} sesiones sin reporte hace mas de 4 h.`,
            diagnosis: { likely: 'ai_sections null tras generacion', session_ids: stalled.map(s => s.id) },
            proposed: { type: 'trigger_report_recovery', executable: true, confidence: 0.91, blast_radius: `${stalled.length} sesiones` },
            actionKey: buildActionKey('session_delivery_stall', stalled.map(s => s.id)),
            entityRefs: stalled.map(s => s.id),
        });
    }

    // SIGNAL 4: report email unsent after generation (delivery loop).
    {
        const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        // Same baseline as SIGNAL 3: only recent (last 72h) unsent reports are actionable.
        const floor = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        // email_sent_at / ai_sections are per-perfilamiento; resend acts by that id.
        // Two exclusions keep this signal to genuinely-actionable deliveries only:
        //   - is_demo: the "Jugar gratis" funnel shows an on-screen report and NEVER
        //     emails by design, so an unsent demo is expected, not a failure.
        //   - no recipient: a null/empty adult_email can't be resent (the resend would
        //     just 400 at /api/send-email), so flagging it produces an un-actionable
        //     incident (and more send-email noise). Require a real address.
        const { data } = await sb.from('perfilamientos')
            .select('id').not('ai_sections', 'is', null).is('email_sent_at', null)
            .not('is_demo', 'is', true)
            .not('adult_email', 'is', null).neq('adult_email', '')
            // V4 candado (2026-07-08): a HELD/PENDING report is NOT sent BY DESIGN (the
            // choke-point 409s and never stamps email_sent_at). Without this filter every
            // held report matches (ai_sections present + email_sent_at null) => false
            // "email unsent" incident + resend proposal that 409s => incident stuck
            // 'verifying' forever. Only flag genuinely-unsent deliveries (null/ready/sent).
            .or('report_status.is.null,report_status.in.(ready,sent)')
            .lt('created_at', cutoff).gte('created_at', floor).is('deleted_at', null).limit(50);
        const unsent = data ?? [];
        await writeHealthCheck(sb, 'entrega', 'report_email_unsent', 'sessions', unsent.length, 1, '<', unsent.length > 0);
        if (unsent.length > 0) breaches.push({
            classKey: 'report_email_unsent', loopId: 'entrega', signalKey: 'report_email_unsent', sourceRef: 'sessions',
            measured: unsent.length, setpoint: 1, comparator: '>', severity: 'medio',
            title: 'Email de reporte no enviado', summary: `${unsent.length} reportes generados sin email enviado.`,
            diagnosis: { likely: 'email_sent_at null con ai_sections presente', session_ids: unsent.map(s => s.id) },
            proposed: { type: 'resend_email', executable: true, confidence: 0.9, blast_radius: `${unsent.length} sesiones` },
            actionKey: buildActionKey('report_email_unsent', unsent.map(s => s.id)),
            entityRefs: unsent.map(s => s.id),
        });
    }

    // Dedupe into incidents + emit activity rows + alert. The partial unique index
    // uniq_incident_open_per_action (area, action_key) WHERE status NOT IN (resolved, snoozed)
    // is the real guard: an INSERT of an already-open breach collides instead of relying
    // only on the SELECT-then-INSERT below. The SELECT increments signal_count when present.
    let opened = 0;
    for (const b of breaches) {
        const { data: cls } = await sb.from('incident_classes').select('id').eq('area', 'producto').eq('key', b.classKey).maybeSingle();
        const { data: existing } = await sb.from('incidents')
            .select('id, signal_count').eq('area', 'producto').eq('action_key', b.actionKey)
            .not('status', 'in', '(resolved,snoozed)').maybeSingle();

        let incidentId: number;
        if (existing) {
            await sb.from('incidents').update({ signal_count: existing.signal_count + 1, last_seen_at: new Date().toISOString() }).eq('id', existing.id);
            incidentId = existing.id;
        } else {
            // Durable disposition (governance): if a human already rejected or snoozed
            // THIS action_key, do NOT recreate it. The detect cron re-breaches every cycle
            // while a daily counter stays over setpoint; without this guard a 'Rechazar'
            // just spawns a fresh incident on the next run (the dedup index only covers
            // non-closed rows, so a resolved/snoozed row no longer blocks a new insert).
            // Auto-resolved incidents leave resolution=null (the verify-loop sets only
            // verification_result), so a genuinely recurring problem can still re-open.
            // Surge action_keys embed the UTC day, so this suppression lifts the next day.
            const { data: priorDisposition } = await sb.from('incidents')
                .select('resolution')
                .eq('area', 'producto').eq('action_key', b.actionKey)
                .in('status', ['resolved', 'snoozed'])
                .not('resolution', 'is', null)
                .order('id', { ascending: false }).limit(1);
            const decision = (priorDisposition?.[0]?.resolution as { decision?: string } | null)?.decision;
            if (decision === 'reject' || decision === 'snooze') continue;

            // Truncated lifecycle (v1): open the incident directly at 'awaiting_approval'
            // (skips open/diagnosing/proposed, reserved for when AI diagnosis splits from detection).
            const { data: ins } = await sb.from('incidents').insert({
                area: 'producto', loop_id: b.loopId, class_id: cls?.id ?? null, agent: 'vigia', kind: 'incident',
                title: b.title, summary: b.summary, severity: b.severity, status: 'awaiting_approval',
                diagnosis: b.diagnosis, proposed_action: b.proposed, action_key: b.actionKey,
                entity_type: b.entityRefs ? 'session' : null,
                entity_ref: b.entityRefs ? b.entityRefs.join(',') : null,
            }).select('id').single();
            incidentId = ins!.id;
            opened++;
            await sb.from('system_activity_log').insert({
                area: 'producto', source_type: 'sensor', event_type: 'health_check',
                actor: 'vigia', action: 'incident_detected', severity: b.severity, status: 'pending_review',
                reason: { metric: b.signalKey, threshold: b.setpoint, current_value: b.measured },
                incident_id: incidentId, occurred_at: new Date().toISOString(),
            });
            // Per-incident push (spec seccion 5, trigger 1): ALTO and MEDIO both page.
            await alert(b.severity, b.title, b.summary);
            // Ordines writer: Vigia schedules itself to watch the signal back under setpoint.
            await sb.from('agent_ordines').insert({
                area: 'producto', agent: 'vigia', kind: 'watch',
                description: `Vigilar ${b.signalKey} hasta que vuelva bajo ${b.setpoint}.`,
                status: 'open', origin: 'self',
                metadata: { incident_id: incidentId, signal_key: b.signalKey },
            }).then(() => {}, () => {});
        }
    }

    // SECOND TRIGGER (spec seccion 5): the Bandeja count itself pushes Telegram + email.
    // Per-incident alerts above fire on open; this digest fires whenever this run opened at
    // least one new incident, reporting the TOTAL awaiting-approval backlog so the operator
    // sees the queue size (the count change), not just the latest item.
    if (opened > 0) {
        const { count: pendingCount } = await sb.from('incidents')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'awaiting_approval');
        const pending = pendingCount ?? 0;
        if (pending > 0) {
            await alert(
                'medio',
                `Bandeja: ${pending} ${pending === 1 ? 'decision espera' : 'decisiones esperan'} aprobacion`,
                `Vigia abrio ${opened} ${opened === 1 ? 'incidente' : 'incidentes'} en esta ronda. Hay ${pending} en total esperando tu decision.`,
            );
        }
    }

    // VERIFY-LOOP: re-check incidents in 'verifying'. Resolve only when the breached signal
    // is back under setpoint. A silently-failed fix cannot false-resolve (mirrors
    // detectLogic.shouldResolveVerifying: resolve ONLY when entities checked AND none broken).
    {
        const { data: verifying } = await sb.from('incidents')
            .select('id, action_key, entity_ref, proposed_action, summary')
            .eq('area', 'producto').eq('status', 'verifying').limit(50);
        for (const inc of verifying ?? []) {
            const actionType = (inc.proposed_action as { type?: string })?.type;
            let backUnder = false;
            let recheck: Record<string, unknown> = {};
            if (actionType === 'trigger_report_recovery' || actionType === 'resend_email' || actionType === 'retry') {
                const ids = String(inc.entity_ref ?? '').split(',').filter(Boolean);
                if (ids.length) {
                    const { data: still } = await sb.from('perfilamientos')
                        .select('id, ai_sections, email_sent_at').in('id', ids);
                    const stillBroken = (still ?? []).filter(s =>
                        actionType === 'trigger_report_recovery' || actionType === 'retry'
                            ? s.ai_sections == null
                            : s.email_sent_at == null,
                    ).length;
                    backUnder = ids.length > 0 && stillBroken === 0;
                    recheck = { still_broken: stillBroken, total: ids.length };
                }
            }
            if (backUnder) {
                await sb.from('incidents').update({
                    status: 'resolved', resolved_at: new Date().toISOString(),
                    verified_at: new Date().toISOString(),
                    verification_result: { signal_back_under_setpoint: true, ...recheck },
                }).eq('id', inc.id);
                await sb.from('system_activity_log').insert({
                    area: 'producto', source_type: 'controller', event_type: 'health_check',
                    actor: 'vigia', action: 'incident_resolved', severity: 'sano', status: 'success',
                    result: { signal_back_under_setpoint: true, ...recheck },
                    incident_id: inc.id, occurred_at: new Date().toISOString(),
                });
            }
        }
    }

    // Heartbeat: mark the detector itself alive (dead-man's-switch source).
    await sb.from('health_checks').insert({
        area: 'producto', loop_id: 'dashboards', signal_key: 'principia_detect_heartbeat',
        source_type: 'cron', source_ref: 'principia-detect', shape: 'threshold',
        measured_value: breaches.length, setpoint_value: 0, comparator: '>=', unit: 'breaches',
        breached: false, severity: 'sano', checked_at: new Date().toISOString(),
        last_successful_check_at: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, breaches: breaches.length, opened });
}

async function writeHealthCheck(
    sb: SupabaseClient, loopId: string, signalKey: string, sourceRef: string,
    measured: number, setpoint: number, comparator: '<' | '>', breached: boolean,
) {
    await sb.from('health_checks').insert({
        area: 'producto', loop_id: loopId, signal_key: signalKey,
        source_type: 'table', source_ref: sourceRef, shape: 'threshold',
        measured_value: measured, setpoint_value: setpoint, comparator, unit: 'count',
        breached, severity: breached ? 'medio' : 'sano',
        checked_at: new Date().toISOString(), last_successful_check_at: new Date().toISOString(),
    });
}
