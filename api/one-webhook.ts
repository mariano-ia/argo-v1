import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
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
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);"><tr><td style="background:#1D1D1F;padding:24px 28px;"><span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">Method®</span></td></tr><tr><td style="padding:28px;"><h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 12px;">${heading}</h2><p style="font-size:14px;color:#86868B;margin:0 0 12px;line-height:1.6;">${body}</p><a href="${url}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:4px;">${cta}</a></td></tr><tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;"><p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · Perfilamiento conductual para deportistas jóvenes</p></td></tr></table></td></tr></table></body></html>`;
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
 *   - checkout.session.completed (ArgoOne+® subscriptions)
 *   - customer.subscription.deleted (subscription cancellation)
 *   - charge.refunded (refund processing)
 *
 * MercadoPago events:
 *   - payment / payment.created / payment.updated (ArgoOne® payments)
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
    lang: string = 'es',
): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.warn('[one-webhook] Missing RESEND_API_KEY, skipping email'); return; }

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;

    const PL = lang === 'en' ? {
        subject: packSize === 1 ? 'Your ArgoOne® report is ready to use' : `Your ${packSize} ArgoOne® reports are ready to use`,
        packLabel: packSize === 1 ? '1 report' : `${packSize} reports`,
        badge: 'Purchase confirmed', paid: 'Payment received', nextStep: 'Your next step',
        s1t: 'Open your panel', s1b: 'From your panel you generate links for athletes to play the experience.',
        s2t: 'Generate a link and share it', s2b: 'The responsible adult completes a short registration and hands the device to the athlete.',
        s3t: 'Get the report', s3b: 'The athlete plays an adventure of under 10 minutes. The full report arrives at the adult\'s email.',
        cta: 'Go to my reports',
        note: `Keep this link to come back anytime. You can also go to <a href="${origin}/one/panel" style="color:#955FB5;text-decoration:none;">argomethod.com/one/panel</a> and enter your email to see your reports, their delivery status, and generate links.`,
        footer: 'ArgoMethod® · Behavioral profiling for young athletes',
    } : lang === 'pt' ? {
        subject: packSize === 1 ? 'Seu relatório ArgoOne® está pronto para usar' : `Seus ${packSize} relatórios ArgoOne® estão prontos para usar`,
        packLabel: packSize === 1 ? '1 relatório' : `${packSize} relatórios`,
        badge: 'Compra confirmada', paid: 'Pagamento recebido', nextStep: 'Seu próximo passo',
        s1t: 'Acesse seu painel', s1b: 'No seu painel você gera links para os atletas jogarem a experiência.',
        s2t: 'Gere um link e compartilhe', s2b: 'O adulto responsável completa um breve registro e passa o dispositivo ao atleta.',
        s3t: 'Receba o relatório', s3b: 'O atleta joga uma aventura de menos de 10 minutos. O relatório completo chega no email do adulto responsável.',
        cta: 'Ir aos meus relatórios',
        note: `Guarde este link para voltar quando quiser. Você também pode acessar <a href="${origin}/one/panel" style="color:#955FB5;text-decoration:none;">argomethod.com/one/panel</a> com seu email para ver seus relatórios, o status dos envios e gerar links.`,
        footer: 'ArgoMethod® · Perfilamento comportamental para atletas jovens',
    } : {
        subject: packSize === 1 ? 'Tu informe ArgoOne® está listo para usar' : `Tus ${packSize} informes ArgoOne® están listos para usar`,
        packLabel: packSize === 1 ? '1 informe' : `${packSize} informes`,
        badge: 'Compra confirmada', paid: 'Pago recibido', nextStep: 'Tu siguiente paso',
        s1t: 'Accede a tu panel', s1b: 'Desde tu panel generas links para que los deportistas jueguen la experiencia.',
        s2t: 'Genera un link y compártelo', s2b: 'El adulto responsable completa un breve registro y le pasa el dispositivo al deportista.',
        s3t: 'Recibe el informe', s3b: 'El deportista juega una aventura de menos de 10 minutos. El informe completo llega al email del adulto responsable.',
        cta: 'Ir a mis informes',
        note: `Guarda este link para volver cuando quieras. También puedes entrar a <a href="${origin}/one/panel" style="color:#955FB5;text-decoration:none;">argomethod.com/one/panel</a> con tu email para ver tus informes, el estado de los envíos y generar links.`,
        footer: 'ArgoMethod® · Perfilamiento conductual para deportistas jóvenes',
    };
    const subject = PL.subject;
    const packLabel = PL.packLabel;

    const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

<tr><td style="background:#1D1D1F;padding:28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One</span><span style="font-size:10px;color:#fff;font-weight:300;vertical-align:super;">&reg;</span>
    <p style="margin:14px 0 0;font-size:22px;font-weight:300;color:#fff;letter-spacing:-0.02em;">${PL.badge}</p>
</td></tr>

<tr><td style="padding:28px;">
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#16a34a;">${PL.paid}: ${packLabel}</p>
    </div>

    <p style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;margin:0 0 14px;">${PL.nextStep}</p>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td width="28" style="vertical-align:top;padding-bottom:14px;">
            <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">1</div>
        </td>
        <td style="vertical-align:top;padding-left:10px;padding-bottom:14px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">${PL.s1t}</p>
            <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">${PL.s1b}</p>
        </td>
    </tr>
    <tr>
        <td width="28" style="vertical-align:top;padding-bottom:14px;">
            <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">2</div>
        </td>
        <td style="vertical-align:top;padding-left:10px;padding-bottom:14px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">${PL.s2t}</p>
            <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">${PL.s2b}</p>
        </td>
    </tr>
    <tr>
        <td width="28" style="vertical-align:top;">
            <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">3</div>
        </td>
        <td style="vertical-align:top;padding-left:10px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">${PL.s3t}</p>
            <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">${PL.s3b}</p>
        </td>
    </tr>
    </table>

    <div style="text-align:center;margin:28px 0 0;">
        <a href="${panelUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">
            ${PL.cta}
        </a>
    </div>

    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">${PL.note}</p>
</td></tr>

<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">${PL.footer}</p>
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

// ArgoOne® fusion (B8): the unified $12.99 buyer gets a two-track HUB email —
// (1) share the play link so the child plays, (2) do your own Puente — both from
// the hub. Sent instead of the pack "generate links" email when ONE_UNIFIED_SKU
// is on. Buyer-neutral, tuteo, ArgoOne® wordmark.
async function sendHubEmail(email: string, accessToken: string, lang: string = 'es'): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.warn('[one-webhook] Missing RESEND_API_KEY, skipping hub email'); return; }
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;
    const PL = lang === 'en' ? {
        subject: 'Your ArgoOne® is ready. Two steps, your order',
        badge: 'Purchase confirmed', paid: 'Payment received', nextStep: 'Two steps, in any order',
        s1t: 'Share the link so the child plays', s1b: 'From your panel, copy the link and send it to the adult who will accompany the child. The adventure takes under 10 minutes.',
        s2t: 'Create your own bridge', s2b: 'Answer a short questionnaire about your own style. You get a personalized bridge to connect with the child, included in your purchase.',
        cta: 'Go to my panel',
        note: `Keep this link to come back anytime. You can also go to <a href="${origin}/one/panel" style="color:#955FB5;text-decoration:none;">argomethod.com/one/panel</a> and enter your email.`,
        footer: 'ArgoMethod® · Behavioral profiling for young athletes',
    } : lang === 'pt' ? {
        subject: 'Seu ArgoOne® está pronto. Dois passos, na sua ordem',
        badge: 'Compra confirmada', paid: 'Pagamento recebido', nextStep: 'Dois passos, na ordem que preferir',
        s1t: 'Compartilhe o link para a criança jogar', s1b: 'No seu painel, copie o link e envie ao adulto que vai acompanhar a criança. A aventura leva menos de 10 minutos.',
        s2t: 'Crie a sua própria ponte', s2b: 'Responda um breve questionário sobre o seu próprio estilo. Você recebe uma ponte personalizada para conectar com a criança, incluída na sua compra.',
        cta: 'Ir ao meu painel',
        note: `Guarde este link para voltar quando quiser. Você também pode acessar <a href="${origin}/one/panel" style="color:#955FB5;text-decoration:none;">argomethod.com/one/panel</a> com seu email.`,
        footer: 'ArgoMethod® · Perfilamento comportamental para atletas jovens',
    } : {
        subject: 'Tu ArgoOne® está listo. Dos pasos, en tu orden',
        badge: 'Compra confirmada', paid: 'Pago recibido', nextStep: 'Dos pasos, en el orden que prefieras',
        s1t: 'Comparte el link para que el niño juegue', s1b: 'Desde tu panel, copia el link y envíaselo al adulto que va a acompañar al niño. La aventura toma menos de 10 minutos.',
        s2t: 'Crea tu propio puente', s2b: 'Responde un breve cuestionario sobre tu propio estilo. Obtienes un puente personalizado para conectar con el niño, incluido en tu compra.',
        cta: 'Ir a mi panel',
        note: `Guarda este link para volver cuando quieras. También puedes entrar a <a href="${origin}/one/panel" style="color:#955FB5;text-decoration:none;">argomethod.com/one/panel</a> con tu email.`,
        footer: 'ArgoMethod® · Perfilamiento conductual para deportistas jóvenes',
    };
    const step = (n: string, t: string, b: string) => `
    <tr><td width="28" style="vertical-align:top;padding-bottom:14px;">
        <div style="width:24px;height:24px;border-radius:6px;background:#F5F5F7;border:1px solid #E8E8ED;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#955FB5;">${n}</div>
    </td><td style="vertical-align:top;padding-left:10px;padding-bottom:14px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#1D1D1F;">${t}</p>
        <p style="margin:3px 0 0;font-size:12px;color:#86868B;line-height:1.5;">${b}</p>
    </td></tr>`;
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:#1D1D1F;padding:28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">One</span><span style="font-size:10px;color:#fff;font-weight:300;vertical-align:super;">&reg;</span>
    <p style="margin:14px 0 0;font-size:22px;font-weight:300;color:#fff;letter-spacing:-0.02em;">${PL.badge}</p>
</td></tr>
<tr><td style="padding:28px;">
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#16a34a;">${PL.paid}</p>
    </div>
    <p style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;margin:0 0 14px;">${PL.nextStep}</p>
    <table width="100%" cellpadding="0" cellspacing="0">${step('1', PL.s1t, PL.s1b)}${step('2', PL.s2t, PL.s2b)}</table>
    <div style="text-align:center;margin:28px 0 0;">
        <a href="${panelUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${PL.cta}</a>
    </div>
    <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;text-align:center;">${PL.note}</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:18px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">${PL.footer}</p>
</td></tr>
</table></td></tr></table></body></html>`;
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [email], subject: PL.subject, html }),
    });
}

async function sendUpgradeEmail(email: string, plan: string, rosterLimit: number, lang: string = 'es'): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const planLabel = plan === 'pro' ? 'PRO' : 'Academy';
    const L = lang === 'en' ? {
        subject: `Your ${planLabel} plan on ArgoMethod® is active`,
        heroTitle: 'Your plan is active.',
        badgeLabel: `${planLabel} plan active`,
        badgeBody: `Up to ${rosterLimit} active players. Every feature unlocked.`,
        unlockedLabel: 'What your plan unlocked',
        closing: 'Your dashboard already reflects the unlocked features.',
        cta: 'Go to dashboard',
        footer: 'ArgoMethod® · Behavioral profiling for young athletes',
        features: [
            { label: 'Unlimited AI queries', desc: 'Ask whatever you need about your players, with no limit.' },
            { label: 'Bridge words and words to avoid', desc: 'Key phrases to connect with each profile and the ones that create resistance.' },
            { label: 'Quick guide and per-player checklist', desc: 'Activators, demotivators and a checklist before, during and after the activity.' },
            { label: `Up to ${rosterLimit} active players`, desc: 'Profile and re-profile every 6 months. No usage limits.' },
            { label: 'Unlimited group chemistry with full analysis', desc: 'Coaching tools, pairing suggestions and a simulator.' },
            { label: 'Personalized Behavioral Predictor', desc: 'Guidance tailored to each player profile.' },
        ],
    } : lang === 'pt' ? {
        subject: `Seu plano ${planLabel} no ArgoMethod® está ativo`,
        heroTitle: 'Seu plano está ativo.',
        badgeLabel: `Plano ${planLabel} ativo`,
        badgeBody: `Até ${rosterLimit} jogadores ativos. Todas as funções desbloqueadas.`,
        unlockedLabel: 'O que seu plano desbloqueou',
        closing: 'Seu dashboard já reflete as funções desbloqueadas.',
        cta: 'Ir ao dashboard',
        footer: 'ArgoMethod® · Perfilamento comportamental para atletas jovens',
        features: [
            { label: 'Consultas de IA ilimitadas', desc: 'Pergunte o que precisar sobre seus jogadores, sem restrição.' },
            { label: 'Palavras-ponte e palavras a evitar', desc: 'Frases-chave para conectar com cada perfil e as que geram resistência.' },
            { label: 'Guia rápido e checklist por jogador', desc: 'Ativadores, desmotivadores e um checklist antes, durante e depois da atividade.' },
            { label: `Até ${rosterLimit} jogadores ativos`, desc: 'Perfile e re-perfile a cada 6 meses. Sem limites de uso.' },
            { label: 'Química de grupos ilimitada com análise completa', desc: 'Ferramentas de coaching, sugestões de duplas e simulador.' },
            { label: 'Preditor Comportamental personalizado', desc: 'Orientações adaptadas ao perfil de cada jogador.' },
        ],
    } : {
        subject: `Tu plan ${planLabel} en ArgoMethod® está activo`,
        heroTitle: 'Tu plan está activo.',
        badgeLabel: `Plan ${planLabel} activo`,
        badgeBody: `Hasta ${rosterLimit} jugadores activos. Todas las funcionalidades desbloqueadas.`,
        unlockedLabel: 'Qué se desbloqueó con tu plan',
        closing: 'Tu dashboard ya refleja las funcionalidades desbloqueadas.',
        cta: 'Ir al dashboard',
        footer: 'ArgoMethod® · Perfilamiento conductual para deportistas jóvenes',
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
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">Method®</span>
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
    <p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · Perfilamiento conductual para deportistas jóvenes</p>
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

/* ── ArgoPuente® helpers ────────────────────────────────────────────────── */

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
    const child = args.childName || (args.lang === 'en' ? 'the child' : args.lang === 'pt' ? 'a criança' : 'el niño');
    const subject = args.lang === 'en'
        ? `Your ArgoPuente® is ready. Bond with ${child}`
        : args.lang === 'pt'
            ? `Seu ArgoPuente® está pronto. Vínculo com ${child}`
            : `Tu ArgoPuente® está listo. Vínculo con ${child}`;

    const t = args.lang === 'en' ? {
        headline: 'Your ArgoPuente® is ready',
        body: `You will answer 15 short questions (5 to 7 minutes) about your own style. We will then generate a personalized report with 4 bridges to deepen your bond with ${child} in sport.`,
        cta: 'Start the questionnaire',
        note: 'This link is personal and non-transferable. Save it to come back later.',
    } : args.lang === 'pt' ? {
        headline: 'Seu ArgoPuente® está pronto',
        body: `Você responderá 15 perguntas curtas (5 a 7 minutos) sobre seu próprio estilo. Em seguida geramos um relatório personalizado com 4 pontes para aprofundar o vínculo com ${child} no esporte.`,
        cta: 'Começar o questionário',
        note: 'Este link é pessoal e intransferível. Guarde-o para voltar depois.',
    } : {
        headline: 'Tu ArgoPuente® está listo',
        body: `Vas a responder 15 preguntas cortas (5 a 7 minutos) sobre tu propio estilo. Después generamos un informe personalizado con 4 puentes para profundizar el vínculo con ${child} en el deporte.`,
        cta: 'Empezar el cuestionario',
        note: 'Este link es personal e intransferible. Guárdalo para volver más tarde.',
    };

    const html = `<!DOCTYPE html><html lang="${args.lang}"><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">
<tr><td style="background:#1D1D1F;padding:28px;">
<span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">Puente</span><span style="font-size:10px;color:#fff;font-weight:300;vertical-align:super;">&reg;</span>
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
<p style="font-size:11px;color:#AEAEB2;margin:0;">ArgoMethod® · ArgoPuente®</p>
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
    amountTotalCents?: number | null;
}): Promise<void> {
    const { sb, purchaseId, providerPaymentId, amountTotalCents } = args;
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
        // Reconcile the ACTUAL charged amount (a coupon may have discounted it
        // below the $4.99 recorded at checkout). Only when Stripe reported one.
        ...(typeof amountTotalCents === 'number' ? { amount_cents: amountTotalCents } : {}),
    }).eq('id', purchaseId);

    // Per-child model: one ArgoPuente® purchase creates exactly ONE bridge
    // session, toward the single child it was bought for. The old fan-out that
    // covered every child of this adult email is gone — a $4.99 must not unlock
    // bridges to siblings the buyer never paid for.
    await sb.from('puentes_sessions').insert({
        purchase_id: purchase.id,
        source_session_id: purchase.source_session_id,
        lang: purchase.lang,
        status: 'created' as const,
    });
    console.info(`[one-webhook] puentes purchase ${purchase.id} created 1 session (single-child)`);

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
    payerEmail?: string | null;
}) {
    const { sb, sessionId, providerPaymentId, payerEmail } = args;
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const { data: session } = await sb
        .from('perfilamientos')
        .select('id, full_access, adult_email, child_name, share_token, lang, child_id')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session) {
        console.warn(`[one-webhook] unlock: session ${sessionId} not found`);
        return;
    }
    // Idempotent: full_access is the marker that this unlock was already delivered
    // (report + comp Puente). Webhook retries return early — never re-email.
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

    // ArgoOne® fusion: the unlock is now the unified ArgoOne® ($12.99) — the full
    // report PLUS the buyer's own included Puente (comp), delivered like the combo.
    // Mint the bridge toward this perfilamiento for the payer (once) and email both
    // links. The payer email comes from the checkout; fall back to the session's.
    const payer = String(payerEmail || session.adult_email || '').trim().toLowerCase();
    const lang = (session.lang as string) || 'es';
    const reportUrl = session.share_token
        ? `${origin}/report/${sessionId}?token=${encodeURIComponent(session.share_token)}`
        : `${origin}/report/${sessionId}`;
    if (payer && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer)) {
        // Panel from the purchase (owner decision 2026-07-18): buying ArgoOne®
        // enables the panel immediately. The demo child was created with
        // adult_email only, so (a) claim the child for the payer and (b) mint
        // the adult identity whose access_token IS the panel entry. Without
        // these, /one/panel request-access finds none of its three doors
        // (one_purchases / adult_profiles / children.responsible_adult_email)
        // and silently mails nothing.
        if (session.child_id) {
            await sb.from('children')
                .update({ responsible_adult_email: payer })
                .eq('id', session.child_id)
                .is('responsible_adult_email', null);
        }
        let panelUrl = `${origin}/one/panel`;
        try {
            const esc = payer.replace(/([\\%_])/g, '\\$1');
            const { data: ap } = await sb.from('adult_profiles').select('access_token').ilike('email', esc).maybeSingle();
            let apToken = ap?.access_token as string | undefined;
            if (!apToken) {
                const { data: ins } = await sb.from('adult_profiles')
                    .insert({ email: payer, lang })
                    .select('access_token')
                    .maybeSingle();
                apToken = ins?.access_token as string | undefined;
                if (!apToken) {
                    // Lost the unique-email race → re-read the winner.
                    const { data: again } = await sb.from('adult_profiles').select('access_token').ilike('email', esc).maybeSingle();
                    apToken = again?.access_token as string | undefined;
                }
            }
            if (apToken) panelUrl = `${origin}/one/panel?token=${apToken}`;
        } catch (e) {
            console.warn(`[one-webhook] unlock: adult profile mint failed for ${sessionId}:`, e instanceof Error ? e.message : e);
        }
        let bridgeUrl: string | null = null;
        const { data: existing } = await sb.from('puentes_purchases')
            .select('id, magic_token')
            .ilike('recipient_email', payer)
            .eq('source_session_id', sessionId)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing?.magic_token) {
            bridgeUrl = `${origin}/puentes/${existing.magic_token}`;
        } else if (!existing) {
            const mt = randomBytes(24).toString('base64url');
            const { data: minted, error: pErr } = await sb.from('puentes_purchases').insert({
                source_session_id: sessionId, recipient_email: payer, recipient_name: null,
                child_name: session.child_name, amount_cents: 0, currency: 'USD',
                provider: 'comp', provider_payment_id: `unlock_${sessionId}`, status: 'paid',
                paid_at: new Date().toISOString(), magic_token: mt, lang, source: 'argo_one', tenant_id: null,
            }).select('id').maybeSingle();
            if (!pErr && minted) {
                // The bridge session the questionnaire submits against. Without it
                // puentes-start returns children:[] and the flow dead-ends on the
                // last question — this path emails its own link and never passes
                // through send-email's ensure-session branch (bug found 2026-07-18).
                await sb.from('puentes_sessions').insert({
                    purchase_id: minted.id, source_session_id: sessionId,
                    lang, status: 'created' as const,
                });
                bridgeUrl = `${origin}/puentes/${mt}`;
            }
        }
        const childFirst = (session.child_name || '').trim().split(/\s+/)[0] || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
        const panelLink = (label: string) => `<a href="${panelUrl}" style="color:#955FB5;text-decoration:none;">${label}</a>`;
        const T = lang === 'en'
            ? { s: `${childFirst}'s full report is ready`, h: `${childFirst}'s ArgoOne® report is ready`, b: `Here is the full report${bridgeUrl ? `, and your own bridge with ${childFirst} is ready to build` : ''}.`, c: 'Open the report', c2: 'Create my bridge', n: `One-time purchase. No subscription. Your panel is ready: ${panelLink('open your panel')} or go to argomethod.com/one/panel with your email to find your reports and your bridge anytime.` }
            : lang === 'pt'
            ? { s: `O relatório completo de ${childFirst} está pronto`, h: `O relatório ArgoOne® de ${childFirst} está pronto`, b: `Aqui está o relatório completo${bridgeUrl ? `, e a sua própria ponte com ${childFirst} já pode ser criada` : ''}.`, c: 'Abrir o relatório', c2: 'Criar minha ponte', n: `Compra única. Sem assinatura. Seu painel já está pronto: ${panelLink('abra seu painel')} ou acesse argomethod.com/one/panel com seu email para ver seus relatórios e sua ponte quando quiser.` }
            : { s: `El informe completo de ${childFirst} está listo`, h: `El informe ArgoOne® de ${childFirst} está listo`, b: `Aquí tienes el informe completo${bridgeUrl ? `, y tu propio puente con ${childFirst} ya se puede crear` : ''}.`, c: 'Abrir el informe', c2: 'Crear mi puente', n: `Compra única. Sin suscripción. Tu panel ya está listo: ${panelLink('abre tu panel')} o entra a argomethod.com/one/panel con tu email para ver tus informes y tu puente cuando quieras.` };
        try {
            await sendResendEmail(payer, T.s, reproShellTwo('One', T.h, T.b, T.c, reportUrl, bridgeUrl, T.c2, T.n));
        } catch (e) {
            console.warn(`[one-webhook] unlock: email to payer failed for ${sessionId}:`, e instanceof Error ? e.message : e);
        }
    }
    console.info(`[one-webhook] report unlocked + bridge delivered: ${sessionId} (payment ${providerPaymentId})`);
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

/* ── Fase 3: re-profile paid (ArgoOne® 6-month cycle, behind ONE_REPROFILE) ─── */

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [to], subject, html }),
        });
    } catch (e) { console.warn('[one-webhook] resend send failed (non-blocking):', e); }
}

function reproShell(headerWord: string, heading: string, body: string, cta: string, url: string, note: string): string {
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
  <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">${headerWord}</span><span style="font-size:10px;color:#fff;font-weight:300;vertical-align:super;">&reg;</span>
</td></tr>
<tr><td style="padding:28px;">
  <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 10px;">${heading}</h2>
  <p style="font-size:14px;color:#424245;margin:0 0 22px;line-height:1.6;">${body}</p>
  <div style="text-align:center;"><a href="${url}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">${cta}</a></div>
  <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;line-height:1.6;">${note}</p>
</td></tr></table></td></tr></table></body></html>`;
}

// Same shell, two side-by-side buttons (primary + optional secondary).
function reproShellTwo(headerWord: string, heading: string, body: string, cta1: string, url1: string, url2: string | null, cta2: string, note: string): string {
    const btn = (url: string, label: string, primary: boolean) => `<a href="${url}" style="display:inline-block;background:${primary ? '#955FB5' : '#fff'};color:${primary ? '#fff' : '#1D1D1F'};border:1px solid ${primary ? '#955FB5' : '#E8E8ED'};font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;margin:4px 6px 4px 0;">${label}</a>`;
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
  <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">${headerWord}</span><span style="font-size:10px;color:#fff;font-weight:300;vertical-align:super;">&reg;</span>
</td></tr>
<tr><td style="padding:28px;">
  <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 10px;">${heading}</h2>
  <p style="font-size:14px;color:#424245;margin:0 0 22px;line-height:1.6;">${body}</p>
  <div>${btn(url1, cta1, true)}${url2 ? btn(url2, cta2, false) : ''}</div>
  <p style="font-size:11px;color:#AEAEB2;margin:20px 0 0;line-height:1.6;">${note}</p>
</td></tr></table></td></tr></table></body></html>`;
}

// The re-profile purchase is paid. Decide, from the single source of truth
// (check_reprofile_cooldown), whether the child re-plays or the payer receives
// the current fresh photo — never both. Idempotent via one_purchases.reprofile_status.
async function handleReprofilePaid(args: { sb: any; purchaseId: string; providerPaymentId: string; amountTotalCents?: number | null }): Promise<{ branch: string }> {
    const { sb, purchaseId, providerPaymentId, amountTotalCents } = args;
    const origin = process.env.SITE_URL || 'https://argomethod.com';
    // Reconcile the ACTUAL charged amount (a coupon may have discounted the
    // reprofile below its recorded price). Spread into each terminal update.
    const amountPatch = typeof amountTotalCents === 'number' ? { amount_cents: amountTotalCents } : {};

    const { data: purchase } = await sb
        .from('one_purchases')
        .select('id, email, lang, child_id, includes_puente, reprofile_status')
        .eq('id', purchaseId)
        .maybeSingle();
    if (!purchase || !purchase.child_id) return { branch: 'no_child' };
    if (purchase.reprofile_status && purchase.reprofile_status !== 'pending_payment') {
        return { branch: 'already_' + purchase.reprofile_status };
    }

    const lang = (purchase.lang as string) || 'es';
    const payer = String(purchase.email || '').trim().toLowerCase();

    const { data: child } = await sb
        .from('children')
        .select('id, child_name, child_age, responsible_adult_email, adult_name, lang')
        .eq('id', purchase.child_id)
        .is('deleted_at', null)
        .maybeSingle();
    if (!child) return { branch: 'child_gone' };
    let responsible = String(child.responsible_adult_email || '').trim().toLowerCase();
    const childFirst = (child.child_name || '').trim().split(/\s+/)[0] || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');

    // Single source of truth for the 6-month decision.
    const { data: cd, error: cdErr } = await sb.rpc('check_reprofile_cooldown', { p_child_id: purchase.child_id });
    if (cdErr) { console.error('[one-webhook] reprofile cooldown RPC error:', cdErr.message); return { branch: 'cooldown_error' }; }
    const expired = !cd || cd.allowed !== false; // allowed=true (or null) → ≥6mo → re-play

    if (!expired) {
        // ── FRESH photo: the child does NOT re-play. Deliver the current report to
        //    the payer + their own included puente. ──
        const { data: perf } = await sb
            .from('perfilamientos')
            .select('id, share_token')
            .eq('child_id', purchase.child_id)
            .eq('status', 'resolved')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        const reportUrl = perf?.share_token ? `${origin}/report/${perf.id}?token=${perf.share_token}` : `${origin}/one/panel`;

        // The payer's included puente (comp) toward the CURRENT perfilamiento.
        let bridgeUrl: string | null = null;
        if (purchase.includes_puente && perf?.id && payer) {
            const { data: exists } = await sb.from('puentes_purchases').select('id, magic_token')
                .ilike('recipient_email', payer).eq('source_session_id', perf.id).eq('status', 'paid').maybeSingle();
            if (exists?.magic_token) {
                bridgeUrl = `${origin}/puentes/${exists.magic_token}`;
            } else if (!exists) {
                const mt = randomBytes(24).toString('base64url');
                const { data: minted, error: mintErr } = await sb.from('puentes_purchases').insert({
                    source_session_id: perf.id, recipient_email: payer, recipient_name: null, child_name: child.child_name,
                    amount_cents: 0, currency: 'USD', provider: 'comp', provider_payment_id: `reprofile_${purchaseId}`,
                    status: 'paid', paid_at: new Date().toISOString(), magic_token: mt,
                    lang, source: 'argo_one', tenant_id: null,
                }).select('id').maybeSingle();
                if (!mintErr && minted) {
                    // Same dead-end guard as the unlock path: this comp purchase
                    // emails its own bridge link, so its session must be minted here.
                    await sb.from('puentes_sessions').insert({
                        purchase_id: minted.id, source_session_id: perf.id,
                        lang, status: 'created' as const,
                    });
                    bridgeUrl = `${origin}/puentes/${mt}`;
                }
            }
        }

        const T = lang === 'en' ? { s: `${childFirst}'s profile is still current`, h: `${childFirst}'s profile is still current`, b: `Another adult refreshed ${childFirst}'s profile recently, so there's no need to play again yet. Here is the current report${bridgeUrl ? ', and your own bridge is ready to build' : ''}.`, c: 'Open the report', c2: 'Create my bridge', n: 'The profile refreshes every 6 months.' }
            : lang === 'pt' ? { s: `O perfil de ${childFirst} ainda está atual`, h: `O perfil de ${childFirst} ainda está atual`, b: `Outro adulto atualizou o perfil de ${childFirst} recentemente, então não é preciso jogar de novo por enquanto. Aqui está o relatório atual${bridgeUrl ? ', e a sua própria ponte já pode ser criada' : ''}.`, c: 'Abrir o relatório', c2: 'Criar minha ponte', n: 'O perfil se atualiza a cada 6 meses.' }
            : { s: `El perfil de ${childFirst} sigue vigente`, h: `El perfil de ${childFirst} sigue vigente`, b: `Otro adulto actualizó el perfil de ${childFirst} hace poco, así que no hace falta volver a jugar por ahora. Aquí tienes el informe actual${bridgeUrl ? ', y tu propio puente ya se puede crear' : ''}.`, c: 'Abrir el informe', c2: 'Crear mi puente', n: 'El perfil se actualiza cada 6 meses.' };
        if (payer) await sendResendEmail(payer, T.s, reproShellTwo('One', T.h, T.b, T.c, reportUrl, bridgeUrl, (T as { c2?: string }).c2 || '', T.n));

        await sb.from('one_purchases').update({ payment_status: 'paid', payment_id: providerPaymentId, paid_at: new Date().toISOString(), reprofile_status: 'fresh_delivered', ...amountPatch }).eq('id', purchaseId);
        return { branch: 'fresh_delivered' };
    }

    // ── EXPIRED: the child re-plays. Mint a replay slot + email the IMMUTABLE
    //    responsible adult for authorization (never an address the payer chose). ──
    if (!responsible) {
        if (payer) {
            // No authorizer on record (a legacy pre-fusion child carries NULL
            // responsible_adult_email). The payer already cleared the checkout
            // authorization gate (isResponsible || isBuyer) and is a real adult
            // who explicitly paid, so adopt them as the immutable responsible
            // adult instead of stranding the money. Backfill the child so future
            // cycles are clean. Then fall through to the normal authorize+play path.
            responsible = payer;
            await sb.from('children')
                .update({ responsible_adult_email: payer })
                .eq('id', purchase.child_id)
                .is('responsible_adult_email', null);
        } else {
            // Truly no email anywhere (should be unreachable — checkout requires a
            // payer email). Hold the purchase and alert; no automatic refund.
            await sb.from('one_purchases').update({ payment_status: 'paid', payment_id: providerPaymentId, paid_at: new Date().toISOString(), reprofile_status: 'no_authorizer', ...amountPatch }).eq('id', purchaseId);
            await alertOwner('[Argo] Re-perfilado sin adulto autorizante', `La compra ${purchaseId} (niño ${purchase.child_id}) no tiene responsible_adult_email ni email del pagador. Queda en espera; sin reembolso automático.`);
            return { branch: 'no_authorizer' };
        }
    }

    // Per-child idempotency (backstop to the checkout dedup + Stripe retries): if
    // an authorization is already in flight for this child (a non-completed replay
    // slot bound to a paid reprofile purchase), do NOT mint a second slot/consent/
    // email. The child re-plays ONCE; this purchase just waits on the same
    // authorization. (Its own included puente is still delivered at completion via
    // the payer's is_buyer link, and — if it never completes — no double-play.)
    {
        const { data: openSlots } = await sb.from('one_links')
            .select('id, purchase_id')
            .eq('child_id', purchase.child_id)
            .neq('status', 'completed');
        for (const s of openSlots ?? []) {
            if (s.purchase_id === purchaseId) continue;
            const { data: sp } = await sb.from('one_purchases').select('kind, payment_status').eq('id', s.purchase_id).maybeSingle();
            if (sp?.kind === 'reprofile' && sp?.payment_status === 'paid') {
                await sb.from('one_purchases').update({ payment_status: 'paid', payment_id: providerPaymentId, paid_at: new Date().toISOString(), reprofile_status: 'awaiting_auth', ...amountPatch }).eq('id', purchaseId);
                return { branch: 'awaiting_auth_shared' };
            }
        }
    }

    const slug = randomBytes(9).toString('hex');
    const { data: slot } = await sb.from('one_links')
        .insert({ purchase_id: purchaseId, child_id: purchase.child_id, status: 'available', slug })
        .select('id, slug')
        .single();
    if (!slot) { console.error('[one-webhook] reprofile slot insert failed'); return { branch: 'slot_error' }; }

    // Authorization record (works for any age; COPPA is enforced at play only for
    // <13). 14-day TTL (owner-approved), not the 24h consent default.
    const token = randomBytes(16).toString('hex');
    await sb.from('parental_consents').insert({
        token,
        adult_name: child.adult_name || '',
        adult_email: responsible,
        child_name: child.child_name,
        child_age: child.child_age,
        flow_type: 'one',
        one_link_id: slot.id,
        lang,
        status: 'pending',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const authUrl = `${origin}/consent/${token}`;
    const A = lang === 'en' ? { s: `Authorize ${childFirst}'s new profile`, h: `Time to refresh ${childFirst}'s profile`, b: `Someone requested a new profile for ${childFirst}. As the responsible adult, your authorization is needed. Whoever paid for this will receive ${childFirst}'s individual report and will build their bridge report from that profile. Tap to authorize, then hand the device to ${childFirst} to play.`, c: `Authorize and play`, n: 'This link is valid for 14 days.' }
        : lang === 'pt' ? { s: `Autorize o novo perfil de ${childFirst}`, h: `Hora de atualizar o perfil de ${childFirst}`, b: `Alguém solicitou um novo perfil para ${childFirst}. Como adulto responsável, é necessária a sua autorização. Quem pagou receberá o relatório individual de ${childFirst} e criará o seu relatório de ponte a partir desse perfil. Toque para autorizar e passe o dispositivo para ${childFirst} jogar.`, c: 'Autorizar e jogar', n: 'Este link é válido por 14 dias.' }
        : { s: `Autoriza el nuevo perfil de ${childFirst}`, h: `Es momento de actualizar el perfil de ${childFirst}`, b: `Alguien solicitó un nuevo perfil para ${childFirst}. Como adulto responsable, hace falta tu autorización. Quien lo pagó recibirá el informe individual de ${childFirst} y generará su informe puente basado en ese perfil. Toca para autorizar y pásale el dispositivo a ${childFirst} para que juegue.`, c: 'Autorizar y jugar', n: 'Este enlace es válido por 14 días.' };
    await sendResendEmail(responsible, A.s, reproShell('One', A.h, A.b, A.c, authUrl, A.n));

    await sb.from('one_purchases').update({ payment_status: 'paid', payment_id: providerPaymentId, paid_at: new Date().toISOString(), reprofile_status: 'awaiting_auth', ...amountPatch }).eq('id', purchaseId);
    return { branch: 'awaiting_auth' };
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

    // ArgoPuente® payment
    if (source === 'argo_puentes') {
        const puentesPurchaseId = session.metadata?.purchase_id;
        if (!puentesPurchaseId) return res.status(200).json({ received: true, ignored: true, reason: 'missing puentes purchase_id' });
        await handlePuentesPaid({ sb, purchaseId: puentesPurchaseId, providerPaymentId: session.id, amountTotalCents: typeof session.amount_total === 'number' ? session.amount_total : null });
        return res.status(200).json({ received: true, kind: 'puentes', purchase_id: puentesPurchaseId });
    }

    // Demo report unlock payment
    if (source === 'unlock') {
        const unlockSessionId = session.metadata?.session_id;
        if (!unlockSessionId) return res.status(200).json({ received: true, ignored: true, reason: 'missing unlock session_id' });
        await handleUnlockPaid({ sb, sessionId: unlockSessionId, providerPaymentId: session.id, payerEmail: session.customer_email || session.customer_details?.email || null });
        return res.status(200).json({ received: true, kind: 'unlock', session_id: unlockSessionId });
    }

    // ArgoOne® payment
    const purchaseId = session?.metadata?.purchase_id;
    if (!purchaseId || source !== 'argo_one') {
        return res.status(200).json({ received: true, ignored: true });
    }

    const { data: existing } = await sb
        .from('one_purchases')
        .select('id, payment_status, email, pack_size, access_token, lang, kind')
        .eq('id', purchaseId)
        .single();

    if (!existing) return res.status(404).json({ error: 'Purchase not found' });
    if (existing.payment_status === 'paid') return res.status(200).json({ received: true, already_processed: true });

    // ── Fase 3: a re-profile purchase branches (fresh photo vs authorize+play);
    //    it never sends the first-play hub/confirmation email. Gate on the DURABLE
    //    kind (a kind='reprofile' row can only exist if ONE_REPROFILE was on at
    //    checkout), NOT the runtime flag — so a flag flip between checkout and this
    //    webhook can't misroute a paid re-profile into the first-play handler. ──
    if (existing.kind === 'reprofile') {
        const r = await handleReprofilePaid({ sb, purchaseId, providerPaymentId: session.id, amountTotalCents: typeof session.amount_total === 'number' ? session.amount_total : null });
        await logActivity(sb, { area: 'ventas', action: 'reprofile_paid', sourceType: 'webhook', severity: 'sano', resourceType: 'one_purchase', resourceId: String(purchaseId), reason: { provider: 'stripe', branch: r.branch, payment_id: session.id } });
        console.info(`[one-webhook] Stripe: reprofile purchase ${purchaseId} → ${r.branch}`);
        return res.status(200).json({ received: true, purchase_id: purchaseId, reprofile: r.branch });
    }

    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: session.id,
        paid_at: new Date().toISOString(),
        // Reconcile the ACTUAL charged amount (a coupon may have discounted it
        // below the amount recorded at checkout). Only when Stripe reported one.
        ...(typeof session.amount_total === 'number' ? { amount_cents: session.amount_total } : {}),
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

    // Unified $12.99 buyer → two-track HUB email; legacy pack → pack email.
    if (process.env.ONE_UNIFIED_SKU === 'on') {
        await sendHubEmail(existing.email, existing.access_token, existing.lang);
    } else {
        await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size, existing.lang);
    }

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

    // ── ArgoOne® payment events ─────────────────────────────────────────
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

    // ArgoPuente®: external_reference prefixed with "puentes_"
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
        .select('id, payment_status, email, pack_size, access_token, lang, kind')
        .eq('id', purchaseId)
        .single();

    if (!existing) return res.status(404).json({ error: 'Purchase not found' });
    if (existing.payment_status === 'paid') return res.status(200).json({ received: true, already_processed: true });

    // Defensive: re-profile checkout is Stripe-only, so a reprofile purchase should
    // never settle via MercadoPago. If one ever did, route it to the same durable
    // branch rather than the first-play hub email (which would strand the buyer).
    if (existing.kind === 'reprofile') {
        const r = await handleReprofilePaid({ sb, purchaseId, providerPaymentId: String(resourceId) });
        console.info(`[one-webhook] MP: reprofile purchase ${purchaseId} → ${r.branch}`);
        return res.status(200).json({ received: true, purchase_id: purchaseId, reprofile: r.branch });
    }

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

    // Unified $12.99 buyer → two-track HUB email; legacy pack → pack email.
    if (process.env.ONE_UNIFIED_SKU === 'on') {
        await sendHubEmail(existing.email, existing.access_token, existing.lang);
    } else {
        await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size, existing.lang);
    }

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
