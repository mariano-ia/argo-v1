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

// Server-side defense-in-depth. The client (src/main.tsx) already skips these,
// but an outdated/other client could still POST them. Drop non-actionable noise
// so it never inflates the client_errors_per_day signal (Vigia SIGNAL 1):
//   - dev/localhost origins (a `vercel dev` session writes to the prod DB)
//   - browser internals that are not bugs (ResizeObserver loop, auth lock steal)
//   - stale-chunk errors after a deploy (the client auto-reloads; see main.tsx)
// Keep this list in sync with BENIGN_NOISE / STALE_CHUNK in src/main.tsx.
// "Lock (broken|was stolen)" covers both Chrome's and Safari's phrasing of the
// same benign Web Locks auth event.
const NOISE_MESSAGE = /ResizeObserver loop|Lock (?:broken|was stolen) by another request|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|is not a valid JavaScript MIME type|Loading chunk \S+ failed/i;

// Transitional filter (added 2026-07-04). Bundles built while main.tsx still
// preventDefault()ed vite:preloadError turn a stale chunk after a deploy into
// a generic TypeError from the lazy route factory in src/App.tsx
// (`.then(m => ({ default: m.TenantHome }))` with m === undefined). Browsers
// holding those cached bundles will beam that TypeError one last time on the
// next deploy. Drop it ONLY when the property being read is exactly one of the
// lazy route exports below. Safe to delete once pre-2026-07-04 bundles have
// aged out of caches (roughly a few deploys from now).
const LAZY_ROUTE_EXPORTS = new Set([
    'TenantDashboard', 'TenantHome', 'TenantSettings', 'TenantUsers',
    'TenantGroups', 'TenantGrupos', 'TenantGuide', 'TenantPlayers',
    'TenantChat', 'TenantPricing', 'TenantHelp',
    'Dashboard', 'Sessions', 'Metrics', 'QuestionsAdmin', 'AdminUsers',
    'AdminTenants', 'AdminAIUsage', 'AdminRevenue', 'AdminArgoOne',
    'Contactos', 'AdminAuditLog', 'AdminHealth', 'Feedback',
    'PrincipiaShell', 'Resumen', 'Registros', 'Incidentes', 'Bandeja',
    'AreaDetail', 'Consilium', 'BlogAdmin', 'BlogEditor',
    'SetPassword', 'FeedbackForm', 'ReportPage', 'TermsPage', 'PrivacyPage',
    'PricingPage', 'Familias', 'OnePlay', 'OnePanel', 'ConsentLanding',
    'DeleteMyData', 'DeleteLanding', 'ResultRevealPreview',
    'TestIslas', 'TestEsquivar', 'TestTormenta', 'Deck', 'Demo',
]);
// Chrome: Cannot read properties of undefined (reading 'X')
// Safari: undefined is not an object (evaluating '$.X')
const RESIDUAL_LAZY_PATTERNS = [
    /Cannot read properties of undefined \(reading '(\w+)'\)/,
    /undefined is not an object \(evaluating '[\w$]+\.(\w+)'\)/,
];
function isStaleLazyResidual(message: string): boolean {
    for (const re of RESIDUAL_LAZY_PATTERNS) {
        const m = re.exec(message);
        if (m && LAZY_ROUTE_EXPORTS.has(m[1])) return true;
    }
    return false;
}

function isLocalOrigin(...vals: (string | null | undefined)[]): boolean {
    return vals.some(v => typeof v === 'string' && /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(v));
}

// Cheap DoS cap. Real error payloads are <2KB; 16KB covers oversize stacks.
const MAX_BODY_BYTES = 16384;

function trunc(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    return value.length > max ? value.slice(0, max) : value;
}

function int(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.floor(value);
}

// Defense-in-depth — the client already scrubs, but if the client is
// compromised / outdated, still strip the obvious patterns at ingest.
function scrubSensitive(s: string | null): string | null {
    if (s === null) return null;
    return s
        .replace(/([?&])(access_token|token|session_id|auth|api_key|bearer|email|key)=[^&\s"']+/gi, '$1$2=REDACTED')
        .replace(/(Authorization:\s*Bearer\s+)[^\s"']+/gi, '$1REDACTED');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        const kind = typeof body.kind === 'string' ? body.kind : null;
        if (!kind || !KNOWN_KINDS.has(kind)) {
            res.status(204).end();
            return;
        }

        // Drop non-actionable noise (see NOISE_MESSAGE above). Silently accept (204)
        // so the client stays fire-and-forget; we just don't persist it.
        const rawMessage = typeof body.message === 'string' ? body.message : '';
        if (
            NOISE_MESSAGE.test(rawMessage) ||
            isStaleLazyResidual(rawMessage) ||
            isLocalOrigin(
                typeof body.url === 'string' ? body.url : null,
                typeof body.source === 'string' ? body.source : null,
            )
        ) {
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
            message: scrubSensitive(trunc(body.message, 1000)),
            source:  scrubSensitive(trunc(body.source,  500)),
            line:    int(body.line),
            col:     int(body.col),
            stack:   scrubSensitive(trunc(body.stack,   4000)),
            url:     scrubSensitive(trunc(body.url,     500)),
            ua:      trunc(body.ua, 500),
        });

        res.status(204).end();
    } catch (err) {
        console.error('[client-errors] insert failed:', err);
        res.status(204).end();
    }
}
