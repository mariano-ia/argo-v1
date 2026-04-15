import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

/**
 * Unified session endpoint. Routes by `action` field in POST body:
 *   - "start"  → create a started session (returns id)
 *   - "update" → update an existing session by id
 *   - "save"   → create a complete session in one call (legacy fallback)
 */
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
            const { adult_name, adult_email, child_name, child_age, sport, tenant_id, lang, consent_token } = fields;

            if (!adult_email || !child_name) {
                return res.status(400).json({ error: 'Missing required fields: adult_email, child_name' });
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

            const share_token = randomBytes(16).toString('hex');
            const { data, error } = await sb.from('sessions').insert({
                adult_name,
                adult_email,
                child_name,
                child_age,
                sport:           sport || null,
                tenant_id:       tenant_id ?? null,
                lang:            lang ?? 'es',
                eje:             '_pending',
                motor:           '_pending',
                archetype_label: '_pending',
                answers:         [],
                share_token,
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

            return res.status(200).json({ ok: true, id: data.id, share_token: data.share_token });
        }

        // ── Update session ───────────────────────────────────────────────────
        if (action === 'update') {
            const { id, ...rest } = fields;

            if (!id) {
                return res.status(400).json({ error: 'Missing required field: id' });
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
                answers, tenant_id, lang,
                ai_tokens_input, ai_tokens_output, ai_cost_usd,
            } = fields;

            if (!adult_email || !eje || !motor) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const save_share_token = randomBytes(16).toString('hex');
            const { data: saveData, error } = await sb.from('sessions').insert({
                adult_name,
                adult_email,
                child_name,
                child_age,
                sport:            sport || null,
                eje,
                motor,
                archetype_label,
                eje_secundario:   eje_secundario ?? null,
                tenant_id:        tenant_id ?? null,
                lang:             lang ?? 'es',
                answers:          answers ?? [],
                ai_tokens_input:  ai_tokens_input ?? 0,
                ai_tokens_output: ai_tokens_output ?? 0,
                ai_cost_usd:      ai_cost_usd ?? 0,
                share_token:      save_share_token,
            }).select('id, share_token').single();

            if (error) {
                console.error('[session:save] Insert error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({ ok: true, id: saveData.id });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('[session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
