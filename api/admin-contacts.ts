import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * GET /api/admin-contacts
 * Superadmin-only. Builds a single deduplicated contact list (by lowercased email)
 * out of every source where we hold a real person's email. Aggregates name, language,
 * audience (coach vs family), commercial relationship, origin sources, profile count,
 * and first-seen / last-activity timestamps across sources.
 *
 * Read-only. Intended to feed the admin "Contactos" tab (search + filters + CSV export),
 * and eventually a newsletter integration.
 */

type Audience = 'coach' | 'family';

interface Contact {
    email: string;
    name: string;
    lang: string;
    audience: Audience;
    segments: string[]; // paid | trial | one | puentes | lead
    sources: string[];  // tenant | member | session | one | one_link | puentes | lead
    country: string;
    city: string;
    sport: string;
    profiles: number;
    first_seen: string | null;
    last_activity: string | null;
}

const norm = (v: unknown): string =>
    typeof v === 'string' ? v.trim().toLowerCase() : '';

const isEmail = (v: string): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

// Fetch every row of a table in pages of 1000 (Supabase per-request cap).
async function fetchAll(
    sb: SupabaseClient,
    table: string,
    columns: string,
): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb
            .from(table)
            .select(columns)
            .range(from, from + PAGE - 1);
        if (error) throw error;
        const rows = (data ?? []) as unknown as Record<string, unknown>[];
        out.push(...rows);
        if (rows.length < PAGE) break;
    }
    return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify caller is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
    }

    const { data: { user }, error: authError } = await sb.auth.getUser(
        authHeader.replace('Bearer ', ''),
    );
    if (authError || !user?.email) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: callerAdmin } = await sb
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

    if (!callerAdmin) {
        return res.status(403).json({ error: 'Not an admin' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const map = new Map<string, Contact>();

        const touch = (email: string): Contact | null => {
            const key = norm(email);
            if (!isEmail(key)) return null;
            let c = map.get(key);
            if (!c) {
                c = {
                    email: key,
                    name: '',
                    lang: '',
                    audience: 'family',
                    segments: [],
                    sources: [],
                    country: '',
                    city: '',
                    sport: '',
                    profiles: 0,
                    first_seen: null,
                    last_activity: null,
                };
                map.set(key, c);
            }
            return c;
        };

        const setIfEmpty = (c: Contact, field: 'name' | 'lang' | 'country' | 'city' | 'sport', v: unknown) => {
            if (!c[field] && typeof v === 'string' && v.trim()) c[field] = v.trim();
        };

        const addSource = (c: Contact, s: string) => {
            if (!c.sources.includes(s)) c.sources.push(s);
        };

        const addSegment = (c: Contact, s: string) => {
            if (!c.segments.includes(s)) c.segments.push(s);
        };

        const seenAt = (c: Contact, iso: unknown) => {
            if (typeof iso !== 'string' || !iso) return;
            if (!c.first_seen || iso < c.first_seen) c.first_seen = iso;
            if (!c.last_activity || iso > c.last_activity) c.last_activity = iso;
        };

        // Per source: fail soft so one schema drift doesn't kill the whole list.
        const safe = async (fn: () => Promise<void>, label: string) => {
            try { await fn(); } catch (e) { console.error(`[admin-contacts] source ${label} failed:`, e); }
        };

        // 1) Tenants — paying / trial account owners (coaches, clubs)
        await safe(async () => {
            const rows = await fetchAll(sb, 'tenants', 'email, display_name, plan, country, city, sport, lang, created_at');
            for (const r of rows) {
                const c = touch(r.email as string);
                if (!c) continue;
                c.audience = 'coach';
                addSource(c, 'tenant');
                const plan = norm(r.plan);
                addSegment(c, plan && plan !== 'trial' ? 'paid' : 'trial');
                setIfEmpty(c, 'name', r.display_name);
                setIfEmpty(c, 'lang', r.lang);
                setIfEmpty(c, 'country', r.country);
                setIfEmpty(c, 'city', r.city);
                setIfEmpty(c, 'sport', r.sport);
                seenAt(c, r.created_at);
            }
        }, 'tenants');

        // 2) Tenant members — invited coaches / staff
        await safe(async () => {
            const rows = await fetchAll(sb, 'tenant_members', 'email, full_name, created_at');
            for (const r of rows) {
                const c = touch(r.email as string);
                if (!c) continue;
                c.audience = 'coach';
                addSource(c, 'member');
                setIfEmpty(c, 'name', r.full_name);
                seenAt(c, r.created_at);
            }
        }, 'tenant_members');

        // 3) Sessions — adults who profiled a child (parents and coaches)
        await safe(async () => {
            const rows = await fetchAll(sb, 'sessions', 'adult_email, adult_name, sport, lang, created_at, is_demo, deleted_at');
            for (const r of rows) {
                if (r.deleted_at) continue;
                if (r.is_demo === true) continue;
                const c = touch(r.adult_email as string);
                if (!c) continue;
                addSource(c, 'session');
                c.profiles += 1;
                setIfEmpty(c, 'name', r.adult_name);
                setIfEmpty(c, 'lang', r.lang);
                setIfEmpty(c, 'sport', r.sport);
                seenAt(c, r.created_at);
            }
        }, 'sessions');

        // 4) ArgoOne® purchases — parent buyers (one-time)
        await safe(async () => {
            const rows = await fetchAll(sb, 'one_purchases', 'email, lang, created_at, paid_at');
            for (const r of rows) {
                const c = touch(r.email as string);
                if (!c) continue;
                addSource(c, 'one');
                addSegment(c, 'one');
                setIfEmpty(c, 'lang', r.lang);
                seenAt(c, r.created_at);
                seenAt(c, r.paid_at);
            }
        }, 'one_purchases');

        // 5) ArgoOne® links — recipients (may differ from buyer)
        await safe(async () => {
            const rows = await fetchAll(sb, 'one_links', 'recipient_email, child_name, sport, created_at, completed_at');
            for (const r of rows) {
                const c = touch(r.recipient_email as string);
                if (!c) continue;
                addSource(c, 'one_link');
                addSegment(c, 'one');
                if (r.completed_at) c.profiles += 1;
                setIfEmpty(c, 'sport', r.sport);
                seenAt(c, r.created_at);
                seenAt(c, r.completed_at);
            }
        }, 'one_links');

        // 6) ArgoPuente® purchases — adults who bought the bridge report
        await safe(async () => {
            const rows = await fetchAll(sb, 'puentes_purchases', 'recipient_email, recipient_name, lang, created_at, paid_at');
            for (const r of rows) {
                const c = touch(r.recipient_email as string);
                if (!c) continue;
                addSource(c, 'puentes');
                addSegment(c, 'puentes');
                setIfEmpty(c, 'name', r.recipient_name);
                setIfEmpty(c, 'lang', r.lang);
                seenAt(c, r.created_at);
                seenAt(c, r.paid_at);
            }
        }, 'puentes_purchases');

        // 7) Leads — landing / newsletter signups
        await safe(async () => {
            const rows = await fetchAll(sb, 'leads', 'email, first_seen, last_seen');
            for (const r of rows) {
                const c = touch(r.email as string);
                if (!c) continue;
                addSource(c, 'lead');
                seenAt(c, r.first_seen);
                seenAt(c, r.last_seen);
            }
        }, 'leads');

        // Final pass: anyone with no commercial segment is just a lead/contact.
        const contacts = [...map.values()].map((c) => {
            if (c.segments.length === 0) c.segments.push('lead');
            return c;
        });

        // Most recent activity first.
        contacts.sort((a, b) => (b.last_activity ?? '').localeCompare(a.last_activity ?? ''));

        return res.status(200).json({ contacts, total: contacts.length });
    } catch (err) {
        console.error('[admin-contacts] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
