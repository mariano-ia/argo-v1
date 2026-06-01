// scripts/qa/ai-eval.ts
// Runs the AI quality eval against the live endpoints and writes a markdown report.
// Run: npm run qa:ai-eval   (uses tsx so it can import src/lib + scripts TS)
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveProfile } from '../../src/lib/profileResolver';
import { getReportData } from '../../src/lib/argosEngine';
import { scoreText } from './lib/scoring.mjs';
import { REPORT_CASES, CHAT_CASES } from './eval/cases';

config();

const BASE = process.env.QA_BASE_URL || 'https://www.argomethod.com';

export async function runEval(): Promise<number> {
  const lines: string[] = ['# AI Eval Report', `\nFecha: ${new Date().toISOString()}`, `Target: ${BASE}\n`];
  let failed = 0;

  // ── Report generation eval ─────────────────────────────────────────────
  lines.push('## Reportes (generate-ai)\n');
  for (const c of REPORT_CASES) {
    const profile = resolveProfile(c.answers);
    const axisOk = profile.eje === c.expectedAxis;
    const report = getReportData(profile.eje, profile.motor, '', c.nombre, 'es');
    const issues: string[] = [];
    if (!axisOk) issues.push(`resolver gave ${profile.eje}, expected ${c.expectedAxis}`);
    try {
      const r = await fetch(`${BASE}/api/generate-ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, context: { nombre: c.nombre, deporte: c.deporte, edad: c.edad, destinatario: c.destinatario, lang: 'es' } }),
      });
      const body = await r.json() as { sections?: Record<string, unknown> };
      if (r.status !== 200 || !body.sections) {
        issues.push(`generate-ai status ${r.status}`);
      } else {
        for (const [k, v] of Object.entries(body.sections)) {
          if (typeof v === 'string') {
            const s = scoreText(v, { requireProbabilistic: false });
            if (!s.ok) issues.push(`${k}: ${s.issues.join('; ')}`);
          }
        }
      }
    } catch (e) { issues.push(`request error: ${e}`); }
    const ok = issues.length === 0;
    if (!ok) failed++;
    lines.push(`- **${c.id}** (${c.expectedAxis}/${profile.motor}): ${ok ? 'PASS' : 'FAIL'}`);
    for (const i of issues) lines.push(`  - ${i}`);
  }

  // ── Chat eval ──────────────────────────────────────────────────────────
  lines.push('\n## Chat (tenant-chat)\n');
  // signInWithPassword uses the anon (publishable) key, not the service role key.
  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
  const { data: auth } = await sb.auth.signInWithPassword({
    email: process.env.QA_TENANT_EMAIL!, password: process.env.QA_TENANT_PASSWORD!,
  });
  const token = auth?.session?.access_token;
  if (!token) {
    lines.push('- SKIP: no se pudo autenticar el tenant de prueba (revisar QA_TENANT_EMAIL/PASSWORD).');
  } else {
    for (const c of CHAT_CASES) {
      const issues: string[] = [];
      try {
        const r = await fetch(`${BASE}/api/tenant-chat`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: c.message, lang: 'es' }),
        });
        const body = await r.json() as { message?: unknown; reply?: unknown; content?: unknown };
        // tenant-chat returns { thread_id, message: { role, content }, usage }. Extract the text.
        const m = body.message;
        const answer = typeof m === 'string'
          ? m
          : String((m as { content?: unknown })?.content ?? body.reply ?? body.content ?? '');
        const s = scoreText(answer, { requireProbabilistic: c.requireProbabilistic });
        if (r.status !== 200) issues.push(`status ${r.status}`);
        if (!s.ok) issues.push(...s.issues);
      } catch (e) { issues.push(`request error: ${e}`); }
      const ok = issues.length === 0;
      if (!ok) failed++;
      lines.push(`- **${c.id}**: ${ok ? 'PASS' : 'FAIL'}`);
      for (const i of issues) lines.push(`  - ${i}`);
    }
  }

  lines.push(`\n## Resultado: ${failed === 0 ? 'TODO PASÓ' : `${failed} FALLAS`}`);
  mkdirSync('docs/qa', { recursive: true });
  writeFileSync('docs/qa/ai-eval-report.md', lines.join('\n'));
  console.log(lines.join('\n'));
  return failed;
}

// Only execute when run directly (so importing this module for type/parse checks has no side effects).
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  runEval().then(failed => process.exit(failed > 0 ? 1 : 0));
}
