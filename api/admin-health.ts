import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-health
 *
 * Superadmin one-shot aggregation of both telemetry streams:
 *  - audio_events (the watchdog/self-heal events)
 *  - client_errors (window.error + unhandledrejection)
 *
 * Returns 30-day aggregates by day / type / screen / device for audio,
 * and 30-day aggregates by day / message-prefix / browser for errors,
 * plus the 50 most recent raw rows of each. Bearer-token gated via the
 * admin_users.email allowlist (same pattern as admin-tenants etc.).
 */

interface AudioRaw {
    created_at: string;
    recovery_type: string;
    screen_index: number | null;
    ctx_state: string | null;
    effect_src: string | null;
    ua: string | null;
    is_demo: boolean;
}

interface ErrorRaw {
    created_at: string;
    kind: string;
    message: string | null;
    source: string | null;
    line: number | null;
    col: number | null;
    stack: string | null;
    url: string | null;
    ua: string | null;
}

function deviceClass(ua: string | null): string {
    if (!ua) return 'unknown';
    const u = ua.toLowerCase();
    if (/iphone|ipad|ipod/.test(u)) return 'iOS';
    if (/android/.test(u))           return 'Android';
    if (/macintosh|mac os x/.test(u)) return 'macOS';
    if (/windows/.test(u))           return 'Windows';
    if (/linux/.test(u))             return 'Linux';
    return 'other';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user || !userData.user.email) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: admin } = await sb
        .from('admin_users')
        .select('id')
        .eq('email', userData.user.email)
        .maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Not authorized' });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: audioRows }, { data: errorRows }] = await Promise.all([
        sb.from('audio_events')
            .select('created_at, recovery_type, screen_index, ctx_state, effect_src, ua, is_demo')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(5000),
        sb.from('client_errors')
            .select('created_at, kind, message, source, line, col, stack, url, ua')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(5000),
    ]);

    // ── Audio aggregations ─────────────────────────────────────────────────
    const audioEvents = (audioRows ?? []) as AudioRaw[];
    const audio = {
        total: audioEvents.length,
        demo_count: audioEvents.filter(e => e.is_demo).length,
        by_day: {} as Record<string, number>,
        by_type: {} as Record<string, number>,
        by_screen: {} as Record<number, number>,
        by_device: {} as Record<string, number>,
        recent: audioEvents.slice(0, 50),
    };
    for (const e of audioEvents) {
        const day = e.created_at.slice(0, 10);
        audio.by_day[day] = (audio.by_day[day] ?? 0) + 1;
        audio.by_type[e.recovery_type] = (audio.by_type[e.recovery_type] ?? 0) + 1;
        if (typeof e.screen_index === 'number') {
            audio.by_screen[e.screen_index] = (audio.by_screen[e.screen_index] ?? 0) + 1;
        }
        const dev = deviceClass(e.ua);
        audio.by_device[dev] = (audio.by_device[dev] ?? 0) + 1;
    }

    // ── Error aggregations ─────────────────────────────────────────────────
    const errorEvents = (errorRows ?? []) as ErrorRaw[];
    const errors = {
        total: errorEvents.length,
        by_day:  {} as Record<string, number>,
        by_kind: {} as Record<string, number>,
        by_msg:  {} as Record<string, number>,   // first 80 chars
        by_device: {} as Record<string, number>,
        recent: errorEvents.slice(0, 50),
    };
    for (const e of errorEvents) {
        const day = e.created_at.slice(0, 10);
        errors.by_day[day] = (errors.by_day[day] ?? 0) + 1;
        errors.by_kind[e.kind] = (errors.by_kind[e.kind] ?? 0) + 1;
        const msgKey = (e.message ?? 'unknown').slice(0, 80);
        errors.by_msg[msgKey] = (errors.by_msg[msgKey] ?? 0) + 1;
        const dev = deviceClass(e.ua);
        errors.by_device[dev] = (errors.by_device[dev] ?? 0) + 1;
    }

    return res.status(200).json({
        audio,
        errors,
        window: { days: 30, since },
    });
}
