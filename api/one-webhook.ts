import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { createHmac, timingSafeEqual } from 'crypto';
// Inlined Principia activity logger + lifecycle emails (best-effort). Serverless
// functions here do NOT bundle cross-directory imports — importing ../src/lib
// throws ERR_MODULE_NOT_FOUND at runtime.
type ActivityInput = { area: string; action: string; sourceType?: string; eventType?: string; actor?: string; resourceType?: string; resourceId?: string; severity?: string; status?: string; reason?: Record<string, unknown>; result?: Record<string, unknown>; relatedLogs?: string[]; incidentId?: number; occurredAt?: string };
async function logActivity(sb: { from: (table: string) => { insert: (values: unknown) => unknown } }, input: ActivityInput): Promise<void> {
    try {
        await sb.from('system_activity_log').insert({
            area: input.area, source_type: input.sourceType ?? 'system', event_type: input.eventType ?? null,
            actor: input.actor ?? null, action: input.action, resource_type: input.resourceType ?? null,
            resource_id: input.resourceId ?? null, severity: input.severity ?? 'info', status: input.status ?? null,
            reason: input.reason ?? null, result: input.result ?? null, related_logs: input.relatedLogs ?? [],
            incident_id: input.incidentId ?? null, occurred_at: input.occurredAt ?? null,
        });
    } catch (err) { console.warn('[principia:logActivity] non-blocking write failed:', err); }
}

function lifecycleShell(heading: string, body: string, cta: string, url: string): string {
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);"><tr><td style="background:#1D1D1F;padding:24px 28px;"><span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span></td></tr><tr><td style="padding:28px;"><h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 12px;">${heading}</h2><p style="font-size:14px;color:#86868B;margin:0 0 12px;line-height:1.6;">${body}</p><a href="${url}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:4px;">${cta}</a></td></tr><tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;"><p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jóvenes</p></td></tr></table></td></tr></table></body></html>`;
}
function paymentFailedEmail(lang: string): { subject: string; html: string } {
    const url = `${process.env.SITE_URL || 'https://argomethod.com'}/dashboard`;
    const c = lang === 'en' ? { s: 'We could not process your payment', h: 'There was a problem with your payment', b: 'We could not process your subscription charge. We will retry automatically, but you may want to review your payment method to avoid interruptions.', cta: 'Review my account' }
        : lang === 'pt' ? { s: 'Não conseguimos processar seu pagamento', h: 'Houve um problema com seu pagamento', b: 'Não conseguimos processar a cobrança da sua assinatura. Vamos tentar de novo automaticamente, mas você pode revisar seu meio de pagamento para evitar interrupções.', cta: 'Revisar minha conta' }
        : { s: 'No pudimos procesar tu pago', h: 'Hubo un problema con tu pago', b: 'No pudimos procesar el cobro de tu suscripción. Lo intentaremos de nuevo automáticamente, pero puedes revisar tu medio de pago para evitar interrupciones.', cta: 'Revisar mi cuenta' };
    return { subject: c.s, html: lifecycleShell(c.h, c.b, c.cta, url) };
}
function subscriptionEndedEmail(lang: string): { subject: string; html: string } {
    const url = `${process.env.SITE_URL || 'https://argomethod.com'}/dashboard/pricing`;
    const c = lang === 'en' ? { s: 'Your Argo subscription has ended', h: 'Your subscription has ended', b: 'Your plan returned to the trial state. Your profiles and reports are still saved. Whenever you want to resume, you can activate a plan again at any time.', cta: 'See plans' }
        : lang === 'pt' ? { s: 'Sua assinatura do Argo terminou', h: 'Sua assinatura terminou', b: 'Seu plano voltou ao estado de teste. Seus perfis e relatórios continuam salvos. Quando quiser retomar, você pode ativar um plano novamente a qualquer momento.', cta: 'Ver planos' }
        : { s: 'Tu suscripción a Argo finalizó', h: 'Tu suscripción finalizó', b: 'Tu plan volvió al estado de prueba. Tus perfiles y reportes siguen guardados. Cuando quieras retomar, puedes activar un plan de nuevo en cualquier momento.', cta: 'Ver planes' };
    return { subject: c.s, html: lifecycleShell(c.h, c.b, c.cta, url) };
}
async function sendTenantEmail(to: string, subject: string, html: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    try {
        const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [to], subject, html }) });
        if (!r.ok) console.error('[one-webhook] lifecycle email resend error:', r.status);
    } catch (e) { console.error('[one-webhook] lifecycle email failed:', e); }
}

// Look up a tenant's email and send a lifecycle email (best-effort).
async function emailTenant(
    sb: { from: (table: string) => any },
    tenantId: string | undefined,
    build: (lang: string) => { subject: string; html: string },
): Promise<void> {
    if (!tenantId) return;
    const { data } = await sb.from('tenants').select('email, lang').eq('id', tenantId).maybeSingle();
    const email = (data as { email?: string } | null)?.email;
    const lang = (data as { lang?: string } | null)?.lang || 'es';
    if (email) {
        const { subject, html } = build(lang);
        await sendTenantEmail(email, subject, html);
    }
}

// Owner-facing revenue alert to QA_ALERT_EMAIL (payment failed / subscription
// cancelled or paused). Best-effort; mirrors qa-monitor's sendAlert pattern.
async function alertOwner(subject: string, text: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    const to = process.env.QA_ALERT_EMAIL || 'marianonoceti@gmail.com';
    if (!key) return;
    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [to], subject, text }),
        });
    } catch (e) { console.error('[one-webhook] owner alert failed:', e); }
}

// Verifies a MercadoPago webhook signature (x-signature: "ts=...,v1=...").
// MP signs the manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
// with the webhook secret from the MP dashboard. Returns true if valid.
function verifyMpSignature(req: VercelRequest, secret: string): boolean {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    if (typeof xSignature !== 'string') return false;

    const parts: Record<string, string> = {};
    for (const kv of xSignature.split(',')) {
        const [k, v] = kv.split('=').map(s => s.trim());
        if (k && v) parts[k] = v;
    }
    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    const rawId = String(req.query['data.id'] ?? req.query.id ?? '');
    // MP lowercases the id in the manifest when it contains letters.
    const idPart = /[a-zA-Z]/.test(rawId) ? rawId.toLowerCase() : rawId;
    const manifest = `id:${idPart};request-id:${xRequestId ?? ''};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');

    const a = Buffer.from(v1);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

// Disable Vercel's default body parsing for Stripe signature verification
export const config = { api: { bodyParser: false } };

/**
 * POST /api/one-webhook
 * Handles payment confirmation from Stripe and MercadoPago.
 *
 * Stripe events:
 *   - checkout.session.completed (Argo One + subscriptions)
 *   - customer.subscription.deleted (subscription cancellation)
 *   - charge.refunded (refund processing)
 *
 * MercadoPago events:
 *   - payment / payment.created / payment.updated (Argo One payments)
 *   - subscription_preapproval (subscription status changes)
 *   - subscription_authorized_payment (recurring payment processed)
 */

const PLAN_CONFIG: Record<string, { roster_limit: number }> = {
    pro: { roster_limit: 50 },
    academy: { roster_limit: 100 },
};

/* ── Email helpers ───────────────────────────────────────────────────────── */

async function sendConfirmationEmail(
    email: string,
    accessToken: string,
    packSize: number,
): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.warn('[one-webhook] Missing RESEND_API_KEY, skipping email'); return; }

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;

    const subject = packSize === 1
        ? 'Tu informe Argo One está listo para usar'
        : `Tus ${packSize} informes Argo One están listos para usar`;

    const packLabel = packSize === 1 ? '1 informe' : `${packSize} informes`;

    const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

<tr><td style="background:#1D1D1F;padding:28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
    <span style="background:#955FB5;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">ONE</span>
    <p style="margin:14px 0 0;font-size:22px;font-weight:300;color:#fff;letter-spacing:-0.02em;">Compra confirmada</p>
</td></tr>

<tr><td style="padding:28px;">
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#16a34a;">Pago recibido: ${packLabel}</p>
    </div>

    <p style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;margin:0 0 14px;">Tu siguiente paso</p>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td width="28" style="vertical-align:top;padding-bottom:14px;">
            <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">1</div>
        </td>
        <td style="vertical-align:top;padding-left:10px;padding-bottom:14px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Accede a tu panel</p>
            <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">Desde tu panel puedes generar links para que los deportistas jueguen la experiencia.</p>
        </td>
    </tr>
    <tr>
        <td width="28" style="vertical-align:top;padding-bottom:14px;">
            <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">2</div>
        </td>
        <td style="vertical-align:top;padding-left:10px;padding-bottom:14px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Genera un link y compártelo</p>
            <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">El adulto responsable completa un breve registro y le pasa el dispositivo al deportista.</p>
        </td>
    </tr>
    <tr>
        <td width="28" style="vertical-align:top;">
            <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">3</div>
        </td>
        <td style="vertical-align:top;padding-left:10px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">Recibe el informe</p>
            <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">El deportista juega una aventura de menos de 10 minutos. El informe completo llega al email del adulto responsable.</p>
        </td>
    </tr>
    </table>

    <div style="text-align:center;margin:28px 0 0;">
        <a href="${panelUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">
            Ir a mis informes
        </a>
    </div>

    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">Este link es personal. Guárdalo para acceder a tus informes cuando quieras.</p>
</td></tr>

<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jóvenes</p>
</td></tr>

</table></td></tr></table>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [email],
            subject,
            html,
        }),
    });
}

async function sendUpgradeEmail(email: string, plan: string, rosterLimit: number, lang: string = 'es'): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const planLabel = plan === 'pro' ? 'PRO' : 'Academy';
    const L = lang === 'en' ? {
        subject: `Your ${planLabel} plan on Argo Method is active`,
        heroTitle: 'Your plan is active.',
        badgeLabel: `${planLabel} plan active`,
        badgeBody: `Up to ${rosterLimit} active players. Every feature unlocked.`,
        unlockedLabel: 'What your plan unlocked',
        closing: 'Your dashboard already reflects the unlocked features.',
        cta: 'Go to dashboard',
        footer: 'Argo Method · Behavioral profiling for young athletes',
        features: [
            { label: 'Unlimited AI queries', desc: 'Ask whatever you need about your players, with no limit.' },
            { label: 'Bridge words and words to avoid', desc: 'Key phrases to connect with each profile and the ones that create resistance.' },
            { label: 'Quick guide and per-player checklist', desc: 'Activators, demotivators and a checklist before, during and after the activity.' },
            { label: `Up to ${rosterLimit} active players`, desc: 'Profile and re-profile every 6 months. No usage limits.' },
            { label: 'Unlimited group chemistry with full analysis', desc: 'Coaching tools, pairing suggestions and a simulator.' },
            { label: 'Personalized Behavioral Predictor', desc: 'Guidance tailored to each player profile.' },
        ],
    } : lang === 'pt' ? {
        subject: `Seu plano ${planLabel} no Argo Method está ativo`,
        heroTitle: 'Seu plano está ativo.',
        badgeLabel: `Plano ${planLabel} ativo`,
        badgeBody: `Até ${rosterLimit} jogadores ativos. Todas as funções desbloqueadas.`,
        unlockedLabel: 'O que seu plano desbloqueou',
        closing: 'Seu dashboard já reflete as funções desbloqueadas.',
        cta: 'Ir ao dashboard',
        footer: 'Argo Method · Perfilamento comportamental para atletas jovens',
        features: [
            { label: 'Consultas de IA ilimitadas', desc: 'Pergunte o que precisar sobre seus jogadores, sem restrição.' },
            { label: 'Palavras-ponte e palavras a evitar', desc: 'Frases-chave para conectar com cada perfil e as que geram resistência.' },
            { label: 'Guia rápido e checklist por jogador', desc: 'Ativadores, desmotivadores e um checklist antes, durante e depois da atividade.' },
            { label: `Até ${rosterLimit} jogadores ativos`, desc: 'Perfile e re-perfile a cada 6 meses. Sem limites de uso.' },
            { label: 'Química de grupos ilimitada com análise completa', desc: 'Ferramentas de coaching, sugestões de duplas e simulador.' },
            { label: 'Preditor Comportamental personalizado', desc: 'Orientações adaptadas ao perfil de cada jogador.' },
        ],
    } : {
        subject: `Tu plan ${planLabel} en Argo Method está activo`,
        heroTitle: 'Tu plan está activo.',
        badgeLabel: `Plan ${planLabel} activo`,
        badgeBody: `Hasta ${rosterLimit} jugadores activos. Todas las funcionalidades desbloqueadas.`,
        unlockedLabel: 'Qué se desbloqueó con tu plan',
        closing: 'Tu dashboard ya refleja las funcionalidades desbloqueadas.',
        cta: 'Ir al dashboard',
        footer: 'Argo Method · Perfilamiento conductual para deportistas jóvenes',
        features: [
            { label: 'Consultas IA ilimitadas', desc: 'Pregunta lo que necesites sobre tus jugadores sin restricción.' },
            { label: 'Palabras puente y palabras a evitar', desc: 'Frases clave para conectar con cada perfil y las que generan resistencia.' },
            { label: 'Guía rápida y checklist por jugador', desc: 'Activadores, desmotivadores y un checklist antes, durante y después de la actividad.' },
            { label: `Hasta ${rosterLimit} jugadores activos`, desc: 'Perfila y re-perfila cada 6 meses. Sin límites de uso.' },
            { label: 'Química de grupos ilimitada con análisis completo', desc: 'Herramientas de coaching, sugerencias de duplas y simulador.' },
            { label: 'Predictor Conductual personalizado', desc: 'Orientaciones adaptadas al perfil de cada jugador.' },
        ],
    };
    const features = L.features;

    const featureRows = features.map(f => `
        <tr>
            <td width="28" style="vertical-align:top;padding-bottom:12px;">
                <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);text-align:center;line-height:20px;font-size:11px;color:#16a34a;font-weight:700;">&#10003;</div>
            </td>
            <td style="vertical-align:top;padding-left:8px;padding-bottom:12px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">${f.label}</p>
                <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">${f.desc}</p>
            </td>
        </tr>`).join('');

    const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

<tr><td style="background:#1D1D1F;padding:28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
    <p style="margin:16px 0 0;font-size:24px;font-weight:300;color:#fff;letter-spacing:-0.02em;">${L.heroTitle}</p>
</td></tr>

<tr><td style="padding:28px;">
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#16a34a;">${L.badgeLabel}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#86868B;">${L.badgeBody}</p>
    </div>

    <p style="margin:0 0 16px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">${L.unlockedLabel}</p>

    <table width="100%" cellpadding="0" cellspacing="0">
        ${featureRows}
    </table>

    <div style="text-align:center;margin:24px 0 0;">
        <p style="margin:0 0 16px;font-size:13px;color:#86868B;">${L.closing}</p>
        <a href="${origin}/dashboard" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">
            ${L.cta}
        </a>
    </div>
</td></tr>

<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Perfilamiento conductual para deportistas jóvenes</p>
</td></tr>

</table></td></tr></table>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [email],
            subject: L.subject,
            html,
        }),
    });
}

/* ── Argo Puentes helpers ────────────────────────────────────────────────── */

async function sendPuentesMagicEmail(args: {
    to: string;
    recipientName: string | null;
    childName: string | null;
    magicLink: string;
    lang: string;
}): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.warn('[one-webhook] Missing RESEND_API_KEY, skipping puentes email'); return; }

    const violet = '#955FB5';
    const child = args.childName || (args.lang === 'en' ? 'your child' : args.lang === 'pt' ? 'seu filho' : 'tu hijo');
    const subject = args.lang === 'en'
        ? `Your Argo Puentes is ready. Bond with ${child}`
        : args.lang === 'pt'
            ? `Seu Argo Puentes está pronto. Vínculo com ${child}`
            : `Tu Argo Puentes está listo. Vínculo con ${child}`;

    const t = args.lang === 'en' ? {
        headline: 'Your Argo Puentes is ready',
        body: `You will answer 15 short questions (5 to 7 minutes) about your own style. We will then generate a personalized report with 4 bridges to deepen your bond with ${child} in sport.`,
        cta: 'Start the questionnaire',
        note: 'This link is personal and non-transferable. Save it to come back later.',
    } : args.lang === 'pt' ? {
        headline: 'Seu Argo Puentes está pronto',
        body: `Você responderá 15 perguntas curtas (5 a 7 minutos) sobre seu próprio estilo. Em seguida geramos um relatório personalizado com 4 pontes para aprofundar o vínculo com ${child} no esporte.`,
        cta: 'Começar o questionário',
        note: 'Este link é pessoal e intransferível. Guarde-o para voltar depois.',
    } : {
        headline: 'Tu Argo Puentes está listo',
        body: `Vas a responder 15 preguntas cortas (5 a 7 minutos) sobre tu propio estilo. Después generamos un informe personalizado con 4 puentes para profundizar el vínculo con ${child} en el deporte.`,
        cta: 'Empezar el cuestionario',
        note: 'Este link es personal e intransferible. Guárdalo para volver más tarde.',
    };

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:#1D1D1F;padding:28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
<span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTES</span>
<p style="margin:14px 0 0;font-size:22px;font-weight:300;color:#fff;letter-spacing:-0.02em;">${t.headline}</p>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 22px;font-size:14px;color:#424245;line-height:1.7;">${t.body}</p>
<div style="text-align:center;">
<a href="${args.magicLink}" style="display:inline-block;background:${violet};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.cta}</a>
</div>
<p style="margin:20px 0 0;font-size:11px;color:#AEAEB2;text-align:center;line-height:1.6;">${t.note}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
<p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method · Argo Puentes</p>
</td></tr>
</table></td></tr></table></body></html>`;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [args.to],
            subject,
            html,
        }),
    });
}

async function handlePuentesPaid(args: {
    sb: ReturnType<typeof createClient<any, any>>;
    purchaseId: string;
    providerPaymentId: string;
}): Promise<void> {
    const { sb, purchaseId, providerPaymentId } = args;
    const { data: purchase, error } = await sb
        .from('puentes_purchases')
        .select('*')
        .eq('id', purchaseId)
        .maybeSingle();
    if (error || !purchase) {
        console.error('[one-webhook] puentes purchase not found:', error?.message, purchaseId);
        return;
    }
    if (purchase.status === 'paid') {
        console.info('[one-webhook] puentes purchase already paid:', purchaseId);
        return;
    }

    await sb.from('puentes_purchases').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_payment_id: providerPaymentId,
    }).eq('id', purchaseId);

    // Multi-child support: one Argo Puentes purchase covers every child this adult
    // email already profiled (up to MAX_CHILDREN_PER_PURCHASE). current_perfilamiento
    // gives one row per child = its latest resolved perfilamiento, already filtered
    // to resolved + non-deleted. perfilamiento_id is the assessment id that
    // puentes_sessions.source_session_id binds to (FK unchanged, by perfilamiento id).
    // The originating source_session_id is included first, followed by any
    // siblings ordered by most recent first.
    const MAX_CHILDREN_PER_PURCHASE = 5;
    const { data: siblings } = await sb
        .from('current_perfilamiento')
        .select('perfilamiento_id, child_name, current_profile_date')
        .eq('adult_email', purchase.recipient_email)
        .order('current_profile_date', { ascending: false });
    const siblingIds = (siblings ?? []).map((s: any) => s.perfilamiento_id);
    const uniqueIds = Array.from(new Set([purchase.source_session_id, ...siblingIds])).slice(0, MAX_CHILDREN_PER_PURCHASE);

    const sessionRows = uniqueIds.map(sid => ({
        purchase_id: purchase.id,
        source_session_id: sid,
        lang: purchase.lang,
        status: 'created' as const,
    }));
    if (sessionRows.length > 0) {
        await sb.from('puentes_sessions').insert(sessionRows);
    }
    console.info(`[one-webhook] puentes purchase ${purchase.id} created ${sessionRows.length} sessions (multi-child)`);

    // Send the magic-link email. Use the preview's own URL when running on
    // a Vercel preview deployment so the magic link lands on the preview
    // host that has the /puentes routes (production may not have them yet).
    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.SITE_URL || 'https://argomethod.com');
    const magicLink = `${origin}/puentes/${purchase.magic_token}`;
    await sendPuentesMagicEmail({
        to: purchase.recipient_email,
        recipientName: purchase.recipient_name,
        childName: purchase.child_name,
        magicLink,
        lang: purchase.lang,
    });

    console.info(`[one-webhook] puentes purchase paid: ${purchaseId}`);
}

/* ── Demo report unlock (paid from the demo report "Obtener informe completo" CTA) ── */

async function handleUnlockPaid(args: {
    sb: ReturnType<typeof createClient<any, any>>;
    sessionId: string;
    providerPaymentId: string;
}) {
    const { sb, sessionId, providerPaymentId } = args;
    const { data: session } = await sb
        .from('perfilamientos')
        .select('id, full_access')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session) {
        console.warn(`[one-webhook] unlock: session ${sessionId} not found`);
        return;
    }
    if (session.full_access) {
        console.info(`[one-webhook] unlock: session ${sessionId} already unlocked`);
        return;
    }
    const { error } = await sb
        .from('perfilamientos')
        .update({ full_access: true })
        .eq('id', sessionId);
    if (error) {
        console.error(`[one-webhook] unlock update failed for ${sessionId}:`, error.message);
        return;
    }
    console.info(`[one-webhook] report unlocked: ${sessionId} (payment ${providerPaymentId})`);
}

/* ── Main handler ────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // Detect provider from request
        const isStripe = req.headers['stripe-signature'];
        const mpTopic = req.query.topic || req.body?.topic || req.body?.type;

        if (isStripe) {
            return handleStripe(req, res, sb);
        } else if (mpTopic) {
            return handleMercadoPago(req, res, sb, String(mpTopic));
        }

        return res.status(400).json({ error: 'Unknown webhook source' });
    } catch (err) {
        console.error('[one-webhook] Error:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}

/* ── Stripe handler ──────────────────────────────────────────────────────── */

async function handleStripe(req: VercelRequest, res: VercelResponse, sb: ReturnType<typeof createClient<any, any>>) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || !webhookSecret) {
        console.error('[one-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const stripe = new Stripe(stripeKey);

    let event: Stripe.Event;
    try {
        const rawBody = await buffer(req);
        const signature = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[one-webhook] Stripe signature verification failed:', msg);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // ── Idempotency ──────────────────────────────────────────────────────
    // Stripe retries deliver the same event many times. Record event.id; if
    // we've already processed it, skip. Fails open (logs + continues) if the
    // webhook_events table is missing, so the webhook keeps working until the
    // migration is applied.
    {
        const { error: dupErr } = await sb
            .from('webhook_events')
            .insert({ event_id: event.id, provider: 'stripe' });
        if (dupErr) {
            if (dupErr.code === '23505') {
                console.info(`[one-webhook] Stripe event ${event.id} already processed, skipping`);
                return res.status(200).json({ received: true, duplicate: true });
            }
            console.warn('[one-webhook] webhook_events insert issue (continuing):', dupErr.code, dupErr.message);
        }
    }

    // Handle a failed recurring charge. We don't downgrade on the first
    // failure — Stripe runs its own retry/dunning schedule, and when it
    // finally gives up it emits customer.subscription.deleted (handled below,
    // which downgrades to trial). Here we log loudly for visibility/alerting.
    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        const sub = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
        let failedTenantId: string | undefined;
        if (sub) {
            const { data: t } = await sb.from('tenants').select('id').eq('subscription_id', sub).maybeSingle();
            failedTenantId = t?.id;
        }
        console.error(`[one-webhook] PAYMENT FAILED — subscription ${sub ?? '?'}, tenant ${failedTenantId ?? 'unknown'}, invoice ${invoice.id}`);
        await emailTenant(sb, failedTenantId, (lang) => paymentFailedEmail(lang));
        await logActivity(sb, { area: 'ventas', sourceType: 'webhook', action: 'payment_failed', severity: 'medio', resourceType: 'tenant', resourceId: failedTenantId, reason: { provider: 'stripe', subscription: sub, invoice: invoice.id } });
        await alertOwner('[Argo Ventas] Pago fallido (Stripe)', `Falló el cobro de la suscripción ${sub ?? '?'} (tenant ${failedTenantId ?? 'desconocido'}, invoice ${invoice.id}). Stripe reintenta solo; si agota los reintentos, la suscripción se cancela y la cuenta baja a trial.`);
        return res.status(200).json({ received: true, action: 'payment_failed_logged' });
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;
        if (tenantId) {
            await sb.from('tenants').update({
                plan: 'trial',
                roster_limit: 8,
                subscription_provider: null,
                subscription_id: null,
            }).eq('id', tenantId);
            console.info(`[one-webhook] Subscription cancelled: tenant ${tenantId} downgraded to trial`);
            await emailTenant(sb, tenantId, (lang) => subscriptionEndedEmail(lang));
            await logActivity(sb, { area: 'ventas', sourceType: 'webhook', action: 'subscription_cancelled', severity: 'alto', resourceType: 'tenant', resourceId: tenantId, reason: { provider: 'stripe' } });
            await alertOwner('[Argo Ventas] Suscripción cancelada (Stripe)', `La suscripción del tenant ${tenantId} se canceló (Stripe). La cuenta volvió a trial.`);
        }
        return res.status(200).json({ received: true, action: 'subscription_cancelled' });
    }

    // Handle refund
    if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = charge.payment_intent as string;
        if (paymentIntent) {
            const { data: purchase } = await sb
                .from('one_purchases')
                .select('id')
                .eq('payment_id', paymentIntent)
                .maybeSingle();
            if (purchase) {
                await sb.from('one_purchases').update({ payment_status: 'refunded' }).eq('id', purchase.id);
                console.info(`[one-webhook] Refund processed for purchase ${purchase.id}`);
            }
        }
        return res.status(200).json({ received: true, action: 'refund_processed' });
    }

    if (event.type !== 'checkout.session.completed') {
        return res.status(200).json({ received: true, ignored: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const source = session.metadata?.source;

    // Route to subscription handler
    if (source === 'argo_subscription') {
        const subId = typeof session.subscription === 'string' ? session.subscription : undefined;
        return handleSubscription({ id: session.id, metadata: session.metadata ?? {}, subscription: subId, customer_email: session.customer_email ?? undefined }, 'stripe', res, sb);
    }

    // Argo Puentes payment
    if (source === 'argo_puentes') {
        const puentesPurchaseId = session.metadata?.purchase_id;
        if (!puentesPurchaseId) return res.status(200).json({ received: true, ignored: true, reason: 'missing puentes purchase_id' });
        await handlePuentesPaid({ sb, purchaseId: puentesPurchaseId, providerPaymentId: session.id });
        return res.status(200).json({ received: true, kind: 'puentes', purchase_id: puentesPurchaseId });
    }

    // Demo report unlock payment
    if (source === 'unlock') {
        const unlockSessionId = session.metadata?.session_id;
        if (!unlockSessionId) return res.status(200).json({ received: true, ignored: true, reason: 'missing unlock session_id' });
        await handleUnlockPaid({ sb, sessionId: unlockSessionId, providerPaymentId: session.id });
        return res.status(200).json({ received: true, kind: 'unlock', session_id: unlockSessionId });
    }

    // Argo One payment
    const purchaseId = session?.metadata?.purchase_id;
    if (!purchaseId || source !== 'argo_one') {
        return res.status(200).json({ received: true, ignored: true });
    }

    const { data: existing } = await sb
        .from('one_purchases')
        .select('id, payment_status, email, pack_size, access_token')
        .eq('id', purchaseId)
        .single();

    if (!existing) return res.status(404).json({ error: 'Purchase not found' });
    if (existing.payment_status === 'paid') return res.status(200).json({ received: true, already_processed: true });

    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: session.id,
        paid_at: new Date().toISOString(),
    }).eq('id', purchaseId);

    // Principia ingestion (area=ventas). event.id is NOT in scope inside this
    // helper — it receives `session`, not the outer Stripe `event`. Use session.id.
    await logActivity(sb, {
        area: 'ventas',
        action: 'payment_received',
        sourceType: 'webhook',
        severity: 'sano',
        resourceType: 'one_purchase',
        resourceId: String(purchaseId),
        reason: { provider: 'stripe', pack_size: existing.pack_size, payment_id: session.id },
        relatedLogs: [`one_purchases.${purchaseId}`],
    });

    await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size);

    console.info(`[one-webhook] Stripe: Purchase ${purchaseId} marked as paid (${existing.pack_size} pack)`);
    return res.status(200).json({ received: true, purchase_id: purchaseId });
}

/* ── MercadoPago handler ─────────────────────────────────────────────────── */

async function handleMercadoPago(req: VercelRequest, res: VercelResponse, sb: ReturnType<typeof createClient<any, any>>, topic: string) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) return res.status(500).json({ error: 'Missing MP token' });

    // ── Signature verification ───────────────────────────────────────────
    // When MERCADOPAGO_WEBHOOK_SECRET is set, every MP notification must carry
    // a valid signature. Without the secret we log loudly but still process,
    // so the webhook keeps working until the secret is configured in Vercel.
    // Signature handling is best-effort by design. MP signs dashboard-webhook
    // (v2) deliveries with x-signature, but IPN notifications sent to a
    // preference's/preapproval's notification_url do NOT carry it. Rejecting
    // unsigned IPNs would again leave every payment unconfirmed (the original
    // bug). So we reject only when a signature is PRESENT but invalid (blocks
    // tampering of v2 deliveries), and otherwise proceed to the authoritative
    // gate below: every payment/preapproval is re-fetched from MP's API with our
    // seller token, so a forged "approved" event cannot exist in our account.
    const mpSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const sigPresent = typeof req.headers['x-signature'] === 'string';
    if (mpSecret && sigPresent && !verifyMpSignature(req, mpSecret)) {
        console.error('[one-webhook] MP signature present but invalid — rejecting');
        return res.status(401).json({ error: 'Invalid signature' });
    }
    if (!sigPresent) {
        console.warn('[one-webhook] MP notification without x-signature (IPN) — proceeding via authoritative API re-fetch');
    }

    // ── Subscription preapproval events ──────────────────────────────────
    if (topic === 'subscription_preapproval') {
        const preapprovalId = req.query.id || req.body?.data?.id;
        if (!preapprovalId) return res.status(200).json({ received: true, ignored: true });

        const paRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
            headers: { 'Authorization': `Bearer ${mpToken}` },
        });
        if (!paRes.ok) {
            console.error('[one-webhook] MP preapproval fetch failed:', paRes.status);
            return res.status(502).json({ error: 'Failed to fetch MP preapproval' });
        }

        const preapproval = await paRes.json();
        const tenantId = preapproval.external_reference;

        if (!tenantId) return res.status(200).json({ received: true, ignored: true });

        if (preapproval.status === 'authorized') {
            // Subscription activated: determine plan from reason field
            const reason = (preapproval.reason ?? '').toLowerCase();
            const plan = reason.includes('academy') ? 'academy' : 'pro';
            const config = PLAN_CONFIG[plan];

            await sb.from('tenants').update({
                plan,
                roster_limit: config.roster_limit,
                subscription_provider: 'mercadopago',
                subscription_id: String(preapprovalId),
            }).eq('id', tenantId);

            // Fetch tenant email for upgrade email
            const { data: tenant } = await sb.from('tenants').select('auth_user_id, lang').eq('id', tenantId).maybeSingle();
            if (tenant?.auth_user_id) {
                const { data: { user } } = await sb.auth.admin.getUserById(tenant.auth_user_id);
                if (user?.email) {
                    await sendUpgradeEmail(user.email, plan, config.roster_limit, (tenant.lang as string) || 'es');
                }
            }

            console.info(`[one-webhook] MP subscription authorized: tenant ${tenantId} → ${plan}`);
        } else if (preapproval.status === 'cancelled') {
            await sb.from('tenants').update({
                plan: 'trial',
                roster_limit: 8,
                subscription_provider: null,
                subscription_id: null,
            }).eq('id', tenantId);
            console.info(`[one-webhook] MP subscription cancelled: tenant ${tenantId} → trial`);
            await emailTenant(sb, tenantId, (lang) => subscriptionEndedEmail(lang));
            await logActivity(sb, { area: 'ventas', sourceType: 'webhook', action: 'subscription_cancelled', severity: 'alto', resourceType: 'tenant', resourceId: tenantId, reason: { provider: 'mercadopago' } });
            await alertOwner('[Argo Ventas] Suscripción cancelada (MercadoPago)', `La suscripción del tenant ${tenantId} se canceló (MercadoPago). La cuenta volvió a trial.`);
        } else if (preapproval.status === 'paused') {
            // MercadoPago pauses a preapproval after its recurring charge fails
            // repeatedly. Treat it like a cancellation and downgrade so we never
            // serve a paid plan that isn't being paid for. If the payment later
            // recovers, MP re-emits status='authorized' and the branch above
            // restores the plan.
            await sb.from('tenants').update({
                plan: 'trial',
                roster_limit: 8,
                subscription_provider: null,
                subscription_id: null,
            }).eq('id', tenantId);
            console.error(`[one-webhook] MP subscription PAUSED (payment failing): tenant ${tenantId} → trial`);
            await emailTenant(sb, tenantId, (lang) => paymentFailedEmail(lang));
            await logActivity(sb, { area: 'ventas', sourceType: 'webhook', action: 'subscription_paused', severity: 'alto', resourceType: 'tenant', resourceId: tenantId, reason: { provider: 'mercadopago', cause: 'payment_failing' } });
            await alertOwner('[Argo Ventas] Pago fallando / suscripción pausada (MercadoPago)', `MercadoPago pausó la suscripción del tenant ${tenantId} por pagos fallidos. Bajó a trial; si el pago se recupera, vuelve a su plan.`);
        }

        return res.status(200).json({ received: true, status: preapproval.status });
    }

    // ── Subscription authorized payment (recurring charge) ──────────────
    if (topic === 'subscription_authorized_payment') {
        const paymentId = req.query.id || req.body?.data?.id;
        console.info(`[one-webhook] MP subscription payment received: ${paymentId}`);
        // Recurring payments don't require action — tenant stays on current plan
        return res.status(200).json({ received: true, action: 'subscription_payment_logged' });
    }

    // ── Argo One payment events ─────────────────────────────────────────
    if (topic !== 'payment' && topic !== 'payment.created' && topic !== 'payment.updated') {
        return res.status(200).json({ received: true, ignored: true });
    }

    const resourceId = req.query.id || req.body?.data?.id;
    if (!resourceId) return res.status(400).json({ error: 'Missing resource id' });

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { 'Authorization': `Bearer ${mpToken}` },
    });

    if (!paymentRes.ok) {
        console.error('[one-webhook] MP payment fetch failed:', paymentRes.status);
        return res.status(502).json({ error: 'Failed to fetch MP payment' });
    }

    const payment = await paymentRes.json();

    if (payment.status !== 'approved') {
        return res.status(200).json({ received: true, status: payment.status });
    }

    // Argo Puentes: external_reference prefixed with "puentes_"
    const externalRef = payment.external_reference as string | undefined;
    const isPuentes = payment.metadata?.source === 'argo_puentes' || externalRef?.startsWith('puentes_');
    if (isPuentes) {
        const puentesPurchaseId = (payment.metadata?.purchase_id as string)
            || (externalRef?.startsWith('puentes_') ? externalRef.slice('puentes_'.length) : undefined);
        if (!puentesPurchaseId) return res.status(200).json({ received: true, ignored: true, reason: 'missing puentes purchase id' });
        await handlePuentesPaid({ sb, purchaseId: puentesPurchaseId, providerPaymentId: String(resourceId) });
        return res.status(200).json({ received: true, kind: 'puentes', purchase_id: puentesPurchaseId });
    }

    // Demo report unlock: external_reference prefixed with "unlock_"
    if (externalRef?.startsWith('unlock_')) {
        const unlockSessionId = externalRef.slice('unlock_'.length);
        await handleUnlockPaid({ sb, sessionId: unlockSessionId, providerPaymentId: String(resourceId) });
        return res.status(200).json({ received: true, kind: 'unlock', session_id: unlockSessionId });
    }

    const purchaseId = externalRef || payment.metadata?.purchase_id;
    if (!purchaseId) return res.status(200).json({ received: true, ignored: true });

    const { data: existing } = await sb
        .from('one_purchases')
        .select('id, payment_status, email, pack_size, access_token')
        .eq('id', purchaseId)
        .single();

    if (!existing) return res.status(404).json({ error: 'Purchase not found' });
    if (existing.payment_status === 'paid') return res.status(200).json({ received: true, already_processed: true });

    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: String(resourceId),
        paid_at: new Date().toISOString(),
    }).eq('id', purchaseId);

    // Principia ingestion (area=ventas). Latam path — without this, MercadoPago
    // payments are never logged. resourceId is the MP payment id in scope here.
    await logActivity(sb, {
        area: 'ventas',
        action: 'payment_received',
        sourceType: 'webhook',
        severity: 'sano',
        resourceType: 'one_purchase',
        resourceId: String(purchaseId),
        reason: { provider: 'mercadopago', pack_size: existing.pack_size, payment_id: String(resourceId) },
        relatedLogs: [`one_purchases.${purchaseId}`],
    });

    await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size);

    console.info(`[one-webhook] MP: Purchase ${purchaseId} marked as paid (${existing.pack_size} pack)`);
    return res.status(200).json({ received: true, purchase_id: purchaseId });
}

/* ── Subscription handler (shared for Stripe checkout.session.completed) ── */

async function handleSubscription(
    session: { id: string; metadata: Record<string, string>; subscription?: string; customer_email?: string },
    provider: 'stripe' | 'mercadopago',
    res: VercelResponse,
    sb: ReturnType<typeof createClient<any, any>>,
) {
    const tenantId = session.metadata?.tenant_id;
    const plan = session.metadata?.plan;

    if (!tenantId || !plan || !PLAN_CONFIG[plan]) {
        return res.status(200).json({ received: true, ignored: true, reason: 'missing metadata' });
    }

    const config = PLAN_CONFIG[plan];

    const { error } = await sb.from('tenants').update({
        plan,
        roster_limit: config.roster_limit,
        subscription_provider: provider,
        subscription_id: session.subscription ?? session.id,
    }).eq('id', tenantId);

    if (error) {
        console.error('[one-webhook] Subscription update error:', error.message);
        return res.status(500).json({ error: 'Failed to update tenant' });
    }

    const { data: upgTenant } = await sb.from('tenants').select('lang').eq('id', tenantId).maybeSingle();
    const email = session.customer_email;
    if (email) {
        await sendUpgradeEmail(email, plan, config.roster_limit, (upgTenant?.lang as string) || 'es');
    }

    console.info(`[one-webhook] Subscription (${provider}): Tenant ${tenantId} upgraded to ${plan} (roster: ${config.roster_limit})`);
    return res.status(200).json({ received: true, tenant_id: tenantId, plan });
}
