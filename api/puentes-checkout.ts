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

// Escape LIKE metacharacters so an email containing % or _ can't widen an
// ilike match beyond the exact (case-insensitive) address.
function likeEscape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function clientIp(req: VercelRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : (fwd ?? '');
    return raw.split(',')[0].trim() || 'unknown';
}

// Fixed-window rate limit via Vercel KV (Upstash REST). Fail-open if unset.
async function rateLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
        const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
        const { result } = await incr.json();
        if (result === 1) {
            await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        return typeof result === 'number' && result > limit;
    } catch {
        return false;
    }
}

// Re-send an EXISTING ArgoPuente® magic link to its own recipient address (never
// echoed in an HTTP response on the shareable-link path, so a token bearer who
// types someone else's email can't capture their capability token). Minimal
// body; the full report lives behind the magic link. ArgoPuente® wordmark.
async function sendExistingBridgeEmail(email: string, magicToken: string, childFirstName: string, lang: string, origin: string): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const url = `${origin}/puentes/${magicToken}`;
    const n = childFirstName || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
    const PL = lang === 'en' ? {
        subject: `Your ArgoPuente® with ${n}`,
        body: `You already have your bridge with ${n}. Here is your permanent link.`,
        cta: 'Open my bridge',
    } : lang === 'pt' ? {
        subject: `Sua ArgoPuente® com ${n}`,
        body: `Você já tem a sua ponte com ${n}. Aqui está o seu link permanente.`,
        cta: 'Abrir minha ponte',
    } : {
        subject: `Tu ArgoPuente® con ${n}`,
        body: `Ya tienes tu puente con ${n}. Aquí está tu enlace permanente.`,
        cta: 'Abrir mi puente',
    };
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'Argo Method <hola@argomethod.com>',
            to: [email],
            subject: PL.subject,
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<tr><td style="background:#1D1D1F;padding:24px 28px;">
    <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:300;">Puente</span><span style="font-size:10px;color:#fff;font-weight:300;vertical-align:super;">&reg;</span>
</td></tr>
<tr><td style="padding:28px;">
    <p style="font-size:14px;color:#424245;margin:0 0 22px;line-height:1.6;">${PL.body}</p>
    <div style="text-align:center;"><a href="${url}" style="display:inline-block;background:#955FB5;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">${PL.cta}</a></div>
</td></tr>
</table></td></tr></table></body></html>`,
        }),
    });
}

/* ── Stripe checkout ─────────────────────────────────────────────────────── */

// Resolve a customer-entered promotion code to its Stripe id, re-validated
// server-side. Returns null when unknown/inactive/expired/exhausted. Inlined per
// endpoint — Vercel functions can't import shared helpers between api/ files.
async function resolvePromotionCodeId(stripeKey: string, code: string): Promise<string | null> {
    const norm = code.trim().toUpperCase();
    if (!norm) return null;
    const r = await fetch(`https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(norm)}&active=true&limit=1`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const pc = Array.isArray(data?.data) ? data.data[0] : null;
    if (!pc || pc.active === false || typeof pc.id !== 'string') return null;
    // The coupon lives under `promotion.coupon` (newer Stripe API, an id) or
    // `coupon` (older API, a nested object or id). Verify it is still valid.
    const inlineCoupon = pc.coupon && typeof pc.coupon === 'object' ? pc.coupon : null;
    if (inlineCoupon) return inlineCoupon.valid === false ? null : pc.id;
    const couponId = (pc.promotion && pc.promotion.coupon) || (typeof pc.coupon === 'string' ? pc.coupon : null);
    if (!couponId) return null;
    const cr = await fetch(`https://api.stripe.com/v1/coupons/${encodeURIComponent(couponId)}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (!cr.ok) return null;
    const coupon = await cr.json();
    if (!coupon || coupon.valid === false) return null;
    return pc.id;
}

async function createStripeCheckout(args: {
    email: string;
    childName: string;
    purchaseId: string;
    lang: string;
    promotionCodeId: string | null;
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

    const params: Record<string, string> = {
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
    };
    if (args.promotionCodeId) params['discounts[0][promotion_code]'] = args.promotionCodeId;

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
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

    // Throttle: this endpoint mints Stripe sessions and (on the shareable-link
    // path) is reachable by any bearer, so cap creation per IP. Belt-and-braces
    // against pending-row / checkout-session spam and the 409 existence oracle.
    if (await rateLimited(`rl:puentes-checkout:ip:${clientIp(req)}`, 40, 3600)) {
        return res.status(429).json({ error: 'rate_limited' });
    }

    try {
        const {
            source_session_id: bodySourceId,
            recipient_email,
            recipient_name,
            lang,
            consent_given,
            invite_token,
            bridge_link_token,
            coupon_code: bodyCoupon,
        } = req.body as {
            source_session_id?: string;
            recipient_email?: string;
            recipient_name?: string;
            lang?: string;
            consent_given?: boolean;
            coupon_code?: string;
            // ArgoOne® fusion (B13, legado): an accepted bridge-invite authorizes an
            // adult OTHER than the responsible one to buy the $4.99 add-on.
            invite_token?: string;
            // Fase 1 (frozen model §4): the child's ONE shareable bridges-link.
            // Shared only by the authorizing adult; whoever opens it onboards
            // (name + email + T&C) and pays THEIR own $4.99. The link IS the
            // authorization; it is safely re-shareable because the $4.99 buys
            // ONLY the buyer's bridge (never the child's individual report).
            bridge_link_token?: string;
        };

        if (!consent_given) {
            return res.status(400).json({ error: 'Consent required' });
        }
        if (!recipient_email) {
            return res.status(400).json({ error: 'Missing recipient_email' });
        }

        const flagOn = process.env.PUENTES_ADDON_V2 === 'on'
            || ['1', 'on', 'true'].includes((process.env.VITE_BRIDGES_V2 || '').trim().toLowerCase());

        // ── Path C (Fase 1): resolve the child + CURRENT perfilamiento from the
        //    bridges-link token. The client never sends a perfilamiento id on this
        //    path — the token alone picks the child's current photo server-side. ──
        let source_session_id = bodySourceId;
        let viaBridgeLink = false;
        if (flagOn && bridge_link_token) {
            const { data: linkChild } = await sb
                .from('children')
                .select('id')
                .eq('bridge_link_token', String(bridge_link_token))
                .is('deleted_at', null)
                .maybeSingle();
            if (!linkChild) return res.status(404).json({ error: 'invalid_link' });
            const { data: cur } = await sb
                .from('perfilamientos')
                .select('id')
                .eq('child_id', linkChild.id)
                .eq('status', 'resolved')
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (!cur) return res.status(404).json({ error: 'invalid_link' });
            source_session_id = cur.id;
            viaBridgeLink = true;
        }

        if (!source_session_id) {
            return res.status(400).json({ error: 'Missing source_session_id or recipient_email' });
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
        // Path C (Fase 1, resolved above): the child's shareable bridges-link IS
        // the authorization — only the authorizing adult can mint/share it, and
        // it yields bridge-only entitlement, so ANY onboarded email may buy.
        // Path A (invite, legado): behind PUENTES_ADDON_V2, a valid pending/accepted
        // bridge-invite toward THIS perfilamiento, addressed to THIS recipient,
        // authorizes the buy (the responsible adult already vouched by inviting).
        // Path B (fallback, unchanged): only the child's responsible adult
        // (recipient_email == the source perfilamiento's adult_email) may buy.
        const inviteFlagOn = flagOn;
        let inviteRow: { id: string } | null = null;
        if (!viaBridgeLink && inviteFlagOn && invite_token) {
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
        if (!viaBridgeLink && !inviteRow) {
            if (!srcSession.adult_email || normEmail(recipient_email) !== normEmail(srcSession.adult_email)) {
                return res.status(403).json({
                    error: 'not_authorized',
                    detail: "The ArgoPuente® add-on is only available to the child's responsible adult or an invited adult.",
                });
            }
        }

        // Block double-purchase for THIS child only (per recipient_email x
        // source_session_id — the frozen model's "1 puente por email × niño";
        // a NEW perfilamiento after a re-profile deliberately allows a fresh
        // $4.99, that's the "puente sobre foto nueva" rule). Case-insensitive
        // so the same adult typing Marta@ vs marta@ can't buy twice.
        const { data: existing } = await sb
            .from('puentes_purchases')
            .select('id, magic_token')
            .ilike('recipient_email', likeEscape(normEmail(recipient_email)))
            .eq('source_session_id', source_session_id)
            .eq('status', 'paid')
            .limit(1)
            .maybeSingle();
        if (existing) {
            const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com');
            // Shareable-link path: the caller has NOT proven they own the typed
            // email (the bridges-link is designed to be widely re-shared), so we
            // must NOT echo the magic token — that would hand any bearer another
            // adult's full report. Instead re-send the link to its own inbox and
            // reply without the token. Paths A/B (invite / responsible-adult email
            // match) proved authorization, so they keep the direct redirect.
            if (viaBridgeLink) {
                const firstName = (srcSession.child_name || '').trim().split(/\s+/)[0] || '';
                await sendExistingBridgeEmail(normEmail(recipient_email), existing.magic_token, firstName, (lang || srcSession.lang || 'es') as string, origin);
                return res.status(409).json({
                    error: 'already_purchased',
                    emailed: true,
                    detail: 'This email already has a bridge with this child. We re-sent the link to that address.',
                });
            }
            return res.status(409).json({
                error: 'already_purchased',
                detail: 'This adult already has an active ArgoPuente® toward this child.',
                existing_magic_link: `${origin}/puentes/${existing.magic_token}`,
            });
        }

        const childName = srcSession.child_name || '';
        const magicToken = genMagicToken();
        const finalLang = (lang || srcSession.lang || 'es') as string;

        // Resolve an optional discount coupon BEFORE the insert, so an invalid code
        // fails fast (400) without leaving an orphan pending purchase row. The
        // charged amount is reconciled from Stripe's amount_total in the webhook.
        let promotionCodeId: string | null = null;
        if (typeof bodyCoupon === 'string' && bodyCoupon.trim()) {
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeKey) return res.status(500).json({ error: 'Server configuration error' });
            promotionCodeId = await resolvePromotionCodeId(stripeKey, bodyCoupon);
            if (!promotionCodeId) return res.status(400).json({ error: 'invalid_coupon' });
        }

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
            promotionCodeId,
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
