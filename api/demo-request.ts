import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ArgoAcademy® "Solicitar demo" lead form.
// POST (public): validate + persist a demo request, notify the team, and send
// the requester a confirmation email. GET (admin): list recent requests.
//
// NOTE: Vercel serverless functions here are transpiled, not bundled. They
// cannot import from other api/ files nor from src/. Everything is inlined.

const RESEND = 'https://api.resend.com/emails';
const TEAM_FROM = 'Argo Method <hola@argomethod.com>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TEAM_SIZE = ['1-15', '16-50', '51-100', '100+'];
const MAX = 300; // per-field length cap

function clean(v: unknown, max = MAX): string {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function esc(s: string): string {
    return s.replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
    ));
}

// ── Requester confirmation email (es / en / pt) ──────────────────────────────
function confirmEmail(name: string, lang: string): { subject: string; html: string } {
    const first = esc(name.split(/\s+/)[0] || '');
    const wrap = (title: string, lead: string, body: string, closing: string) => ({
        subject: title,
        html: `<!doctype html><html><body style="margin:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D1D1F;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #E8E8ED;border-radius:16px;padding:32px 28px;">
      <p style="margin:0 0 20px;font-size:19px;letter-spacing:-0.02em;">
        <span style="font-weight:800;">Argo</span><span style="font-weight:300;">Academy</span><span style="font-weight:300;font-size:13px;vertical-align:top;">&reg;</span>
      </p>
      <p style="margin:0 0 16px;font-size:16px;font-weight:600;">${lead}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#424245;">${body}</p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:#424245;">${closing}</p>
    </div>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#86868B;">Argo Method &middot; argomethod.com</p>
  </div>
</body></html>`,
    });

    if (lang === 'en') {
        return wrap(
            'We received your ArgoAcademy® demo request',
            `Hi${first ? ' ' + first : ''}, we got your request.`,
            'Thanks for your interest in ArgoAcademy&reg;. Our team will reach out very soon to arrange a demo and answer any questions about how Argo can help your institution.',
            'No need to do anything for now. We will contact you shortly.',
        );
    }
    if (lang === 'pt') {
        return wrap(
            'Recebemos sua solicitação de demo do ArgoAcademy®',
            `Olá${first ? ' ' + first : ''}, recebemos sua solicitação.`,
            'Obrigado pelo interesse no ArgoAcademy&reg;. Nossa equipe entrará em contato em breve para agendar uma demo e responder suas dúvidas sobre como o Argo pode ajudar sua instituição.',
            'Você não precisa fazer nada por enquanto. Entraremos em contato em breve.',
        );
    }
    return wrap(
        'Recibimos tu solicitud de demo de ArgoAcademy®',
        `Hola${first ? ' ' + first : ''}, recibimos tu mensaje.`,
        'Gracias por tu interés en ArgoAcademy&reg;. Nuestro equipo te va a contactar muy pronto para coordinar una demo y resolver cualquier duda sobre cómo Argo puede ayudar a tu institución.',
        'No necesitas hacer nada por ahora. Te escribimos en breve.',
    );
}

async function send(apiKey: string, from: string, to: string, subject: string, opts: { html?: string; text?: string }): Promise<void> {
    try {
        await fetch(RESEND, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to: [to], subject, ...opts }),
        });
    } catch { /* best-effort */ }
}

async function notifyTeam(subject: string, body: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.QA_ALERT_EMAIL || 'hola@argomethod.com';
    if (apiKey) await send(apiKey, 'Argo Leads <qa@argomethod.com>', to, subject, { text: body });

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
        try {
            await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: tgChat, text: `${subject}\n\n${body}` }),
            });
        } catch { /* best-effort */ }
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }
    const sb = createClient(supabaseUrl, serviceKey);

    // ── POST: capture demo request (public) ──────────────────────────────────
    if (req.method === 'POST') {
        try {
            const b = (req.body || {}) as Record<string, unknown>;

            // Honeypot: real users never fill this hidden field. Pretend success.
            if (clean(b.company_url)) return res.status(200).json({ ok: true });

            const name = clean(b.name);
            const email = clean(b.email).toLowerCase();
            const institution = clean(b.institution);
            const whatsapp = clean(b.whatsapp);
            const country = clean(b.country, 80);
            const consent = b.consent === true || b.consent === 'true';

            if (!name || !email || !institution || !whatsapp || !country) {
                return res.status(400).json({ error: 'missing_fields' });
            }
            if (!EMAIL_RE.test(email)) {
                return res.status(400).json({ error: 'invalid_email' });
            }
            if (!consent) {
                return res.status(400).json({ error: 'consent_required' });
            }

            const sportRaw = clean(b.sport, 80);
            const teamSizeRaw = clean(b.team_size, 20);
            const sport = sportRaw || null;
            const team_size = VALID_TEAM_SIZE.includes(teamSizeRaw) ? teamSizeRaw : null;
            const langRaw = clean(b.lang, 5);
            const lang = ['es', 'en', 'pt'].includes(langRaw) ? langRaw : 'es';
            const source = clean(b.source, 40) || 'home';

            const { error: insertErr } = await sb.from('demo_requests').insert({
                name, email, institution, whatsapp, country, consent,
                sport, team_size, lang, source,
                user_agent: clean(req.headers['user-agent'], 500) || null,
                referrer: clean(req.headers['referer'], 500) || null,
            });

            if (insertErr) {
                console.error('[demo-request] insert error:', insertErr.message);
                return res.status(500).json({ error: 'save_failed' });
            }

            // Notify team (best-effort, never blocks the response).
            const teamBody = [
                `Nueva solicitud de demo de ArgoAcademy`,
                ``,
                `Nombre: ${name}`,
                `Email: ${email}`,
                `WhatsApp: ${whatsapp}`,
                `Institución: ${institution}`,
                `País: ${country}`,
                `Deporte: ${sport || '-'}`,
                `Cantidad de niños: ${team_size || '-'}`,
                `Origen: ${source}`,
            ].join('\n');

            const requesterKey = process.env.RESEND_API_KEY;
            const confirm = confirmEmail(name, lang);

            await Promise.allSettled([
                notifyTeam('🎯 Nueva demo ArgoAcademy', teamBody),
                requesterKey
                    ? send(requesterKey, TEAM_FROM, email, confirm.subject, { html: confirm.html })
                    : Promise.resolve(),
            ]);

            return res.status(200).json({ ok: true });
        } catch (err) {
            console.error('[demo-request] POST error:', err);
            return res.status(500).json({ error: 'internal_error' });
        }
    }

    // ── GET / PATCH: admin (authenticated) ───────────────────────────────────
    if (req.method === 'GET' || req.method === 'PATCH') {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing auth token' });
        }
        try {
            const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
            if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

            const { data: admin } = await sb
                .from('admin_users').select('id').eq('email', user.email).maybeSingle();
            if (!admin) return res.status(403).json({ error: 'Not an admin' });

            if (req.method === 'PATCH') {
                const id = clean((req.body || {}).id, 60);
                const status = clean((req.body || {}).status, 20);
                if (!id || !['new', 'contacted', 'closed'].includes(status)) {
                    return res.status(400).json({ error: 'invalid_input' });
                }
                const { error: updErr } = await sb.from('demo_requests').update({ status }).eq('id', id);
                if (updErr) return res.status(500).json({ error: 'update_failed' });
                return res.status(200).json({ ok: true });
            }

            const { data: rows, error: queryErr } = await sb
                .from('demo_requests')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);
            if (queryErr) return res.status(500).json({ error: 'Failed to fetch' });

            return res.status(200).json({ requests: rows ?? [], total: rows?.length ?? 0 });
        } catch (err) {
            console.error('[demo-request] admin error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
