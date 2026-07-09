import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/puentes-complete
 * Body: { puentes_session_id, answers: [{ questionId, optionId }] }
 *
 * 1. Resolves the adult profile from the 15 answers (inlined resolver because
 *    Vercel serverless cannot import between /api files).
 * 2. Persists answers + profile, marks status = 'answered'.
 * 3. Triggers /api/generate-puentes and waits for completion.
 * 4. Triggers /api/send-puentes-email (fire and forget, status is updated by
 *    that endpoint).
 *
 * Resolver logic mirrors src/lib/puentesProfileResolver.ts. Keep in sync by
 * hand; the canonical version is covered by unit tests in src/lib.
 */

type Axis = 'D' | 'I' | 'S' | 'C';
type Motor = 'agil' | 'equilibrado' | 'profundo';
type Pressure = 'regulado' | 'reactivo' | 'evitativo';

interface OptionMap {
    axis?: Axis;
    motor?: Motor;
    pressure?: Pressure;
    contextKey?: 'history' | 'dominant_emotion';
    contextValue?: string;
}

const OPTION_MAP: Record<string, OptionMap> = {
    q1a: { axis: 'D' }, q1b: { axis: 'I' }, q1c: { axis: 'S' }, q1d: { axis: 'C' },
    q2a: { axis: 'S' }, q2b: { axis: 'D' }, q2c: { axis: 'C' }, q2d: { axis: 'I' },
    q3a: { axis: 'I' }, q3b: { axis: 'C' }, q3c: { axis: 'D' }, q3d: { axis: 'S' },
    q4a: { axis: 'C' }, q4b: { axis: 'S' }, q4c: { axis: 'D' }, q4d: { axis: 'I' },
    q5a: { axis: 'D' }, q5b: { axis: 'S' }, q5c: { axis: 'I' }, q5d: { axis: 'C' },
    q6a: { axis: 'S' }, q6b: { axis: 'I' }, q6c: { axis: 'D' }, q6d: { axis: 'C' },
    q7a: { axis: 'C' }, q7b: { axis: 'D' }, q7c: { axis: 'S' }, q7d: { axis: 'I' },
    q8a: { axis: 'I' }, q8b: { axis: 'S' }, q8c: { axis: 'D' }, q8d: { axis: 'C' },
    q9a: { motor: 'agil' }, q9b: { motor: 'equilibrado' }, q9c: { motor: 'profundo' },
    q10a: { motor: 'profundo' }, q10b: { motor: 'agil' }, q10c: { motor: 'equilibrado' },
    q11a: { pressure: 'regulado' }, q11b: { pressure: 'reactivo' }, q11c: { pressure: 'evitativo' },
    q12a: { pressure: 'regulado' }, q12b: { pressure: 'evitativo' }, q12c: { pressure: 'reactivo' },
    q13a: { pressure: 'reactivo' }, q13b: { pressure: 'regulado' }, q13c: { pressure: 'evitativo' },
    q14a: { contextKey: 'history', contextValue: 'ex_competitive' },
    q14b: { contextKey: 'history', contextValue: 'ex_brief' },
    q14c: { contextKey: 'history', contextValue: 'recreational' },
    q14d: { contextKey: 'history', contextValue: 'none' },
    q15a: { contextKey: 'dominant_emotion', contextValue: 'orgullo' },
    q15b: { contextKey: 'dominant_emotion', contextValue: 'nervios' },
    q15c: { contextKey: 'dominant_emotion', contextValue: 'disfrute' },
    q15d: { contextKey: 'dominant_emotion', contextValue: 'preocupacion' },
    q15e: { contextKey: 'dominant_emotion', contextValue: 'curiosidad' },
    q15f: { contextKey: 'dominant_emotion', contextValue: 'mezcla' },
};

const REQUIRED_IDS = [
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8',
    'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15',
];
const SECONDARY_AXIS_THRESHOLD = 3;

function resolveAdultProfile(answers: { questionId: string; optionId: string }[]) {
    const answered = new Set(answers.map(a => a.questionId));
    const missing = REQUIRED_IDS.filter(id => !answered.has(id));
    if (missing.length) throw new Error(`Missing answers: ${missing.join(',')}`);

    const axis: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
    const motor: Record<Motor, number> = { agil: 0, equilibrado: 0, profundo: 0 };
    const press: Record<Pressure, number> = { regulado: 0, reactivo: 0, evitativo: 0 };
    const ctx: Record<string, string> = {};

    for (const a of answers) {
        const m = OPTION_MAP[a.optionId];
        if (!m) continue;
        if (m.axis) axis[m.axis]++;
        if (m.motor) motor[m.motor]++;
        if (m.pressure) press[m.pressure]++;
        if (m.contextKey && m.contextValue) ctx[m.contextKey] = m.contextValue;
    }

    const sortedAx = (Object.entries(axis) as [Axis, number][]).sort((a, b) => b[1] - a[1]);
    const sortedMo = (Object.entries(motor) as [Motor, number][]).sort((a, b) => b[1] - a[1]);
    const sortedPr = (Object.entries(press) as [Pressure, number][]).sort((a, b) => b[1] - a[1]);

    const moTop = sortedMo[0][1];
    const moTops = sortedMo.filter(([, c]) => c === moTop).map(([k]) => k);

    return {
        eje_primary: sortedAx[0][0],
        eje_secondary: sortedAx[1][1] >= SECONDARY_AXIS_THRESHOLD ? sortedAx[1][0] : null,
        motor: moTops.length > 1 ? ('equilibrado' as Motor) : moTops[0],
        pressure_style: sortedPr[0][0],
        history: ctx.history ?? 'none',
        dominant_emotion: ctx.dominant_emotion ?? 'mezcla',
        axis_counts: { ...axis },
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { puentes_session_id, answers } = req.body as {
            puentes_session_id?: string;
            answers?: { questionId: string; optionId: string }[];
        };
        if (!puentes_session_id || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Missing puentes_session_id or answers' });
        }

        let profile;
        try {
            profile = resolveAdultProfile(answers);
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Invalid answers' });
        }

        // Find the purchase from the session, then propagate the answers +
        // adult profile to ALL puentes_sessions of that purchase (multi-child:
        // one questionnaire, multiple bridges).
        const { data: anchor } = await sb
            .from('puentes_sessions')
            .select('id, purchase_id')
            .eq('id', puentes_session_id)
            .maybeSingle();
        if (!anchor) return res.status(404).json({ error: 'Puentes session not found' });

        const { data: siblings } = await sb
            .from('puentes_sessions')
            .select('id, source_session_id')
            .eq('purchase_id', anchor.purchase_id);

        const siblingIds = (siblings ?? []).map(s => s.id);
        if (siblingIds.length === 0) siblingIds.push(puentes_session_id);

        const { error: updErr } = await sb
            .from('puentes_sessions')
            .update({
                adult_answers: answers,
                adult_profile: profile,
                status: 'answered',
            })
            .in('id', siblingIds);
        if (updErr) {
            console.error('[puentes-complete] Update error:', updErr.message);
            return res.status(500).json({ error: 'Could not save answers' });
        }

        // ── ArgoOne fusion (L3) dual-write ──────────────────────────────────
        // Behind PUENTES_BRIDGES: also populate adult_profiles (reusable by email)
        // + bridges (adult x perfilamiento, with a frozen DISC snapshot). SHADOW:
        // nothing reads these until the read side flips, so this is best-effort and
        // never blocks the legacy puentes_sessions flow. Flag OFF = identical legacy.
        if (process.env.PUENTES_BRIDGES === 'on') {
            try {
                const { data: purchase } = await sb
                    .from('puentes_purchases')
                    .select('recipient_email, lang')
                    .eq('id', anchor.purchase_id)
                    .maybeSingle();
                const em = (purchase?.recipient_email || '').trim().toLowerCase();
                if (em) {
                    const bLang = purchase?.lang || 'es';
                    const nowIso = new Date().toISOString();
                    // +6 months, clamping end-of-month overflow (Aug 31 + 6 → Feb, not Mar 3)
                    // so it matches Postgres' interval '6 months' used in the migration backfill.
                    const exp = new Date();
                    const expDay = exp.getDate();
                    exp.setMonth(exp.getMonth() + 6);
                    if (exp.getDate() !== expDay) exp.setDate(0);
                    const expIso = exp.toISOString();

                    // Upsert the reusable adult profile by normalized email (one row,
                    // overwritten on re-profile).
                    let adultProfileId: string | undefined;
                    const { data: apRow } = await sb.from('adult_profiles').select('id').eq('email', em).maybeSingle();
                    if (apRow) {
                        adultProfileId = apRow.id;
                        await sb.from('adult_profiles').update({
                            disc: profile, adult_answers: answers, lang: bLang,
                            computed_at: nowIso, expires_at: expIso, updated_at: nowIso,
                        }).eq('id', apRow.id);
                    } else {
                        const { data: ins } = await sb.from('adult_profiles').insert({
                            email: em, disc: profile, adult_answers: answers, lang: bLang,
                            computed_at: nowIso, expires_at: expIso,
                        }).select('id').single();
                        if (ins) {
                            adultProfileId = ins.id;
                        } else {
                            // Lost an insert race on the unique email index: re-select the winner.
                            const { data: reRow } = await sb.from('adult_profiles').select('id').eq('email', em).maybeSingle();
                            adultProfileId = reRow?.id;
                        }
                    }

                    // One bridge per child (adult x perfilamiento), DISC frozen at generation.
                    for (const s of (siblings ?? [])) {
                        if (!s.source_session_id) continue;
                        const bridgeData = {
                            adult_profile_id: adultProfileId ?? null,
                            perfilamiento_id: s.source_session_id,
                            adult_email: em,
                            disc_snapshot: profile,
                            adult_profile_computed_at: nowIso,
                            status: 'answered',
                            lang: bLang,
                            computed_at: nowIso,
                            expires_at: expIso,
                        };
                        const { data: br } = await sb.from('bridges').select('id')
                            .eq('adult_email', em).eq('perfilamiento_id', s.source_session_id).maybeSingle();
                        if (br) await sb.from('bridges').update(bridgeData).eq('id', br.id);
                        else await sb.from('bridges').insert(bridgeData);
                    }
                }
            } catch (dwErr) {
                console.warn('[puentes-complete] L3 dual-write (adult_profiles/bridges) failed (non-blocking):', dwErr instanceof Error ? dwErr.message : dwErr);
            }
        }

        // Internal endpoint calls must hit the SAME deployment running this
        // function. On Vercel previews, VERCEL_URL is the unique deploy URL.
        const origin = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : (process.env.SITE_URL || 'https://argomethod.com');

        // Generate puentes for every child of this purchase, in parallel.
        const genResults = await Promise.allSettled(siblingIds.map(sid =>
            fetch(`${origin}/api/generate-puentes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puentes_session_id: sid }),
            }).then(async r => ({ id: sid, ok: r.ok, body: r.ok ? null : await r.text() })),
        ));

        const failedGens = genResults
            .map((r, i) => ({ r, sid: siblingIds[i] }))
            .filter(({ r }) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));

        if (failedGens.length > 0 && failedGens.length === siblingIds.length) {
            console.error('[puentes-complete] all generate-puentes calls failed', failedGens);
            return res.status(500).json({ error: 'Generation failed' });
        }
        if (failedGens.length > 0) {
            console.warn(`[puentes-complete] ${failedGens.length}/${siblingIds.length} generations failed, continuing anyway`);
        }

        // Send the report email and AWAIT it. A previous fire-and-forget here
        // silently dropped emails: Vercel can freeze the serverless instance
        // the moment this handler returns its response, killing any in-flight
        // un-awaited fetch. We use the anchor session id since the email
        // aggregates all children of the purchase internally. If the send
        // fails the report is already generated and persisted, so we still
        // return ok; the puentes-sync-cron backstop re-sends generated-but-
        // unsent sessions.
        let emailSent = false;
        try {
            const emailRes = await fetch(`${origin}/api/send-puentes-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puentes_session_id }),
            });
            emailSent = emailRes.ok;
            if (!emailRes.ok) {
                console.warn('[puentes-complete] send-puentes-email failed:', await emailRes.text());
            }
        } catch (err) {
            console.warn('[puentes-complete] send-puentes-email threw:', err);
        }

        return res.status(200).json({
            ok: true,
            profile,
            children_count: siblingIds.length,
            failed_count: failedGens.length,
            email_sent: emailSent,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-complete] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
