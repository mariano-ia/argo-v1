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
}): string {
    const maduracionBanner = params.maduracionTemprana ? `
    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:24px;">
        <strong style="color:#92400e;">📌 Nota: Maduración Temprana</strong><br/>
        <span style="color:#78350f;font-size:14px;">
            Los perfiles DISC en la infancia temprana (menores de 7 años) son altamente plásticos.
            Se recomienda revisitar este perfil en <strong>6 meses</strong> para observar la evolución de las tendencias.
        </span>
    </div>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Informe de Sintonía Argo · ${params.nombreNino}</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1c2e;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,28,46,0.08);">

    <!-- Header -->
    <div style="background:#1a1c2e;padding:32px 40px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6366f1;margin-bottom:8px;">
            Método Argo · Architecture of Tune
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
            Informe de Sintonía
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:#9ca3af;">
            Preparado para ${params.nombreAdulto}
        </p>
    </div>

    <!-- Archetype badge -->
    <div style="background:#f0f1ff;border-bottom:1px solid #e5e7eb;padding:20px 40px;display:flex;align-items:center;gap:16px;">
        <div>
            <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#6366f1;margin-bottom:4px;">
                Arquetipo detectado
            </div>
            <div style="font-size:22px;font-weight:800;color:#1a1c2e;">${params.arquetipo}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px;">
                ${params.nombreNino} · ${params.deporte} · ${params.edad} años
            </div>
        </div>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
        ${maduracionBanner}
        <div style="font-size:14px;line-height:1.8;color:#374151;">
            ${params.reportHtml}
        </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">
            © 2026 Argo Method · Este informe es una fotografía del presente, no una etiqueta permanente.
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
    } = req.body as {
        toEmail: string;
        nombreAdulto: string;
        nombreNino: string;
        deporte: string;
        edad: number;
        arquetipo: string;
        reportHtml: string;
        maduracionTemprana: boolean;
    };

    if (!toEmail || !nombreNino) {
        return res.status(400).json({ error: 'Faltan campos requeridos: toEmail, nombreNino' });
    }

    const html = buildHtml({ nombreAdulto, nombreNino, deporte, edad, arquetipo, reportHtml, maduracionTemprana });

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Argo Method <noreply@argomethod.com>',
            to: [toEmail],
            subject: `Informe de Sintonía Argo · ${nombreNino} · ${arquetipo}`,
            html,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido de Resend' }));
        return res.status(response.status).json({ error });
    }

    return res.status(200).json({ success: true });
}
