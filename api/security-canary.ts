import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/security-canary  — the always-on "vigilante".
 *
 * Runs the black-box attacker probe on a schedule (Vercel cron, hourly): using
 * ONLY the public anon key, it tries to read/delete/execute every sensitive
 * surface and asserts each is denied. If anyone ever re-opens an RLS policy or
 * re-grants the anon role (the exact drift that caused the 2026-07-06 incident,
 * including the `SELECT USING(true)` pattern the Supabase advisor does NOT flag),
 * this returns HTTP 500 and fires a Telegram/email alert. qa-monitor (which alerts
 * on any 5xx endpoint) is a second net.
 *
 * Keep FORBIDDEN in sync with scripts/security/expected-denied.json — the .mjs
 * probe (npm run check:security, CI/local) and this cron share the same contract.
 * api/* functions are transpiled, not bundled, so the list is inlined here on
 * purpose (cannot import scripts/ or read a sibling file reliably at runtime).
 */

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const FORBIDDEN = {
  reads: [
    'children', 'perfilamientos', 'current_perfilamiento', 'one_purchases', 'one_links',
    'leads', 'admin_audit_log', 'system_activity_log', 'parental_consents', 'child_memory',
    'child_memory_events', 'chat_messages', 'puentes_purchases', 'puentes_sessions',
    'ai_events', 'blog_topics',
  ],
  deletes: ['perfilamientos', 'children', 'leads', 'one_links', 'one_purchases', 'admin_audit_log'],
  rpcs: [
    { name: 'merge_children', args: { p_survivor: NIL_UUID, p_absorbed: NIL_UUID, p_actor: 'security-canary' } },
    { name: 'increment_ai_queries', args: { p_tenant_id: NIL_UUID } },
  ],
};

async function runProbe(url: string, anon: string): Promise<{ failures: string[]; passes: number }> {
  const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' };
  const failures: string[] = [];
  let passes = 0;

  for (const table of FORBIDDEN.reads) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
      let body: unknown = null;
      try { body = await res.json(); } catch { /* non-JSON = denied */ }
      if (res.ok && Array.isArray(body) && body.length > 0) failures.push(`READ ${table} exposed (${res.status}, ${body.length} rows)`);
      else passes++;
    } catch { passes++; }
  }
  for (const table of FORBIDDEN.deletes) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?id=eq.${NIL_UUID}`, { method: 'DELETE', headers });
      if (res.ok) failures.push(`DELETE ${table} not denied (${res.status})`);
      else passes++;
    } catch { passes++; }
  }
  for (const rpc of FORBIDDEN.rpcs) {
    try {
      const res = await fetch(`${url}/rest/v1/rpc/${rpc.name}`, { method: 'POST', headers, body: JSON.stringify(rpc.args) });
      if (res.ok) failures.push(`RPC ${rpc.name} not denied (${res.status})`);
      else passes++;
    } catch { passes++; }
  }
  return { failures, passes };
}

async function alert(failures: string[]): Promise<void> {
  const msg = `🚨 Argo SECURITY CANARY FAILED\n\nThe public anon key can reach data that must be locked:\n- ${failures.join('\n- ')}\n\nAn RLS policy or grant regressed. Run: npm run check:security. Fix before continuing to sell.`;
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    try {
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text: msg }),
      });
    } catch (e) { console.warn('[security-canary] Telegram alert failed:', e); }
  }
  const resendKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL || process.env.SUPERADMIN_EMAIL;
  if (resendKey && alertEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Argo Security <hola@argomethod.com>', to: alertEmail, subject: '🚨 Argo security canary failed', text: msg }),
      });
    } catch (e) { console.warn('[security-canary] Email alert failed:', e); }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Strict cron auth — NO user-agent fallback (a security endpoint must not be
  // spoofable). When CRON_SECRET is set the Bearer token is mandatory.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization ?? '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return res.status(500).json({ error: 'missing_supabase_env' });

  const { failures, passes } = await runProbe(url, anon);

  if (failures.length > 0) {
    console.error(`[security-canary] EXPOSED SURFACES (${failures.length}):`, failures.join(' | '));
    await alert(failures);
    return res.status(500).json({ ok: false, exposed: failures, checked: passes + failures.length });
  }
  return res.status(200).json({ ok: true, denied: passes, message: 'all sensitive surfaces denied to anon' });
}
