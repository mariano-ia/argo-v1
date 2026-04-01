import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Enterprise welcome email ───────────────────────────────────────────────

function buildEnterpriseWelcomeEmail(ownerName: string, institutionName: string, rosterLimit: number, origin: string): string {
    return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

<tr><td style="background:#1D1D1F;padding:32px 28px 36px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
    <span style="background:#16a34a;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">ENTERPRISE</span>
    <p style="margin:18px 0 0;font-size:26px;font-weight:300;color:#fff;letter-spacing:-0.03em;line-height:1.2;">
        Bienvenido, <strong style="font-weight:700;">${ownerName}</strong>.
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#86868B;">
        Tu plataforma de perfilamiento conductual para ${institutionName} está lista.
    </p>
</td></tr>

<tr><td style="padding:28px;">
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#16a34a;">Plan Enterprise activo</p>
        <p style="margin:0;font-size:13px;color:#86868B;">Hasta ${rosterLimit} jugadores activos. Todas las funcionalidades desbloqueadas. Consultor IA con modelo premium.</p>
    </div>

    <p style="margin:0 0 14px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">Tu plataforma incluye</p>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td width="28" style="vertical-align:top;padding-bottom:12px;">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);text-align:center;line-height:20px;font-size:11px;color:#16a34a;font-weight:700;">&#10003;</div>
    </td><td style="vertical-align:top;padding-left:8px;padding-bottom:12px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Consultor IA premium</p>
        <p style="margin:2px 0 0;font-size:12px;color:#86868B;">Modelo avanzado, consultas ilimitadas. Pregunta sobre cualquier jugador por nombre.</p>
    </td></tr>
    <tr><td width="28" style="vertical-align:top;padding-bottom:12px;">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);text-align:center;line-height:20px;font-size:11px;color:#16a34a;font-weight:700;">&#10003;</div>
    </td><td style="vertical-align:top;padding-left:8px;padding-bottom:12px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Hasta ${rosterLimit} jugadores activos</p>
        <p style="margin:2px 0 0;font-size:12px;color:#86868B;">Perfila y re-perfila cada 6 meses. Sin limites de uso.</p>
    </td></tr>
    <tr><td width="28" style="vertical-align:top;padding-bottom:12px;">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);text-align:center;line-height:20px;font-size:11px;color:#16a34a;font-weight:700;">&#10003;</div>
    </td><td style="vertical-align:top;padding-left:8px;padding-bottom:12px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Dashboard completo + API</p>
        <p style="margin:2px 0 0;font-size:12px;color:#86868B;">Grupos ilimitados, guia situacional, palabras puente, checklist, integraciones.</p>
    </td></tr>
    <tr><td width="28" style="vertical-align:top;">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);text-align:center;line-height:20px;font-size:11px;color:#16a34a;font-weight:700;">&#10003;</div>
    </td><td style="vertical-align:top;padding-left:8px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Soporte dedicado</p>
        <p style="margin:2px 0 0;font-size:12px;color:#86868B;">Onboarding asistido y canal directo con nuestro equipo.</p>
    </td></tr>
    </table>

    <div style="text-align:center;margin:28px 0 0;">
        <p style="margin:0 0 16px;font-size:14px;color:#86868B;">Para acceder a tu plataforma, configura tu contraseña:</p>
        <a href="${origin}/signup" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">
            Configurar mi cuenta
        </a>
    </div>

    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">Si tienes preguntas, responde directamente a este email.</p>
</td></tr>

<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jovenes</p>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

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

            const { full_name } = req.body ?? {};

            // Check if tenant already exists
            const { data: existing } = await sb.from('tenants').select('id').eq('email', email).maybeSingle();
            if (existing) return res.status(400).json({ error: 'Tenant with this email already exists' });

            // Create Supabase Auth user with invite
            let authUserId: string | undefined;
            const { data: authUser, error: authErr } = await sb.auth.admin.createUser({
                email,
                email_confirm: false,
                user_metadata: { full_name: full_name || display_name },
            });

            if (!authErr && authUser?.user?.id) {
                authUserId = authUser.user.id;
            } else {
                console.warn('[admin-tenants] createUser failed, trying lookup:', authErr?.message);
                try {
                    const { data: listData } = await sb.auth.admin.listUsers({ perPage: 1000 });
                    const found = (listData?.users ?? []).find((u: { email?: string }) => u.email === email);
                    if (found) authUserId = found.id;
                } catch (e) {
                    console.error('[admin-tenants] listUsers failed:', e);
                }
                if (!authUserId) {
                    return res.status(500).json({ error: `No se pudo crear el usuario para ${email}: ${authErr?.message ?? 'unknown'}` });
                }
            }

            // Generate slug
            const base = display_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
            const suffix = Math.random().toString(36).slice(2, 10);
            const slug = `${base}-${suffix}`;

            if (!authUserId) {
                return res.status(500).json({ error: 'Could not resolve auth user ID for this email.' });
            }

            const tenantInsert: Record<string, unknown> = {
                email,
                display_name,
                slug,
                plan: 'enterprise',
                roster_limit: roster_limit || 500,
                onboarding_completed: false,
                auth_user_id: authUserId,
            };

            const { data: tenant, error: insertErr } = await sb.from('tenants')
                .insert(tenantInsert)
                .select('id, slug')
                .single();

            if (insertErr) return res.status(500).json({ error: insertErr.message });

            // Create tenant_members row for owner
            await sb.from('tenant_members').insert({
                tenant_id: tenant!.id,
                auth_user_id: authUserId || null,
                email,
                role: 'owner',
                status: 'active',
                full_name: full_name || null,
            });

            // Send welcome email
            const origin = process.env.SITE_URL || 'https://argomethod.com';
            const resendKey = process.env.RESEND_API_KEY;
            let emailSent = false;
            if (resendKey) {
                const ownerName = full_name || display_name;
                try {
                    const emailRes = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'Argo Method <hola@argomethod.com>',
                            to: [email],
                            subject: `Bienvenido a Argo Method Enterprise, ${display_name}`,
                            html: buildEnterpriseWelcomeEmail(ownerName, display_name, roster_limit || 500, origin),
                        }),
                    });
                    emailSent = emailRes.ok;
                    if (!emailRes.ok) {
                        const errBody = await emailRes.text();
                        console.error('[admin-tenants] Resend email error:', errBody);
                    }
                } catch (emailErr) {
                    console.error('[admin-tenants] Email send failed:', emailErr);
                }
            } else {
                console.warn('[admin-tenants] RESEND_API_KEY not set, skipping welcome email');
            }

            // Send password setup email via Supabase Auth
            await sb.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${origin}/signup` } }).catch(() => {});

            await auditLog(sb, adminEmail, 'create-enterprise', 'tenant', tenant!.id, { email, display_name, full_name, roster_limit: roster_limit || 500, email_sent: emailSent });
            return res.status(200).json({ ok: true, tenant, action: 'enterprise_created', email_sent: emailSent });
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
