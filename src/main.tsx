import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import App from './App.tsx'
import './index.css'

// ─── Browser error telemetry (custom, in-house instead of Sentry) ─────────
// Wires window 'error' and 'unhandledrejection' to /api/client-errors via
// sendBeacon. Fire-and-forget — never blocks. The /admin/health page
// aggregates the events. Filters telemetry beacon failures so we don't
// log the very transport we're about to use.
(function setupClientErrorTelemetry() {
    if (typeof window === 'undefined') return;
    const SAMPLED_PATHS = new Set(['/audio-telemetry', '/client-errors']);
    const beam = (payload: Record<string, unknown>) => {
        try {
            const body = JSON.stringify(payload);
            if (navigator.sendBeacon) {
                const blob = new Blob([body], { type: 'application/json' });
                navigator.sendBeacon('/api/client-errors', blob);
            } else if (typeof fetch !== 'undefined') {
                fetch('/api/client-errors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    keepalive: true,
                }).catch(() => {});
            }
        } catch { /* never throw from a telemetry path */ }
    };

    window.addEventListener('error', (e: ErrorEvent) => {
        // Skip our own telemetry endpoints to prevent feedback loops.
        if (typeof e.filename === 'string' && SAMPLED_PATHS.has(new URL(e.filename, window.location.origin).pathname)) return;
        beam({
            kind: 'error',
            message: e.message ?? null,
            source: e.filename ?? null,
            line: e.lineno ?? null,
            col: e.colno ?? null,
            stack: e.error?.stack ?? null,
            url: window.location.href,
            ua: navigator.userAgent,
        });
    });

    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        const reason = e.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        const stack = reason instanceof Error ? reason.stack : null;
        beam({
            kind: 'unhandledrejection',
            message: message?.slice(0, 500) ?? null,
            stack: stack ?? null,
            url: window.location.href,
            ua: navigator.userAgent,
        });
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
