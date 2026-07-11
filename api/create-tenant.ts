import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// NOTE: Vercel serverless functions here do NOT bundle cross-directory imports
// (project is ESM with moduleResolution=bundler but the functions aren't
// bundled), so importing from ../src/lib throws ERR_MODULE_NOT_FOUND at runtime.
// Email sending is therefore inlined, matching the repo convention.
async function sendWelcomeEmail(to: string, lang: string, displayName: string, slug: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.warn('[create-tenant] RESEND_API_KEY not set, skipping welcome email'); return; }
    const site = process.env.SITE_URL || 'https://argomethod.com';
    const playUrl = `${site}/play/${slug}`;
    const dashUrl = `${site}/dashboard`;
    const L = lang === 'en' || lang === 'pt' ? lang : 'es';
    const t = {
        es: { subject: 'Bienvenido a ArgoMethod®', heading: `Bienvenido, ${displayName}`,
              b1: 'Tu cuenta ya está activa con 14 días de prueba. Desde tu panel puedes invitar a tus deportistas y ver sus perfiles a medida que completan la experiencia.',
              b2: `Tu link para compartir con las familias es <a href="${playUrl}" style="color:#955FB5;">${playUrl}</a>.`,
              cta: 'Ir a mi panel' },
        en: { subject: 'Welcome to ArgoMethod®', heading: `Welcome, ${displayName}`,
              b1: 'Your account is active with a 14-day trial. From your dashboard you can invite your athletes and see their profiles as they complete the experience.',
              b2: `Your link to share with families is <a href="${playUrl}" style="color:#955FB5;">${playUrl}</a>.`,
              cta: 'Go to my dashboard' },
        pt: { subject: 'Bem-vindo ao ArgoMethod®', heading: `Bem-vindo, ${displayName}`,
              b1: 'Sua conta está ativa com 14 dias de teste. No seu painel você pode convidar seus atletas e ver os perfis conforme eles completam a experiência.',
              b2: `Seu link para compartilhar com as famílias é <a href="${playUrl}" style="color:#955FB5;">${playUrl}</a>.`,
              cta: 'Ir ao meu painel' },
    }[L];
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;"><span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;">Method</span><span style="font-size:11px;color:#fff;font-weight:100;vertical-align:super;">&reg;</span></td></tr>
<tr><td style="padding:28px;">
<h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 12px;">${t.heading}</h2>
<p style="font-size:14px;color:#86868B;margin:0 0 12px;line-height:1.6;">${t.b1}</p>
<p style="font-size:14px;color:#86868B;margin:0 0 12px;line-height:1.6;">${t.b2}</p>
<a href="${dashUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:4px;">${t.cta}</a>
</td></tr>
<tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;"><p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · Perfilamiento conductual para deportistas jóvenes</p></td></tr>
</table></td></tr></table></body></html>`;
    try {
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [to], subject: t.subject, html }),
        });
        if (!r.ok) console.error('[create-tenant] welcome email resend error:', r.status);
    } catch (e) { console.error('[create-tenant] welcome email failed:', e); }
}

function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
    const suffix = randomBytes(4).toString('hex'); // 8 hex chars, cryptographically secure
    return `${base}-${suffix}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('[create-tenant] Missing env vars');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { auth_user_id, email, display_name, full_name, lang } = req.body;

        if (!auth_user_id || !email || !display_name) {
            return res.status(400).json({ error: 'Missing required fields: auth_user_id, email, display_name' });
        }

        // Input validation
        if (typeof email !== 'string' || email.length > 255 || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        if (typeof display_name !== 'string' || display_name.length > 100) {
            return res.status(400).json({ error: 'Display name too long' });
        }
        if (typeof auth_user_id !== 'string' || auth_user_id.length > 100) {
            return res.status(400).json({ error: 'Invalid auth_user_id' });
        }

        // ── Guard: an invited member must NEVER get their own trial tenant ──────
        // If this auth user is already a tenant_members row (linked by id, or
        // invited by email and not yet linked), they belong to an existing club
        // (e.g. an invited coach/admin). Return that club and skip creation + the
        // welcome email. Also makes the endpoint idempotent for existing owners.
        const { data: byAuthMember } = await sb.from('tenant_members')
            .select('id, tenant_id, auth_user_id')
            .eq('auth_user_id', auth_user_id)
            .limit(1).maybeSingle();
        let membership = byAuthMember as { id: string; tenant_id: string; auth_user_id: string | null } | null;
        if (!membership) {
            const { data: byEmailMember } = await sb.from('tenant_members')
                .select('id, tenant_id, auth_user_id')
                .eq('email', email)
                .limit(1).maybeSingle();
            membership = byEmailMember as { id: string; tenant_id: string; auth_user_id: string | null } | null;
            if (membership && !membership.auth_user_id) {
                // Link the invited-by-email membership to this auth user on first login.
                await sb.from('tenant_members').update({ auth_user_id }).eq('id', membership.id);
            }
        }
        if (membership) {
            const { data: existingTenant } = await sb.from('tenants')
                .select('id, slug').eq('id', membership.tenant_id).maybeSingle();
            return res.status(200).json({ ok: true, member: true, tenant: existingTenant ?? null });
        }

        // Upsert pattern: try insert, if auth_user_id conflict return existing
        const slug = generateSlug(display_name);

        const { data: tenant, error } = await sb
            .from('tenants')
            .upsert({
                auth_user_id,
                email,
                display_name,
                slug,
                plan: 'trial',
                roster_limit: 8,
                lang: typeof lang === 'string' && ['es', 'en', 'pt'].includes(lang) ? lang : 'es',
                trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            }, { onConflict: 'auth_user_id', ignoreDuplicates: true })
            .select('id, slug')
            .single();

        if (error) {
            // If upsert returned nothing (duplicate ignored), fetch existing
            if (error.code === 'PGRST116') {
                const { data: existing } = await sb
                    .from('tenants')
                    .select('id, slug')
                    .eq('auth_user_id', auth_user_id)
                    .single();
                if (existing) {
                    return res.status(200).json({ ok: true, tenant: existing, existing: true });
                }
            }
            console.error('[create-tenant] Insert error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        // Register owner in tenant_members
        const { error: memberErr } = await sb.from('tenant_members').upsert(
            { tenant_id: tenant!.id, auth_user_id, email, role: 'owner', status: 'active', full_name: full_name || null },
            { onConflict: 'tenant_id,email' },
        );
        if (memberErr) {
            console.error('[create-tenant] tenant_members upsert failed:', memberErr.message);
        }

        // Welcome email — only on a genuinely new account (not idempotent re-calls).
        await sendWelcomeEmail(email, typeof lang === 'string' ? lang : 'es', display_name, tenant!.slug);

        return res.status(200).json({ ok: true, tenant, existing: false });
    } catch (err) {
        console.error('[create-tenant] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
