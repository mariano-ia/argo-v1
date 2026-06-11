import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Golden end-to-end journey canary (daily).
//
// The synthetic monitor (qa-monitor) probes each endpoint in isolation
// ("does generate-ai answer 200?"). This canary instead exercises the WHOLE real
// user journey as the QA tenant, in order, the way a real coach+child would:
//
//   start-play → generate-ai → save session → send the report email → clean up
//
// It is the only signal that proves the chain is actually wired together — most
// importantly that an email genuinely gets sent (Resend accepted it), which no
// other check verifies. Runs as the QA tenant, emails the QA inbox, marks the
// session is_demo, and hard-deletes it afterward (and any leftovers from a prior
// failed run) so it never pollutes prod data or the roster.
//
// On any step failing it alerts through email + Telegram (same channels as
// qa-monitor) and records the failure; on success it writes a health_checks
// heartbeat so qa-monitor's dead-man's-switch (CHECK 9) catches it going silent.
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 120; // generate-ai alone is 15-27s; give the chain room.

const CANARY_CHILD_NAME = 'Journey Canary'; // stable marker for cleanup
const CANARY_TEAM_CHILD = 'Journey Canary Plantel'; // marker for the per-plantel attribution check
const STEP_TIMEOUT_MS = 60_000;

type StepResult = { step: string; ok: boolean; detail: string };

// Fixed, schema-valid report for the generate-ai call (serverless can't import
// argosEngine from ../src). Mirrors the minimal shape the real client sends.
function canaryReport() {
  return {
    nombre: CANARY_CHILD_NAME,
    arquetipo: { id: 'sostenedor-ritmico', eje: 'S', motor: 'Medio', label: 'Sostenedor Rítmico' },
    perfil: 'Perfil de prueba del canary.',
    bienvenida: 'Hola.',
    wow: 'Dato wow.',
    motorDesc: 'Motor rítmico.',
    combustible: 'Se enciende con un rol claro.',
    grupoEspacio: 'Aporta estabilidad al grupo.',
    corazon: 'Quiere que el equipo funcione.',
    reseteo: 'Respira y vuelve a su ritmo.',
    ecos: 'Frases que resuenan.',
    checklist: { antes: 'a', durante: 'b', despues: 'c' },
    palabrasPuente: ['equipo', 'constancia'],
    palabrasRuido: ['apuro'],
    guia: [{ situacion: 'derrota', activador: 'calma', desmotivacion: 'caos' }],
  };
}

// fetch with one retry on a transient 5xx / network error + a hard timeout, so a
// single platform blip on a once-a-day canary doesn't page. A sustained failure
// still surfaces. Mirrors qa-monitor's fetchProbe.
async function call(url: string, init: RequestInit): Promise<{ status: number; body: Record<string, unknown> }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), STEP_TIMEOUT_MS);
    try {
      const r = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(timer);
      if (r.status >= 500 && attempt === 0) { await new Promise(res => setTimeout(res, 2000)); continue; }
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      return { status: r.status, body };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt === 0) { await new Promise(res => setTimeout(res, 2000)); continue; }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// Inline alert (email + Telegram). qa-monitor's sendAlert can't be imported
// (serverless functions here don't bundle cross-file imports), so mirror it.
async function alert(failures: StepResult[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
  const lines = failures.map(f => `- ${f.step}: ${f.detail}`).join('\n');
  const body = `El canary de viaje completo (journey-canary) falló:\n\n${lines}\n\nRevisa los logs de Vercel del endpoint /api/journey-canary.`;
  if (apiKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Argo QA <qa@argomethod.com>',
        to, subject: `[Argo QA] journey-canary FAILED (${failures.length})`, text: body,
      }),
    }).catch(() => {});
  }
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgChat, text: `[Argo QA] journey-canary FAILED\n\n${body}` }),
    }).catch(() => {});
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Protect like the other crons.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  const base = process.env.SITE_URL || 'https://www.argomethod.com';
  const slug = process.env.QA_TENANT_SLUG || 'qa-robot';
  const toEmail = process.env.QA_TENANT_EMAIL || process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });
  const sb = createClient(supabaseUrl, serviceKey);

  const failures: StepResult[] = [];
  let tenantId: string | null = null;
  let createdSessionId: string | null = null;

  try {
    // STEP 1 — start-play (roster capacity + signed play_token).
    let playToken = '';
    try {
      const { status, body } = await call(`${base}/api/start-play`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (status !== 200 || body.ok !== true || !body.play_token) {
        failures.push({ step: 'start-play', ok: false, detail: `status=${status} body=${JSON.stringify(body).slice(0, 200)}` });
      } else {
        tenantId = String(body.tenant_id);
        playToken = String(body.play_token);
      }
    } catch (e) { failures.push({ step: 'start-play', ok: false, detail: String(e) }); }

    // STEP 2 — generate-ai (the AI report).
    let sections: Record<string, unknown> | null = null;
    let usage: Record<string, unknown> = {};
    try {
      const { status, body } = await call(`${base}/api/generate-ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: canaryReport(),
          context: { nombre: CANARY_CHILD_NAME, deporte: 'futbol', edad: 12, destinatario: 'entrenador', lang: 'es' },
        }),
      });
      const s = (body as { sections?: Record<string, unknown> }).sections;
      if (status !== 200 || !s || typeof s.resumenPerfil !== 'string') {
        failures.push({ step: 'generate-ai', ok: false, detail: `status=${status} hasSections=${!!s}` });
      } else {
        sections = s;
        usage = (body as { usage?: Record<string, unknown> }).usage ?? {};
      }
    } catch (e) { failures.push({ step: 'generate-ai', ok: false, detail: String(e) }); }

    // STEP 3 — save the session (persistence + tenant attribution gate).
    let shareToken = '';
    if (tenantId && playToken) {
      try {
        const { status, body } = await call(`${base}/api/session`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            adult_name: 'Canary', adult_email: toEmail,
            child_name: CANARY_CHILD_NAME, child_age: 12,
            eje: 'S', motor: 'Medio', archetype_label: 'Sostenedor Rítmico',
            tenant_id: tenantId, play_token: playToken, lang: 'es',
            ai_tokens_input: usage.inputTokens ?? 0, ai_tokens_output: usage.outputTokens ?? 0,
            ai_cost_usd: usage.costUsd ?? 0,
            is_demo: true,
          }),
        });
        if (status !== 200 || body.ok !== true || !body.id) {
          failures.push({ step: 'save-session', ok: false, detail: `status=${status} body=${JSON.stringify(body).slice(0, 200)}` });
        } else {
          createdSessionId = String(body.id);
          shareToken = String(body.share_token ?? '');
        }
      } catch (e) { failures.push({ step: 'save-session', ok: false, detail: String(e) }); }
    } else if (!failures.some(f => f.step === 'start-play')) {
      failures.push({ step: 'save-session', ok: false, detail: 'skipped: no play_token from start-play' });
    }

    // STEP 4 — send the report email (the chain's real promise; nothing else
    // verifies this end-to-end). Resend accepting it (200) is the success signal.
    if (createdSessionId && sections) {
      try {
        const { status, body } = await call(`${base}/api/send-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail, nombreAdulto: 'Canary', nombreNino: CANARY_CHILD_NAME,
            deporte: 'futbol', edad: 12, eje: 'S', motor: 'Medio',
            arquetipo: 'Sostenedor Rítmico', perfil: 'Perfil de prueba del canary.',
            palabrasPuente: ['equipo', 'constancia'],
            sessionId: createdSessionId, shareToken, lang: 'es',
            resumenPerfil: String(sections.resumenPerfil ?? ''),
            emailSubject: '[QA] Journey canary (ignorar)',
          }),
        });
        if (status !== 200 || (body as { success?: boolean }).success !== true) {
          failures.push({ step: 'send-email', ok: false, detail: `status=${status} body=${JSON.stringify(body).slice(0, 200)}` });
        }
      } catch (e) { failures.push({ step: 'send-email', ok: false, detail: String(e) }); }
    } else if (!failures.length) {
      failures.push({ step: 'send-email', ok: false, detail: 'skipped: no session/sections' });
    }

    // STEP 5 — per-plantel attribution. The flow above exercises the institution
    // link; coaches share PER-PLANTEL links, so this is the only signal that team
    // attribution (start-play w/ team_slug -> session save -> group_members row)
    // actually works end-to-end. Without it, a silent break in ensureTeamMembership
    // would make players vanish from coach rosters while the canary stayed green.
    if (tenantId) {
      try {
        // Ensure the QA tenant has a plantel to attribute to (idempotent: reuse or create).
        let teamSlug = '';
        let teamId = '';
        const { data: existingTeam } = await sb.from('groups')
          .select('id, slug').eq('tenant_id', tenantId).is('deleted_at', null).limit(1).maybeSingle();
        if (existingTeam && existingTeam.slug) { teamSlug = existingTeam.slug; teamId = existingTeam.id; }
        else {
          const { data: newTeam } = await sb.from('groups')
            .insert({ tenant_id: tenantId, name: 'Canary Plantel' }).select('id, slug').single();
          teamSlug = newTeam && newTeam.slug ? newTeam.slug : '';
          teamId = newTeam && newTeam.id ? newTeam.id : '';
        }
        if (!teamSlug || !teamId) {
          failures.push({ step: 'plantel-attribution', ok: false, detail: 'could not resolve a QA plantel slug' });
        } else {
          const sp = await call(`${base}/api/start-play`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, team_slug: teamSlug }),
          });
          const teamToken = String(sp.body.play_token ?? '');
          if (sp.status !== 200 || sp.body.ok !== true || !teamToken) {
            failures.push({ step: 'plantel-start-play', ok: false, detail: `status=${sp.status} body=${JSON.stringify(sp.body).slice(0, 160)}` });
          } else {
            const sv = await call(`${base}/api/session`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'save', adult_name: 'Canary', adult_email: toEmail,
                child_name: CANARY_TEAM_CHILD, child_age: 12,
                eje: 'S', motor: 'Medio', archetype_label: 'Sostenedor Rítmico',
                tenant_id: tenantId, play_token: teamToken, lang: 'es', is_demo: true,
              }),
            });
            const teamSessionId = String(sv.body.id ?? '');
            if (sv.status !== 200 || sv.body.ok !== true || !teamSessionId) {
              failures.push({ step: 'plantel-save-session', ok: false, detail: `status=${sv.status} body=${JSON.stringify(sv.body).slice(0, 160)}` });
            } else {
              const { data: gm } = await sb.from('group_members')
                .select('id').eq('group_id', teamId).eq('session_id', teamSessionId).maybeSingle();
              if (!gm) {
                failures.push({ step: 'plantel-attribution', ok: false, detail: 'session saved but not attributed to the plantel (no group_members row)' });
              }
            }
          }
        }
      } catch (e) { failures.push({ step: 'plantel-attribution', ok: false, detail: String(e) }); }
    }
  } finally {
    // Cleanup — ALWAYS, even on failure. Hard-delete every canary session for the
    // QA tenant (self-healing: clears leftovers from a prior crashed run too), so
    // the roster stays clean and is_demo rows never accumulate. Children FK rows
    // (feedback/chat_messages/...) are deleted first in case any exist.
    try {
      let q = sb.from('sessions').select('id').in('child_name', [CANARY_CHILD_NAME, CANARY_TEAM_CHILD]).eq('is_demo', true);
      if (tenantId) q = q.eq('tenant_id', tenantId);
      const { data: stale } = await q;
      const ids = (stale ?? []).map((r: { id: string }) => r.id);
      if (ids.length) {
        await sb.from('feedback').delete().in('session_id', ids).then(() => {}, () => {});
        await sb.from('chat_messages').delete().in('session_id', ids).then(() => {}, () => {});
        await sb.from('group_members').delete().in('session_id', ids).then(() => {}, () => {});
        await sb.from('sessions').delete().in('id', ids);
      }
    } catch (e) { console.warn('[journey-canary] cleanup failed (non-fatal):', e); }
  }

  // Heartbeat — let qa-monitor's dead-man's-switch (CHECK 9) notice if this cron
  // silently stops. Only on a fully successful run, so a heartbeat means the whole
  // chain worked, not just that the function booted.
  const ok = failures.length === 0;
  const at = new Date().toISOString();
  if (ok) {
    try {
      await sb.from('health_checks').insert({
        area: 'sistema', signal_key: 'journey-canary_heartbeat', source_type: 'cron', source_ref: 'journey-canary',
        shape: 'threshold', measured_value: 0, setpoint_value: 0, comparator: '>=', unit: 'runs',
        breached: false, severity: 'sano', checked_at: at, last_successful_check_at: at,
      });
    } catch (e) { console.warn('[journey-canary] heartbeat failed:', e); }
  }

  // Record the run + alert on failure.
  try {
    await sb.from('system_activity_log').insert({
      area: 'producto', source_type: 'cron', event_type: 'health_check', actor: 'system',
      action: 'journey_canary_run', severity: ok ? 'sano' : 'medio', status: ok ? 'success' : 'failed',
      result: { ok, failed: failures.length, failing: failures.map(f => f.step) }, occurred_at: at,
    });
  } catch { /* non-blocking */ }

  if (!ok) await alert(failures);
  return res.status(ok ? 200 : 500).json({ ok, failures, session_cleaned: createdSessionId ?? null });
}
