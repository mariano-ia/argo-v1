import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Phase 2: resolve which tenant the caller acts on. An explicit tenant_id
// requires ACTIVE membership of THAT tenant; absent tenant_id keeps the
// single-membership back-compat path. Returns null when the caller may not act.
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
        if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
        const { data: t } = await sb
            .from('tenants')
            .select('id')
            .eq('id', requestedTenantId)
            .eq('auth_user_id', userId)
            .maybeSingle();
        if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
        return null;
    }
    const { data: m } = await sb
        .from('tenant_members')
        .select('id, tenant_id, role')
        .eq('auth_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (m) return { tenantId: (m as { tenant_id: string }).tenant_id, role: (m as { role: string }).role ?? 'owner', memberId: (m as { id: string }).id };
    const { data: t } = await sb
        .from('tenants')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
    if (t) return { tenantId: (t as { id: string }).id, role: 'owner', memberId: null };
    return null;
}

// ─── Invite email HTML ────────────────────────────────────────────────────────

const INVITE_COPY: Record<string, { headline: (n: string) => string; sub: string; body: string; hint: string; cta: string; disclaimer: string }> = {
    es: {
        headline: (n) => `Te invitaron a unirte a <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Crea tu contraseña para acceder al dashboard de Argo Method.',
        body: 'Argo Method es una plataforma de perfilado conductual para deportistas jóvenes. Desde el dashboard puedes ver los perfiles de tus jugadores, analizar la química de tus grupos y consultar al asistente Argo.',
        hint: 'Haz clic en el botón de abajo para crear tu contraseña y acceder.',
        cta: 'Crear contraseña →',
        disclaimer: 'Este enlace es personal e intransferible. Si no esperabas esta invitación, puedes ignorar este mensaje.',
    },
    en: {
        headline: (n) => `You've been invited to join <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Create your password to access the Argo Method dashboard.',
        body: 'Argo Method is a behavioral profiling platform for young athletes. From the dashboard you can view your players\' profiles, analyze your group chemistry, and consult the Argo assistant.',
        hint: 'Click the button below to create your password and get started.',
        cta: 'Create password →',
        disclaimer: 'This link is personal and non-transferable. If you weren\'t expecting this invitation, you can safely ignore this message.',
    },
    pt: {
        headline: (n) => `Você foi convidado a entrar em <strong style="font-weight:700;">${n}</strong>`,
        sub: 'Crie sua senha para acessar o dashboard do Argo Method.',
        body: 'O Argo Method é uma plataforma de perfilamento comportamental para atletas jovens. No dashboard você pode ver os perfis dos seus jogadores, analisar a química dos seus grupos e consultar o assistente Argo.',
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

// Email for an EXISTING Argo identity added to another institution (no password
// to create — they already have an account).
function buildAddedEmail(tenantName: string, dashUrl: string, lang = 'es'): string {
    const violet = '#955FB5';
    const violetShadow = 'rgba(149,95,181,0.28)';
    const copy: Record<string, { headline: string; sub: string; body: string; hint: string; cta: string; disclaimer: string }> = {
        es: { headline: `Te sumaron a ${tenantName}`, sub: 'Ya tienes acceso con tu cuenta de Argo', body: `Un administrador de ${tenantName} te agregó a su equipo en Argo Method.`, hint: 'Entra con tu cuenta actual. Vas a ver esta institución en el selector, arriba a la izquierda.', cta: 'Abrir mi panel', disclaimer: 'Si no esperabas esto, puedes ignorar este email.' },
        en: { headline: `You've been added to ${tenantName}`, sub: 'You already have access with your Argo account', body: `An admin at ${tenantName} added you to their team on Argo Method.`, hint: 'Sign in with your current account. This institution will appear in the selector, top left.', cta: 'Open my dashboard', disclaimer: 'If you did not expect this, you can ignore this email.' },
        pt: { headline: `Você foi adicionado a ${tenantName}`, sub: 'Você já tem acesso com sua conta Argo', body: `Um administrador de ${tenantName} adicionou você à equipe no Argo Method.`, hint: 'Entre com sua conta atual. Esta instituição aparecerá no seletor, no canto superior esquerdo.', cta: 'Abrir meu painel', disclaimer: 'Se você não esperava isso, pode ignorar este email.' },
    };
    const c = copy[lang] ?? copy.es;
    return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Argo Method</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
  <tr><td style="background:#1D1D1F;padding:26px 28px 30px;">
    <div><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:100;"> Method</span></div>
    <p style="margin:16px 0 0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:-0.4px;line-height:1.3;">${c.headline}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#86868B;">${c.sub}</p>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;">
    <p style="margin:0 0 14px;font-size:15px;color:#424245;line-height:1.7;">${c.body}</p>
    <p style="margin:0;font-size:14px;color:#86868B;line-height:1.65;">${c.hint}</p>
  </td></tr>
  <tr><td style="padding:28px 28px 32px;text-align:center;">
    <a href="${dashUrl}" style="display:inline-block;background:${violet};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:17px 44px;border-radius:12px;letter-spacing:-0.01em;box-shadow:0 4px 18px ${violetShadow};">${c.cta}</a>
    <p style="margin:16px auto 0;font-size:11px;color:#AEAEB2;max-width:380px;line-height:1.7;">${c.disclaimer}</p>
  </td></tr>
  <tr><td style="background:#F5F5F7;border-top:1px solid #E8E8ED;padding:18px 28px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">Argo Method · Dashboard</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

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

        // Phase 2: explicit tenant scoping via request body (transport = body).
        const requestedTenantId = typeof req.body?.tenant_id === 'string' && req.body.tenant_id ? req.body.tenant_id : null;

        // Get caller's tenant — explicit tenant requires active membership; absent
        // tenant keeps single-membership back-compat (incl. legacy tenants fallback).
        const ctx = await resolveTenantContext(sb, user.id, requestedTenantId);
        if (!ctx) return res.status(requestedTenantId ? 403 : 404).json({ error: requestedTenantId ? 'Not a member of this tenant' : 'Tenant not found' });
        const tenantId = ctx.tenantId;
        const callerRole = ctx.role;
        // Only the institution admin (owner) can invite users
        if (callerRole !== 'owner') return res.status(403).json({ error: 'forbidden' });

        // Validate email + parse role/teams
        const { email, lang, role: roleInput, teams: teamsInput } = req.body ?? {};
        const emailLang = typeof lang === 'string' && ['es', 'en', 'pt'].includes(lang) ? lang : 'es';
        const memberRole = roleInput === 'coach' ? 'coach' : 'member';
        const teamIds: string[] = Array.isArray(teamsInput) ? teamsInput.filter((t: unknown): t is string => typeof t === 'string') : [];
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        // Escape LIKE wildcards so an attacker-supplied address (e.g. "%@gmail.com"
        // or one containing "_") can never match other people's rows via ILIKE.
        // Using ILIKE on the escaped pattern gives a case-insensitive EXACT match.
        const emailPattern = normalizedEmail.replace(/([\\%_])/g, '\\$1');

        // Check not already a member (case-insensitive)
        const { data: existing } = await sb
            .from('tenant_members')
            .select('id, status')
            .eq('tenant_id', tenantId)
            .ilike('email', emailPattern)
            .maybeSingle();

        if (existing) {
            if ((existing as { status: string }).status === 'active') return res.status(409).json({ error: 'already_member' });
            if ((existing as { status: string }).status === 'pending') return res.status(409).json({ error: 'already_invited' });
        }

        // Multi-institution: if this email already has an Argo identity (it's a
        // member of another institution, so we already hold its auth_user_id),
        // don't create a new auth user — attach a membership to the existing
        // identity (active immediately) and notify them. This is what lets one
        // coach belong to several clubs.
        const { data: existingIdentity } = await sb
            .from('tenant_members')
            .select('auth_user_id')
            .ilike('email', emailPattern)
            .eq('status', 'active') // only attach to a CONFIRMED identity, never a
            .not('auth_user_id', 'is', null) // pending invite that was never accepted
            .limit(1)
            .maybeSingle();

        if (existingIdentity && (existingIdentity as { auth_user_id: string | null }).auth_user_id) {
            const existingAuthId = (existingIdentity as { auth_user_id: string }).auth_user_id;
            const { data: attached, error: attachErr } = await sb
                .from('tenant_members')
                .insert({ tenant_id: tenantId, email: normalizedEmail, role: memberRole, status: 'active', auth_user_id: existingAuthId })
                .select('id')
                .single();
            if (attachErr || !attached) {
                console.error('[invite-user] attach error:', attachErr?.message);
                return res.status(500).json({ error: 'Failed to add member' });
            }
            if (memberRole === 'coach' && teamIds.length > 0) {
                const { data: validTeams } = await sb
                    .from('groups').select('id').eq('tenant_id', tenantId).is('deleted_at', null).in('id', teamIds);
                const validTeamIds = (validTeams ?? []).map((g: { id: string }) => g.id);
                if (validTeamIds.length > 0) {
                    await sb.from('group_coaches').insert(
                        validTeamIds.map((gid: string) => ({ group_id: gid, member_id: (attached as { id: string }).id }))
                    );
                }
            }
            // Notify (best-effort — the membership is already active).
            const { data: tn } = await sb.from('tenants').select('display_name').eq('id', tenantId).single();
            const tenantName = (tn as { display_name: string } | null)?.display_name ?? 'una institución';
            const resendKey = process.env.RESEND_API_KEY;
            if (resendKey) {
                const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
                const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'argomethod.com';
                const dashUrl = `${proto}://${host}/dashboard`;
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: 'Argo Method <hola@argomethod.com>',
                        to: [normalizedEmail],
                        subject: emailLang === 'en' ? `You've been added to ${tenantName} on Argo Method`
                            : emailLang === 'pt' ? `Você foi adicionado a ${tenantName} no Argo Method`
                            : `Te agregaron a ${tenantName} en Argo Method`,
                        html: buildAddedEmail(tenantName, dashUrl, emailLang),
                    }),
                }).catch(() => { /* best-effort */ });
            }
            return res.status(200).json({ ok: true, attached: true });
        }

        // Build redirect URL dynamically from request host
        const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
        const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'argomethod.com';
        const redirectTo = `${proto}://${host}/set-password?lang=${emailLang}`;

        // Generate invite link (does NOT send any email — we send our own below)
        const { data: linkData, error: inviteError } = await sb.auth.admin.generateLink({
            type: 'invite',
            email: normalizedEmail,
            options: { redirectTo, data: { tenant_id: tenantId } },
        });

        if (inviteError || !linkData?.properties?.action_link) {
            const msg = inviteError?.message ?? '';
            console.error('[invite-user] generateLink error:', msg);
            // Supabase returns this when the email is already registered
            if (msg.toLowerCase().includes('already been registered') || msg.toLowerCase().includes('already registered')) {
                return res.status(409).json({ error: 'email_already_exists' });
            }
            return res.status(500).json({ error: msg || 'Failed to generate invite link' });
        }

        // Insert pending member record — store auth_user_id now so remove-member can clean up later
        const { data: insertedMember, error: insertError } = await sb
            .from('tenant_members')
            .insert({ tenant_id: tenantId, email: normalizedEmail, role: memberRole, status: 'pending', auth_user_id: linkData.user.id })
            .select('id')
            .single();
        if (insertError || !insertedMember) {
            console.error('[invite-user] Insert error:', insertError?.message);
            return res.status(500).json({ error: 'Failed to create invite record' });
        }

        // Assign the coach to the selected teams (validate they belong to this tenant).
        // group_coaches cascades on member delete, so the rollback below cleans these up too.
        if (memberRole === 'coach' && teamIds.length > 0) {
            const { data: validTeams } = await sb
                .from('groups')
                .select('id')
                .eq('tenant_id', tenantId)
                .is('deleted_at', null)
                .in('id', teamIds);
            const validTeamIds = (validTeams ?? []).map((g: { id: string }) => g.id);
            if (validTeamIds.length > 0) {
                await sb.from('group_coaches').insert(
                    validTeamIds.map((gid: string) => ({ group_id: gid, member_id: (insertedMember as { id: string }).id }))
                );
            }
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
