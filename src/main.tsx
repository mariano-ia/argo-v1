import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import App from './App.tsx'
import './index.css'

// ─── Browser error telemetry (custom, in-house instead of Sentry) ─────────
// Wires window 'error' and 'unhandledrejection' to /api/client-errors via
// sendBeacon. Fire-and-forget — never blocks, never throws into the
// listener (which would loop the error event).
(function setupClientErrorTelemetry() {
    if (typeof window === 'undefined') return;
    const TELEMETRY_PATHS = new Set(['/api/audio-telemetry', '/api/client-errors']);

    // Strip sensitive query params + auth headers from anything that lands
    // in the DB. Catches the common Argo cases: ?token=, ?access_token=,
    // magic-link tokens, "Authorization: Bearer ...".
    const scrubSensitive = (s: string | null | undefined): string | null => {
        if (typeof s !== 'string') return null;
        return s
            .replace(/([?&])(access_token|token|session_id|auth|api_key|bearer|email|key)=[^&\s"']+/gi, '$1$2=REDACTED')
            .replace(/(Authorization:\s*Bearer\s+)[^\s"']+/gi, '$1REDACTED');
    };

    const beam = (payload: Record<string, unknown>) => {
        try {
            const body = JSON.stringify(payload);
            let sent = false;
            if (navigator.sendBeacon) {
                const blob = new Blob([body], { type: 'application/json' });
                // sendBeacon returns true only if the user agent queued the request.
                sent = navigator.sendBeacon('/api/client-errors', blob);
            }
            if (!sent && typeof fetch !== 'undefined') {
                fetch('/api/client-errors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    keepalive: true,
                }).catch(() => {});
            }
        } catch { /* never throw from a telemetry path */ }
    };

    const isOwnTelemetry = (filename: unknown): boolean => {
        if (typeof filename !== 'string' || !filename) return false;
        try {
            const u = new URL(filename, window.location.origin);
            return TELEMETRY_PATHS.has(u.pathname);
        } catch {
            return false; // malformed URL → not ours
        }
    };

    window.addEventListener('error', (e: ErrorEvent) => {
        if (isOwnTelemetry(e.filename)) return;
        try {
            beam({
                kind: 'error',
                message: scrubSensitive(e.message ?? null),
                source:  scrubSensitive(e.filename ?? null),
                line:    e.lineno ?? null,
                col:     e.colno ?? null,
                stack:   scrubSensitive(e.error?.stack ?? null),
                url:     scrubSensitive(window.location.href),
                ua:      navigator.userAgent,
            });
        } catch { /* swallow */ }
    });

    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        try {
            const reason = e.reason;
            let message: string | null = null;
            let stack: string | null = null;
            // Defensive extraction — reason can be Error, string, object with
            // hostile toString, cross-realm Error, null, undefined, etc.
            try {
                if (reason && typeof reason === 'object') {
                    if ('message' in reason && typeof (reason as { message?: unknown }).message === 'string') {
                        message = (reason as { message: string }).message;
                    }
                    if ('stack' in reason && typeof (reason as { stack?: unknown }).stack === 'string') {
                        stack = (reason as { stack: string }).stack;
                    }
                } else if (typeof reason === 'string') {
                    message = reason;
                } else if (typeof reason === 'number' || typeof reason === 'boolean') {
                    message = String(reason);
                }
            } catch { message = '[reason extraction failed]'; }

            beam({
                kind: 'unhandledrejection',
                message: scrubSensitive(message?.slice(0, 500) ?? null),
                stack:   scrubSensitive(stack ?? null),
                url:     scrubSensitive(window.location.href),
                ua:      navigator.userAgent,
            });
        } catch { /* swallow */ }
    });
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <LangProvider>
                <App />
            </LangProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
