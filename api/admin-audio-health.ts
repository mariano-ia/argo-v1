import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-audio-health
 *
 * Superadmin endpoint that aggregates the `audio_events` telemetry table
 * into a small set of charts for /admin/audio-health: total recoveries
 * over the last 30 days, breakdown by recovery_type, by screen_index,
 * by device class (rough UA parse), and the 50 most recent raw events.
 *
 * Authenticates by requiring a valid superadmin bearer token (the
 * existing pattern — see admin-tenants.ts).
 */

interface RawEvent {
    created_at: string;
    recovery_type: string;
    screen_index: number | null;
    ctx_state: string | null;
    effect_src: string | null;
    ua: string | null;
    is_demo: boolean;
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

    // Auth: require a bearer token from a superadmin user (same as the
    // other /api/admin-* endpoints — they use the user JWT to verify the
    // 'is_admin' flag via Supabase).
    const authHeader = (req.headers['authorization'] ?? '') as string;
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    const { data: adminCheck } = await sb
        .from('users')
        .select('is_admin')
        .eq('id', userData.user.id)
        .maybeSingle();
    if (!adminCheck?.is_admin) return res.status(403).json({ error: 'Not authorized' });

    // Pull 30 days of events. The table is indexed on created_at DESC.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await sb
        .from('audio_events')
        .select('created_at, recovery_type, screen_index, ctx_state, effect_src, ua, is_demo')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);

    if (error) {
        console.error('[admin-audio-health] query error:', error.message);
        return res.status(500).json({ error: error.message });
    }

    const events = (rows ?? []) as RawEvent[];
    const total = events.length;

    const byDay: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byScreen: Record<number, number> = {};
    const byDevice: Record<string, number> = {};
    let demoCount = 0;

    for (const e of events) {
        const day = e.created_at.slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + 1;
        byType[e.recovery_type] = (byType[e.recovery_type] ?? 0) + 1;
        if (typeof e.screen_index === 'number') {
            byScreen[e.screen_index] = (byScreen[e.screen_index] ?? 0) + 1;
        }
        const dev = deviceClass(e.ua);
        byDevice[dev] = (byDevice[dev] ?? 0) + 1;
        if (e.is_demo) demoCount++;
    }

    return res.status(200).json({
        total,
        demo_count: demoCount,
        by_day: byDay,
        by_type: byType,
        by_screen: byScreen,
        by_device: byDevice,
        recent: events.slice(0, 50),
        window: { days: 30, since },
    });
}
