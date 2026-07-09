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
        const { link_id, session_data } = req.body as {
            link_id?: string;
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

        // Verify link exists and is not already completed
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, purchase_id')
            .eq('id', link_id)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status === 'completed') return res.status(400).json({ error: 'Already completed' });

        // ArgoOne®: a completed play creates a CHILD (tenant_id NULL = persistent
        // roster/identity entity) plus a resolved PERFILAMIENTO (the assessment).
        // 1:1 here — each ArgoOne® link yields exactly one child + one perfilamiento.
        const lang = session_data.lang || 'es';

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
            })
            .select('id')
            .single();

        if (childErr || !child) {
            console.error('[one-complete] Child insert error:', childErr?.message);
            return res.status(500).json({ error: 'Failed to save session' });
        }

        // Save the perfilamiento, the assessment (no tenant_id — this is ArgoOne®).
        // Identity columns are still present + populated per row.
        const { data: perfilamiento, error: perfErr } = await sb
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
            })
            .select('id')
            .single();

        if (perfErr || !perfilamiento) {
            console.error('[one-complete] Perfilamiento insert error:', perfErr?.message);
            // Clean up the just-created childless child so a retry doesn't orphan it.
            await sb.from('children').delete().eq('id', child.id);
            return res.status(500).json({ error: 'Failed to save session' });
        }

        // Mark link as completed. session_id stores the PERFILAMIENTO id so the
        // /report/:id link (read by perfilamiento id) stays valid.
        await sb.from('one_links').update({
            status: 'completed',
            session_id: perfilamiento.id,
            completed_at: new Date().toISOString(),
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
                .select('includes_puente')
                .eq('id', link.purchase_id)
                .maybeSingle();

            // The prepaid combo Puente is delivered by send-email, which finds it by the
            // report recipient's email (the adult who played). Keep the comp bound to that
            // adult_email so the magic link actually reaches them. (R4 "the included puente
            // belongs to the BUYER" is correct for the fusion, but needs a separate buyer
            // delivery channel — the hub email — so it is handled in the ArgoOne fusion build,
            // not as an L0 hotfix: adjudicating it to the buyer here orphaned it when
            // buyer != player, since no delivery path looks it up by the buyer email.)
            if (onePurchase?.includes_puente && session_data.adult_email) {
                const { data: existing } = await sb
                    .from('puentes_purchases')
                    .select('id')
                    .eq('recipient_email', session_data.adult_email)
                    .eq('source_session_id', perfilamiento.id)
                    .eq('status', 'paid')
                    .maybeSingle();

                if (!existing) {
                    await sb.from('puentes_purchases').insert({
                        source_session_id: perfilamiento.id,
                        recipient_email: session_data.adult_email,
                        recipient_name: session_data.adult_name ?? null,
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
