import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin Tenants API.
 * GET  /api/admin-tenants                          → list all tenants with stats
 * POST /api/admin-tenants  { action, tenant_id, ... } → manage tenant
 *
 * Actions:
 *   - "change-plan"    { tenant_id, plan, roster_limit }
 *   - "create-enterprise" { email, display_name, roster_limit }
 *   - "reset-trial"    { tenant_id }
 *   - "extend-trial"   { tenant_id, days }
 */

async function verifyAdmin(req: VercelRequest, sb: ReturnType<typeof createClient>): Promise<string | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const { data: { user }, error } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) return null;
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', user.email).maybeSingle();
    return admin ? (user.email ?? null) : null;
}

async function auditLog(sb: ReturnType<typeof createClient>, adminEmail: string, action: string, targetType: string, targetId: string, details?: Record<string, unknown>) {
    await sb.from('admin_audit_log').insert({ admin_email: adminEmail, action, target_type: targetType, target_id: targetId, details: details ?? null }).catch(() => {});
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    const adminEmail = await verifyAdmin(req, sb);
    if (!adminEmail) return res.status(403).json({ error: 'Admin access required' });

    try {
        // ── GET: List all tenants with stats ────────────────────────────
        if (req.method === 'GET') {
            const { data: tenants } = await sb
                .from('tenants')
                .select('id, email, display_name, slug, plan, roster_limit, ai_queries_count, ai_queries_reset_at, trial_expires_at, onboarding_completed, created_at, institution_type, sport, country')
                .order('created_at', { ascending: false });

            // Get session counts per tenant
            const tenantIds = (tenants ?? []).map(t => t.id);
            const stats: Record<string, { active_players: number; total_sessions: number; last_session: string | null }> = {};

            if (tenantIds.length > 0) {
                // Active players per tenant
                for (const t of tenants ?? []) {
                    const { count: activeCount } = await sb
                        .from('sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', t.id)
                        .is('archived_at', null)
                        .is('deleted_at', null)
                        .not('eje', 'eq', '_pending');

                    const { count: totalCount } = await sb
                        .from('sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', t.id)
                        .is('deleted_at', null);

                    const { data: lastSession } = await sb
                        .from('sessions')
                        .select('created_at')
                        .eq('tenant_id', t.id)
                        .is('deleted_at', null)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    stats[t.id] = {
                        active_players: activeCount ?? 0,
                        total_sessions: totalCount ?? 0,
                        last_session: lastSession?.created_at ?? null,
                    };
                }
            }

            const enriched = (tenants ?? []).map(t => ({
                ...t,
                active_players: stats[t.id]?.active_players ?? 0,
                total_sessions: stats[t.id]?.total_sessions ?? 0,
                last_session: stats[t.id]?.last_session ?? null,
                days_since_last: stats[t.id]?.last_session
                    ? Math.floor((Date.now() - new Date(stats[t.id].last_session!).getTime()) / 86400000)
                    : null,
                trial_days_left: t.plan === 'trial' && t.trial_expires_at
                    ? Math.max(0, Math.ceil((new Date(t.trial_expires_at).getTime() - Date.now()) / 86400000))
                    : null,
            }));

            return res.status(200).json({ tenants: enriched });
        }

        // ── POST: Manage tenant ─────────────────────────────────────────
        const { action, tenant_id, plan, roster_limit, email, display_name, days } = req.body ?? {};

        if (action === 'change-plan') {
            if (!tenant_id || !plan) return res.status(400).json({ error: 'Missing tenant_id or plan' });
            const validPlans = ['trial', 'pro', 'academy', 'enterprise'];
            if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

            const defaultRoster: Record<string, number> = { trial: 8, pro: 50, academy: 100, enterprise: roster_limit || 500 };
            const { error } = await sb.from('tenants').update({
                plan,
                roster_limit: roster_limit || defaultRoster[plan],
            }).eq('id', tenant_id);

            if (error) return res.status(500).json({ error: error.message });
            await auditLog(sb, adminEmail, 'change-plan', 'tenant', tenant_id, { plan, roster_limit: roster_limit || defaultRoster[plan] });
            return res.status(200).json({ ok: true, action: 'plan_changed' });
        }

        if (action === 'create-enterprise') {
            if (!email || !display_name) return res.status(400).json({ error: 'Missing email or display_name' });

            // Check if tenant already exists
            const { data: existing } = await sb.from('tenants').select('id').eq('email', email).maybeSingle();
            if (existing) return res.status(400).json({ error: 'Tenant with this email already exists' });

            // Generate slug
            const base = display_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
            const suffix = Math.random().toString(36).slice(2, 10);
            const slug = `${base}-${suffix}`;

            const { data: tenant, error: insertErr } = await sb.from('tenants').insert({
                email,
                display_name,
                slug,
                plan: 'enterprise',
                roster_limit: roster_limit || 500,
                onboarding_completed: false,
            }).select('id, slug').single();

            if (insertErr) return res.status(500).json({ error: insertErr.message });
            await auditLog(sb, adminEmail, 'create-enterprise', 'tenant', tenant!.id, { email, display_name, roster_limit: roster_limit || 500 });
            return res.status(200).json({ ok: true, tenant, action: 'enterprise_created' });
        }

        if (action === 'reset-trial') {
            if (!tenant_id) return res.status(400).json({ error: 'Missing tenant_id' });
            const { error } = await sb.from('tenants').update({
                plan: 'trial',
                roster_limit: 8,
                trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            }).eq('id', tenant_id);
            if (error) return res.status(500).json({ error: error.message });
            await auditLog(sb, adminEmail, 'reset-trial', 'tenant', tenant_id, {});
            return res.status(200).json({ ok: true, action: 'trial_reset' });
        }

        if (action === 'extend-trial') {
            if (!tenant_id) return res.status(400).json({ error: 'Missing tenant_id' });
            const extDays = days || 14;
            const { data: tenant } = await sb.from('tenants').select('trial_expires_at').eq('id', tenant_id).single();
            const baseDate = tenant?.trial_expires_at ? new Date(tenant.trial_expires_at) : new Date();
            const newExpiry = new Date(Math.max(baseDate.getTime(), Date.now()) + extDays * 86400000);
            const { error } = await sb.from('tenants').update({ trial_expires_at: newExpiry.toISOString() }).eq('id', tenant_id);
            if (error) return res.status(500).json({ error: error.message });
            await auditLog(sb, adminEmail, 'extend-trial', 'tenant', tenant_id, { days: extDays, expires_at: newExpiry.toISOString() });
            return res.status(200).json({ ok: true, action: 'trial_extended', expires_at: newExpiry.toISOString() });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
        console.error('[admin-tenants] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
