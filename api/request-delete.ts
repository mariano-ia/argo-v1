import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

/**
 * POST /api/request-delete
 *
 * Starts the parental data-deletion flow. The adult submits their email
 * (optionally a child name). We create a deletion_requests row with a
 * 1-hour TTL and send a confirmation email. The actual delete happens
 * only when they click the link and /api/confirm-delete fires.
 *
 * No authentication required — the email verification IS the auth.
 *
 * Note: email templates are inlined below because Vercel serverless
 * cannot import between files in /api (see CLAUDE.md).
 */

// ─── Email templates (inlined) ───────────────────────────────────────────────

interface TemplateArgs {
    childName: string | null;
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
  .cta { display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 20px; }
  .fallback { font-size: 12px; color: #86868B; word-break: break-all; }
  .hr { height: 1px; background: #E8E8ED; margin: 24px 0; border: 0; }
  .note { font-size: 13px; color: #86868B; line-height: 1.6; }
  .warn { font-size: 13px; color: #991b1b; background: #fef2f2; border-radius: 8px; padding: 12px; line-height: 1.6; margin: 8px 0 16px; }
  .footer { font-size: 12px; color: #86868B; text-align: center; margin-top: 24px; }
  .footer a { color: #86868B; }
  .brand { font-size: 14px; letter-spacing: -0.01em; color: #1D1D1F; margin-bottom: 20px; }
  .brand b { font-weight: 800; } .brand span { font-weight: 100; }
`;

function deleteEmailES(args: TemplateArgs): EmailTemplate {
    const { childName, confirmUrl } = args;
    const cName = childName ? escapeHtml(childName) : null;
    const cUrl = escapeHtml(confirmUrl);
    const scope = cName
        ? `los datos de <strong>${cName}</strong>`
        : 'todos los datos de los deportistas asociados a este email';
    return {
        subject: 'Confirma la eliminación de tus datos en Argo Method',
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirmar eliminación</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Solicitud de eliminación</h1>
      <p>Recibimos una solicitud para eliminar permanentemente ${scope} de los sistemas de Argo Method.</p>
      <div class="warn"><strong>Esta acción es irreversible.</strong> Una vez confirmada, todos los datos se borran de forma permanente: respuestas del deportista, perfil generado, secciones de IA y registros relacionados.</div>
      <p>Si tú solicitaste esto, confirma haciendo click en el botón:</p>
      <a class="cta" href="${cUrl}">Confirmar y eliminar datos</a>
      <p class="fallback">O copia este enlace en tu navegador:<br>${cUrl}</p>
      <p class="note">⏱ Este enlace expira en 1 hora por seguridad.</p>
      <hr class="hr">
      <p class="note"><strong>Si no fuiste tú</strong>, puedes ignorar este email. No se eliminará nada mientras no hagas click.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a>
    </div>
  </div>
</body></html>`,
        text: `Recibimos una solicitud para eliminar permanentemente ${childName ? `los datos de ${childName}` : 'todos los datos asociados a este email'} de los sistemas de Argo Method.\n\nEsta acción es IRREVERSIBLE. Una vez confirmada, todos los datos se borran de forma permanente.\n\nSi tú solicitaste esto, confirma aquí:\n${confirmUrl}\n\nEste enlace expira en 1 hora.\n\nSi no fuiste tú, ignora este email. No se eliminará nada mientras no hagas click.\n\nArgo Method — hola@argomethod.com`,
    };
}

function deleteEmailEN(args: TemplateArgs): EmailTemplate {
    const { childName, confirmUrl } = args;
    const cName = childName ? escapeHtml(childName) : null;
    const cUrl = escapeHtml(confirmUrl);
    const scope = cName
        ? `the data for <strong>${cName}</strong>`
        : 'all athlete data associated with this email';
    return {
        subject: 'Confirm deletion of your Argo Method data',
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirm deletion</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Data deletion request</h1>
      <p>We received a request to permanently delete ${scope} from Argo Method's systems.</p>
      <div class="warn"><strong>This action is irreversible.</strong> Once confirmed, all data is permanently deleted: athlete answers, generated profile, AI sections, and related records.</div>
      <p>If you requested this, confirm by clicking the button:</p>
      <a class="cta" href="${cUrl}">Confirm and delete data</a>
      <p class="fallback">Or copy this link into your browser:<br>${cUrl}</p>
      <p class="note">⏱ This link expires in 1 hour for security.</p>
      <hr class="hr">
      <p class="note"><strong>If this wasn't you</strong>, you can ignore this email. Nothing will be deleted unless you click.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a>
    </div>
  </div>
</body></html>`,
        text: `We received a request to permanently delete ${childName ? `the data for ${childName}` : 'all athlete data associated with this email'} from Argo Method.\n\nThis action is IRREVERSIBLE. Once confirmed, all data is permanently deleted.\n\nIf you requested this, confirm here:\n${confirmUrl}\n\nThis link expires in 1 hour.\n\nIf this wasn't you, ignore this email. Nothing will be deleted unless you click.\n\nArgo Method — hola@argomethod.com`,
    };
}

function deleteEmailPT(args: TemplateArgs): EmailTemplate {
    const { childName, confirmUrl } = args;
    const cName = childName ? escapeHtml(childName) : null;
    const cUrl = escapeHtml(confirmUrl);
    const scope = cName
        ? `os dados de <strong>${cName}</strong>`
        : 'todos os dados de atletas associados a este email';
    return {
        subject: 'Confirme a eliminação dos seus dados no Argo Method',
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirmar eliminação</title><style>${baseStyles}</style></head><body>
  <div class="wrap">
    <div class="card">
      <div class="brand"><b>Argo</b><span> Method</span></div>
      <h1>Solicitação de eliminação</h1>
      <p>Recebemos uma solicitação para eliminar permanentemente ${scope} dos sistemas do Argo Method.</p>
      <div class="warn"><strong>Esta ação é irreversível.</strong> Uma vez confirmada, todos os dados são eliminados permanentemente: respostas do atleta, perfil gerado, seções de IA e registros relacionados.</div>
      <p>Se você solicitou isso, confirme clicando no botão:</p>
      <a class="cta" href="${cUrl}">Confirmar e eliminar dados</a>
      <p class="fallback">Ou copie este link no seu navegador:<br>${cUrl}</p>
      <p class="note">⏱ Este link expira em 1 hora por segurança.</p>
      <hr class="hr">
      <p class="note"><strong>Se não foi você</strong>, ignore este email. Nada será eliminado enquanto você não clicar.</p>
    </div>
    <div class="footer">
      Argo Method · <a href="mailto:hola@argomethod.com">hola@argomethod.com</a>
    </div>
  </div>
</body></html>`,
        text: `Recebemos uma solicitação para eliminar permanentemente ${childName ? `os dados de ${childName}` : 'todos os dados de atletas associados a este email'} do Argo Method.\n\nEsta ação é IRREVERSÍVEL. Uma vez confirmada, todos os dados são eliminados permanentemente.\n\nSe você solicitou isso, confirme aqui:\n${confirmUrl}\n\nEste link expira em 1 hora.\n\nSe não foi você, ignore este email. Nada será eliminado enquanto você não clicar.\n\nArgo Method — hola@argomethod.com`,
    };
}

function getTemplate(lang: string, args: TemplateArgs): EmailTemplate {
    if (lang === 'en') return deleteEmailEN(args);
    if (lang === 'pt') return deleteEmailPT(args);
    return deleteEmailES(args);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;

    if (!serviceKey || !supabaseUrl || !resendKey) {
        console.error('[request-delete] Missing env');
        return res.status(500).json({ ok: false, error: 'server_config' });
    }

    const hostHeader = (req.headers['x-forwarded-host'] ?? req.headers.host) as string | undefined;
    const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
    const derivedSiteUrl = hostHeader ? `${protoHeader}://${hostHeader}` : null;
    const siteUrl = derivedSiteUrl || process.env.SITE_URL || 'https://argomethod.com';

    const { adult_email, child_name, lang } = req.body ?? {};

    if (
        typeof adult_email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adult_email)
    ) {
        return res.status(400).json({ ok: false, error: 'invalid_email' });
    }

    const langSafe: 'es' | 'en' | 'pt' = lang === 'en' || lang === 'pt' ? lang : 'es';
    const childNameClean = typeof child_name === 'string' && child_name.trim()
        ? child_name.trim()
        : null;
    const emailNorm = adult_email.trim().toLowerCase();

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // Check whether any matching sessions exist. We do NOT reveal this
        // to the caller (would leak whether an email is registered), but we
        // only send the email if there's something to delete — otherwise
        // attackers could use this endpoint to spam arbitrary emails.
        //
        // Matching policy:
        //   - adult_email: case-insensitive exact match (trimmed, lowercased)
        //   - child_name (optional): case-insensitive SUBSTRING match so
        //     parents don't need to remember exactly how they typed the
        //     name during onboarding. "Lucas" matches "Lucas Pérez", etc.
        let query = sb
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .ilike('adult_email', emailNorm);
        if (childNameClean) {
            // Escape any % / _ in user input so they're not interpreted as
            // wildcards, then wrap in % for substring match.
            const safe = childNameClean.replace(/[%_]/g, '\\$&');
            query = query.ilike('child_name', `%${safe}%`);
        }
        const { count, error: countErr } = await query;
        if (countErr) {
            console.error('[request-delete] count error:', countErr.message);
            // Return a generic success anyway so we don't leak DB errors
            return res.status(200).json({ ok: true });
        }

        if (!count || count === 0) {
            // No matching data. Silently return success so we don't leak
            // whether this email exists in the system.
            console.info('[request-delete] no matching sessions', { email_prefix: emailNorm.slice(0, 3) });
            return res.status(200).json({ ok: true });
        }

        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

        const { error: insertErr } = await sb.from('deletion_requests').insert({
            token,
            adult_email: emailNorm,
            child_name: childNameClean,
            expires_at: expiresAt,
        });
        if (insertErr) {
            console.error('[request-delete] insert error:', insertErr.message);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }

        const confirmUrl = `${siteUrl}/delete/${token}`;
        const tpl = getTemplate(langSafe, { childName: childNameClean, confirmUrl });

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [emailNorm],
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
            }),
        });

        if (!resendRes.ok) {
            const errText = await resendRes.text().catch(() => '');
            console.error('[request-delete] Resend failed:', resendRes.status, errText.slice(0, 200));
            return res.status(500).json({ ok: false, error: 'email_send_failed' });
        }

        console.info('[request-delete] ok', {
            count,
            token_prefix: token.slice(0, 6),
            scope: childNameClean ? 'single_child' : 'all_for_email',
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[request-delete] unexpected:', err);
        return res.status(500).json({ ok: false, error: 'internal' });
    }
}
