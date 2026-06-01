import posthog from 'posthog-js';

/**
 * PostHog analytics — conversion funnel for the marketing/business side
 * (landing → pricing → signup → trial → paid). Privacy-conscious by design:
 *
 *  - No-ops entirely unless VITE_POSTHOG_KEY is set (safe before configuration).
 *  - autocapture + automatic pageviews are OFF; we only send explicit events
 *    and pageviews we trigger ourselves.
 *  - Callers must NOT track on children's game routes (/play, /one, /app,
 *    /consent). The AnalyticsGate enforces this for pageviews.
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

let initialized = false;

export function initAnalytics(): void {
    if (initialized || !KEY) return;
    posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false,
        autocapture: false,
        persistence: 'localStorage',
    });
    initialized = true;
}

/** Manually record a pageview (called only for non-game routes). */
export function trackPageview(path: string): void {
    if (!KEY) return;
    initAnalytics();
    posthog.capture('$pageview', { $current_url: path });
}

/** Record a funnel/business event, e.g. track('subscription_upgraded', { plan }). */
export function track(event: string, props?: Record<string, unknown>): void {
    if (!KEY) return;
    initAnalytics();
    posthog.capture(event, props);
}
