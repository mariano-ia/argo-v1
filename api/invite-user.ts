import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Invite email HTML ────────────────────────────────────────────────────────

const INVITE_COPY: Record<string, { headline: (n: string) => string; sub: string; body: string; hint: string; cta: string; disclaimer: string }> = {
    es: {
        headline: (n) => `Te invitaron a unirte a <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Crea tu contraseña para acceder al dashboard de Argo Method.',
        body: 'Argo Method es una plataforma de perfilado conductual para deportistas jóvenes. Desde el dashboard puedes ver los perfiles de tus deportistas, organizar grupos y consultar al asistente Argo.',
        hint: 'Haz clic en el botón de abajo para crear tu contraseña y acceder.',
        cta: 'Crear contraseña →',
        disclaimer: 'Este enlace es personal e intransferible. Si no esperabas esta invitación, puedes ignorar este mensaje.',
    },
    en: {
        headline: (n) => `You've been invited to join <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Create your password to access the Argo Method dashboard.',
        body: 'Argo Method is a behavioral profiling platform for young athletes. From the dashboard you can view your athletes\' profiles, organize groups, and consult the Argo assistant.',
        hint: 'Click the button below to create your password and get started.',
        cta: 'Create password →',
        disclaimer: 'This link is personal and non-transferable. If you weren\'t expecting this invitation, you can safely ignore this message.',
    },
    pt: {
        headline: (n) => `Você foi convidado a entrar em <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Crie sua senha para acessar o dashboard do Argo Method.',
        body: 'O Argo Method é uma plataforma de perfilamento comportamental para atletas jovens. No dashboard você pode ver os perfis dos seus atletas, organizar grupos e consultar o assistente Argo.',
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
<title>Argo Method</title>
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
        <span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:100;"> Method</span>
        <span style="background:#BBBCFF;color:#1D1D1F;font-size:9px;font-weight:600;padding:2px 7px;border-radius:4px;letter-spacing:0.05em;margin-left:8px;vertical-align:middle;">beta</span>
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
        Argo Method · Dashboard
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
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
        // Validate caller
        const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        // Get caller's tenant — try tenant_members first, fall back to tenants.auth_user_id
        let tenantId: string | null = null;
        const { data: callerRow } = await sb
            .from('tenant_members')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
        if (callerRow) {
            tenantId = (callerRow as { tenant_id: string }).tenant_id;
        } else {
            const { data: tenantRow } = await sb
                .from('tenants')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            if (tenantRow) tenantId = (tenantRow as { id: string }).id;
        }
        if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

        // Validate email
        const { email, lang } = req.body ?? {};
        const emailLang = typeof lang === 'string' && ['es', 'en', 'pt'].includes(lang) ? lang : 'es';
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        const normalizedEmail = email.toLowerCase().trim();

        // Check not already a member
        const { data: existing } = await sb
            .from('tenant_members')
            .select('id, status')
            .eq('tenant_id', tenantId)
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existing) {
            if ((existing as { status: string }).status === 'active') return res.status(409).json({ error: 'already_member' });
            if ((existing as { status: string }).status === 'pending') return res.status(409).json({ error: 'already_invited' });
        }

        // Build redirect URL dynamically from request host
        const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
        const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'argomethod.com';
        const redirectTo = `${proto}://${host}/set-password`;

        // Generate invite link (does NOT send any email — we send our own below)
        const { data: linkData, error: inviteError } = await sb.auth.admin.generateLink({
            type: 'invite',
            email: normalizedEmail,
            options: { redirectTo, data: { tenant_id: tenantId } },
        });

        if (inviteError || !linkData?.properties?.action_link) {
            console.error('[invite-user] generateLink error:', inviteError?.message);
            return res.status(500).json({ error: inviteError?.message ?? 'Failed to generate invite link' });
        }

        // Insert pending member record
        const { error: insertError } = await sb
            .from('tenant_members')
            .insert({ tenant_id: tenantId, email: normalizedEmail, role: 'member', status: 'pending' });
        if (insertError) {
            console.error('[invite-user] Insert error:', insertError.message);
            return res.status(500).json({ error: 'Failed to create invite record' });
        }

        // Fetch tenant display name for the email
        const { data: tenantData } = await sb
            .from('tenants')
            .select('display_name')
            .eq('id', tenantId)
            .single();
        const tenantName = (tenantData as { display_name: string } | null)?.display_name ?? 'tu organización';

        // Send branded invite email via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const html = buildInviteEmail(tenantName, linkData.properties.action_link, emailLang);
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'Argo Method <hola@argomethod.com>',
                    to: [normalizedEmail],
                    subject: emailLang === 'en'
                        ? `You've been invited to manage ${tenantName} on Argo Method`
                        : emailLang === 'pt'
                        ? `Você foi convidado a gerenciar ${tenantName} no Argo Method`
                        : `Te invitaron a gestionar ${tenantName} en Argo Method`,
                    html,
                }),
            });
            if (!emailRes.ok) {
                // Roll back member record if email fails
                await sb.from('tenant_members').delete()
                    .eq('tenant_id', tenantId).eq('email', normalizedEmail).eq('status', 'pending');
                const emailErr = await emailRes.json().catch(() => ({}));
                console.error('[invite-user] Resend error:', emailErr);
                return res.status(500).json({ error: 'Failed to send invite email' });
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[invite-user] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
