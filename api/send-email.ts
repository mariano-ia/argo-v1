import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildHtml(params: {
    nombreAdulto: string;
    nombreNino: string;
    deporte: string;
    edad: number;
    eje: string;
    motor: string;
    arquetipo: string;
    perfil: string;
    palabrasPuente: string[];
    sessionId?: string;
    shareToken?: string;
    lang?: string;
    resumenPerfil?: string;
    siteUrl?: string;
}): string {
    const langAttr = (params.lang || 'es') as 'es' | 'en' | 'pt';
    const baseUrl = params.siteUrl || 'https://argomethod.com';
    const tokenParam = params.shareToken ? `?token=${params.shareToken}` : '';
    const reportUrl = params.sessionId ? `${baseUrl}/report/${params.sessionId}${tokenParam}` : baseUrl;

    const AXIS_DOT: Record<string, string> = {
        D: '#f97316', I: '#f59e0b', S: '#22c55e', C: '#6366f1',
    };
    const axisColor = AXIS_DOT[params.eje] ?? '#955FB5';

    const MOTOR_LABELS: Record<string, Record<string, string>> = {
        es: { Rápido: 'Dinámico',  Medio: 'Decidido', Lento: 'Persistente' },
        en: { Rápido: 'Dynamic',   Medio: 'Decisive',  Lento: 'Persistent'  },
        pt: { Rápido: 'Dinâmico',  Medio: 'Decidido',  Lento: 'Persistente' },
    };
    const MOTOR_STYLE: Record<string, { bg: string; text: string }> = {
        Rápido: { bg: 'rgba(245,158,11,0.13)', text: '#b45309' },
        Medio:  { bg: 'rgba(149,95,181,0.1)',  text: '#7A4D96' },
        Lento:  { bg: 'rgba(59,130,246,0.1)',  text: '#1d4ed8' },
    };
    const motorLabelMap = MOTOR_LABELS[langAttr] ?? MOTOR_LABELS.es;
    const motorLabel = motorLabelMap[params.motor] ?? params.motor;
    const motorStyle = MOTOR_STYLE[params.motor] ?? MOTOR_STYLE.Medio;
    const motorPrefix = langAttr === 'en' ? 'Engine' : 'Motor';

    const violet = '#955FB5';
    const violetShadow = 'rgba(149,95,181,0.28)';
    const pillColor = '#16a34a';
    const pillBg = 'rgba(34,197,94,0.09)';
    const pillBorder = 'rgba(34,197,94,0.25)';

    const pill = (word: string) =>
        `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:500;color:${pillColor};background:${pillBg};border:1px solid ${pillBorder};margin:0 5px 6px 0;">${word}</span>`;

    const copy = {
        es: {
            headerTitle: `El informe de <strong style="font-weight:700;">${params.nombreNino}</strong> está listo.`,
            headerSub: `Para ${params.nombreAdulto} · ${params.deporte} · ${params.edad} años`,
            eyebrow: 'Arquetipo',
            bridgeLabel: 'Palabras que lo activan',
            ctaSub: 'El informe completo incluye patrón de decisión, guía de comunicación, checklist de entrenamiento, brújula secundaria y más.',
            ctaBtn: 'Ver informe completo →',
            security: '🔒 Este link es personal e intransferible. Solo tú lo recibiste.',
            privacyLink: 'Política de Privacidad de Argo Method',
            reviewTitle: 'Tu opinión nos ayuda a mejorar',
            reviewQ: '¿Qué tan claro te resultó el informe?',
            chips: ['Muy claro', 'Algo claro', 'Confuso'],
            reviewSub: 'Son solo 4 preguntas · 30 segundos',
            footerLine1: 'Argo Method · Informe de Sintonía',
            footerLine2: 'Este informe es una fotografía del presente, no una etiqueta permanente.',
            privacy: 'Privacidad',
            terms: 'Términos',
        },
        en: {
            headerTitle: `<strong style="font-weight:700;">${params.nombreNino}</strong>'s report is ready.`,
            headerSub: `For ${params.nombreAdulto} · ${params.deporte} · ${params.edad} years`,
            eyebrow: 'Archetype',
            bridgeLabel: 'Activating words',
            ctaSub: 'The full report includes decision pattern, communication guide, training checklist, secondary compass, and more.',
            ctaBtn: 'View full report →',
            security: '🔒 This link is personal and non-transferable. Only you received it.',
            privacyLink: 'Argo Method Privacy Policy',
            reviewTitle: 'Your feedback helps us improve',
            reviewQ: 'How clear was the report?',
            chips: ['Very clear', 'Somewhat clear', 'Confusing'],
            reviewSub: 'Just 4 questions · 30 seconds',
            footerLine1: 'Argo Method · Profile Report',
            footerLine2: 'This report is a snapshot of the present, not a permanent label.',
            privacy: 'Privacy',
            terms: 'Terms',
        },
        pt: {
            headerTitle: `O relatório de <strong style="font-weight:700;">${params.nombreNino}</strong> está pronto.`,
            headerSub: `Para ${params.nombreAdulto} · ${params.deporte} · ${params.edad} anos`,
            eyebrow: 'Arquétipo',
            bridgeLabel: 'Palavras que o ativam',
            ctaSub: 'O relatório completo inclui padrão de decisão, guia de comunicação, checklist de treino, bússola secundária e mais.',
            ctaBtn: 'Ver relatório completo →',
            security: '🔒 Este link é pessoal e intransferível. Só você o recebeu.',
            privacyLink: 'Política de Privacidade do Argo Method',
            reviewTitle: 'Sua opinião nos ajuda a melhorar',
            reviewQ: 'Quão claro foi o relatório?',
            chips: ['Muito claro', 'Um pouco claro', 'Confuso'],
            reviewSub: 'São apenas 4 perguntas · 30 segundos',
            footerLine1: 'Argo Method · Relatório de Perfil',
            footerLine2: 'Este relatório é uma fotografia do presente, não um rótulo permanente.',
            privacy: 'Privacidade',
            terms: 'Termos',
        },
    };
    const c = copy[langAttr] ?? copy.es;

    const reviewWidget = params.sessionId ? `
  <!-- SEPARATOR -->
  <tr><td style="padding:28px 28px 0;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- REVIEW WIDGET -->
  <tr>
    <td style="padding:24px 28px;">
      <div style="background:#F5F5F7;border-radius:14px;padding:22px 20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1D1D1F;letter-spacing:-0.01em;">${c.reviewTitle}</p>
        <p style="margin:0 0 18px;font-size:13px;color:#86868B;">${c.reviewQ}</p>
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="padding:0 4px;"><![endif]-->
        <a href="${reportUrl}?feedback=muy_claro"
           style="display:inline-block;background:${violet};color:#fff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 3px 8px;box-shadow:0 2px 8px ${violetShadow};">
          ${c.chips[0]}
        </a>
        <!--[if mso]></td><td style="padding:0 4px;"><![endif]-->
        <a href="${reportUrl}?feedback=algo_claro"
           style="display:inline-block;background:#ffffff;color:#424245;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 3px 8px;border:1px solid #D2D2D7;">
          ${c.chips[1]}
        </a>
        <!--[if mso]></td><td style="padding:0 4px;"><![endif]-->
        <a href="${reportUrl}?feedback=confuso"
           style="display:inline-block;background:#ffffff;color:#86868B;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 3px 8px;border:1px solid #D2D2D7;">
          ${c.chips[2]}
        </a>
        <!--[if mso]></td></tr></table><![endif]-->
        <p style="margin:12px 0 0;font-size:11px;color:#AEAEB2;">${c.reviewSub}</p>
      </div>
    </td>
  </tr>` : '';

    return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${params.arquetipo} · Argo Method</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

  <!-- HEADER -->
  <tr>
    <td style="background:#1D1D1F;padding:26px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:100;"> Method</span>
            <span style="background:#BBBCFF;color:#1D1D1F;font-size:9px;font-weight:600;padding:2px 7px;border-radius:4px;letter-spacing:0.05em;margin-left:8px;vertical-align:middle;">beta</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:14px;">
            <p style="margin:0;font-size:23px;font-weight:300;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">
              ${c.headerTitle}
            </p>
            <p style="margin:7px 0 0;font-size:13px;color:#86868B;">${c.headerSub}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO: ARQUETIPO -->
  <tr>
    <td style="padding:30px 28px 26px;">

      <!-- Eyebrow -->
      <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#AEAEB2;">${c.eyebrow}</p>

      <!-- Archetype name row -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:9px;">
            <span style="display:block;width:11px;height:11px;border-radius:50%;background:${axisColor};"></span>
          </td>
          <td style="vertical-align:middle;padding-right:12px;">
            <span style="font-size:29px;font-weight:300;color:#1D1D1F;letter-spacing:-0.04em;line-height:1;">${params.arquetipo}</span>
          </td>
          <td style="vertical-align:middle;">
            <span style="background:${motorStyle.bg};color:${motorStyle.text};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;white-space:nowrap;">${motorPrefix} ${motorLabel}</span>
          </td>
        </tr>
      </table>

      <!-- Perfil sentence -->
      <p style="margin:18px 0 0;font-size:15px;color:#424245;line-height:1.7;max-width:480px;">
        ${params.perfil}
      </p>

      <!-- Bridge words -->
      <div style="margin-top:20px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">${c.bridgeLabel}</p>
        <div style="line-height:1;">
          ${params.palabrasPuente.map(pill).join('')}
        </div>
      </div>

    </td>
  </tr>

  ${params.resumenPerfil ? `<!-- CONTRATO DE SINTONÍA -->
  <tr>
    <td style="padding:0 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D2D2D7;border-radius:14px;">
        <tr><td style="padding:20px 18px;">
          <p style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#86868B;margin:0 0 14px 0;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#86868B;vertical-align:middle;margin-right:8px;"></span>
            ${langAttr === 'en' ? 'THE TUNING CONTRACT' : langAttr === 'pt' ? 'O CONTRATO DE SINTONIA' : 'EL CONTRATO DE SINTONÍA'}
          </p>
          ${params.resumenPerfil.split(/\n\n+/).filter(Boolean).map(p => {
              const html = p.trim().replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
              return `<p style="font-size:14px;color:#424245;line-height:1.75;margin:0 0 10px 0;">${html}</p>`;
          }).join('')}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr><td style="padding:12px 14px;background:#F5F5F7;border-radius:12px;">
              <p style="font-size:11px;color:#86868B;line-height:1.6;margin:0;">
                ℹ️ ${langAttr === 'en' ? 'This report does not evaluate talent or predict athletic future. It describes present tendencies that may evolve. It is a snapshot, not a permanent label.' : langAttr === 'pt' ? 'Este relatório não avalia talento nem prevê o futuro esportivo. Descreve tendências presentes que podem evoluir. É uma fotografia do momento, não um rótulo permanente.' : 'Este informe no evalúa talento ni predice el futuro deportivo. Describe tendencias presentes que pueden evolucionar. Es una fotografía del momento, no una etiqueta permanente.'}
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- SEPARATOR -->
  <tr><td style="padding:0 28px;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- CTA -->
  <tr>
    <td style="padding:28px 28px 8px;text-align:center;">

      <p style="margin:0 0 22px;font-size:14px;color:#86868B;line-height:1.65;max-width:420px;margin-left:auto;margin-right:auto;">
        ${c.ctaSub}
      </p>

      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td><![endif]-->
      <a href="${reportUrl}"
         style="display:inline-block;background:${violet};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:17px 44px;border-radius:12px;letter-spacing:-0.01em;box-shadow:0 4px 18px ${violetShadow};">
        ${c.ctaBtn}
      </a>
      <!--[if mso]></td></tr></table><![endif]-->

      <!-- Security note -->
      <p style="margin:20px auto 0;font-size:11px;color:#AEAEB2;line-height:1.7;max-width:400px;">
        ${c.security}<br/>
        <a href="https://argomethod.com/privacy" style="color:#AEAEB2;text-decoration:underline;">${c.privacyLink}</a>
      </p>

    </td>
  </tr>
  ${reviewWidget}

  <!-- FOOTER -->
  <tr>
    <td style="background:#F5F5F7;border-top:1px solid #E8E8ED;padding:18px 28px;text-align:center;">
      <p style="margin:0 0 5px;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">
        ${c.footerLine1}
      </p>
      <p style="margin:0;font-size:11px;color:#AEAEB2;line-height:1.6;">
        ${c.footerLine2}
        <br/>
        <a href="https://argomethod.com/privacy" style="color:#AEAEB2;text-decoration:underline;">${c.privacy}</a>
        &nbsp;·&nbsp;
        <a href="https://argomethod.com/terms" style="color:#AEAEB2;text-decoration:underline;">${c.terms}</a>
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('[send-email] RESEND_API_KEY is not set');
            return res.status(500).json({ error: 'RESEND_API_KEY no está configurada en las variables de entorno de Vercel.' });
        }

        const body = req.body;
        if (!body || typeof body !== 'object') {
            console.error('[send-email] req.body is missing or not an object:', typeof body);
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const {
            toEmail,
            nombreAdulto,
            nombreNino,
            deporte,
            edad,
            eje,
            motor,
            arquetipo,
            perfil,
            palabrasPuente,
            sessionId,
            shareToken,
            lang,
            emailSubject,
            resumenPerfil,
        } = body as {
            toEmail: string;
            nombreAdulto: string;
            nombreNino: string;
            deporte: string;
            edad: number;
            eje: string;
            motor: string;
            arquetipo: string;
            perfil: string;
            palabrasPuente: string[];
            sessionId?: string;
            shareToken?: string;
            lang?: string;
            emailSubject?: string;
            resumenPerfil?: string;
        };

        console.log('[send-email] Request received:', {
            toEmail,
            nombreNino,
            eje,
            motor,
            lang,
            sessionId,
            hasApiKey: !!apiKey,
        });

        if (!toEmail || !nombreNino) {
            console.error('[send-email] Missing required fields — toEmail:', toEmail, 'nombreNino:', nombreNino);
            return res.status(400).json({ error: 'Missing required fields: toEmail, nombreNino' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(toEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Idempotency: skip if already sent for this session
        if (sessionId) {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            if (serviceKey && supabaseUrl) {
                const sb = createClient(supabaseUrl, serviceKey);
                const { data: sess } = await sb.from('sessions').select('email_sent_at').eq('id', sessionId).maybeSingle();
                if (sess?.email_sent_at) {
                    console.log('[send-email] Already sent for session', sessionId);
                    return res.status(200).json({ success: true, already_sent: true });
                }
            }
        }

        // If no shareToken provided but we have a sessionId, fetch it from DB
        let finalShareToken = shareToken;
        if (!finalShareToken && sessionId) {
            const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const sUrl = process.env.VITE_SUPABASE_URL;
            if (sKey && sUrl) {
                const sbForToken = createClient(sUrl, sKey);
                const { data: tokenData } = await sbForToken.from('sessions').select('share_token').eq('id', sessionId).maybeSingle();
                finalShareToken = tokenData?.share_token || undefined;
            }
        }

        // Derive siteUrl from the request host so preview deploys receive
        // emails that link back to the preview (not to argomethod.com which
        // wouldn't have the session). Falls back to SITE_URL env and then
        // to argomethod.com for production.
        const hostHeader = (req.headers['x-forwarded-host'] ?? req.headers.host) as string | undefined;
        const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
        const derivedSiteUrl = hostHeader ? `${protoHeader}://${hostHeader}` : null;
        const siteUrl = derivedSiteUrl || process.env.SITE_URL || 'https://argomethod.com';

        const html = buildHtml({
            nombreAdulto, nombreNino, deporte, edad, eje, motor, arquetipo, perfil,
            palabrasPuente: Array.isArray(palabrasPuente) ? palabrasPuente : [],
            sessionId, shareToken: finalShareToken, lang, resumenPerfil,
            siteUrl,
        });

        const langAttr = lang || 'es';
        const autoSubject = langAttr === 'en'
            ? `${nombreNino}'s Argo Method report is ready`
            : langAttr === 'pt'
            ? `O relatório de ${nombreNino} pelo Argo Method está pronto`
            : `El informe de ${nombreNino} en Argo Method está listo`;
        const subject = emailSubject || autoSubject;

        console.log('[send-email] Calling Resend API — to:', toEmail, 'subject:', subject);

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [toEmail],
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido de Resend' }));
            console.error('[send-email] Resend API error — status:', response.status, 'body:', JSON.stringify(error));
            return res.status(response.status).json({ error });
        }

        const resendData = await response.json().catch(() => ({}));
        console.log('[send-email] Success — Resend response:', JSON.stringify(resendData));

        // Mark email as sent for idempotency
        if (sessionId) {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            if (serviceKey && supabaseUrl) {
                const sb = createClient(supabaseUrl, serviceKey);
                try { await sb.from('sessions').update({ email_sent_at: new Date().toISOString() }).eq('id', sessionId); } catch { /* non-blocking */ }
            }
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('[send-email] Unhandled exception:', err instanceof Error ? err.message : err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
