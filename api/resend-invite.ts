import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/resend-invite
 * Body: { member_id, tenant_id?, lang? }
 *
 * Resends the dashboard invitation to a PENDING member. Owner-only.
 *
 * A pending invite's Supabase auth user is unconfirmed and its email link
 * expires, so generateLink({ type: 'invite' }) on the same email would fail
 * with "already registered". We therefore mirror the proven delete+re-invite
 * flow, but WITHOUT touching the tenant_members row: we free the email by
 * deleting the old unconfirmed auth user, generate a fresh invite link (new
 * auth user), point the existing member row at it, and resend the branded
 * email. The member id is preserved, so role and plantel (group_coaches)
 * assignments stay intact. accept-invite matches by email, so the swapped
 * auth_user_id does not break activation.
 *
 * Email HTML is inlined (Vercel serverless cannot import between /api files);
 * keep it in sync with api/invite-user.ts.
 */

// ─── Invite email HTML (kept in sync with invite-user.ts) ─────────────────────

const INVITE_COPY: Record<string, { headline: (n: string) => string; sub: string; body: string; hint: string; cta: string; disclaimer: string }> = {
    es: {
        headline: (n) => `Te invitaron a unirte a <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Crea tu contraseña para acceder al dashboard de ArgoMethod®.',
        body: 'ArgoMethod® es una plataforma de perfilado conductual para deportistas jóvenes. Desde el dashboard puedes ver los perfiles de tus jugadores, analizar la química de tus grupos y consultar al asistente Argo.',
        hint: 'Haz clic en el botón de abajo para crear tu contraseña y acceder.',
        cta: 'Crear contraseña →',
        disclaimer: 'Este enlace es personal e intransferible. Si no esperabas esta invitación, puedes ignorar este mensaje.',
    },
    en: {
        headline: (n) => `You've been invited to join <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Create your password to access the ArgoMethod® dashboard.',
        body: 'ArgoMethod® is a behavioral profiling platform for young athletes. From the dashboard you can view your players\' profiles, analyze your group chemistry, and consult the Argo assistant.',
        hint: 'Click the button below to create your password and get started.',
        cta: 'Create password →',
        disclaimer: 'This link is personal and non-transferable. If you weren\'t expecting this invitation, you can safely ignore this message.',
    },
    pt: {
        headline: (n) => `Você foi convidado a entrar em <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Crie sua senha para acessar o dashboard do ArgoMethod®.',
        body: 'O ArgoMethod® é uma plataforma de perfilamento comportamental para atletas jovens. No dashboard você pode ver os perfis dos seus jogadores, analisar a química dos seus grupos e consultar o assistente Argo.',
        hint: 'Clique no botão abaixo para criar sua senha e começar.',
        cta: 'Criar senha →',
        disclaimer: 'Este link é pessoal e intransferível. Se você não esperava este convite, pode ignorar esta mensagem.',
    },
};

function buildInviteEmail(tenantName: string, actionLink: string, lang = 'es'): string {
    const c = INVITE_COPY[lang] ?? INVITE_COPY.es;
    const violet = '#955FB5';
    const violetShadow = 'rgba(149,95,181,0.28)';
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ArgoMethod®</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

  <!-- HEADER -->
  <tr>
    <td style="background:#1D1D1F;padding:26px 28px 30px;">
      <div>
        <span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:100;">Method</span><span style="font-size:11px;color:#fff;font-weight:100;vertical-align:super;">&reg;</span>
      </div>
      <p style="margin:16px 0 0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:-0.4px;line-height:1.3;">
        ${c.headline(tenantName)}
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#86868B;">${c.sub}</p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:32px 28px 8px;">
      <p style="margin:0 0 14px;font-size:15px;color:#424245;line-height:1.7;">${c.body}</p>
      <p style="margin:0;font-size:14px;color:#86868B;line-height:1.65;">${c.hint}</p>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:28px 28px 32px;text-align:center;">
      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td><![endif]-->
      <a href="${actionLink}"
         style="display:inline-block;background:${violet};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:17px 44px;border-radius:12px;letter-spacing:-0.01em;box-shadow:0 4px 18px ${violetShadow};">
        ${c.cta}
      </a>
      <!--[if mso]></td></tr></table><![endif]-->
      <p style="margin:16px auto 0;font-size:11px;color:#AEAEB2;max-width:380px;line-height:1.7;">
        ${c.disclaimer}
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#F5F5F7;border-top:1px solid #E8E8ED;padding:18px 28px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">
        ArgoMethod® · Dashboard
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

// ─── Tenant context resolution (kept in sync with invite-user.ts) ─────────────

async function resolveTenantContext(
    sb: any,
    userId: string,
    requestedTenantId: string | null,
): Promise<{ tenantId: string; role: string; memberId: string | null } | null> {
    if (requestedTenantId) {
        const { data: m } = await sb
            .from('tenant_members')
            .select('id, tenant_id, role')
            .eq('auth_user_id', userId)
            .eq('tenant_id', requestedTenantId)
            .eq('status', 'active')
            .maybeSingle();
        if (m) return { tenantId: m.tenant_id, role: m.role ?? 'owner', memberId: m.id };
        const { data: t } = await sb
            .from('tenants')
            .select('id')
            .eq('id', requestedTenantId)
            .eq('auth_user_id', userId)
            .maybeSingle();
        if (t) return { tenantId: t.id, role: 'owner', memberId: null };
        return null;
    }
    const { data: m } = await sb
        .from('tenant_members')
        .select('id, tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (m) return { tenantId: m.tenant_id, role: m.role ?? 'owner', memberId: m.id };
    const { data: t } = await sb
        .from('tenants')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
    if (t) return { tenantId: t.id, role: 'owner', memberId: null };
    return null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const requestedTenantId = typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null;
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const tenantId = ctx.tenantId;
        if (ctx.role !== 'owner') return res.status(403).json({ error: 'forbidden' });

        const { member_id, lang } = req.body ?? {};
        if (!member_id || typeof member_id !== 'string') return res.status(400).json({ error: 'Missing member_id' });
        const emailLang = typeof lang === 'string' && ['es', 'en', 'pt'].includes(lang) ? lang : 'es';

        // Target must belong to this tenant and still be pending.
        const { data: target } = await sb
            .from('tenant_members')
            .select('id, email, status, role, auth_user_id')
            .eq('id', member_id)
            .eq('tenant_id', tenantId)
            .maybeSingle();
        if (!target) return res.status(404).json({ error: 'Member not found' });
        const tgt = target as { id: string; email: string; status: string; role: string; auth_user_id: string | null };
        if (tgt.status === 'active') return res.status(409).json({ error: 'already_active' });
        if (tgt.status !== 'pending') return res.status(400).json({ error: 'not_pending' });

        const normalizedEmail = (tgt.email || '').toLowerCase().trim();
        if (!normalizedEmail.includes('@')) return res.status(400).json({ error: 'Invalid member email' });

        // Free the email by deleting the old unconfirmed auth user, but only
        // when it is exclusive to this pending invite — never lock someone out
        // of another institution or delete a confirmed account.
        if (tgt.auth_user_id) {
            try {
                const { data: au } = await sb.auth.admin.getUserById(tgt.auth_user_id);
                const confirmed = !!au?.user?.email_confirmed_at;
                const { count: refs } = await sb
                    .from('tenant_members')
                    .select('id', { count: 'exact', head: true })
                    .eq('auth_user_id', tgt.auth_user_id);
                const { data: ownedTenant } = await sb
                    .from('tenants')
                    .select('id')
                    .eq('auth_user_id', tgt.auth_user_id)
                    .limit(1)
                    .maybeSingle();
                // refs includes this member row (1). Safe to delete only when no
                // OTHER membership and no owned tenant reference the identity.
                if (!confirmed && (refs ?? 0) <= 1 && !ownedTenant) {
                    await sb.auth.admin.deleteUser(tgt.auth_user_id);
                }
            } catch (err) {
                console.warn('[resend-invite] Could not delete old auth user:', err);
            }
        }

        // Tenant display name — used in the redirect (expired-link page) + email.
        const { data: tenantData } = await sb
            .from('tenants')
            .select('display_name')
            .eq('id', tenantId)
            .single();
        const tenantName = (tenantData as { display_name: string } | null)?.display_name ?? 'tu organización';

        const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
        const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'argomethod.com';
        const redirectTo = `${proto}://${host}/set-password?lang=${emailLang}&org=${encodeURIComponent(tenantName)}`;

        // Generate a fresh invite link (creates a new auth user for the email).
        const { data: linkData, error: inviteError } = await sb.auth.admin.generateLink({
            type: 'invite',
            email: normalizedEmail,
            options: { redirectTo, data: { tenant_id: tenantId } },
        });
        if (inviteError || !linkData?.properties?.action_link) {
            const msg = inviteError?.message ?? '';
            console.error('[resend-invite] generateLink error:', msg);
            if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('registered')) {
                return res.status(409).json({ error: 'email_already_exists' });
            }
            return res.status(500).json({ error: msg || 'Failed to generate invite link' });
        }

        // Point the existing member row at the new identity; refresh invited_at.
        const { error: updErr } = await sb
            .from('tenant_members')
            .update({ auth_user_id: linkData.user.id, invited_at: new Date().toISOString(), status: 'pending' })
            .eq('id', tgt.id);
        if (updErr) {
            console.error('[resend-invite] Update error:', updErr.message);
            return res.status(500).json({ error: 'Failed to update invite record' });
        }

        // Resend the branded invite email.
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const html = buildInviteEmail(tenantName, linkData.properties.action_link, emailLang);
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'Argo Method <hola@argomethod.com>',
                    to: [normalizedEmail],
                    subject: emailLang === 'en'
                        ? `You've been invited to manage ${tenantName} on ArgoMethod®`
                        : emailLang === 'pt'
                        ? `Você foi convidado a gerenciar ${tenantName} no ArgoMethod®`
                        : `Te invitaron a gestionar ${tenantName} en ArgoMethod®`,
                    html,
                }),
            });
            if (!emailRes.ok) {
                const emailErr = await emailRes.text().catch(() => '');
                console.error('[resend-invite] Resend error:', emailErr);
                return res.status(502).json({ error: 'Failed to send invite email' });
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[resend-invite] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
