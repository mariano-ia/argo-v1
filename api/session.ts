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
 *   - "start"  → create a started session (returns id)
 *   - "update" → update an existing session by id
 *   - "save"   → create a complete session in one call (legacy fallback)
 *
 * Tenant attribution is protected: attaching a session to a tenant requires a
 * valid play_token issued by /api/start-play (verified below). Updating a
 * session requires its share_token. Together these close the IDOR where a
 * spoofed tenant_id / session id could create or mutate another tenant's data.
 */

// Loose client type for the inline helpers below — the concrete Supabase client
// carries heavy generics that don't unify cleanly across helper boundaries.
type SB = { from: (table: string) => any };

// Verifies a play_token signed by /api/start-play. Returns the tenant_id AND
// team_id it authorizes, or null if the token is missing, tampered, or expired.
// team_id is signed server-side so a player can't spoof which team they join.
function verifyPlayToken(token: unknown, secret: string): { tenantId: string; teamId: string | null } | null {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    try {
        const { t, tm, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (typeof t !== 'string' || typeof exp !== 'number' || Date.now() > exp) return null;
        return { tenantId: t, teamId: typeof tm === 'string' ? tm : null };
    } catch {
        return null;
    }
}

// Finds the canonical player (active session) for a tenant by adult email + child
// name, case-insensitive. On re-profile we update this row instead of inserting a
// duplicate, so a child is one slot no matter how many times they replay.
async function findExistingPlayer(sb: SB, tenantId: string, adultEmail: unknown, childName: unknown): Promise<string | null> {
    const { data: candidates } = await sb
        .from('sessions')
        .select('id, adult_email, child_name')
        .eq('tenant_id', tenantId)
        .is('archived_at', null)
        .is('deleted_at', null);
    const e = String(adultEmail ?? '').trim().toLowerCase();
    const n = String(childName ?? '').trim().toLowerCase();
    const match = (candidates ?? []).find((c: { adult_email: string | null; child_name: string | null }) =>
        String(c.adult_email ?? '').trim().toLowerCase() === e &&
        String(c.child_name ?? '').trim().toLowerCase() === n);
    return (match as { id: string } | undefined)?.id ?? null;
}

// Attaches a player to a team (idempotent). No-op when teamId is null.
async function ensureTeamMembership(sb: SB, sessionId: string, teamId: string | null): Promise<void> {
    if (!teamId) return;
    await sb.from('group_members').upsert({ group_id: teamId, session_id: sessionId }, { onConflict: 'group_id,session_id' });
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
            // To attach this session to a tenant, the caller must present a
            // valid play_token (issued by /api/start-play, which enforces
            // roster capacity + trial). We trust the tenant_id from the token,
            // not the body. Sessions with no tenant (Argo One / self-play) are
            // allowed without a token — there is no tenant roster to abuse.
            let effectiveTenantId: string | null = null;
            let effectiveTeamId: string | null = null;
            if (tenant_id) {
                const verified = verifyPlayToken(play_token, serviceKey);
                if (!verified || verified.tenantId !== tenant_id) {
                    console.warn('[session:start] Rejected tenant attribution — invalid play_token for tenant', tenant_id);
                    return res.status(403).json({ error: 'invalid_play_token' });
                }
                effectiveTenantId = verified.tenantId;
                effectiveTeamId = verified.teamId;
            }

            // ── Sport is defined by the club, not the parent ─────────────────
            // For tenant (club) plays we stamp the sport server-side from the
            // tenant record, ignoring whatever the client sends. Argo One /
            // self-play (no tenant) keeps the sport provided by the buyer.
            let effectiveSport: string | null = sport || null;
            if (effectiveTenantId) {
                const { data: tenantRow } = await sb
                    .from('tenants')
                    .select('sport')
                    .eq('id', effectiveTenantId)
                    .maybeSingle();
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
                if (!consent) {
                    return res.status(403).json({ error: 'consent_invalid' });
                }
                if (consent.status !== 'confirmed') {
                    return res.status(403).json({ error: 'consent_not_confirmed' });
                }
                if (consent.consumed_at) {
                    return res.status(403).json({ error: 'consent_already_used' });
                }
                if (new Date(consent.expires_at) < new Date()) {
                    return res.status(403).json({ error: 'consent_expired' });
                }
                // Validate consent matches the session payload (prevents token reuse for a different child)
                if (
                    consent.child_name !== child_name ||
                    consent.child_age !== child_age
                ) {
                    return res.status(403).json({ error: 'consent_mismatch' });
                }
            }

            // ── Atomic consent claim (race-safe) ──────────────────────────────
            // For <13, we atomically set consumed_at=now WHERE it's still null.
            // If the WHERE filter matches zero rows, another request already
            // won the race and we return 403 without creating a session.
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
                if (!claimed) {
                    return res.status(403).json({ error: 'consent_already_used' });
                }
            }

            // ── Identity dedup: a re-profile reuses the existing player row ──────
            // If this child already has an active session in the tenant, hand back
            // that row (with a fresh share_token) so the upcoming "update" overwrites
            // it in place. No new row, no extra roster slot. Also (re)attach to the
            // team whose link was used.
            if (effectiveTenantId) {
                const existingId = await findExistingPlayer(sb, effectiveTenantId, adult_email, child_name);
                if (existingId) {
                    const reShareToken = randomBytes(16).toString('hex');
                    await sb.from('sessions')
                        .update({ share_token: reShareToken, last_profiled_at: new Date().toISOString() })
                        .eq('id', existingId);
                    await ensureTeamMembership(sb, existingId, effectiveTeamId);
                    if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                        await sb.from('parental_consents').update({ session_id: existingId }).eq('token', consent_token);
                    }
                    return res.status(200).json({ ok: true, id: existingId, share_token: reShareToken });
                }
            }

            const share_token = randomBytes(16).toString('hex');
            const { data, error } = await sb.from('sessions').insert({
                adult_name,
                adult_email,
                child_name,
                child_age,
                sport:           effectiveSport,
                tenant_id:       effectiveTenantId,
                lang:            lang ?? 'es',
                eje:             '_pending',
                motor:           '_pending',
                archetype_label: '_pending',
                answers:         [],
                share_token,
                is_demo:         is_demo === true,
            }).select('id, share_token').single();

            if (error) {
                console.error('[session:start] Insert error:', error.message, error.details);
                // Rollback the consent claim so the token can be retried
                if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                    await sb.from('parental_consents')
                        .update({ consumed_at: null })
                        .eq('token', consent_token);
                }
                return res.status(500).json({ error: error.message });
            }

            // Link the consent row to the new session for audit
            if (typeof child_age === 'number' && child_age < 13 && typeof consent_token === 'string') {
                await sb.from('parental_consents')
                    .update({ session_id: data.id })
                    .eq('token', consent_token);
            }

            // Attach the new player to its team (per-team play link)
            await ensureTeamMembership(sb, data.id, effectiveTeamId);

            return res.status(200).json({ ok: true, id: data.id, share_token: data.share_token });
        }

        // ── Update session ───────────────────────────────────────────────────
        if (action === 'update') {
            const { id, share_token, ...rest } = fields;

            if (!id) {
                return res.status(400).json({ error: 'Missing required field: id' });
            }

            // ── Ownership gate ───────────────────────────────────────────────
            // Only the client that started this session (and holds its
            // share_token) may update it. Prevents mutating another session by
            // guessing its id.
            if (typeof share_token !== 'string' || !share_token) {
                return res.status(403).json({ error: 'missing_session_token' });
            }
            const { data: ownRow, error: ownErr } = await sb
                .from('sessions')
                .select('id, share_token')
                .eq('id', id)
                .maybeSingle();
            if (ownErr) {
                console.error('[session:update] ownership lookup error:', ownErr.message);
                return res.status(500).json({ error: 'update_lookup_failed' });
            }
            if (!ownRow || ownRow.share_token !== share_token) {
                console.warn('[session:update] Rejected update — share_token mismatch for session', id);
                return res.status(403).json({ error: 'invalid_session_token' });
            }

            const allowed: Record<string, unknown> = {};
            const safeKeys = [
                'eje', 'motor', 'archetype_label', 'eje_secundario',
                'answers', 'ai_tokens_input', 'ai_tokens_output', 'ai_cost_usd', 'ai_sections',
            ];
            for (const key of safeKeys) {
                if (rest[key] !== undefined) allowed[key] = rest[key];
            }

            if (Object.keys(allowed).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            const { error } = await sb.from('sessions').update(allowed).eq('id', id);

            if (error) {
                console.error('[session:update] Update error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({ ok: true });
        }

        // ── Save session (legacy — complete in one call) ─────────────────────
        if (action === 'save') {
            const {
                adult_name, adult_email, child_name, child_age, sport,
                eje, motor, archetype_label, eje_secundario,
                answers, tenant_id, lang, play_token,
                ai_tokens_input, ai_tokens_output, ai_cost_usd,
                is_demo,
            } = fields;

            if (!adult_email || !eje || !motor) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Same tenant + team attribution gate as "start".
            let saveTenantId: string | null = null;
            let saveTeamId: string | null = null;
            if (tenant_id) {
                const verified = verifyPlayToken(play_token, serviceKey);
                if (!verified || verified.tenantId !== tenant_id) {
                    console.warn('[session:save] Rejected tenant attribution — invalid play_token for tenant', tenant_id);
                    return res.status(403).json({ error: 'invalid_play_token' });
                }
                saveTenantId = verified.tenantId;
                saveTeamId = verified.teamId;
            }

            // Sport is defined by the club (see "start"). Stamp it server-side.
            let saveSport: string | null = sport || null;
            if (saveTenantId) {
                const { data: tenantRow } = await sb
                    .from('tenants')
                    .select('sport')
                    .eq('id', saveTenantId)
                    .maybeSingle();
                saveSport = tenantRow?.sport ?? null;
            }

            // ── Identity dedup (save path): update existing player in place ──────
            if (saveTenantId) {
                const existingId = await findExistingPlayer(sb, saveTenantId, adult_email, child_name);
                if (existingId) {
                    const { error: upErr } = await sb.from('sessions').update({
                        eje,
                        motor,
                        archetype_label,
                        eje_secundario:   eje_secundario ?? null,
                        answers:          answers ?? [],
                        ai_tokens_input:  ai_tokens_input ?? 0,
                        ai_tokens_output: ai_tokens_output ?? 0,
                        ai_cost_usd:      ai_cost_usd ?? 0,
                        last_profiled_at: new Date().toISOString(),
                    }).eq('id', existingId);
                    if (upErr) {
                        console.error('[session:save] Update existing error:', upErr.message);
                        return res.status(500).json({ error: upErr.message });
                    }
                    await ensureTeamMembership(sb, existingId, saveTeamId);
                    await logActivity(sb, {
                        area: 'producto', action: 'session_reprofiled', sourceType: 'system', severity: 'info',
                        resourceType: 'session', resourceId: String(existingId),
                        reason: { session_id: existingId, eje, motor, tenant_id: saveTenantId },
                        relatedLogs: [`sessions.${existingId}`],
                    });
                    return res.status(200).json({ ok: true, id: existingId, share_token: '' });
                }
            }

            const save_share_token = randomBytes(16).toString('hex');
            const { data: saveData, error } = await sb.from('sessions').insert({
                adult_name,
                adult_email,
                child_name,
                child_age,
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
                share_token:      save_share_token,
                is_demo:          is_demo === true,
            }).select('id, share_token').single();

            if (error) {
                console.error('[session:save] Insert error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            // Attach the new player to its team (per-team play link)
            await ensureTeamMembership(sb, saveData.id, saveTeamId);

            // Principia ingestion (area=producto): a play finished with a real profile.
            await logActivity(sb, {
                area: 'producto',
                action: 'session_completed',
                sourceType: 'system',
                severity: 'info',
                resourceType: 'session',
                resourceId: String(saveData.id),
                reason: { session_id: saveData.id, eje, motor, tenant_id: saveTenantId },
                relatedLogs: [`sessions.${saveData.id}`],
            });

            return res.status(200).json({ ok: true, id: saveData.id, share_token: saveData.share_token });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('[session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
