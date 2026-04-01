import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin-grant-access
 * Body: { session_id }
 * Sets full_access = true on the session and sends a special email with the full report link.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });
    const { data: admin } = await sb.from('admin_users').select('id').eq('email', user.email).maybeSingle();
    if (!admin) return res.status(403).json({ error: 'Admin access required' });

    try {
        const { session_id } = req.body as { session_id?: string };
        if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

        // Get session data
        const { data: session } = await sb
            .from('sessions')
            .select('id, child_name, child_age, sport, adult_name, adult_email, eje, motor, archetype_label, lang')
            .eq('id', session_id)
            .single();

        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Set full_access
        const { error: updateErr } = await sb
            .from('sessions')
            .update({ full_access: true })
            .eq('id', session_id);

        if (updateErr) return res.status(500).json({ error: updateErr.message });

        // Send special email
        const resendKey = process.env.RESEND_API_KEY;
        const origin = process.env.SITE_URL || 'https://argomethod.com';
        const reportUrl = `${origin}/report/${session_id}`;

        if (resendKey && session.adult_email) {
            const childName = session.child_name;
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'Argo Method <hola@argomethod.com>',
                    to: [session.adult_email],
                    subject: `Acceso exclusivo: el informe completo de ${childName} en Argo Method`,
                    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

<tr><td style="background:#1D1D1F;padding:28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
    <p style="margin:16px 0 0;font-size:24px;font-weight:300;color:#fff;letter-spacing:-0.02em;line-height:1.2;">
        Acceso exclusivo al informe completo de <strong style="font-weight:700;">${childName}</strong>
    </p>
</td></tr>

<tr><td style="padding:28px;">
    <div style="background:rgba(149,95,181,0.06);border:1px solid rgba(149,95,181,0.15);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#955FB5;">Acceso especial habilitado</p>
        <p style="margin:4px 0 0;font-size:12px;color:#86868B;">El equipo de Argo Method ha desbloqueado el informe completo de ${childName} para ti. Este acceso incluye todas las secciones del informe que normalmente estan disponibles solo en planes pagos.</p>
    </div>

    <p style="margin:0 0 12px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">Incluye</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    ${['Motor de rendimiento y estilo de decision', 'Palabras puente y palabras a evitar', 'Patron de decision y ritmo cognitivo', 'Guia rapida de entrenamiento', 'Checklist antes, durante y despues', 'Ecos fuera de la cancha'].map(f => `
    <tr><td width="24" style="vertical-align:top;padding-bottom:8px;">
        <div style="width:16px;height:16px;border-radius:50%;background:rgba(149,95,181,0.1);border:1px solid rgba(149,95,181,0.2);text-align:center;line-height:16px;font-size:9px;color:#955FB5;font-weight:700;">&#10003;</div>
    </td><td style="padding-left:8px;padding-bottom:8px;">
        <p style="margin:0;font-size:13px;color:#424245;">${f}</p>
    </td></tr>`).join('')}
    </table>

    <div style="text-align:center;">
        <a href="${reportUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">
            Ver informe completo
        </a>
    </div>

    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">Este link es personal. El informe completo de ${childName} esta disponible en cualquier momento.</p>
</td></tr>

<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jovenes</p>
</td></tr>

</table></td></tr></table>
</body></html>`,
                }),
            });
        }

        // Audit log
        try {
            await sb.from('admin_audit_log').insert({
                admin_email: user.email,
                action: 'grant-full-access',
                target_type: 'session',
                target_id: session_id,
                details: { child_name: session.child_name, adult_email: session.adult_email },
            });
        } catch { /* non-blocking */ }

        return res.status(200).json({ ok: true, email_sent: !!session.adult_email });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[admin-grant-access] Error:', msg);
        return res.status(500).json({ error: msg });
    }
}
