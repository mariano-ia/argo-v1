import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ── Item-quality analysis, fired every 200 real plays ────────────────────────
// The odyssey stores, per answer, the chosen axis + the POSITION it was shown at
// (chosen_pos / displayed_order). That lets us watch the two failure modes the
// expert panel flagged for the v3 wave:
//   · axis magnet   — one axis dominates a question regardless of position
//   · positional bias — one on-screen position dominates regardless of axis
// This cron auto-follows the live instrument (the most recent question_version),
// counts resolved non-demo plays, and each time a new multiple of 200 is crossed
// it computes per-question metrics, persists a snapshot, and alerts the owner.
//   Manual: ?force=1  → run + return the full analysis JSON now (no persist/alert)
//           ?peek=1   → just counts (N, milestone, last) — cheap
// All behind CRON_SECRET. Self-contained (Vercel functions can't import from src/
// nor between api/ files — every helper is inlined).

export const maxDuration = 60;

const MILESTONE = 200;
const THRESHOLDS = {
  entropyFloor: 0.85,   // normalized Shannon over the 4 axes; below = one option too dominant
  maxAxisShare: 0.40,   // any single axis above this = magnet suspicion
  axisFloor: 0.15,      // any axis below this = starved option
  maxPosShare: 0.40,    // any on-screen position above this = positional bias
};

const AX = ['D', 'I', 'S', 'C'] as const;
type Ax = typeof AX[number];

const SCENES: Record<string, string> = {
  q1: 'El Despegue', q2: 'El Nuevo Ritmo', q3: 'El Motor del Viaje', q4: 'La Encrucijada',
  q5: 'La Tormenta', q6: 'El Desajuste', q7: 'El Nudo Rebelde', q8: 'El Empuje',
  q9: 'La Espera', q10: 'El Apoyo', q11: 'La Práctica Final', q12: 'La Meta',
};

type Answer = {
  question_id?: string | null;
  axis?: string | null;
  chosen_pos?: number | null;
  displayed_order?: string | null;
  responseTimeMs?: number | null;
};

type QuestionReport = {
  question_id: string;
  scene: string;
  n: number;
  axis_share: Record<Ax, number>;
  dominant_axis: Ax;
  max_axis_share: number;
  axis_floor: number;
  entropy: number;
  pos_share: number[];        // share chosen at on-screen position 0..3
  max_pos_share: number;
  rt_mean_ms: number;
  rt_p50_ms: number;
  flags: string[];
};

export function normEntropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  let h = 0;
  for (const c of counts) {
    if (c > 0) { const p = c / total; h -= p * Math.log(p); }
  }
  return h / Math.log(4); // 0 (all one option) .. 1 (perfectly even)
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function analyzeQuestion(qid: string, answers: Answer[]): QuestionReport {
  const axisCount: Record<Ax, number> = { D: 0, I: 0, S: 0, C: 0 };
  const posCount = [0, 0, 0, 0];
  const rts: number[] = [];
  let n = 0;
  for (const a of answers) {
    const ax = a.axis as Ax | undefined;
    if (!ax || !(ax in axisCount)) continue;
    axisCount[ax]++;
    n++;
    if (typeof a.chosen_pos === 'number' && a.chosen_pos >= 0 && a.chosen_pos <= 3) posCount[a.chosen_pos]++;
    if (typeof a.responseTimeMs === 'number' && a.responseTimeMs > 0) rts.push(a.responseTimeMs);
  }
  const share = (c: number) => (n ? c / n : 0);
  const axis_share: Record<Ax, number> = { D: share(axisCount.D), I: share(axisCount.I), S: share(axisCount.S), C: share(axisCount.C) };
  const shares = AX.map((a) => axis_share[a]);
  const max_axis_share = Math.max(...shares);
  const axis_floor = Math.min(...shares);
  const dominant_axis = AX[shares.indexOf(max_axis_share)];
  const entropy = normEntropy(AX.map((a) => axisCount[a]));
  // Positional share is normalized over answers that actually recorded a position,
  // NOT over n — otherwise legacy rows without chosen_pos would dilute the shares and
  // mask a real positional bias.
  const posTotal = posCount.reduce((a, b) => a + b, 0);
  const pos_share = posCount.map((c) => (posTotal ? c / posTotal : 0));
  const max_pos_share = posTotal ? Math.max(...pos_share) : 0;

  const flags: string[] = [];
  if (n > 0) {
    if (entropy < THRESHOLDS.entropyFloor) flags.push(`entropía ${entropy.toFixed(2)} < ${THRESHOLDS.entropyFloor}`);
    if (max_axis_share > THRESHOLDS.maxAxisShare) flags.push(`${dominant_axis} ${(max_axis_share * 100).toFixed(0)}% > ${THRESHOLDS.maxAxisShare * 100}%`);
    if (axis_floor < THRESHOLDS.axisFloor) {
      const starved = AX[shares.indexOf(axis_floor)];
      flags.push(`${starved} ${(axis_floor * 100).toFixed(0)}% < ${THRESHOLDS.axisFloor * 100}%`);
    }
    if (max_pos_share > THRESHOLDS.maxPosShare) flags.push(`pos${pos_share.indexOf(max_pos_share)} ${(max_pos_share * 100).toFixed(0)}% (sesgo posicional)`);
  }

  return {
    question_id: qid,
    scene: SCENES[qid] ?? qid,
    n,
    axis_share,
    dominant_axis,
    max_axis_share,
    axis_floor,
    entropy,
    pos_share,
    max_pos_share,
    rt_mean_ms: rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0,
    rt_p50_ms: median(rts),
    flags,
  };
}

function qKey(a: Answer, idx: number): string {
  const raw = (a.question_id ?? '').toString().toLowerCase();
  const m = raw.match(/q?(\d{1,2})/);
  return m ? `q${parseInt(m[1], 10)}` : `q${idx + 1}`;
}

type Analysis = {
  instrument_version: string;
  total_plays: number;
  milestone: number;
  questions: QuestionReport[];
  flagged: string[];
};

export function buildAnalysis(version: string, total: number, milestone: number, rows: { answers: Answer[] | null }[]): Analysis {
  const byQ: Record<string, Answer[]> = {};
  for (const row of rows) {
    const arr = Array.isArray(row.answers) ? row.answers : [];
    arr.forEach((a, i) => {
      const k = qKey(a, i);
      (byQ[k] ??= []).push(a);
    });
  }
  const order = Object.keys(byQ).sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const questions = order.map((qid) => analyzeQuestion(qid, byQ[qid]));
  const flagged = questions.filter((q) => q.flags.length).map((q) => `${q.question_id} (${q.scene}): ${q.flags.join(' · ')}`);
  return { instrument_version: version, total_plays: total, milestone, questions, flagged };
}

export function digestText(a: Analysis): string {
  const header = `Instrumento ${a.instrument_version} · ${a.total_plays} jugadas (hito ${a.milestone} × ${MILESTONE}).`;
  if (!a.flagged.length) {
    return `${header}\n\nTodas las preguntas dentro de umbrales (entropía ≥${THRESHOLDS.entropyFloor}, ningún eje >${THRESHOLDS.maxAxisShare * 100}% ni <${THRESHOLDS.axisFloor * 100}%, sin sesgo posicional). Nada que revisar.`;
  }
  const lines = a.flagged.map((f) => `- ${f}`).join('\n');
  return `${header}\n\n${a.flagged.length} pregunta(s) fuera de umbral:\n${lines}\n\nSnapshot completo guardado en item_quality_snapshots.`;
}

async function sendAlert(subject: string, body: string): Promise<{ email: string; telegram: string }> {
  const out = { email: 'skipped', telegram: 'skipped' };
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
  if (apiKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Argo QA <qa@argomethod.com>', to, subject, text: body }),
      });
      out.email = r.ok ? 'sent' : `error ${r.status}`;
    } catch (e) { out.email = `threw ${e instanceof Error ? e.message : e}`; }
  }
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text: `${subject}\n\n${body}` }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; description?: string };
      out.telegram = j.ok ? 'sent' : `error ${j.description ?? r.status}`;
    } catch (e) { out.telegram = `threw ${e instanceof Error ? e.message : e}`; }
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const provided = (req.query.secret as string) || auth.replace('Bearer ', '');
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const notDemo = 'is_demo.is.null,is_demo.eq.false';

  // 1) Which instrument is live right now? (auto-follows a version bump.)
  const { data: latest, error: latestErr } = await sb
    .from('perfilamientos')
    .select('question_version')
    .eq('status', 'resolved')
    .not('question_version', 'is', null)
    .or(notDemo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) return res.status(500).json({ error: 'query_failed', detail: latestErr.message });
  const version = latest?.question_version as string | undefined;
  if (!version) return res.status(200).json({ ok: true, note: 'no versioned resolved plays yet' });

  // 2) How many resolved non-demo plays does the live instrument have?
  const { count, error: countErr } = await sb
    .from('perfilamientos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'resolved')
    .eq('question_version', version)
    .not('answers', 'is', null)
    .or(notDemo);
  if (countErr) return res.status(500).json({ error: 'count_failed', detail: countErr.message });
  const total = count ?? 0;
  const milestone = Math.floor(total / MILESTONE);

  // Last milestone already reported for this instrument.
  const { data: lastSnap } = await sb
    .from('item_quality_snapshots')
    .select('milestone')
    .eq('instrument_version', version)
    .order('milestone', { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastMilestone = lastSnap?.milestone ?? -1;

  if (req.query.peek) {
    return res.status(200).json({ ok: true, instrument_version: version, total_plays: total, milestone, last_reported_milestone: lastMilestone, per_milestone: MILESTONE });
  }

  const forced = !!req.query.force;
  const crossedNew = milestone >= 1 && milestone > lastMilestone;
  if (!forced && !crossedNew) {
    return res.status(200).json({ ok: true, instrument_version: version, total_plays: total, milestone, last_reported_milestone: lastMilestone, action: 'no new 200-play milestone' });
  }

  // 3) Pull the answers for the live instrument (paginated) and analyze.
  const rows: { answers: Answer[] | null }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('perfilamientos')
      .select('answers')
      .eq('status', 'resolved')
      .eq('question_version', version)
      .not('answers', 'is', null)
      .or(notDemo)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return res.status(500).json({ error: 'fetch_failed', detail: error.message });
    rows.push(...((data ?? []) as { answers: Answer[] | null }[]));
    if (!data || data.length < PAGE) break;
  }

  const analysis = buildAnalysis(version, total, milestone, rows);

  // Forced/manual run: return the full analysis, do not persist or alert.
  if (forced) {
    return res.status(200).json({ ok: true, forced: true, thresholds: THRESHOLDS, analysis });
  }

  // 4) Real milestone crossing: persist snapshot + alert.
  const { error: insErr } = await sb.from('item_quality_snapshots').insert({
    instrument_version: version,
    total_count: total,
    milestone,
    flagged: analysis.flagged.length,
    snapshot: analysis,
  });
  if (insErr) console.warn('[item-quality-cron] snapshot insert failed:', insErr.message);

  const subject = analysis.flagged.length
    ? `[Argo Ítems] ${analysis.flagged.length} pregunta(s) para revisar · ${total} jugadas`
    : `[Argo Ítems] ${total} jugadas · todo dentro de umbral`;
  const delivery = await sendAlert(subject, digestText(analysis));

  return res.status(200).json({ ok: true, instrument_version: version, total_plays: total, milestone, flagged: analysis.flagged, snapshot_saved: !insErr, delivery });
}
