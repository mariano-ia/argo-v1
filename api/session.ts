import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
            const { adult_name, adult_email, child_name, child_age, sport, tenant_id, lang } = fields;

            if (!adult_email || !child_name) {
                return res.status(400).json({ error: 'Missing required fields: adult_email, child_name' });
            }

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
            }).select('id').single();

            if (error) {
                console.error('[session:start] Insert error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({ ok: true, id: data.id });
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
                'answers', 'ai_tokens_input', 'ai_tokens_output', 'ai_cost_usd',
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

            const { error } = await sb.from('sessions').insert({
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
            });

            if (error) {
                console.error('[session:save] Insert error:', error.message, error.details);
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('[session] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
