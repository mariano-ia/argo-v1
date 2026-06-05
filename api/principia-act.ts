import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const EXECUTABLE = new Set(['retry', 'resend_email', 'trigger_report_recovery']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'Invalid token' });
    const adminEmail = userData.user.email;
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', adminEmail).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    const { incident_id, decision } = req.body ?? {};
    if (!incident_id || !['approve', 'reject', 'snooze'].includes(decision)) {
        return res.status(400).json({ error: 'incident_id and a valid decision are required' });
    }

    const { data: incident } = await sb.from('incidents').select('*').eq('id', incident_id).maybeSingle();
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // reject / snooze: governance double-write, no actuator.
    if (decision === 'reject' || decision === 'snooze') {
        const newStatus = decision === 'reject' ? 'resolved' : 'snoozed';
        await sb.from('incidents').update({
            status: newStatus,
            resolved_at: decision === 'reject' ? new Date().toISOString() : null,
            resolution: { decision, by: adminEmail },
        }).eq('id', incident_id);
        await governanceDoubleWrite(sb, adminEmail, decision, incident, 'success', { newStatus });
        return res.status(200).json({ ok: true, status: newStatus });
    }

    // approve: PR/rollback/feature_flag are proposals only.
    const actionType = incident.proposed_action?.type as string;
    if (!EXECUTABLE.has(actionType)) {
        return res.status(409).json({ error: 'manual', message: 'Esta propuesta se ejecuta de forma manual.', actionType });
    }

    // Idempotency guard (Fix 6): has this (incident_id, action_key) already executed?
    const { data: prior } = await sb.from('system_activity_log')
        .select('id').eq('incident_id', incident_id).eq('action', `actuator:${actionType}`)
        .in('status', ['success', 'auto_executed']).limit(1).maybeSingle();
    if (prior) return res.status(200).json({ ok: true, idempotent: true, note: 'already executed' });

    // Move to acting.
    await sb.from('incidents').update({ status: 'acting' }).eq('id', incident_id);

    // Execute the actuator.
    // BACKEND REALITY (grounded against api/send-email.ts):
    //   - send-email does NOT accept/parse a `resend` body param, and it early-returns
    //     { already_sent:true } whenever email_sent_at is set. It also does NOT regenerate
    //     ai_sections; it needs ai_sections present to build the email.
    //   Therefore:
    //   - resend_email  (email_sent_at null, ai_sections present) -> POST /api/send-email
    //     works as-is (no `resend` flag needed; we don't send one).
    //   - retry / trigger_report_recovery (ai_sections null) -> regenerate AI FIRST via
    //     /api/generate-ai (which auto-sends the email on completion, like report-recovery-cron),
    //     NOT send-email (which would no-op on a null-ai_sections session).
    const base = process.env.SITE_URL || 'https://www.argomethod.com';
    let execResult: Record<string, unknown> = {};
    let execOk = false;
    try {
        if (actionType === 'trigger_report_recovery') {
            const r = await fetch(`${base}/api/report-recovery-cron?secret=${process.env.CRON_SECRET ?? ''}`);
            execOk = r.ok; execResult = { triggered: 'report-recovery-cron', status: r.status };
        } else if (actionType === 'retry') {
            // ai_sections null: regenerate the report (generate-ai auto-sends the email).
            const ids = String(incident.entity_ref ?? '').split(',').filter(Boolean);
            const outcomes: Array<{ id: string; ok: boolean }> = [];
            for (const id of ids) {
                const r = await fetch(`${base}/api/generate-ai`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: id }),
                });
                outcomes.push({ id, ok: r.ok });
            }
            execOk = outcomes.length > 0 && outcomes.every(o => o.ok);
            execResult = { regenerated: outcomes };
        } else if (actionType === 'resend_email') {
            // email_sent_at null with ai_sections present: send-email builds + delivers.
            const ids = String(incident.entity_ref ?? '').split(',').filter(Boolean);
            const outcomes: Array<{ id: string; ok: boolean }> = [];
            for (const id of ids) {
                const r = await fetch(`${base}/api/send-email`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: id }),
                });
                outcomes.push({ id, ok: r.ok });
            }
            execOk = outcomes.length > 0 && outcomes.every(o => o.ok);
            execResult = { resent: outcomes };
        }
    } catch (e) {
        execResult = { error: e instanceof Error ? e.message : String(e) };
    }

    // Record execution (idempotency anchor) + move to verifying.
    await sb.from('incidents').update({ status: 'verifying' }).eq('id', incident_id);
    await sb.from('system_activity_log').insert({
        area: incident.area, source_type: 'actuator', event_type: 'ai_decision',
        actor: adminEmail, action: `actuator:${actionType}`,
        severity: execOk ? 'sano' : 'medio', status: execOk ? 'success' : 'failed',
        result: execResult, incident_id, occurred_at: new Date().toISOString(),
    });
    await governanceDoubleWrite(sb, adminEmail, 'approve', incident, execOk ? 'success' : 'failed', { actionType, ...execResult });

    return res.status(200).json({ ok: execOk, status: 'verifying', result: execResult });
}

/**
 * Governance double-write: every human Approve/Reject/Snooze writes BOTH
 * admin_audit_log (authoritative) AND system_activity_log (navigable timeline),
 * cross-linked via related_logs.
 */
async function governanceDoubleWrite(
    sb: SupabaseClient, adminEmail: string, decision: string,
    incident: { id: number; area: string; title?: string },
    status: 'success' | 'failed', details: Record<string, unknown>,
) {
    let auditId: string | null = null;
    try {
        const { data } = await sb.from('admin_audit_log').insert({
            admin_email: adminEmail, action: `principia-${decision}`,
            target_type: 'incident', target_id: String(incident.id),
            details: { title: incident.title, ...details },
        }).select('id').single();
        auditId = data?.id ?? null;
    } catch { /* non-blocking */ }
    try {
        await sb.from('system_activity_log').insert({
            area: incident.area, source_type: 'human', event_type: 'user_action',
            actor: adminEmail, action: `principia_${decision}`,
            resource_type: 'incident', resource_id: String(incident.id),
            severity: 'sano', status,
            related_logs: auditId ? [`admin_audit_log.${auditId}`] : null,
            incident_id: incident.id, occurred_at: new Date().toISOString(),
        });
    } catch { /* non-blocking */ }
}
