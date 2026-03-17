import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildHtml(params: {
    nombreAdulto: string;
    nombreNino: string;
    deporte: string;
    edad: number;
    arquetipo: string;
    reportHtml: string;
    maduracionTemprana: boolean;
    sessionId?: string;
    lang?: string;
    emailHeader?: string;
    emailPreparedFor?: string;
    emailArchetypeOf?: string;
    emailFooter?: string;
    emailMaturationTitle?: string;
    emailMaturationBody?: string;
}): string {
    const langAttr = params.lang || 'es';
    const header = params.emailHeader || 'Informe de Sintonía';
    const preparedFor = params.emailPreparedFor || `Preparado para ${params.nombreAdulto}`;
    const archetypeOf = params.emailArchetypeOf || `Arquetipo de ${params.nombreNino}`;
    const footer = params.emailFooter || 'Argo Method · Este informe es una fotografía del presente, no una etiqueta permanente.';
    const matTitle = params.emailMaturationTitle || 'Nota: Maduración Temprana';
    const matBody = params.emailMaturationBody || 'Los perfiles DISC en la infancia temprana (menores de 7 años) son altamente plásticos. Se recomienda revisitar este perfil en 6 meses para observar la evolución de las tendencias.';

    // ── Feedback CTA block ──────────────────────────────────────────────────
    const baseUrl = 'https://argomethod.com';
    const feedbackCta = params.sessionId ? `
    <div style="background:#FFFFFF;border-top:3px solid #955fb5;padding:32px 40px;text-align:center;">
        <div style="font-size:18px;font-weight:700;color:#1D1D1F;letter-spacing:-0.02em;margin-bottom:6px;">
            Tu opinión nos ayuda a mejorar
        </div>
        <div style="font-size:14px;color:#86868B;margin-bottom:20px;">
            ¿Qué tan claro te resultó el informe?
        </div>
        <div style="margin-bottom:16px;">
            <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="padding:0 6px;"><![endif]-->
            <a href="${baseUrl}/review/${params.sessionId}?q1=muy_claro" style="display:inline-block;background:#955fb5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 4px 8px 4px;">Muy claro</a>
            <!--[if mso]></td><td style="padding:0 6px;"><![endif]-->
            <a href="${baseUrl}/review/${params.sessionId}?q1=algo_claro" style="display:inline-block;background:#e5e7eb;color:#4b5563;font-size:14px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 4px 8px 4px;">Algo claro</a>
            <!--[if mso]></td><td style="padding:0 6px;"><![endif]-->
            <a href="${baseUrl}/review/${params.sessionId}?q1=confuso" style="display:inline-block;background:#F5F5F7;color:#86868B;font-size:14px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:24px;margin:0 4px 8px 4px;">Confuso</a>
            <!--[if mso]></td></tr></table><![endif]-->
        </div>
        <div style="font-size:12px;color:#86868B;">
            Son solo 4 preguntas · 30 segundos
        </div>
    </div>` : '';

    const maduracionBanner = params.maduracionTemprana ? `
    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <strong style="color:#92400e;">📌 ${matTitle}</strong><br/>
        <span style="color:#78350f;font-size:14px;">${matBody}</span>
    </div>` : '';

    return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${header} · ${params.nombreNino}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1D1D1F;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(29,29,31,0.06);">

    <!-- Header -->
    <div style="background:#1D1D1F;padding:32px 40px;">
        <div style="margin-bottom:8px;">
            <span style="font-size:18px;letter-spacing:-0.02em;color:#ffffff;">
                <span style="font-weight:800;">Argo</span><span style="font-weight:100;"> Method</span>
            </span>
            <span style="background:#BBBCFF;color:#1D1D1F;font-size:9px;font-weight:600;padding:2px 6px;border-radius:4px;letter-spacing:0.05em;margin-left:6px;">beta</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:300;color:#ffffff;letter-spacing:-0.5px;">
            ${header}
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:#86868B;">
            ${preparedFor}
        </p>
    </div>

    <!-- Archetype badge -->
    <div style="background:#F5F5F7;border-bottom:1px solid #D2D2D7;padding:24px 40px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#86868B;margin-bottom:4px;">
            ${archetypeOf}
        </div>
        <div style="font-size:24px;font-weight:300;color:#1D1D1F;letter-spacing:-0.03em;">${params.arquetipo}</div>
        <div style="font-size:13px;color:#86868B;margin-top:4px;">
            ${params.deporte} · ${params.edad}
        </div>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;background:#F5F5F7;">
        ${maduracionBanner}
        <div style="font-size:14px;line-height:1.8;color:#424245;">
            ${params.reportHtml}
        </div>
    </div>

    <!-- Feedback CTA -->
    ${feedbackCta}

    <!-- Footer -->
    <div style="background:#F5F5F7;border-top:1px solid #D2D2D7;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#86868B;letter-spacing:0.1em;text-transform:uppercase;">
            ${footer}
        </p>
    </div>

</div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'RESEND_API_KEY no está configurada en las variables de entorno de Vercel.' });
    }

    const {
        toEmail,
        nombreAdulto,
        nombreNino,
        deporte,
        edad,
        arquetipo,
        reportHtml,
        maduracionTemprana,
        sessionId,
        lang,
        emailSubject,
        emailHeader,
        emailPreparedFor,
        emailArchetypeOf,
        emailFooter,
        emailMaturationTitle,
        emailMaturationBody,
    } = req.body as {
        toEmail: string;
        nombreAdulto: string;
        nombreNino: string;
        deporte: string;
        edad: number;
        arquetipo: string;
        reportHtml: string;
        maduracionTemprana: boolean;
        sessionId?: string;
        lang?: string;
        emailSubject?: string;
        emailHeader?: string;
        emailPreparedFor?: string;
        emailArchetypeOf?: string;
        emailFooter?: string;
        emailMaturationTitle?: string;
        emailMaturationBody?: string;
    };

    if (!toEmail || !nombreNino) {
        return res.status(400).json({ error: 'Missing required fields: toEmail, nombreNino' });
    }

    const html = buildHtml({
        nombreAdulto, nombreNino, deporte, edad, arquetipo, reportHtml, maduracionTemprana,
        sessionId, lang, emailHeader, emailPreparedFor, emailArchetypeOf, emailFooter, emailMaturationTitle, emailMaturationBody,
    });

    const subject = emailSubject || `Informe de Sintonía Argo · ${nombreNino} · ${arquetipo}`;

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
        return res.status(response.status).json({ error });
    }

    return res.status(200).json({ success: true });
}
