import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Disable Vercel's default body parsing so we can read the raw body for Stripe signature verification
export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!stripeKey || !webhookSecret || !serviceKey || !supabaseUrl) {
        console.error('[stripe-webhook] Missing env vars');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const stripe = new Stripe(stripeKey);

    // Read raw body for signature verification
    let event: Stripe.Event;
    try {
        const rawBody = await buffer(req);
        const signature = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[stripe-webhook] Signature verification failed:', msg);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenant_id;
        const credits = parseInt(session.metadata?.credits ?? '0', 10);
        const packId = session.metadata?.pack_id ?? 'unknown';

        if (!tenantId || credits <= 0) {
            console.error('[stripe-webhook] Missing metadata:', { tenantId, credits });
            return res.status(400).json({ error: 'Missing metadata' });
        }

        const sb = createClient(supabaseUrl, serviceKey);

        // Fetch current credits and increment
        const { data: tenant, error: fetchErr } = await sb
            .from('tenants')
            .select('credits_remaining')
            .eq('id', tenantId)
            .single();

        if (fetchErr || !tenant) {
            console.error('[stripe-webhook] Tenant not found:', tenantId);
            return res.status(404).json({ error: 'Tenant not found' });
        }

        const newCredits = tenant.credits_remaining + credits;
        const { error: updateErr } = await sb
            .from('tenants')
            .update({ credits_remaining: newCredits })
            .eq('id', tenantId);

        if (updateErr) {
            console.error('[stripe-webhook] Credit update failed:', updateErr.message);
            return res.status(500).json({ error: 'Failed to update credits' });
        }

        console.info(`[stripe-webhook] Credited ${credits} to tenant ${tenantId} (pack: ${packId}, new total: ${newCredits})`);
    }

    return res.status(200).json({ received: true });
}
