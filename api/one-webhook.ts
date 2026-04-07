import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

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

async function sendUpgradeEmail(email: string, plan: string, rosterLimit: number): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const origin = process.env.SITE_URL || 'https://argomethod.com';
    const planLabel = plan === 'pro' ? 'PRO' : 'Academy';
    const features = [
        { label: 'Consultas IA ilimitadas', desc: 'Pregunta lo que necesites sobre tus jugadores sin restricción.' },
        { label: 'Palabras puente y palabras a evitar', desc: 'Frases clave para conectar con cada perfil y las que generan resistencia.' },
        { label: 'Guía rápida y checklist por jugador', desc: 'Activadores, desmotivadores y un checklist antes, durante y después del entrenamiento.' },
        { label: `Hasta ${rosterLimit} jugadores activos`, desc: 'Perfila y re-perfila cada 6 meses. Sin créditos, sin límites de uso.' },
        { label: 'Formaciones ilimitadas con análisis completo', desc: 'Herramientas de coaching, sugerencias de duplas y simulador.' },
        { label: 'Guía situacional personalizada', desc: 'Orientaciones adaptadas al perfil de cada jugador.' },
    ];

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
    <p style="margin:16px 0 0;font-size:24px;font-weight:300;color:#fff;letter-spacing:-0.02em;">Tu plan está activo.</p>
</td></tr>

<tr><td style="padding:28px;">
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#16a34a;">Plan ${planLabel} activo</p>
        <p style="margin:4px 0 0;font-size:12px;color:#86868B;">Hasta ${rosterLimit} jugadores activos. Todas las funcionalidades desbloqueadas.</p>
    </div>

    <p style="margin:0 0 16px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">Qué se desbloqueó con tu plan</p>

    <table width="100%" cellpadding="0" cellspacing="0">
        ${featureRows}
    </table>

    <div style="text-align:center;margin:24px 0 0;">
        <p style="margin:0 0 16px;font-size:13px;color:#86868B;">Tu dashboard ya refleja las funcionalidades desbloqueadas.</p>
        <a href="${origin}/dashboard" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">
            Ir al dashboard
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
            subject: `Tu plan ${planLabel} en Argo Method está activo`,
            html,
        }),
    });
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

async function handleStripe(req: VercelRequest, res: VercelResponse, sb: ReturnType<typeof createClient>) {
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
        return handleSubscription(session, 'stripe', res, sb);
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

    await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size);

    console.info(`[one-webhook] Stripe: Purchase ${purchaseId} marked as paid (${existing.pack_size} pack)`);
    return res.status(200).json({ received: true, purchase_id: purchaseId });
}

/* ── MercadoPago handler ─────────────────────────────────────────────────── */

async function handleMercadoPago(req: VercelRequest, res: VercelResponse, sb: ReturnType<typeof createClient>, topic: string) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) return res.status(500).json({ error: 'Missing MP token' });

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
            const { data: tenant } = await sb.from('tenants').select('auth_user_id').eq('id', tenantId).maybeSingle();
            if (tenant?.auth_user_id) {
                const { data: { user } } = await sb.auth.admin.getUserById(tenant.auth_user_id);
                if (user?.email) {
                    await sendUpgradeEmail(user.email, plan, config.roster_limit);
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
        } else if (preapproval.status === 'paused') {
            console.info(`[one-webhook] MP subscription paused: tenant ${tenantId}`);
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

    const purchaseId = payment.external_reference || payment.metadata?.purchase_id;
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

    await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size);

    console.info(`[one-webhook] MP: Purchase ${purchaseId} marked as paid (${existing.pack_size} pack)`);
    return res.status(200).json({ received: true, purchase_id: purchaseId });
}

/* ── Subscription handler (shared for Stripe checkout.session.completed) ── */

async function handleSubscription(
    session: { id: string; metadata: Record<string, string>; subscription?: string; customer_email?: string },
    provider: 'stripe' | 'mercadopago',
    res: VercelResponse,
    sb: ReturnType<typeof createClient>,
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

    const email = session.customer_email;
    if (email) {
        await sendUpgradeEmail(email, plan, config.roster_limit);
    }

    console.info(`[one-webhook] Subscription (${provider}): Tenant ${tenantId} upgraded to ${plan} (roster: ${config.roster_limit})`);
    return res.status(200).json({ received: true, tenant_id: tenantId, plan });
}
