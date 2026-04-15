import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

/**
 * POST /api/request-consent
 *
 * Called from the frontend when an adult submits the registration form
 * with child_age < 13. Creates a parental_consents row (pending, 24h TTL)
 * and sends the verification email via Resend.
 *
 * Returns: { ok: true, token } on success.
 *
 * Note: email templates are inlined below because Vercel serverless
 * functions cannot import between files in /api (see CLAUDE.md).
 */

// ─── Email templates (inlined — Vercel cannot import between api/ files) ────

interface TemplateArgs {
    adultName: string;
    childName: string;
    confirmUrl: string;
}

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const baseStyles = `
  body { margin: 0; padding: 0; background: #f5f5f7; font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; color: #1D1D1F; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #fff; border-radius: 14px; padding: 32px 28px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
  p  { font-size: 15px; line-height: 1.6; color: #424245; margin: 0 0 16px; }
  .cta { display: inline-block; background: #0071E3; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 20px; }
  .fallback { font-size: 12px; color: #86868B; word-break: break-all; }
  .hr { height: 1px; background: #E8E8ED; margin: 24px 0; border: 0; }
  .note { font-size: 13px; color: #86868B; line-height: 1.6; }
  .footer { font-size: 12px; color: #86868B; text-align: center; margin-top: 24px; }
  .footer a { color: #86868B; }
  .brand { font-size: 14px; letter-spacing: -0.01em; color: #1D1D1F; margin-bottom: 20px; }
  .brand b { font-weight: 800; } .brand span { font-weight: 100; }
`;

function consentEmailES(args: TemplateArgs): EmailTemplate {
    const { adultName, childName, confirmUrl } = args;
    const aName = escapeHtml(adultName);
    const cName = escapeHtml(childName);
    const cUrl = escapeHtml(confirmUrl);
    return {
        subject: `Confirma que eres el adulto responsable de ${childName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirma tu identidad</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Hola ${aName},</h1>
      <p>${cName} está a punto de comenzar su odisea en Argo Method. Antes de que comience, necesitamos que confirmes que eres el padre, madre o tutor legal responsable de ${cName}.</p>
      <a class="cta" href="${cUrl}">Confirmar y continuar</a>
      <p class="fallback">O copia este enlace en tu navegador:<br>${cUrl}</p>
      <p class="note">⏱ Este enlace expira en 24 horas. Si no lo usas a tiempo, deberás empezar de nuevo.</p>
      <hr class="hr">
      <p class="note"><b>¿Por qué te pedimos esto?</b><br>Para proteger la privacidad de los menores, necesitamos verificar que eres el adulto responsable antes de recopilar cualquier dato de ${cName}.</p>
      <p class="note">Si no reconoces este email, puedes ignorarlo. No se recopilará ningún dato hasta que confirmes.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a><br>
      <a href="https://argomethod.com/privacy">Política de Privacidad</a> · <a href="https://argomethod.com/terms">Términos</a>
    </div>
  </div>
</body></html>`,
        text: `Hola ${adultName},\n\n${childName} está a punto de comenzar su odisea en Argo Method. Antes de que comience, necesitamos que confirmes que eres el padre, madre o tutor legal responsable de ${childName}.\n\nConfirma aquí:\n${confirmUrl}\n\nEste enlace expira en 24 horas.\n\n¿Por qué? Para proteger la privacidad de los menores, necesitamos verificar que eres el adulto responsable antes de recopilar cualquier dato de ${childName}.\n\nSi no reconoces este email, puedes ignorarlo. No se recopilará ningún dato hasta que confirmes.\n\nArgo Method — hola@argomethod.com`,
    };
}

function consentEmailEN(args: TemplateArgs): EmailTemplate {
    const { adultName, childName, confirmUrl } = args;
    const aName = escapeHtml(adultName);
    const cName = escapeHtml(childName);
    const cUrl = escapeHtml(confirmUrl);
    return {
        subject: `Confirm you're the responsible adult for ${childName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirm your identity</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Hi ${aName},</h1>
      <p>${cName} is about to start their odyssey on Argo Method. Before they begin, we need you to confirm that you are the parent or legal guardian responsible for ${cName}.</p>
      <a class="cta" href="${cUrl}">Confirm and continue</a>
      <p class="fallback">Or copy this link into your browser:<br>${cUrl}</p>
      <p class="note">⏱ This link expires in 24 hours. If you don't use it in time, you'll need to start over.</p>
      <hr class="hr">
      <p class="note"><b>Why are we asking this?</b><br>To comply with COPPA (the U.S. Children's Online Privacy Protection Act), we need to verify you are the responsible adult before collecting any data about ${cName}.</p>
      <p class="note">If you don't recognize this email, you can ignore it. No data will be collected until you confirm.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a><br>
      <a href="https://argomethod.com/privacy">Privacy Policy</a> · <a href="https://argomethod.com/terms">Terms</a>
    </div>
  </div>
</body></html>`,
        text: `Hi ${adultName},\n\n${childName} is about to start their odyssey on Argo Method. Before they begin, we need you to confirm that you are the parent or legal guardian responsible for ${childName}.\n\nConfirm here:\n${confirmUrl}\n\nThis link expires in 24 hours.\n\nWhy? To comply with COPPA (U.S. Children's Online Privacy Protection Act), we need to verify you are the responsible adult before collecting any data about ${childName}.\n\nIf you don't recognize this email, you can ignore it. No data will be collected until you confirm.\n\nArgo Method — hola@argomethod.com`,
    };
}

function consentEmailPT(args: TemplateArgs): EmailTemplate {
    const { adultName, childName, confirmUrl } = args;
    const aName = escapeHtml(adultName);
    const cName = escapeHtml(childName);
    const cUrl = escapeHtml(confirmUrl);
    return {
        subject: `Confirme que você é o responsável por ${childName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirme sua identidade</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Olá ${aName},</h1>
      <p>${cName} está prestes a começar sua odisseia no Argo Method. Antes de começar, precisamos que você confirme que é o pai, mãe ou responsável legal por ${cName}.</p>
      <a class="cta" href="${cUrl}">Confirmar e continuar</a>
      <p class="fallback">Ou copie este link no seu navegador:<br>${cUrl}</p>
      <p class="note">⏱ Este link expira em 24 horas. Se não for usado a tempo, será necessário começar de novo.</p>
      <hr class="hr">
      <p class="note"><b>Por que pedimos isso?</b><br>Para proteger a privacidade dos menores, precisamos verificar que você é o responsável antes de coletar qualquer dado de ${cName}.</p>
      <p class="note">Se você não reconhece este email, pode ignorá-lo. Nenhum dado será coletado até sua confirmação.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a><br>
      <a href="https://argomethod.com/privacy">Política de Privacidade</a> · <a href="https://argomethod.com/terms">Termos</a>
    </div>
  </div>
</body></html>`,
        text: `Olá ${adultName},\n\n${childName} está prestes a começar sua odisseia no Argo Method. Antes de começar, precisamos que você confirme que é o pai, mãe ou responsável legal por ${childName}.\n\nConfirme aqui:\n${confirmUrl}\n\nEste link expira em 24 horas.\n\nPor quê? Para proteger a privacidade dos menores, precisamos verificar que você é o responsável antes de coletar qualquer dado de ${childName}.\n\nSe você não reconhece este email, pode ignorá-lo. Nenhum dado será coletado até sua confirmação.\n\nArgo Method — hola@argomethod.com`,
    };
}

function getConsentEmailTemplate(lang: string, args: TemplateArgs): EmailTemplate {
    if (lang === 'en') return consentEmailEN(args);
    if (lang === 'pt') return consentEmailPT(args);
    return consentEmailES(args);
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;

    // Build siteUrl from the actual request host (Vercel sets x-forwarded-host
    // with the domain the user hit — works for preview deploys without any env
    // config). Fall back to SITE_URL env var, then to argomethod.com.
    const hostHeader = (req.headers['x-forwarded-host'] ?? req.headers.host) as string | undefined;
    const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
    const derivedSiteUrl = hostHeader ? `${protoHeader}://${hostHeader}` : null;
    const siteUrl = derivedSiteUrl || process.env.SITE_URL || 'https://argomethod.com';

    if (!serviceKey || !supabaseUrl) {
        console.error('[request-consent] Missing Supabase env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }
    if (!resendKey) {
        console.error('[request-consent] Missing RESEND_API_KEY');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const {
        adult_name, adult_email, child_name, child_age, sport,
        flow_type, tenant_id, one_link_id, lang,
    } = req.body ?? {};

    // Basic validation
    if (
        typeof adult_name !== 'string' || !adult_name.trim() ||
        typeof adult_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adult_email) ||
        typeof child_name !== 'string' || !child_name.trim() ||
        typeof child_age !== 'number' || child_age < 8 || child_age >= 13 ||
        typeof flow_type !== 'string' || !['auth', 'tenant', 'one'].includes(flow_type)
    ) {
        return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    const langSafe: 'es' | 'en' | 'pt' = lang === 'en' || lang === 'pt' ? lang : 'es';
    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { error: insertErr } = await sb.from('parental_consents').insert({
            token,
            adult_name: adult_name.trim(),
            adult_email: adult_email.trim().toLowerCase(),
            child_name: child_name.trim(),
            child_age,
            sport: typeof sport === 'string' && sport.trim() ? sport.trim() : null,
            flow_type,
            tenant_id: typeof tenant_id === 'string' ? tenant_id : null,
            one_link_id: typeof one_link_id === 'string' ? one_link_id : null,
            lang: langSafe,
            expires_at: expiresAt,
        });

        if (insertErr) {
            console.error('[request-consent] insert error:', insertErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        // Send email via Resend
        const confirmUrl = `${siteUrl}/consent/${token}`;
        const tpl = getConsentEmailTemplate(langSafe, {
            adultName: adult_name.trim(),
            childName: child_name.trim(),
            confirmUrl,
        });

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [adult_email.trim()],
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
            }),
        });

        if (!resendRes.ok) {
            const errText = await resendRes.text().catch(() => '');
            console.error('[request-consent] Resend failed:', resendRes.status, errText.slice(0, 200));
            // Don't expose Resend details to client
            return res.status(500).json({ ok: false, error: 'email_send_failed' });
        }

        // Minimal structured log (no PII)
        console.info('[request-consent] ok', {
            flow_type,
            lang: langSafe,
            token_prefix: token.slice(0, 6),
        });

        return res.status(200).json({ ok: true, token });
    } catch (err) {
        console.error('[request-consent] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
