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
    // LLM-judge (#22): scores each chat answer on a small rubric. Report-only
    // (never fails the run — regex checks stay the hard gate); a low dimension
    // shows as WARN so quality regressions are visible before they're urgent.
    const judgeAnswer = async (question: string, answer: string): Promise<Record<string, number> | null> => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return null;
      const judgePrompt = `Eres un juez de calidad para un asistente DISC de deporte juvenil (niños 8-16). Evalúa la RESPUESTA a la PREGUNTA del entrenador con esta rúbrica (1-5 cada una):
- anclaje: usa correctamente el marco DISC/perfiles, sin inventar datos.
- accionable: el adulto termina sabiendo qué hacer o qué observar.
- consultivo: si la pregunta era vaga, indaga con 2-3 preguntas concretas ADEMÁS de aportar una lectura; si era específica, responde directo sin interrogar.
- tono: valida, habla desde la fortaleza, lenguaje probabilístico, nunca etiqueta fija ni términos clínicos.
Devuelve SOLO un JSON: {"anclaje":n,"accionable":n,"consultivo":n,"tono":n}

PREGUNTA: ${question}
RESPUESTA: ${answer}`;
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: judgePrompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 200, thinkingConfig: { thinkingBudget: 0 } } }),
        });
        if (!r.ok) return null;
        const data = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (!jsonMatch) return null;
        const scores = JSON.parse(jsonMatch[0]) as Record<string, number>;
        return ['anclaje', 'accionable', 'consultivo', 'tono'].every(k => typeof scores[k] === 'number') ? scores : null;
      } catch { return null; }
    };

    // tenant-chat returns { thread_id, message: { role, content }, usage }. Extract the text.
    const extractAnswer = (body: { message?: unknown; reply?: unknown; content?: unknown }): string => {
      const m = body.message;
      return typeof m === 'string'
        ? m
        : String((m as { content?: unknown })?.content ?? body.reply ?? body.content ?? '');
    };
    const countQuestions = (t: string) => (t.match(/\?/g) ?? []).length;
    const sendChat = async (message: string, threadId?: string) => {
      const r = await fetch(`${BASE}/api/tenant-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, lang: 'es', ...(threadId ? { thread_id: threadId } : {}) }),
      });
      const body = await r.json() as { thread_id?: string; message?: unknown; reply?: unknown; content?: unknown };
      return { status: r.status, threadId: body.thread_id, answer: extractAnswer(body) };
    };
    for (const c of CHAT_CASES) {
      const issues: string[] = [];
      try {
        const { status, threadId, answer } = await sendChat(c.message);
        const s = scoreText(answer, { requireProbabilistic: c.requireProbabilistic });
        if (status !== 200) issues.push(`status ${status}`);
        if (!s.ok) issues.push(...s.issues);
        // Consultive-mode heuristics (F0): question count + substance.
        if (c.expectQuestions) {
          if (countQuestions(answer) < 2) issues.push(`expected exploratory questions, got ${countQuestions(answer)}`);
          if (answer.length < 200) issues.push('exploratory turn too thin (must add value, not only ask)');
        }
        if (c.expectDirect && countQuestions(answer) > 1) {
          issues.push(`expected a direct answer, got ${countQuestions(answer)} questions`);
        }
        // Judge scores are informational (WARN, never FAIL). The answer text is
        // post-rehydration (real QA-tenant player names). The QA tenant must
        // hold synthetic players only; as defense in depth, names listed in
        // QA_ROSTER_NAMES (comma-separated) are scrubbed before the judge call
        // so pointing the eval at a real tenant can't leak minors' names.
        const scrubNames = (t: string): string => (process.env.QA_ROSTER_NAMES ?? '')
          .split(',').map(s => s.trim()).filter(Boolean)
          .reduce((acc, n) => acc.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), 'el jugador'), t);
        const judge = await judgeAnswer(c.message, scrubNames(answer));
        if (judge) {
          const summary = Object.entries(judge).map(([k, v]) => `${k} ${v}`).join(', ');
          const low = Object.entries(judge).filter(([, v]) => v <= 2).map(([k]) => k);
          lines.push(`  - judge: ${summary}${low.length ? ` — WARN low: ${low.join(', ')}` : ''}`);
        }
        if (c.followUp && threadId) {
          const f = await sendChat(c.followUp.message, threadId);
          const s2 = scoreText(f.answer, { requireProbabilistic: false });
          if (f.status !== 200) issues.push(`follow-up status ${f.status}`);
          if (!s2.ok) issues.push(...s2.issues.map(i => `follow-up: ${i}`));
          if (c.followUp.expectNoReAsk && countQuestions(f.answer) > 1) {
            issues.push(`follow-up re-asked (${countQuestions(f.answer)} questions) instead of delivering guidance`);
          }
          if (c.followUp.expectNoReAsk && f.answer.length < 300) {
            issues.push('follow-up guidance too short after context was given');
          }
        }
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
