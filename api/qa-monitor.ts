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

  const failures = checks.filter(c => !c.ok);
  if (failures.length) await sendAlert(failures);
  return res.status(failures.length ? 500 : 200).json({ ok: failures.length === 0, checks });
}
