import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type Check = { name: string; ok: boolean; detail?: string };

async function sendAlert(failures: Check[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
  if (!apiKey) return;
  const lines = failures.map(f => `- ${f.name}: ${f.detail ?? 'failed'}`).join('\n');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Argo QA <qa@argomethod.com>',
      to,
      subject: `[Argo QA] ${failures.length} check(s) FAILED`,
      text: `El monitor sintético detectó fallas en producción:\n\n${lines}\n\nRevisa los logs de Vercel.`,
    }),
  }).catch(() => {});
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Protect like the other crons.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  const base = process.env.SITE_URL || 'https://www.argomethod.com';
  const slug = process.env.QA_TENANT_SLUG || 'qa-robot';
  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push({ name, ok, detail });

  // CHECK 1: start-play returns capacity for the QA tenant.
  try {
    const r = await fetch(`${base}/api/start-play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    const b = await r.json().catch(() => ({}));
    add('start-play 200 + ok', r.status === 200 && b.ok === true, `status=${r.status}`);
  } catch (e) { add('start-play reachable', false, String(e)); }

  // CHECK 2: generate-ai produces valid sections for a fixed report.
  try {
    const r = await fetch(`${base}/api/generate-ai`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report: minimalReport(),
        context: { nombre: 'QA Kid', deporte: 'futbol', edad: 10, destinatario: 'entrenador', lang: 'es' },
      }),
    });
    const b = await r.json().catch(() => ({} as Record<string, unknown>));
    const sections = (b as { sections?: { resumenPerfil?: unknown } }).sections;
    add('generate-ai 200 + sections', r.status === 200 && typeof sections?.resumenPerfil === 'string', `status=${r.status}`);
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
    const r = await fetch(`${base}/api/blog-cron`);
    add('blog-cron protected', r.status === 401 || r.status === 403, `status=${r.status}`);
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
        const r = await fetch(`${base}/api/tenant-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
          body: JSON.stringify({ message: 'En una frase, ¿cómo se llama el perfil de eje S con motor Medio?', lang: 'es' }),
        });
        const b = await r.json().catch(() => ({} as Record<string, unknown>));
        const text = String((b as { message?: { content?: string } }).message?.content ?? '').toLowerCase();
        // Accent-insensitive so a valid "ritmico" (no accent) doesn't false-page.
        const norm = text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const FORBIDDEN = ['sosten confiable', 'el tanque', 'la brujula', 'impulsor decidido', 'estratega reactivo', 'conector relacional'];
        add('coach canary: responds 200', r.status === 200 && text.length > 0, `status=${r.status}`);
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
    { path: '/api/admin-tenants', method: 'GET' },
  ];
  for (const ep of bootProbes) {
    try {
      const r = await fetch(`${base}${ep.path}`, ep.method === 'POST'
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
        : {});
      add(`endpoint boots (no 5xx): ${ep.path}`, r.status < 500, `status=${r.status}`);
    } catch (e) { add(`endpoint reachable: ${ep.path}`, false, String(e)); }
  }

  const failures = checks.filter(c => !c.ok);
  if (failures.length) await sendAlert(failures);

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
