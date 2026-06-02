import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/client-errors
 *
 * Fire-and-forget receiver for browser-side window.error and
 * unhandledrejection events. Same lenient contract as audio-telemetry:
 * never 5xx back to the client, always returns 204 quickly, truncates
 * all free-text fields, drops anything outside the known shape.
 */

const KNOWN_KINDS = new Set(['error', 'unhandledrejection']);

function trunc(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    return value.length > max ? value.slice(0, max) : value;
}

function int(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.floor(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(204).end();
        return;
    }

    try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const kind = typeof body.kind === 'string' ? body.kind : null;
        if (!kind || !KNOWN_KINDS.has(kind)) {
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

        await sb.from('client_errors').insert({
            kind,
            message: trunc(body.message, 1000),
            source:  trunc(body.source,  500),
            line:    int(body.line),
            col:     int(body.col),
            stack:   trunc(body.stack,   4000),
            url:     trunc(body.url,     500),
            ua:      trunc(body.ua,      500),
        });

        res.status(204).end();
    } catch (err) {
        console.error('[client-errors] insert failed:', err);
        res.status(204).end();
    }
}
