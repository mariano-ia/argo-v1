import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * POST /api/one-complete
 * Body: { link_id, session_data }
 *
 * Called when an ArgoOne® odyssey is completed.
 * Creates a child (no tenant_id) + a resolved perfilamiento (no tenant_id),
 * marks the link as completed (one_links.session_id = the perfilamiento id, so
 * the /report/:id link stays valid), and triggers the report email.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { link_id, session_data, session_id } = req.body as {
            link_id?: string;
            // The row-A perfilamiento id already created by /api/session (with
            // report_v4). When ONE_V2_COMPLETE is on, one-complete LINKS this row
            // to the one_link instead of creating a duplicate (closes G2).
            session_id?: string;
            session_data?: {
                adult_name: string;
                adult_email: string;
                child_name: string;
                child_age: number;
                sport: string;
                eje: string;
                motor: string;
                eje_secundario?: string;
                archetype_label: string;
                answers: unknown[];
                ai_sections?: unknown;
                ai_tokens_input?: number;
                ai_tokens_output?: number;
                ai_cost_usd?: number;
                lang?: string;
            };
        };

        if (!link_id || !session_data) {
            return res.status(400).json({ error: 'Missing link_id or session_data' });
        }

        // ArgoOne fusion (B9): forward-only, flag-gated. OFF = legacy behavior
        // (create a fresh child + perfilamiento). ON = additive identity/expiry
        // fields, replay-aware, and — when the front passes the row-A session_id —
        // LINK that row instead of creating a duplicate (closes G2).
        // COUPLING: ONE_UNIFIED_SKU makes every purchase a combo (includes_puente)
        // and triggers the two-track hub email (one-webhook). That hub promises the
        // buyer their bridge, so the SKU flip MUST also activate the comp-to-buyer
        // routing here — otherwise a UNIFIED-on / V2-off window orphans the comp and
        // re-opens G2. So UNIFIED implies V2-complete.
        const V2 = process.env.ONE_V2_COMPLETE === 'on' || process.env.ONE_UNIFIED_SKU === 'on';
        const lang = session_data.lang || 'es';

        // Verify link exists and is not already completed
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, purchase_id')
            .eq('id', link_id)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status === 'completed') return res.status(400).json({ error: 'Already completed' });

        // +6 months from now, clamping end-of-month overflow to match Postgres'
        // interval '6 months' (Aug 31 -> Feb 28/29, not Mar 3).
        const expiresAt = (() => {
            const d = new Date();
            const day = d.getDate();
            d.setMonth(d.getMonth() + 6);
            if (d.getDate() !== day) d.setDate(0);
            return d.toISOString();
        })();

        let perfilamiento: { id: string } | null = null;
        let linkedChildId: string | null = null;  // the child bound to the completed link (V2)

        // ── G2 LINK path (V2 + row-A id supplied): reuse the perfilamiento that
        //    /api/session already created with report_v4; do NOT duplicate it. ──
        if (V2 && session_id) {
            const { data: rowA } = await sb
                .from('perfilamientos')
                .select('id, child_id, adult_email, expires_at')
                .eq('id', session_id)
                .maybeSingle();
            if (!rowA) return res.status(404).json({ error: 'Session not found' });
            perfilamiento = { id: rowA.id };
            linkedChildId = rowA.child_id ?? null;

            // Set expiry on the row if /api/session did not.
            if (!rowA.expires_at) {
                await sb.from('perfilamientos').update({ expires_at: expiresAt }).eq('id', rowA.id);
            }
            // Stamp the responsible adult (R1 = the authorizer) + identity on the
            // child. deletion_id auto-fills via the column DEFAULT.
            if (rowA.child_id) {
                await sb.from('children').update({
                    responsible_adult_email: session_data.adult_email,
                    adult_email: session_data.adult_email,
                    adult_name: session_data.adult_name,
                }).eq('id', rowA.child_id).is('responsible_adult_email', null);
            }
        } else {
            // ── Legacy / non-linked path: create a CHILD + resolved PERFILAMIENTO. ──
            const { data: child, error: childErr } = await sb
                .from('children')
                .insert({
                    tenant_id: null,  // ArgoOne®: no tenant
                    adult_name: session_data.adult_name,
                    adult_email: session_data.adult_email,
                    child_name: session_data.child_name,
                    child_age: session_data.child_age,
                    sport: session_data.sport,
                    lang,
                    // R1: the responsible adult (authorizer). Additive under V2;
                    // NULL under legacy so the shadow read side is unaffected.
                    ...(V2 ? { responsible_adult_email: session_data.adult_email } : {}),
                })
                .select('id')
                .single();

            if (childErr || !child) {
                console.error('[one-complete] Child insert error:', childErr?.message);
                return res.status(500).json({ error: 'Failed to save session' });
            }

            const { data: perf, error: perfErr } = await sb
                .from('perfilamientos')
                .insert({
                    child_id: child.id,
                    status: 'resolved',
                    adult_name: session_data.adult_name,
                    adult_email: session_data.adult_email,
                    child_name: session_data.child_name,
                    child_age: session_data.child_age,
                    sport: session_data.sport,
                    eje: session_data.eje,
                    motor: session_data.motor,
                    eje_secundario: session_data.eje_secundario || null,
                    archetype_label: session_data.archetype_label,
                    answers: session_data.answers,
                    ai_sections: session_data.ai_sections || null,
                    ai_tokens_input: session_data.ai_tokens_input || 0,
                    ai_tokens_output: session_data.ai_tokens_output || 0,
                    ai_cost_usd: session_data.ai_cost_usd || 0,
                    lang,
                    tenant_id: null,  // ArgoOne®: no tenant
                    share_token: crypto.randomBytes(16).toString('hex'),  // required for /report access (report.ts fails closed)
                    last_profiled_at: new Date().toISOString(),
                    ...(V2 ? { expires_at: expiresAt } : {}),
                })
                .select('id')
                .single();

            if (perfErr || !perf) {
                console.error('[one-complete] Perfilamiento insert error:', perfErr?.message);
                // Clean up the just-created childless child so a retry doesn't orphan it.
                await sb.from('children').delete().eq('id', child.id);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            perfilamiento = { id: perf.id };
            linkedChildId = child.id;
        }

        // Mark link as completed. session_id stores the PERFILAMIENTO id so the
        // /report/:id link (read by perfilamiento id) stays valid. child_id is
        // stamped only under V2 (using the id already in scope — no extra query),
        // so the legacy flag-off path stays byte-identical.
        await sb.from('one_links').update({
            status: 'completed',
            session_id: perfilamiento.id,
            completed_at: new Date().toISOString(),
            ...(V2 && linkedChildId ? { child_id: linkedChildId } : {}),
        }).eq('id', link_id);

        // ── ArgoOne+® Puente combo: deliver the prepaid Puente ───────────────
        // If this purchase is the combo (one_purchases.includes_puente), create a
        // complimentary ($0, comp) ArgoPuente® purchase for the responsible adult
        // so it is already PAID when the report email is sent. send-email then shows
        // the prepaid Puente magic link (instead of the $4.99 upsell) and creates the
        // puentes_session itself. Skips if the adult already has a paid purchase, to
        // avoid a duplicate. Non-blocking: a failure here never blocks the report.
        try {
            const { data: onePurchase } = await sb
                .from('one_purchases')
                .select('includes_puente, email')
                .eq('id', link.purchase_id)
                .maybeSingle();

            // R4: the included Puente belongs to the BUYER (one_purchases.email).
            // Under V2 the comp is delivered through the HUB (which now exists):
            // the hub's start-adult-profile hands back this comp magic_token, so a
            // coach buyer whose email != the player is reached. Legacy (flag OFF)
            // keeps the comp bound to the player's adult_email, because send-email
            // finds it by the report recipient (adjudicating it to the buyer with no
            // buyer channel orphaned it — the reverted B4).
            const compEmail = (V2 ? onePurchase?.email : session_data.adult_email);
            if (onePurchase?.includes_puente && compEmail) {
                const { data: existing } = await sb
                    .from('puentes_purchases')
                    .select('id')
                    .eq('recipient_email', compEmail)
                    .eq('source_session_id', perfilamiento.id)
                    .eq('status', 'paid')
                    .maybeSingle();

                if (!existing) {
                    await sb.from('puentes_purchases').insert({
                        source_session_id: perfilamiento.id,
                        recipient_email: compEmail,
                        recipient_name: (V2 ? null : session_data.adult_name) ?? null,
                        child_name: session_data.child_name,
                        amount_cents: 0,
                        currency: 'USD',
                        provider: 'comp',
                        provider_payment_id: `combo_${link.purchase_id}`,
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        magic_token: crypto.randomBytes(24).toString('base64url'),
                        lang,
                        source: 'argo_one',
                        tenant_id: null,
                    });
                }
            }
        } catch (puentesErr) {
            console.warn('[one-complete] prepaid combo Puente failed:', puentesErr instanceof Error ? puentesErr.message : puentesErr);
        }

        return res.status(200).json({
            ok: true,
            session_id: perfilamiento.id,
        });
    } catch (err) {
        console.error('[one-complete] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
