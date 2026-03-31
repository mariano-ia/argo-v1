import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

/**
 * POST /api/one-webhook
 * Handles payment confirmation from Stripe and MercadoPago.
 *
 * Stripe: sends checkout.session.completed event
 * MercadoPago: sends IPN notification (topic=payment)
 *
 * On success: marks purchase as paid, sends confirmation email with panel link.
 */

async function sendConfirmationEmail(
    email: string,
    accessToken: string,
    packSize: number,
): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.warn('[one-webhook] Missing RESEND_API_KEY, skipping email'); return; }

    const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://argomethod.com';
    const panelUrl = `${origin}/one/panel?token=${accessToken}`;

    const subject = packSize === 1
        ? 'Tu informe Argo One está listo para usar'
        : `Tus ${packSize} informes Argo One están listos para usar`;

    const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;"> Method</span>
    <span style="background:#955FB5;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;">ONE</span>
</td></tr>
<tr><td style="padding:28px;">
    <h2 style="font-size:20px;font-weight:300;color:#1D1D1F;margin:0 0 8px;">Compra confirmada</h2>
    <p style="font-size:14px;color:#86868B;margin:0 0 24px;">${packSize === 1 ? 'Tu informe está listo para usar.' : `Tus ${packSize} informes están listos para usar.`}</p>
    <a href="${panelUrl}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
        Ir a mis informes
    </a>
    <p style="font-size:12px;color:#AEAEB2;margin:20px 0 0;">Este link es personal. Guárdalo para acceder a tus informes cuando quieras.</p>
</td></tr>
<tr><td style="background:#F5F5F7;padding:16px 28px;text-align:center;border-top:1px solid #E8E8ED;">
    <p style="font-size:11px;color:#AEAEB2;margin:0;">Argo Method</p>
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        // ── Detect provider from request ────────────────────────────────
        const isStripe = req.headers['stripe-signature'];
        const isMPTopic = req.query.topic || req.body?.topic || req.body?.type;

        if (isStripe) {
            return handleStripe(req, res, sb);
        } else if (isMPTopic) {
            return handleMercadoPago(req, res, sb);
        }

        return res.status(400).json({ error: 'Unknown webhook source' });
    } catch (err) {
        console.error('[one-webhook] Error:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}

// ── Stripe handler ──────────────────────────────────────────────────────────

async function handleStripe(req: VercelRequest, res: VercelResponse, sb: ReturnType<typeof createClient>) {
    // Verify Stripe webhook signature
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'] as string;

    if (whSecret && sig) {
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const parts = Object.fromEntries(sig.split(',').map(p => { const [k, v] = p.split('='); return [k, v]; }));
        const signedPayload = `${parts.t}.${rawBody}`;
        const expected = createHmac('sha256', whSecret).update(signedPayload).digest('hex');
        if (expected !== parts.v1) {
            console.error('[one-webhook] Invalid Stripe signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }
    }

    const event = req.body;

    if (event.type !== 'checkout.session.completed') {
        return res.status(200).json({ received: true, ignored: true });
    }

    const session = event.data?.object;
    const purchaseId = session?.metadata?.purchase_id;

    if (!purchaseId || session?.metadata?.source !== 'argo_one') {
        return res.status(200).json({ received: true, ignored: true });
    }

    // Idempotency: check if already processed
    const { data: existing } = await sb
        .from('one_purchases')
        .select('id, payment_status, email, pack_size, access_token')
        .eq('id', purchaseId)
        .single();

    if (!existing) return res.status(404).json({ error: 'Purchase not found' });
    if (existing.payment_status === 'paid') return res.status(200).json({ received: true, already_processed: true });

    // Mark as paid
    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: session.id,
        paid_at: new Date().toISOString(),
    }).eq('id', purchaseId);

    // Send confirmation email
    await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size);

    console.info(`[one-webhook] Stripe: Purchase ${purchaseId} marked as paid (${existing.pack_size} pack)`);
    return res.status(200).json({ received: true, purchase_id: purchaseId });
}

// ── MercadoPago handler ─────────────────────────────────────────────────────

async function handleMercadoPago(req: VercelRequest, res: VercelResponse, sb: ReturnType<typeof createClient>) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) return res.status(500).json({ error: 'Missing MP token' });

    // MP sends different notification types
    const topic = req.query.topic || req.body?.topic || req.body?.type;
    const resourceId = req.query.id || req.body?.data?.id;

    if (topic !== 'payment' && topic !== 'payment.created' && topic !== 'payment.updated') {
        return res.status(200).json({ received: true, ignored: true });
    }

    if (!resourceId) return res.status(400).json({ error: 'Missing resource id' });

    // Fetch payment details from MP API
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

    // Idempotency check
    const { data: existing } = await sb
        .from('one_purchases')
        .select('id, payment_status, email, pack_size, access_token')
        .eq('id', purchaseId)
        .single();

    if (!existing) return res.status(404).json({ error: 'Purchase not found' });
    if (existing.payment_status === 'paid') return res.status(200).json({ received: true, already_processed: true });

    // Mark as paid
    await sb.from('one_purchases').update({
        payment_status: 'paid',
        payment_id: String(resourceId),
        paid_at: new Date().toISOString(),
    }).eq('id', purchaseId);

    // Send confirmation email
    await sendConfirmationEmail(existing.email, existing.access_token, existing.pack_size);

    console.info(`[one-webhook] MP: Purchase ${purchaseId} marked as paid (${existing.pack_size} pack)`);
    return res.status(200).json({ received: true, purchase_id: purchaseId });
}
