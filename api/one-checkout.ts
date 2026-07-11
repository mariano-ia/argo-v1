import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/one-checkout
 * Body: { email, kind?: 'one' | 'one_puente', lang? }
 * Returns: { checkout_url, purchase_id }
 *
 * Single-price ArgoOne® checkout in USD via Stripe. No packs, no ARS for now.
 *   - one        → $9.99   (child profile report)
 *   - one_puente → $12.99  (report + a prepaid Puente for the responsible adult)
 *
 * The combo is recorded with includes_puente=true on the purchase; delivering the
 * prepaid Puente after the child plays is a separate (next) step.
 */

const PRICES: Record<string, { usd_cents: number; label: string; includes_puente: boolean }> = {
    one:        { usd_cents: 999,  label: 'ArgoOne®',          includes_puente: false },
    one_puente: { usd_cents: 1299, label: 'ArgoOne+®', includes_puente: true },
};

function normEmail(s?: string | null): string {
    return (s || '').trim().toLowerCase();
}

async function createStripeCheckout(price: { usd_cents: number; label: string }, email: string, purchaseId: string, accessToken: string): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://argomethod.com';

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'mode': 'payment',
            'customer_email': email,
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][unit_amount]': String(price.usd_cents),
            'line_items[0][price_data][product_data][name]': price.label,
            'line_items[0][quantity]': '1',
            'metadata[purchase_id]': purchaseId,
            'metadata[source]': 'argo_one',
            'success_url': `${origin}/one/panel?token=${accessToken}&success=1`,
            'cancel_url': `${origin}/one`,
        }).toString(),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[one-checkout] Stripe API error:', err);
        throw new Error(`Stripe error: ${err}`);
    }

    const session = await res.json();
    return session.url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { email: rawEmail, kind: bodyKind, lang: bodyLang, child_id: bodyChildId } = req.body as { email?: string; kind?: string; lang?: string; child_id?: string };
        const email = String(rawEmail || '').trim().toLowerCase();
        // Prefer the language the client sent; otherwise fall back to the browser's
        // Accept-Language header so an English (or Portuguese) visitor gets emails in
        // their language even if the /one page did not pass lang. 'es' is the last resort.
        const headerLang = (() => {
            const al = (req.headers['accept-language'] || '').toString().toLowerCase();
            if (al.startsWith('en')) return 'en';
            if (al.startsWith('pt')) return 'pt';
            return 'es';
        })();
        const lang = typeof bodyLang === 'string' && ['es', 'en', 'pt'].includes(bodyLang) ? bodyLang : headerLang;
        // ONE_UNIFIED_SKU (ArgoOne fusion): a single product ArgoOne® $12.99 that ALWAYS
        // includes the puente. Flag OFF = legacy two-SKU (one $9.99 / one_puente $12.99).
        // The front keeps sending {kind} during the transition; when unified we ignore it
        // and always charge the combo (the $9.99 no-puente SKU is retired).
        const UNIFIED = process.env.ONE_UNIFIED_SKU === 'on';
        const kind = UNIFIED ? 'one_puente' : (bodyKind === 'one_puente' ? 'one_puente' : 'one');
        const price = UNIFIED
            ? { usd_cents: 1299, label: 'ArgoOne®', includes_puente: true }
            : PRICES[kind];

        // Validate + normalize: a well-formed address, already trimmed/lowercased so
        // the panel unifies purchases reliably and a poisoned value can't reach the
        // aggregation query.
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        // ── Fase 3: re-profile of an EXISTING child (behind ONE_REPROFILE) ──────
        // A $12.99 purchase bound to a child_id. The child does NOT play now; the
        // webhook decides (fresh photo → deliver current report; expired → email
        // the immutable responsible adult for authorization, then the child plays).
        // So a re-profile purchase creates NO play-link slot here (that slot is
        // minted after authorization). The payer must be the buyer or the child's
        // responsible adult (anti-redirection, §2).
        const REPROFILE_ON = process.env.ONE_REPROFILE === 'on';
        let reprofileChildId: string | null = null;
        if (REPROFILE_ON && typeof bodyChildId === 'string' && bodyChildId) {
            const { data: child } = await sb
                .from('children')
                .select('id, tenant_id, responsible_adult_email, adult_email, archived_at, deleted_at, merged_into')
                .eq('id', bodyChildId)
                .maybeSingle();
            if (!child || child.archived_at || child.deleted_at || child.merged_into) {
                return res.status(404).json({ error: 'child_not_found' });
            }
            // ArgoOne children only — a tenant/club child re-profiles through the
            // dashboard flow, never via this $12.99 checkout (else charged-but-
            // undeliverable).
            if (child.tenant_id) {
                return res.status(400).json({ error: 'reprofile_not_supported_for_tenant_child' });
            }
            const isResponsible = normEmail(child.responsible_adult_email) === email || normEmail(child.adult_email) === email;
            // The buyer of ANY of the child's reports may also re-profile it: a
            // one_link for THIS child whose purchase email == the caller. Filtered
            // by the caller's email (never an arbitrary link).
            let isBuyer = isResponsible;
            if (!isBuyer) {
                const { data: buyerLinks } = await sb
                    .from('one_links')
                    .select('one_purchases!inner(email)')
                    .eq('child_id', bodyChildId);
                // The embedded relation can arrive as an object or a single-element
                // array depending on the FK cardinality inference; handle both.
                isBuyer = (buyerLinks ?? []).some((l: any) => {
                    const op = Array.isArray(l.one_purchases) ? l.one_purchases[0] : l.one_purchases;
                    return normEmail(op?.email) === email;
                });
            }
            if (!isResponsible && !isBuyer) {
                return res.status(403).json({ error: 'not_authorized_to_reprofile' });
            }
            // Dedup: one re-profile in flight per child. A second purchase (e.g. the
            // buyer AND the adult both paying) would double-play the child inside the
            // 6-month window — reject it before charging.
            const { data: inFlight } = await sb
                .from('one_purchases')
                .select('id')
                .eq('child_id', bodyChildId)
                .eq('kind', 'reprofile')
                .in('reprofile_status', ['pending_payment', 'awaiting_auth'])
                .limit(1)
                .maybeSingle();
            if (inFlight) {
                return res.status(409).json({ error: 'reprofile_already_in_progress' });
            }
            reprofileChildId = bodyChildId;
        }

        // Create purchase record (pending). pack_size is always 1 (no packs for now).
        const { data: purchase, error: insertErr } = await sb
            .from('one_purchases')
            .insert({
                email,
                pack_size: 1,
                amount_cents: price.usd_cents,
                currency: 'usd',
                payment_provider: 'stripe',
                payment_status: 'pending',
                includes_puente: price.includes_puente,
                lang,
                ...(reprofileChildId ? { kind: 'reprofile', child_id: reprofileChildId, reprofile_status: 'pending_payment' } : {}),
            })
            .select('id, access_token')
            .single();

        if (insertErr || !purchase) {
            console.error('[one-checkout] Insert error:', insertErr?.message);
            return res.status(500).json({ error: 'Failed to create purchase' });
        }

        // First-play purchases get a play-link slot immediately. A re-profile does
        // NOT (its slot is minted by the webhook/consent after authorization).
        if (!reprofileChildId) {
            await sb.from('one_links').insert([{ purchase_id: purchase.id, status: 'available' }]);
        }

        const checkoutUrl = await createStripeCheckout(price, email, purchase.id, purchase.access_token);

        return res.status(200).json({
            checkout_url: checkoutUrl,
            purchase_id: purchase.id,
            kind,
            currency: 'usd',
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[one-checkout] Error:', msg);
        return res.status(500).json({ error: 'Failed to create checkout session', detail: msg });
    }
}
