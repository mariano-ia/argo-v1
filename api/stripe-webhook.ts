import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Credit packs — same as create-checkout.ts (single source of truth)
const CREDIT_PACKS: Record<string, { credits: number }> = {
    starter: { credits: 10 },
    team:    { credits: 30 },
    club:    { credits: 100 },
};

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
        const packId = session.metadata?.pack_id ?? 'unknown';

        if (!tenantId) {
            console.error('[stripe-webhook] Missing tenant_id in metadata');
            return res.status(400).json({ error: 'Missing metadata' });
        }

        // Revalidate credits from pack definition — don't trust metadata.credits
        const pack = CREDIT_PACKS[packId];
        if (!pack) {
            console.error('[stripe-webhook] Unknown pack_id:', packId);
            return res.status(400).json({ error: 'Invalid pack' });
        }

        const sb = createClient(supabaseUrl, serviceKey);

        // Idempotency: check if this event was already processed
        const { data: existing } = await sb
            .from('credit_transactions')
            .select('id')
            .eq('stripe_event_id', event.id)
            .maybeSingle();

        if (existing) {
            console.info(`[stripe-webhook] Event ${event.id} already processed, skipping`);
            return res.status(200).json({ received: true, duplicate: true });
        }

        // Atomic credit increment via RPC
        const { data, error: rpcError } = await sb.rpc('add_credits', {
            p_tenant_id: tenantId,
            p_credits: pack.credits,
            p_stripe_event_id: event.id,
            p_pack_id: packId,
        });

        if (rpcError) {
            console.error('[stripe-webhook] Credit update failed:', rpcError.message);
            return res.status(500).json({ error: 'Failed to update credits' });
        }

        console.info(`[stripe-webhook] Credited ${pack.credits} to tenant ${tenantId} (pack: ${packId}, new total: ${data?.new_credits ?? '?'})`);
    }

    return res.status(200).json({ received: true });
}
