import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// This monitor makes several multi-second calls in one invocation (generate-ai
// is 15-27s, the coach canary hits tenant-chat, plus 13 boot probes) and may now
// retry the AI probe once on a transient 5xx. Give it explicit headroom so the
// monitor itself never times out mid-run and silently skips its own activity-log
// write / dead-man's-switch heartbeat.
export const maxDuration = 120;

type Check = { name: string; ok: boolean; detail?: string };

type AlertResult = {
  email: 'sent' | 'error' | 'skipped (no RESEND_API_KEY)';
  telegram: { attempted: boolean; ok?: boolean; description?: string };
};

async function sendAlert(failures: Check[]): Promise<AlertResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
  const lines = failures.map(f => `- ${f.name}: ${f.detail ?? 'failed'}`).join('\n');
  const body = `El monitor sintético detectó fallas en producción:\n\n${lines}\n\nRevisa los logs de Vercel.`;
  const result: AlertResult = { email: 'skipped (no RESEND_API_KEY)', telegram: { attempted: false } };

  // Email (Resend) — the mandatory floor.
  if (apiKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Argo QA <qa@argomethod.com>',
          to,
          subject: `[Argo QA] ${failures.length} check(s) FAILED`,
          text: body,
        }),
      });
      result.email = r.ok ? 'sent' : 'error';
      if (!r.ok) console.warn('[qa-monitor] Resend send failed:', r.status, await r.text().catch(() => ''));
    } catch (e) { result.email = 'error'; console.warn('[qa-monitor] Resend threw:', e); }
  }

  // Telegram — second channel, using the same creds principia-detect/Vigía uses.
  // Surfaces the API result instead of swallowing it (email-only alerting was the
  // gap that made a Resend hiccup invisible; a swallowed Telegram error is the same
  // trap). Plain text (no parse_mode) so check names with '_' or '*' never break
  // Telegram's Markdown parser.
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    result.telegram.attempted = true;
    try {
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text: `[Argo QA] ${failures.length} check(s) FAILED\n\n${body}` }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; description?: string };
      result.telegram.ok = !!j.ok;
      if (!j.ok) {
        result.telegram.description = String(j.description ?? `http ${r.status}`);
        console.warn('[qa-monitor] Telegram send failed:', result.telegram.description);
      }
    } catch (e) {
      result.telegram.ok = false;
      result.telegram.description = e instanceof Error ? e.message : String(e);
      console.warn('[qa-monitor] Telegram threw:', result.telegram.description);
    }
  }
  return result;
}

// Minimal but schema-valid ReportData for the generate-ai smoke check.
function minimalReport() {
  return {
    nombre: 'QA Kid',
    arquetipo: { id: 'impulsor-dinamico', eje: 'D', motor: 'Rápido', label: 'Impulsor Dinámico' },
    perfil: 'Perfil de prueba.',
    bienvenida: 'Hola.',
    wow: 'Dato wow.',
    motorDesc: 'Motor rápido.',
    combustible: 'Se enciende con desafíos.',
    grupoEspacio: 'En grupo lidera.',
    corazon: 'Quiere ganar.',
    reseteo: 'Respira y reencuadra.',
    ecos: 'Frases que resuenan.',
    checklist: { antes: 'a', durante: 'b', despues: 'c' },
    palabrasPuente: ['vamos', 'decisión'],
    palabrasRuido: ['quizás'],
    guia: [{ situacion: 'derrota', activador: 'reto', desmotivacion: 'crítica vacía' }],
  };
}

// Probe fetch that retries ONCE on a transient 5xx or network error before
// reporting the result. The AI endpoints take 15-27s and a single slow call can
// exceed its own maxDuration and return a platform 5xx; that blip self-recovers
// and report-recovery-cron backstops any real user, so one bad sample must not
// page a human at 3am. A sustained failure (both attempts fail) still surfaces
// the real status and alerts. The common case (200 on the first try) pays no
// extra cost. Throws only if BOTH attempts throw (true unreachable endpoint).
async function fetchProbe(url: string, init: RequestInit): Promise<{ status: number; body: Record<string, unknown> }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, init);
      // Retry a 5xx only on the first attempt; otherwise return the real status.
      if (r.status >= 500 && attempt === 0) {
        await new Promise(res => setTimeout(res, 2000));
        continue;
      }
      const body = await r.json().catch(() => ({} as Record<string, unknown>));
      return { status: r.status, body };
    } catch (e) {
      lastErr = e;
      if (attempt === 0) { await new Promise(res => setTimeout(res, 2000)); continue; }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Protect like the other crons.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  // On-demand alert-channel self-test: `?selftest=1` fires one test alert through
  // every channel (email + Telegram) and returns, WITHOUT running the checks. Lets us
  // prove the alerting pipeline end-to-end without waiting for (or faking) a real
  // failure. Still behind CRON_SECRET, so it can't be used to spam the owner.
  if (req.query.selftest) {
    const delivery = await sendAlert([{ name: 'selftest', ok: false, detail: 'Prueba manual del canal de alertas. Si ves esto, las alertas del monitor te llegan bien.' }]);
    return res.status(200).json({ ok: true, selftest: 'fired', delivery });
  }

  // Telegram setup helper (behind CRON_SECRET): `?tgdebug=1` returns the bot's
  // @username, the currently-configured chat_id, and the distinct chats that have
  // messaged the bot (via getUpdates). Used to find the owner's real chat_id after
  // they /start the bot — the configured id was the bot's own (it can't message
  // itself). Reads the runtime token; never returns it.
  if (req.query.tgdebug) {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (!tgToken) return res.status(200).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN unset at runtime' });
    const me = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`).then(r => r.json()).catch(() => ({}));
    const upd = await fetch(`https://api.telegram.org/bot${tgToken}/getUpdates`).then(r => r.json()).catch(() => ({}));
    type TgChat = { id: number; type: string; first_name?: string; username?: string; title?: string };
    const updResult = ((upd as { result?: Array<{ message?: { chat?: TgChat } }> }).result) ?? [];
    const chats = Array.from(
      new Map(updResult.map(u => u.message?.chat).filter((c): c is TgChat => !!c).map(c => [c.id, c])).values()
    );
    return res.status(200).json({
      ok: true,
      bot: { username: (me as { result?: { username?: string; id?: number } }).result?.username, id: (me as { result?: { id?: number } }).result?.id },
      configured_chat_id: tgChat,
      getUpdates_ok: (upd as { ok?: boolean }).ok ?? false,
      getUpdates_error: (upd as { description?: string }).description,
      chats_that_messaged_bot: chats,
    });
  }

  const base = process.env.SITE_URL || 'https://www.argomethod.com';
  const slug = process.env.QA_TENANT_SLUG || 'qa-robot';
  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push({ name, ok, detail });

  // CHECK 1: start-play returns capacity for the QA tenant.
  try {
    const { status, body } = await fetchProbe(`${base}/api/start-play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    add('start-play 200 + ok', status === 200 && (body as { ok?: boolean }).ok === true, `status=${status}`);
  } catch (e) { add('start-play reachable', false, String(e)); }

  // CHECK 2: generate-ai produces valid sections for a fixed report.
  // Retries once on a transient 5xx (the AI call is slow and can occasionally
  // exceed maxDuration on a single sample); only a sustained failure pages.
  try {
    const { status, body } = await fetchProbe(`${base}/api/generate-ai`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report: minimalReport(),
        context: { nombre: 'QA Kid', deporte: 'futbol', edad: 10, destinatario: 'entrenador', lang: 'es' },
      }),
    });
    const sections = (body as { sections?: { resumenPerfil?: unknown } }).sections;
    add('generate-ai 200 + sections', status === 200 && typeof sections?.resumenPerfil === 'string', `status=${status}`);
  } catch (e) { add('generate-ai reachable', false, String(e)); }

  // CHECK 3: DB integrity — no _pending sessions stuck for the QA tenant.
  try {
    const { data: tenant } = await sb.from('tenants').select('id').eq('slug', slug).single();
    const { count } = await sb.from('sessions').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant?.id).eq('eje', '_pending');
    add('no stuck _pending QA sessions', (count ?? 0) < 5, `pending=${count}`);
  } catch (e) { add('DB reachable', false, String(e)); }

  // CHECK 4: cron endpoints are protected.
  try {
    const { status } = await fetchProbe(`${base}/api/blog-cron`, {});
    add('blog-cron protected', status === 401 || status === 403, `status=${status}`);
  } catch (e) { add('blog-cron reachable', false, String(e)); }

  // CHECK 5: AI-failed reports — sessions that finished profiling (real eje)
  // but have no ai_sections in the last 24h. With the "never email a report
  // without AI" change, these are real plays whose report was NOT delivered
  // and must be regenerated. Any such session should page ops.
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await sb.from('sessions').select('*', { count: 'exact', head: true })
      .neq('eje', '_pending')
      .is('ai_sections', null)
      .gte('created_at', cutoff);
    add('no AI-failed reports (24h)', (count ?? 0) === 0, `undelivered=${count}`);
  } catch (e) { add('AI-failure check reachable', false, String(e)); }

  // CHECK 6: Argo Coach quality telemetry (ai_events, last 24h). This is the
  // production signal for hallucination / bug #2 / provider outages / latency.
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: events, error } = await sb.from('ai_events')
      .select('provider, groundtruth_violation, label_violation, prohibited_after_retry, latency_ms')
      .eq('source', 'tenant-chat')
      .gte('created_at', cutoff);
    if (error) {
      // Table not migrated yet → skip rather than page.
      add('coach telemetry', true, `skipped: ${error.message}`);
    } else {
      const ev = events ?? [];
      const total = ev.length;
      if (total === 0) {
        add('coach telemetry present', true, 'no chat traffic in 24h');
      } else {
        const gt = ev.filter(e => e.groundtruth_violation).length;
        const lbl = ev.filter(e => e.label_violation).length;
        const leaked = ev.filter(e => e.prohibited_after_retry).length;
        const openai = ev.filter(e => e.provider === 'openai').length;
        const lat = ev.map(e => e.latency_ms ?? 0).sort((a, b) => a - b);
        const p95 = lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] ?? 0;
        // P0: a forbidden label or prohibited copy reached a coach.
        add('coach: no forbidden-label served', lbl === 0, `label_violations=${lbl}/${total}`);
        add('coach: no prohibited copy served', leaked === 0, `prohibited_after_retry=${leaked}/${total}`);
        // P0: ground-truth (wrong-axis) violation rate under 2%.
        add('coach: ground-truth violation rate < 2%', gt / total < 0.02, `gt=${gt}/${total}`);
        // P0: Gemini health — OpenAI fallback share under 10%.
        add('coach: OpenAI fallback share < 10%', openai / total < 0.10, `openai=${openai}/${total}`);
        // P1: p95 latency under 15s.
        add('coach: p95 latency < 15s', p95 < 15000, `p95=${p95}ms`);
      }
    }
  } catch (e) { add('coach telemetry reachable', false, String(e)); }

  // CHECK 7: Argo Coach live canary (end-to-end). Logs in at runtime as the QA
  // tenant user (Supabase access tokens expire in ~1h, so a static token would
  // be stale by the time the daily cron runs), then asks a canonical-naming
  // question and asserts the answer uses the new name and never an old forbidden
  // label — catches bug #2 / KB regressions the wrong-axis telemetry can't.
  // Needs QA_COACH_EMAIL + QA_COACH_PASSWORD; skipped silently when absent.
  const qaEmail = process.env.QA_COACH_EMAIL;
  const qaPassword = process.env.QA_COACH_PASSWORD;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supaUrl = process.env.VITE_SUPABASE_URL;
  if (qaEmail && qaPassword && anonKey && supaUrl) {
    try {
      const tokenRes = await fetch(`${supaUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: qaEmail, password: qaPassword }),
      });
      const access = ((await tokenRes.json().catch(() => ({}))) as { access_token?: string }).access_token;
      if (!access) {
        add('coach canary: QA login', false, `login status=${tokenRes.status}`);
      } else {
        const { status, body: b } = await fetchProbe(`${base}/api/tenant-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
          body: JSON.stringify({ message: 'En una frase, ¿cómo se llama el perfil de eje S con motor Medio?', lang: 'es' }),
        });
        const text = String((b as { message?: { content?: string } }).message?.content ?? '').toLowerCase();
        // Accent-insensitive so a valid "ritmico" (no accent) doesn't false-page.
        const norm = text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const FORBIDDEN = ['sosten confiable', 'el tanque', 'la brujula', 'impulsor decidido', 'estratega reactivo', 'conector relacional'];
        add('coach canary: responds 200', status === 200 && text.length > 0, `status=${status}`);
        add('coach canary: canonical naming (S+Medio = Sostenedor Rítmico)', norm.includes('sostenedor') && norm.includes('ritmico'), text.slice(0, 80));
        add('coach canary: no forbidden old label', !FORBIDDEN.some(f => norm.includes(f)));
      }
    } catch (e) { add('coach canary reachable', false, String(e)); }
  }

  // CHECK: Principia detector dead-man's-switch (out-of-band). If principia-detect
  // hasn't written its heartbeat in 25 min (2.5x its 10-min cadence), the cockpit
  // may show lying-green; page via the independent qa-monitor channel.
  try {
    const hbCutoff = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    const { data: hb } = await sb.from('health_checks')
      .select('checked_at').eq('source_ref', 'principia-detect')
      .order('checked_at', { ascending: false }).limit(1).maybeSingle();
    add('principia detector alive', !!hb && hb.checked_at >= hbCutoff,
        hb ? `last heartbeat ${hb.checked_at}` : 'no heartbeat row');
  } catch (e) { add('principia detector reachable', false, String(e)); }

  // CHECK 9: cron liveness dead-man's-switch. Each functional cron writes a
  // health_checks heartbeat per run (source_ref=<cron>). If a heartbeat exists
  // but is older than ~2.5x the cron's cadence, that cron silently stopped or
  // died after boot — page ops. No heartbeat row yet (just deployed / not run
  // since) is grace, not an alarm, so this never false-fires on rollout.
  const CRON_MAX_STALE_MIN: Record<string, number> = {
    'report-recovery-cron': 30,     // runs every 5 min
    'retention-cron': 2880,         // daily
    'puentes-reminder-cron': 2880,  // daily
    'puentes-sync-cron': 2880,      // daily
    'trial-lifecycle-cron': 2880,   // daily
    'blog-cron': 11520,             // Mon/Thu
  };
  for (const [ref, maxMin] of Object.entries(CRON_MAX_STALE_MIN)) {
    try {
      const { data: chb } = await sb.from('health_checks')
        .select('checked_at').eq('source_ref', ref)
        .order('checked_at', { ascending: false }).limit(1).maybeSingle();
      const cutoff = new Date(Date.now() - maxMin * 60 * 1000).toISOString();
      const ok = !chb || (chb.checked_at as string) >= cutoff;
      add(`cron alive: ${ref}`, ok, chb ? `last heartbeat ${chb.checked_at}` : 'no heartbeat yet (grace)');
    } catch (e) { add(`cron heartbeat readable: ${ref}`, false, String(e)); }
  }

  // CHECK 8: no critical api endpoint returns a 5xx on boot. An import/boot crash
  // (e.g. ERR_MODULE_NOT_FOUND from a cross-directory import) makes a function 500
  // BEFORE its handler runs, leaving zero DB rows — invisible to every passive check
  // above. We probe each endpoint with an inert/unauthenticated payload: a healthy
  // function answers 4xx (bad request / auth-required), a broken one answers 5xx.
  // This is the check that would have caught the 2026-06-05 ERR_MODULE_NOT_FOUND
  // outage (create-tenant / session / one-webhook / send-email / *-cron). The probes
  // are side-effect-free (empty body 400s, unauth crons 401, admin 403).
  const bootProbes: { path: string; method: 'GET' | 'POST' }[] = [
    { path: '/api/create-tenant', method: 'POST' },
    { path: '/api/session', method: 'POST' },
    { path: '/api/send-email', method: 'POST' },
    { path: '/api/one-webhook', method: 'POST' },
    { path: '/api/one-start-play', method: 'POST' },
    { path: '/api/tenant-info', method: 'GET' },
    { path: '/api/report-recovery-cron', method: 'GET' },
    { path: '/api/trial-lifecycle-cron', method: 'GET' },
    { path: '/api/blog-cron', method: 'GET' },
    { path: '/api/retention-cron', method: 'GET' },
    { path: '/api/puentes-reminder-cron', method: 'GET' },
    { path: '/api/puentes-sync-cron', method: 'GET' },
    { path: '/api/admin-tenants', method: 'GET' },
  ];
  for (const ep of bootProbes) {
    try {
      const { status } = await fetchProbe(`${base}${ep.path}`, ep.method === 'POST'
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
        : {});
      add(`endpoint boots (no 5xx): ${ep.path}`, status < 500, `status=${status}`);
    } catch (e) { add(`endpoint reachable: ${ep.path}`, false, String(e)); }
  }

  const failures = checks.filter(c => !c.ok);

  // Alert only when the failing set CHANGES (a check NEWLY fails vs the previous run).
  // Avoids hourly eco of a known/stale issue (e.g. a one-off Coach slip lingering in a
  // 24h window). The activity row below still records ALL current failures, so the
  // dashboard view stays complete; this only gates the email.
  let prevFailing: string[] = [];
  try {
    const { data: prev } = await sb.from('system_activity_log')
      .select('result').eq('action', 'synthetic_monitor_run')
      .order('occurred_at', { ascending: false }).limit(1).maybeSingle();
    prevFailing = ((prev?.result as { failing?: string[] } | null)?.failing) ?? [];
  } catch { /* unreadable → fall through and alert on any failure */ }
  const newlyFailing = failures.filter(f => !prevFailing.includes(f.name));
  if (newlyFailing.length) await sendAlert(failures);

  // Principia ingestion: record the synthetic monitor run as a health_check row.
  try {
    await sb.from('system_activity_log').insert({
      area: 'producto', source_type: 'cron', event_type: 'health_check',
      actor: 'system', action: 'synthetic_monitor_run',
      severity: failures.length ? 'medio' : 'sano',
      status: failures.length ? 'failed' : 'success',
      result: { total: checks.length, failed: failures.length, failing: failures.map(f => f.name) },
      occurred_at: new Date().toISOString(),
    });
  } catch { /* non-blocking */ }

  return res.status(failures.length ? 500 : 200).json({ ok: failures.length === 0, checks });
}
