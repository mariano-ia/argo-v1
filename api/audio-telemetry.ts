import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/audio-telemetry
 *
 * Fire-and-forget receiver for the in-flow audio watchdog. Every time the
 * client's recoverAudioIfNeeded / watchdog / same-src revive heals a
 * stalled or silent audio element, it beams one event here (typically via
 * navigator.sendBeacon, so the request survives navigation).
 *
 * The endpoint is intentionally lenient:
 *  - No auth (data is innocuous device-state telemetry, not user PII).
 *  - Validates the recovery_type whitelist + truncates free-text fields,
 *    but always returns 204 quickly so the client side never blocks.
 *  - On any error, swallows + returns 204 so the UI can never see a 5xx
 *    bouncing back from a telemetry beacon.
 */

const KNOWN_RECOVERY_TYPES = new Set([
    'ctx_resume',
    'effect_replay',
    'effect_stall_nudge',
    'gain_rescue',
    'same_src_revive',
    'visibility_recover',
    'ended_restart',
]);

function trunc(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    return value.length > max ? value.slice(0, max) : value;
}

// Cheap DoS cap. Real telemetry payloads are <500 bytes; 8KB is huge slack.
const MAX_BODY_BYTES = 8192;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Always answer fast — telemetry must never block the page.
    if (req.method !== 'POST') {
        res.status(204).end();
        return;
    }

    const contentLength = Number(req.headers['content-length'] ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
        res.status(413).end();
        return;
    }

    try {
        // sendBeacon delivers Blob(application/json) which Vercel sometimes
        // hands us as a string rather than auto-parsing. Tolerate both.
        let body: Record<string, unknown> = {};
        if (typeof req.body === 'string') {
            try { body = JSON.parse(req.body); } catch { body = {}; }
        } else if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
            body = req.body as Record<string, unknown>;
        }
        const recovery_type = typeof body.recovery_type === 'string' ? body.recovery_type : null;
        if (!recovery_type || !KNOWN_RECOVERY_TYPES.has(recovery_type)) {
            res.status(204).end();
            return;
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        if (!serviceKey || !supabaseUrl) {
            res.status(204).end();
            return;
        }

        const sb = createClient(supabaseUrl, serviceKey);

        const session_id_raw = typeof body.session_id === 'string' ? body.session_id : null;
        const uuid_re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const session_id = session_id_raw && uuid_re.test(session_id_raw) ? session_id_raw : null;

        const screen_index = typeof body.screen_index === 'number' && Number.isFinite(body.screen_index)
            ? Math.floor(body.screen_index)
            : null;

        await sb.from('audio_events').insert({
            session_id,
            screen_index,
            recovery_type,
            ctx_state:    trunc(body.ctx_state, 32),
            effect_src:   trunc(body.effect_src, 128),
            ua:           trunc(body.ua, 500),
            is_demo:      body.is_demo === true || body.is_demo === 'true' || body.is_demo === 1,
        });

        res.status(204).end();
    } catch (err) {
        console.error('[audio-telemetry] insert failed:', err);
        res.status(204).end();
    }
}
