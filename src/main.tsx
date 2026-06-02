import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { LangProvider } from './context/LangContext'
import App from './App.tsx'
import './index.css'

// Sentry: client-side error + performance tracking. No-op if DSN is unset
// (preview branches / local dev). Configure via VITE_SENTRY_DSN in Vercel.
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN as string,
        environment: import.meta.env.MODE,
        // Browser tracing + replay sampling kept conservative: this is a low-
        // volume app and we mostly care about errors. Bump if needed later.
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.5,
        // Filter out telemetry beacons and other expected fire-and-forget
        // requests that occasionally fail in transit (don't pollute Sentry).
        beforeSend(event, hint) {
            const err = hint.originalException as Error | undefined;
            if (err?.message?.includes('audio-telemetry')) return null;
            return event;
        },
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <LangProvider>
                <App />
            </LangProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
