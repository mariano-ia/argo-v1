import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
// Inlined Principia activity logger (best-effort, never throws). Vercel serverless
// functions here don't bundle cross-directory imports, so importing ../src/lib
// throws ERR_MODULE_NOT_FOUND at runtime.
type ActivityInput = { area: string; action: string; sourceType?: string; eventType?: string; actor?: string; resourceType?: string; resourceId?: string; severity?: string; status?: string; reason?: Record<string, unknown>; result?: Record<string, unknown>; relatedLogs?: string[]; incidentId?: number; occurredAt?: string };
async function logActivity(sb: { from: (table: string) => { insert: (values: unknown) => unknown } }, input: ActivityInput): Promise<void> {
    try {
        await sb.from('system_activity_log').insert({
            area: input.area, source_type: input.sourceType ?? 'system', event_type: input.eventType ?? null,
            actor: input.actor ?? null, action: input.action, resource_type: input.resourceType ?? null,
            resource_id: input.resourceId ?? null, severity: input.severity ?? 'info', status: input.status ?? null,
            reason: input.reason ?? null, result: input.result ?? null, related_logs: input.relatedLogs ?? [],
            incident_id: input.incidentId ?? null, occurred_at: input.occurredAt ?? null,
        });
    } catch (err) { console.warn('[principia:logActivity] non-blocking write failed:', err); }
}

/**
 * Unified session endpoint. Routes by `action` field in POST body:
 *   - "start"  → create a child (or re-profile an existing one) + a started perfilamiento
 *   - "update" → update an existing perfilamiento by id (+ share_token)
 *   - "save"   → create a complete perfilamiento in one call (legacy fallback)
 *
 * Data model (2026-06-29 split): a `children` row is the persistent roster entity
 * (one child = one slot + identity + reprofile_token). Each play writes an append-only
 * `perfilamientos` row (the assessment + its report). The general link ALWAYS creates a
 * new child; re-profile appends a perfilamiento to an existing child, identified ONLY by
 * the signed `cid` inside the play_token (never from the body — closes the IDOR).
 *
 * Tenant attribution is protected: attaching to a tenant requires a valid play_token
 * (from /api/start-play, which enforces roster capacity) or, for re-profile, from
 * /api/start-reprofile (which carries the signed child id and skips the roster gate).
 */

// Loose client type for the inline helpers below — the concrete Supabase client
// carries heavy generics that don't unify cleanly across helper boundaries.
type SB = { from: (table: string) => any };

// Verifies a play_token signed by /api/start-play or /api/start-reprofile. Returns the
// tenant_id + team_id it authorizes, plus (for re-profile) the signed child_id and mode.
// Everything is signed server-side so a player can't spoof tenant, team, or which child
// a re-profile lands on.
function verifyPlayToken(token: unknown, secret: string): { tenantId: string; teamId: string | null; childId: string | null; mode: 'new' | 'reprofile' } | null {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    try {
        const { t, tm, cid, m, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (typeof t !== 'string' || typeof exp !== 'number' || Date.now() > exp) return null;
        return {
            tenantId: t,
            teamId: typeof tm === 'string' ? tm : null,
            childId: typeof cid === 'string' ? cid : null,
            mode: m === 'r' ? 'reprofile' : 'new',
        };
    } catch {
        return null;
    }
}

// Attaches a CHILD to a team (idempotent). No-op when teamId is null. Membership is
// per-child so it survives re-profiles (which only add perfilamientos).
async function ensureTeamMembership(sb: SB, teamId: string | null, childId: string): Promise<void> {
    if (!teamId) return;
    const { error } = await sb.from('group_members').upsert({ group_id: teamId, child_id: childId }, { onConflict: 'group_id,child_id' });
    if (error) console.error('[session] ensureTeamMembership failed to attribute child to plantel:', error.message, { childId, teamId });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[session] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const { action, ...fields } = req.body;

    try {
        // ── Start session ────────────────────────────────────────────────────
        if (action === 'start') {
            const { adult_name, adult_email, child_name, child_age, sport, tenant_id, lang, consent_token, play_token, is_demo } = fields;

            if (!adult_email || !child_name) {
                return res.status(400).json({ error: 'Missing required fields: adult_email, child_name' });
            }

            // ── Tenant attribution gate ──────────────────────────────────────
            // To attach to a tenant the caller must present a valid play_token. We
            // trust the tenant_id, team_id, and (for re-profile) child_id from the
            // SIGNED token, never the body. ArgoOne® / self-play (no tenant) needs no token.
            let effectiveTenantId: string | null = null;
            let effectiveTeamId: string | null = null;
            let reproChildId: string | null = null;
            if (tenant_id) {
                const verified = verifyPlayToken(play_token, serviceKey);
                if (!verified || verified.tenantId !== tenant_id) {
                    console.warn('[session:start] Rejected tenant attribution — invalid play_token for tenant', tenant_id);
                    return res.status(403).json({ error: 'invalid_play_token' });
                }
                effectiveTenantId = verified.tenantId;
                effectiveTeamId = verified.teamId;
                if (verified.mode === 'reprofile') reproChildId = verified.childId;
            }

            // ── Sport is defined by the club, not the parent ─────────────────
            let effectiveSport: string | null = sport || null;
            if (effectiveTenantId) {
                const { data: tenantRow } = await sb.from('tenants').select('sport').eq('id', effectiveTenantId).maybeSingle();
                effectiveSport = tenantRow?.sport ?? null;
            }

            // ── COPPA gate: children under 13 require a confirmed consent token ──
            if (typeof child_age === 'number' && child_age < 13) {
                if (typeof consent_token !== 'string' || !/^[a-f0-9]{32}$/.test(consent_token)) {
                    return res.status(403).json({ error: 'consent_required' });
                }
                const { data: consent, error: consentErr } = await sb
                    .from('parental_consents')
                    .select('token, status, expires_at, child_name, child_age, consumed_at')
                    .eq('token', consent_token)
                    .maybeSingle();
                if (consentErr) {
                    console.error('[session:start] consent lookup error:', consentErr.message);
                    return res.status(500).json({ error: 'consent_lookup_failed' });
                }
                if (!consent) return res.status(403).json({ error: 'consent_invalid' });
                if (consent.status !== 'confirmed') return res.status(403).json({ error: 'consent_not_confirmed' });
                if (consent.consumed_at) return res.status(403).json({ error: 'consent_already_used' });
                if (new Date(consent.expires_at) < new Date()) return res.status(403).json({ error: 'consent_expired' });
                if (consent.child_name !== child_name || consent.child_age !== child_age) {
                    return res.status(403).json({ error: 'consent_mismatch' });
                }
            }

            // ── Atomic consent claim (race-safe) ──────────────────────────────
            if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                const { data: claimed, error: claimErr } = await sb
                    .from('parental_consents')
                    .update({ consumed_at: new Date().toISOString() })
                    .eq('token', consent_token)
                    .is('consumed_at', null)
                    .select('token')
                    .maybeSingle();
                if (claimErr) {
                    console.error('[session:start] consent claim error:', claimErr.message);
                    return res.status(500).json({ error: 'consent_claim_failed' });
                }
                if (!claimed) return res.status(403).json({ error: 'consent_already_used' });
            }

            const rollbackConsent = async () => {
                if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                    await sb.from('parental_consents').update({ consumed_at: null }).eq('token', consent_token);
                }
            };

            // ── Resolve the child: re-profile an existing one, or create a new one ──
            let childId: string;
            if (reproChildId) {
                // Re-profile: append to an existing child. Verify it belongs to this
                // tenant and is active (the cid is signed, but re-validate state).
                const { data: childRow } = await sb.from('children')
                    .select('id, tenant_id, archived_at, deleted_at, merged_into')
                    .eq('id', reproChildId).maybeSingle();
                if (!childRow || childRow.tenant_id !== effectiveTenantId || childRow.archived_at || childRow.deleted_at || childRow.merged_into) {
                    await rollbackConsent();
                    return res.status(403).json({ error: 'child_inactive' });
                }
                childId = reproChildId;
            } else {
                // New child (general link always creates a new child — same name ≠ same child).
                const { data: childRow, error: childErr } = await sb.from('children').insert({
                    tenant_id:   effectiveTenantId,
                    adult_name,
                    adult_email,
                    child_name,
                    child_age:   typeof child_age === 'number' ? child_age : null,
                    sport:       effectiveSport,
                    lang:        lang ?? 'es',
                    is_demo:     is_demo === true,
                }).select('id').single();
                if (childErr || !childRow) {
                    console.error('[session:start] child insert error:', childErr?.message);
                    await rollbackConsent();
                    return res.status(500).json({ error: childErr?.message ?? 'child_create_failed' });
                }
                childId = childRow.id;
            }

            // ── Create the started perfilamiento (in_flight) ──────────────────
            const share_token = randomBytes(16).toString('hex');
            const { data: perf, error } = await sb.from('perfilamientos').insert({
                child_id:        childId,
                adult_name,
                adult_email,
                child_name,
                child_age:       typeof child_age === 'number' ? child_age : null,
                sport:           effectiveSport,
                tenant_id:       effectiveTenantId,
                lang:            lang ?? 'es',
                eje:             '_pending',
                motor:           '_pending',
                archetype_label: '_pending',
                answers:         [],
                status:          'in_flight',
                share_token,
                is_demo:         is_demo === true,
            }).select('id, share_token').single();

            if (error || !perf) {
                console.error('[session:start] perfilamiento insert error:', error?.message, error?.details);
                await rollbackConsent();
                // If we just created a fresh childless child, remove it.
                if (!reproChildId) await sb.from('children').delete().eq('id', childId);
                return res.status(500).json({ error: error?.message ?? 'perfilamiento_create_failed' });
            }

            // Link the consent to the perfilamiento + child for audit (COPPA chain).
            if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                await sb.from('parental_consents').update({ session_id: perf.id, child_id: childId }).eq('token', consent_token);
            }

            await ensureTeamMembership(sb, effectiveTeamId, childId);

            return res.status(200).json({ ok: true, id: perf.id, share_token: perf.share_token, child_id: childId });
        }

        // ── Update perfilamiento ─────────────────────────────────────────────
        if (action === 'update') {
            const { id, share_token, ...rest } = fields;
            if (!id) return res.status(400).json({ error: 'Missing required field: id' });

            // Ownership gate: only the client holding this perfilamiento's share_token may update it.
            if (typeof share_token !== 'string' || !share_token) {
                return res.status(403).json({ error: 'missing_session_token' });
            }
            const { data: ownRow, error: ownErr } = await sb
                .from('perfilamientos').select('id, share_token, child_id, tenant_id').eq('id', id).maybeSingle();
            if (ownErr) {
                console.error('[session:update] ownership lookup error:', ownErr.message);
                return res.status(500).json({ error: 'update_lookup_failed' });
            }
            if (!ownRow || ownRow.share_token !== share_token) {
                console.warn('[session:update] Rejected update — share_token mismatch for perfilamiento', id);
                return res.status(403).json({ error: 'invalid_session_token' });
            }

            const allowed: Record<string, unknown> = {};
            const safeKeys = [
                'eje', 'motor', 'archetype_label', 'eje_secundario',
                'answers', 'ai_tokens_input', 'ai_tokens_output', 'ai_cost_usd', 'ai_sections', 'game_metrics',
            ];
            for (const key of safeKeys) {
                if (rest[key] !== undefined) allowed[key] = rest[key];
            }
            if (Object.keys(allowed).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            // Completing the questionnaire (a real eje) resolves the perfilamiento.
            const resolves = typeof allowed.eje === 'string' && allowed.eje !== '_pending';
            if (resolves) allowed.status = 'resolved';

            const { error } = await sb.from('perfilamientos').update(allowed).eq('id', id);
            if (error) {
                console.error('[session:update] Update error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            if (resolves) {
                await logActivity(sb, {
                    area: 'producto', action: 'session_completed', sourceType: 'system', severity: 'info',
                    resourceType: 'session', resourceId: String(id),
                    reason: { session_id: id, child_id: ownRow.child_id, eje: allowed.eje, motor: allowed.motor, tenant_id: ownRow.tenant_id },
                    relatedLogs: [`perfilamientos.${id}`],
                });
            }

            return res.status(200).json({ ok: true });
        }

        // ── Save session (legacy — complete in one call) ─────────────────────
        if (action === 'save') {
            const {
                adult_name, adult_email, child_name, child_age, sport,
                eje, motor, archetype_label, eje_secundario,
                answers, tenant_id, lang, play_token,
                ai_tokens_input, ai_tokens_output, ai_cost_usd, ai_sections, game_metrics,
                is_demo,
            } = fields;

            if (!adult_email || !eje || !motor) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            let saveTenantId: string | null = null;
            let saveTeamId: string | null = null;
            let saveReproChildId: string | null = null;
            if (tenant_id) {
                const verified = verifyPlayToken(play_token, serviceKey);
                if (!verified || verified.tenantId !== tenant_id) {
                    console.warn('[session:save] Rejected tenant attribution — invalid play_token for tenant', tenant_id);
                    return res.status(403).json({ error: 'invalid_play_token' });
                }
                saveTenantId = verified.tenantId;
                saveTeamId = verified.teamId;
                if (verified.mode === 'reprofile') saveReproChildId = verified.childId;
            }

            let saveSport: string | null = sport || null;
            if (saveTenantId) {
                const { data: tenantRow } = await sb.from('tenants').select('sport').eq('id', saveTenantId).maybeSingle();
                saveSport = tenantRow?.sport ?? null;
            }

            const resolved = typeof eje === 'string' && eje !== '_pending';

            // Resolve the child (re-profile existing or create new).
            let saveChildId: string;
            if (saveReproChildId) {
                const { data: childRow } = await sb.from('children')
                    .select('id, tenant_id, archived_at, deleted_at, merged_into')
                    .eq('id', saveReproChildId).maybeSingle();
                if (!childRow || childRow.tenant_id !== saveTenantId || childRow.archived_at || childRow.deleted_at || childRow.merged_into) {
                    return res.status(403).json({ error: 'child_inactive' });
                }
                saveChildId = saveReproChildId;
            } else {
                const { data: childRow, error: childErr } = await sb.from('children').insert({
                    tenant_id:  saveTenantId,
                    adult_name,
                    adult_email,
                    child_name,
                    child_age:  typeof child_age === 'number' ? child_age : null,
                    sport:      saveSport,
                    lang:       lang ?? 'es',
                    is_demo:    is_demo === true,
                }).select('id').single();
                if (childErr || !childRow) {
                    console.error('[session:save] child insert error:', childErr?.message);
                    return res.status(500).json({ error: childErr?.message ?? 'child_create_failed' });
                }
                saveChildId = childRow.id;
            }

            const save_share_token = randomBytes(16).toString('hex');
            const { data: saveData, error } = await sb.from('perfilamientos').insert({
                child_id:         saveChildId,
                adult_name,
                adult_email,
                child_name,
                child_age:        typeof child_age === 'number' ? child_age : null,
                sport:            saveSport,
                eje,
                motor,
                archetype_label,
                eje_secundario:   eje_secundario ?? null,
                tenant_id:        saveTenantId,
                lang:             lang ?? 'es',
                answers:          answers ?? [],
                ai_tokens_input:  ai_tokens_input ?? 0,
                ai_tokens_output: ai_tokens_output ?? 0,
                ai_cost_usd:      ai_cost_usd ?? 0,
                ai_sections:      ai_sections ?? null,
                game_metrics:     game_metrics ?? null,
                status:           resolved ? 'resolved' : 'in_flight',
                share_token:      save_share_token,
                is_demo:          is_demo === true,
            }).select('id, share_token').single();

            if (error || !saveData) {
                console.error('[session:save] Insert error:', error?.message, error?.details);
                if (!saveReproChildId) await sb.from('children').delete().eq('id', saveChildId);
                return res.status(500).json({ error: error?.message ?? 'perfilamiento_create_failed' });
            }

            await ensureTeamMembership(sb, saveTeamId, saveChildId);

            if (resolved) {
                await logActivity(sb, {
                    area: 'producto', action: 'session_completed', sourceType: 'system', severity: 'info',
                    resourceType: 'session', resourceId: String(saveData.id),
                    reason: { session_id: saveData.id, child_id: saveChildId, eje, motor, tenant_id: saveTenantId },
                    relatedLogs: [`perfilamientos.${saveData.id}`],
                });
            }

            return res.status(200).json({ ok: true, id: saveData.id, share_token: saveData.share_token, child_id: saveChildId });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('[session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
