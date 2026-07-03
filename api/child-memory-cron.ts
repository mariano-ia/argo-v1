import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Per-child memory consolidation (M2, docs/ARGOCOACH-MEMORIA-NINO.md).
 *
 * Nightly: for every (tenant, child, member) with NEW episodic events since
 * its watermark, distill the events into the consolidated summary the chat
 * injects when the child is mentioned. One cheap Flash-Lite call per group.
 *
 * Safety: the output must pass the same probabilistic-language guardrails as
 * the chat (prohibited words + deterministic phrases, inlined below — Vercel
 * serverless can't import between api files). On a dirty output we retry once;
 * if still dirty we KEEP the previous summary and move the watermark forward
 * (memory lags rather than loops on poison input).
 *
 * A user-edited summary (user_edited_at) is treated as the new base: the cron
 * appends on top of it, never reverts the user's wording wholesale.
 *
 * Auth: optional CRON_SECRET, mirrors the other crons.
 */

export const maxDuration = 120;

const GROUP_CAP = 60;            // groups consolidated per run (cost/time bound)
// Discovery look-back. 7 days (not 24h) is the self-healing margin: if the
// cron misses runs for days, the affected groups are still discovered on the
// next successful run, and the per-group watermark keeps work idempotent.
const EVENT_WINDOW_H = 168;
const EVENTS_PER_GROUP = 8;      // newest events fed into one consolidation
const SUMMARY_MAX_CHARS = 1200;

// ── Guardrails (compact inline mirror of api/tenant-chat.ts) ────────────────
const PROHIBITED = [
    'déficit', 'deficit', 'trastorno', 'disorder', 'transtorno', 'diagnóstico', 'diagnostico',
    'diagnosis', 'patología', 'patologia', 'síndrome', 'sindrome', 'tdah', 'adhd', 'autismo',
    'autism', 'terapia', 'therapy', 'enfermedad', 'illness', 'depresión', 'depresion',
    'depression', 'bipolar', 'medicación', 'medicacion', 'medication',
    'agresivo', 'aggressive', 'agressivo', 'violento', 'violent', 'problemático', 'problematico',
    'débil', 'weak', 'fraco', 'incapaz', 'fracaso', 'inútil', 'vago', 'lazy', 'torpe',
    'retrasado', 'anormal', 'abnormal', 'defecto', 'condenado', 'fracasado',
    'siempre será', 'nunca podrá', 'nació para', 'está destinado', 'will always be', 'will never',
];
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function isClean(text: string): boolean {
    const lower = text.toLowerCase();
    for (const w of PROHIBITED) {
        if (w.includes(' ') ? lower.includes(w) : new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(w)}(?![\\p{L}\\p{N}])`, 'iu').test(lower)) return false;
    }
    return !/\bes un[ao]? (líder|problema|caso)\b/iu.test(text);
}

// ── Compact Gemini caller ────────────────────────────────────────────────────
async function callGemini(system: string, user: string): Promise<{ text: string; tokensIn: number; tokensOut: number } | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } },
        }),
    });
    if (!res.ok) { console.warn('[child-memory-cron] Gemini error', res.status, await res.text()); return null; }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) return null;
    const usage = data.usageMetadata ?? {};
    return { text: text.trim(), tokensIn: usage.promptTokenCount ?? 0, tokensOut: usage.candidatesTokenCount ?? 0 };
}

const SYSTEM_PROMPT = `Eres el sistema de memoria de ArgoMethod®, un producto de perfilamiento conductual DISC para niños deportistas (8-16 años). Mantienes la "memoria del niño" que el asistente del entrenador consulta para dar continuidad entre conversaciones.

REGLAS ESTRICTAS:
- Lenguaje probabilístico siempre ("tiende a", "suele", "es probable que"); nunca afirmaciones de identidad fija sobre el niño.
- Siempre desde la fortaleza y la oportunidad; nunca desde el déficit.
- Solo comportamiento observable en la actividad deportiva. Nada clínico, nada de la vida privada de la familia.
- No inventes nada que no esté en la memoria actual o en los eventos nuevos.
- Nombra al niño siempre como "el niño" y a cualquier otro jugador como "un compañero". NUNCA uses nombres propios.
- Si la memoria actual contiene información de hace meses que sigue siendo útil, consérvala comprimida como contexto histórico en una frase ("hace unos meses...", "la temporada pasada..."); nunca la descartes solo por vieja.
- Escribe en el MISMO idioma en que están escritas las consultas de los eventos.
- Texto plano, sin títulos ni markdown. Máximo 120 palabras.
- Estructura: primero las situaciones en las que se acompaña al niño y las señales observadas; después qué se sugirió y, si se sabe, cómo resultó.

Responde SOLO con la memoria actualizada.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    const sb = createClient(supabaseUrl, serviceKey);

    // Liveness heartbeat for qa-monitor's dead-man's-switch (best-effort).
    try {
        const hbAt = new Date().toISOString();
        await sb.from('health_checks').insert({
            area: 'sistema', signal_key: 'child-memory-cron_heartbeat', source_type: 'cron', source_ref: 'child-memory-cron',
            shape: 'threshold', measured_value: 0, setpoint_value: 0, comparator: '>=', unit: 'runs',
            breached: false, severity: 'sano', checked_at: hbAt, last_successful_check_at: hbAt,
        });
    } catch (e) { console.warn('[child-memory-cron] heartbeat failed:', e); }

    const stats = { groups: 0, consolidated: 0, skipped: 0, dirty: 0, errors: 0 };
    try {
        // 1. Discover groups with recent events (48h window covers a missed run).
        const since = new Date(Date.now() - EVENT_WINDOW_H * 3600_000).toISOString();
        const { data: recent, error: recErr } = await sb
            .from('child_memory_events')
            .select('tenant_id, child_id, member_id, updated_at')
            .gt('updated_at', since)
            .order('updated_at', { ascending: false })
            .limit(2000);
        if (recErr) throw new Error(`discovery failed: ${recErr.message}`);

        const groups = new Map<string, { tenant_id: string; child_id: string; member_id: string | null }>();
        for (const r of recent ?? []) {
            const key = `${r.tenant_id}|${r.child_id}|${r.member_id ?? 'null'}`;
            if (!groups.has(key)) groups.set(key, { tenant_id: r.tenant_id, child_id: r.child_id, member_id: r.member_id ?? null });
            if (groups.size >= GROUP_CAP) break;
        }
        if ((recent?.length ?? 0) > 0 && groups.size >= GROUP_CAP) {
            console.warn(`[child-memory-cron] group cap ${GROUP_CAP} reached; remainder picked up next run`);
        }

        // Names must not reach Gemini (same invariant as the chat): the target
        // child becomes "el niño" and any other tenant child "un compañero"
        // BEFORE the text leaves, so summaries are name-free by construction.
        const childNamesCache = new Map<string, Array<{ id: string; name: string }>>();
        const getTenantChildren = async (tenantId: string) => {
            if (!childNamesCache.has(tenantId)) {
                const { data } = await sb.from('children').select('id, child_name').eq('tenant_id', tenantId).limit(1000);
                childNamesCache.set(tenantId, ((data ?? []) as Array<{ id: string; child_name: string }>)
                    .map(r => ({ id: r.id, name: (r.child_name ?? '').trim() }))
                    .filter(r => r.name.length > 1));
            }
            return childNamesCache.get(tenantId)!;
        };
        const scrubForModel = (text: string, children: Array<{ id: string; name: string }>, targetChildId: string): string => {
            let out = text;
            const variants = children
                .flatMap(c => {
                    const first = c.name.split(/\s+/)[0];
                    const vs = first && first !== c.name ? [c.name, first] : [c.name];
                    return vs.map(v => ({ v, isTarget: c.id === targetChildId }));
                })
                .sort((a, b) => b.v.length - a.v.length); // longest first ("Juan Pablo" before "Juan")
            for (const { v, isTarget } of variants) {
                out = out.replace(
                    new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(v)}(?![\\p{L}\\p{N}])`, 'giu'),
                    isTarget ? 'el niño' : 'un compañero',
                );
            }
            return out;
        };

        for (const g of groups.values()) {
            stats.groups++;
            try {
                // 2. Current summary row (one per child+member, code-enforced).
                let memQ = sb.from('child_memory')
                    .select('id, summary, events_through, user_edited_at')
                    .eq('tenant_id', g.tenant_id)
                    .eq('child_id', g.child_id);
                memQ = g.member_id ? memQ.eq('member_id', g.member_id) : memQ.is('member_id', null);
                const { data: mem } = await memQ.maybeSingle();

                // 3. Events newer than the watermark, oldest → newest.
                let evQ = sb.from('child_memory_events')
                    .select('content, advice, situation_id, updated_at')
                    .eq('tenant_id', g.tenant_id)
                    .eq('child_id', g.child_id)
                    .gt('updated_at', mem?.events_through ?? '1970-01-01')
                    .order('updated_at', { ascending: true })
                    .limit(EVENTS_PER_GROUP);
                evQ = g.member_id ? evQ.eq('member_id', g.member_id) : evQ.is('member_id', null);
                const { data: events } = await evQ;
                if (!events || events.length === 0) { stats.skipped++; continue; }

                const watermark = String(events[events.length - 1].updated_at);
                const tenantChildren = await getTenantChildren(g.tenant_id);
                const eventsText = scrubForModel(events.map(e =>
                    `[${String(e.updated_at).slice(0, 10)}]${e.situation_id ? ` (situación: ${e.situation_id})` : ''} consultó: "${e.content}"${e.advice ? ` / se sugirió: "${e.advice}"` : ''}`
                ).join('\n'), tenantChildren, g.child_id);
                const currentSummary = mem?.summary?.trim()
                    ? scrubForModel(mem.summary.trim(), tenantChildren, g.child_id)
                    : '(vacía)';
                const userPrompt = `MEMORIA ACTUAL${mem?.user_edited_at ? ' (editada por el usuario: consérvala como base, no la reescribas entera)' : ''}:\n${currentSummary}\n\nEVENTOS NUEVOS (viejo → nuevo):\n${eventsText}`;

                // 4. Consolidate (1 retry on dirty output; keep old summary if still dirty).
                let result = await callGemini(SYSTEM_PROMPT, userPrompt);
                if (result && !isClean(result.text)) {
                    result = await callGemini(SYSTEM_PROMPT, `${userPrompt}\n\nIMPORTANTE: tu borrador anterior usó lenguaje no permitido (clínico, negativo o determinista). Reescríbelo respetando todas las reglas.`);
                }

                let newSummary: string | null = null;
                if (result && result.text && isClean(result.text)) {
                    newSummary = result.text.slice(0, SUMMARY_MAX_CHARS);
                } else if (result) {
                    stats.dirty++;
                    console.warn(`[child-memory-cron] dirty output kept OLD summary (tenant=${g.tenant_id} child=${g.child_id})`);
                } else {
                    stats.errors++;
                    continue; // AI unavailable: don't advance the watermark, retry next run
                }

                // 5. Write summary (or just advance the watermark on dirty output).
                if (mem) {
                    const { error } = await sb.from('child_memory')
                        .update({ ...(newSummary ? { summary: newSummary } : {}), events_through: watermark, updated_at: new Date().toISOString() })
                        .eq('id', mem.id);
                    if (error) { stats.errors++; console.warn('[child-memory-cron] update failed:', error.message); continue; }
                } else if (newSummary) {
                    const { error } = await sb.from('child_memory').insert({
                        tenant_id: g.tenant_id, child_id: g.child_id, member_id: g.member_id,
                        summary: newSummary, events_through: watermark, updated_at: new Date().toISOString(),
                    });
                    if (error) { stats.errors++; console.warn('[child-memory-cron] insert failed:', error.message); continue; }
                }
                if (newSummary) stats.consolidated++;

                // M4 hierarchical consolidation: episodes that are BOTH already
                // reflected in a summary (<= watermark) and older than 90 days
                // are pruned — the summary is the long-term carrier, the diary
                // stays bounded (~30 KB per active child, forever).
                if (newSummary) {
                    const pruneBefore = new Date(Date.now() - 90 * 86400_000).toISOString();
                    let pruneQ = sb.from('child_memory_events').delete()
                        .eq('tenant_id', g.tenant_id)
                        .eq('child_id', g.child_id)
                        .lte('updated_at', watermark)
                        .lt('updated_at', pruneBefore);
                    pruneQ = g.member_id ? pruneQ.eq('member_id', g.member_id) : pruneQ.is('member_id', null);
                    const { error: pruneErr } = await pruneQ;
                    if (pruneErr) console.warn('[child-memory-cron] prune failed (non-fatal):', pruneErr.message);
                }

                // 6. Cost telemetry (best-effort; flash-lite rates).
                if (result) {
                    try {
                        await sb.from('ai_events').insert({
                            tenant_id: g.tenant_id, source: 'child-memory-cron', provider: 'gemini',
                            model: 'gemini-2.5-flash-lite', lang: 'es',
                            tokens_in: result.tokensIn, tokens_out: result.tokensOut,
                            cost_usd: (result.tokensIn * 0.10 + result.tokensOut * 0.40) / 1_000_000,
                            latency_ms: 0, mentioned_player: true,
                        });
                    } catch { /* telemetry never blocks */ }
                }
            } catch (groupErr) {
                stats.errors++;
                console.warn('[child-memory-cron] group failed:', groupErr instanceof Error ? groupErr.message : groupErr);
            }
        }

        console.info('[child-memory-cron] done', JSON.stringify(stats));
        return res.status(200).json({ ok: true, ...stats });
    } catch (err) {
        console.error('[child-memory-cron] fatal:', err instanceof Error ? err.message : err);
        return res.status(500).json({ error: 'child-memory-cron failed', ...stats });
    }
}
