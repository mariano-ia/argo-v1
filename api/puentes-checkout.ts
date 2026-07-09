import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * POST /api/puentes-checkout
 * Body: { source_session_id, recipient_email, recipient_name?, lang?, consent_given }
 * Returns: { checkout_url, purchase_id, provider, currency }
 *
 * Creates an ArgoPuente® add-on purchase ($4.99 USD, Stripe only) toward a
 * single already-played child.
 *
 * Access gate: the $4.99 is available only to the child's responsible adult
 * (recipient_email must match the source perfilamiento's adult_email). Without
 * it, anyone who knows a perfilamiento id could buy a bridge and read that
 * child's individual report. This is the interim relationship gate; the full
 * invitation model (one authorized adult inviting another) lands with
 * PUENTES_ADDON_V2.
 */

const PRICE_USD_CENTS = 499;          // $4.99 USD (ArgoPuente® add-on)

function genMagicToken(): string {
    return crypto.randomBytes(24).toString('base64url');
}

function normEmail(s?: string | null): string {
    return (s || '').trim().toLowerCase();
}

/* ── Stripe checkout ─────────────────────────────────────────────────────── */

async function createStripeCheckout(args: {
    email: string;
    childName: string;
    purchaseId: string;
    lang: string;
}): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

    // On Vercel previews, success/cancel URLs must redirect back to the
    // preview deploy (which is the only place puentes routes exist outside
    // of production). In production, use the public argomethod.com domain.
    const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com');
    const productLabel = args.lang === 'en'
        ? `ArgoPuente®: bond with ${args.childName}`
        : args.lang === 'pt'
            ? `ArgoPuente®: vínculo com ${args.childName}`
            : `ArgoPuente®: vínculo con ${args.childName}`;

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            mode: 'payment',
            customer_email: args.email,
            // Disable Stripe Link (the email-code auto-fill flow) — only card.
            'payment_method_types[0]': 'card',
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][unit_amount]': String(PRICE_USD_CENTS),
            'line_items[0][price_data][product_data][name]': productLabel,
            'line_items[0][quantity]': '1',
            'metadata[purchase_id]': args.purchaseId,
            'metadata[source]': 'argo_puentes',
            success_url: `${origin}/puentes/checkout/success?purchase_id=${args.purchaseId}`,
            cancel_url: `${origin}/puentes/checkout/cancel`,
        }).toString(),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[puentes-checkout] Stripe error:', err);
        throw new Error(`Stripe error: ${err}`);
    }
    const session = await res.json();
    return session.url;
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const {
            source_session_id,
            recipient_email,
            recipient_name,
            lang,
            consent_given,
            invite_token,
        } = req.body as {
            source_session_id?: string;
            recipient_email?: string;
            recipient_name?: string;
            lang?: string;
            consent_given?: boolean;
            // ArgoOne fusion (B13): an accepted bridge-invite authorizes an adult
            // OTHER than the responsible one (e.g. a grandparent) to buy the $4.99
            // add-on. The invite IS the authorization (R1), replacing the email gate.
            invite_token?: string;
        };

        if (!source_session_id || !recipient_email) {
            return res.status(400).json({ error: 'Missing source_session_id or recipient_email' });
        }
        if (!consent_given) {
            return res.status(400).json({ error: 'Consent required' });
        }

        // Look up source perfilamiento: child name, lang fallback, tenant_id, and
        // the responsible adult's email (for the relationship gate below).
        const { data: srcSession, error: srcErr } = await sb
            .from('perfilamientos')
            .select('id, lang, tenant_id, child_name, adult_email')
            .eq('id', source_session_id)
            .maybeSingle();
        if (srcErr || !srcSession) return res.status(404).json({ error: 'Source session not found' });

        // ── Authorization (R1/R2/R5) ────────────────────────────────────────
        // Path A (invite): behind PUENTES_ADDON_V2, a valid pending/accepted
        // bridge-invite toward THIS perfilamiento, addressed to THIS recipient,
        // authorizes the buy (the responsible adult already vouched by inviting).
        // Path B (fallback, unchanged): only the child's responsible adult
        // (recipient_email == the source perfilamiento's adult_email) may buy.
        // Honor the invite bypass whenever the hub that CREATES invites is live
        // (VITE_BRIDGES_V2) OR the dedicated add-on flag is on. Coupling them means
        // an invite is never emailed without the checkout able to honor it, so a
        // legitimately-invited adult can't be stranded on a 403 during a partial
        // rollout. (VITE_ vars are readable from process.env on Vercel functions.)
        const inviteFlagOn = process.env.PUENTES_ADDON_V2 === 'on'
            || ['1', 'on', 'true'].includes((process.env.VITE_BRIDGES_V2 || '').trim().toLowerCase());
        let inviteRow: { id: string } | null = null;
        if (inviteFlagOn && invite_token) {
            const { data: inv } = await sb
                .from('bridge_invites')
                .select('id, invited_email, status, expires_at')
                .eq('token', invite_token)
                .eq('perfilamiento_id', source_session_id)
                .maybeSingle();
            const fresh = inv && (!inv.expires_at || new Date(inv.expires_at) > new Date());
            const open = inv && (inv.status === 'pending' || inv.status === 'accepted');
            if (inv && fresh && open && normEmail(inv.invited_email) === normEmail(recipient_email)) {
                inviteRow = { id: inv.id };
            }
        }
        if (!inviteRow) {
            if (!srcSession.adult_email || normEmail(recipient_email) !== normEmail(srcSession.adult_email)) {
                return res.status(403).json({
                    error: 'not_authorized',
                    detail: "The ArgoPuente® add-on is only available to the child's responsible adult or an invited adult.",
                });
            }
        }

        // Block double-purchase for THIS child only (per recipient_email x
        // source_session_id). A paid bridge toward a different child is unaffected;
        // the old "one purchase covers all their children" fan-out is gone.
        const { data: existing } = await sb
            .from('puentes_purchases')
            .select('id, magic_token')
            .eq('recipient_email', recipient_email)
            .eq('source_session_id', source_session_id)
            .eq('status', 'paid')
            .maybeSingle();
        if (existing) {
            const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com');
            return res.status(409).json({
                error: 'already_purchased',
                detail: 'This adult already has an active ArgoPuente® toward this child.',
                existing_magic_link: `${origin}/puentes/${existing.magic_token}`,
            });
        }

        const childName = srcSession.child_name || '';
        const magicToken = genMagicToken();
        const finalLang = (lang || srcSession.lang || 'es') as string;

        // Create pending purchase (Stripe USD only — Fase 0 STRIPE_ONLY, no
        // MercadoPago/ARS path).
        const { data: purchase, error: insErr } = await sb
            .from('puentes_purchases')
            .insert({
                source_session_id,
                recipient_email,
                recipient_name: recipient_name ?? null,
                child_name: childName,
                amount_cents: PRICE_USD_CENTS,
                currency: 'USD',
                provider: 'stripe',
                status: 'pending',
                magic_token: magicToken,
                lang: finalLang,
                source: srcSession.tenant_id ? 'tenant' : 'argo_one',
                tenant_id: srcSession.tenant_id ?? null,
            })
            .select('id')
            .single();
        if (insErr || !purchase) {
            console.error('[puentes-checkout] Insert error:', insErr?.message);
            return res.status(500).json({ error: 'Failed to create purchase' });
        }

        // Mark the invite accepted (best-effort): the invitee engaged and reached
        // checkout. Payment confirmation (status=paid + the puentes_session) is
        // handled by the webhook; this flag is only the responsible adult's
        // progress signal, not proof of payment.
        if (inviteRow) {
            await sb.from('bridge_invites').update({ status: 'accepted' }).eq('id', inviteRow.id);
        }

        const checkoutUrl = await createStripeCheckout({
            email: recipient_email,
            childName,
            purchaseId: purchase.id,
            lang: finalLang,
        });

        return res.status(200).json({
            checkout_url: checkoutUrl,
            purchase_id: purchase.id,
            provider: 'stripe',
            currency: 'USD',
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[puentes-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout session', detail: msg });
    }
}
