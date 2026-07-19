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

        // ArgoOne® fusion (B9): forward-only, flag-gated. OFF = legacy behavior
        // (create a fresh child + perfilamiento). ON = additive identity/expiry
        // fields, replay-aware, and — when the front passes the row-A session_id —
        // LINK that row instead of creating a duplicate (closes G2).
        // COUPLING: ONE_UNIFIED_SKU makes every purchase a combo (includes_puente)
        // and triggers the two-track hub email (one-webhook). That hub promises the
        // buyer their bridge, so the SKU flip MUST also activate the comp-to-buyer
        // routing here — otherwise a UNIFIED-on / V2-off window orphans the comp and
        // re-opens G2. So UNIFIED implies V2-complete.
        // ONE_REPROFILE implies V2: a re-profile MUST take the LINK/append path
        // (reuse the row-A perfilamiento bound to the existing child), never the
        // legacy new-child path — else a re-play would fork a duplicate child.
        const V2 = process.env.ONE_V2_COMPLETE === 'on' || process.env.ONE_UNIFIED_SKU === 'on' || process.env.ONE_REPROFILE === 'on';
        const lang = session_data.lang || 'es';

        // Verify link exists and is not already completed
        const { data: link } = await sb
            .from('one_links')
            .select('id, status, purchase_id, child_id')
            .eq('id', link_id)
            .single();

        if (!link) return res.status(404).json({ error: 'Link not found' });
        if (link.status === 'completed') return res.status(400).json({ error: 'Already completed' });

        // A replay slot (link.child_id already set by the webhook) is a re-profile:
        // it MUST take the LINK/append path (reuse the row-A perfilamiento bound to
        // the existing child) regardless of the runtime flags — otherwise flipping a
        // flag off between authorization and completion would fork a duplicate child.
        // Durable signal, mirrors the flag-independence of the webhook/session gates.
        const isReplaySlot = !!link.child_id;
        if (isReplaySlot && !session_id) {
            return res.status(400).json({ error: 'reprofile_requires_session_id' });
        }

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

        // ── G2 LINK path (V2 OR a durable replay slot + row-A id supplied): reuse
        //    the perfilamiento that /api/session already created; do NOT duplicate. ──
        if ((V2 || isReplaySlot) && session_id) {
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
                    const { data: mintedComp, error: compErr } = await sb.from('puentes_purchases').insert({
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
                    }).select('id').maybeSingle();
                    if (mintedComp) {
                        // Mirror of the one-webhook fix (b4c56fc): the comp's bridge
                        // session must exist at mint time — under V2 the BUYER is
                        // routed straight to /puentes/:token via the hub, and
                        // send-email's ensure branch only covers the report
                        // recipient's email, so nothing else materializes it.
                        const { error: sessErr } = await sb.from('puentes_sessions').insert({
                            purchase_id: mintedComp.id,
                            source_session_id: perfilamiento.id,
                            lang,
                            status: 'created',
                        });
                        if (sessErr) console.warn('[one-complete] combo puente session insert failed (puentes-start self-heals):', sessErr.message);
                    } else if (compErr) {
                        console.warn('[one-complete] combo puente purchase insert failed:', compErr.message);
                    }
                }
            }
        } catch (puentesErr) {
            console.warn('[one-complete] prepaid combo Puente failed:', puentesErr instanceof Error ? puentesErr.message : puentesErr);
        }

        // ── Fase 3: a re-profile completed. Advance its purchase(s) to a TERMINAL
        //    reprofile_status so the checkout dedup ("one in flight per child") does
        //    not block the NEXT 6-month re-profile forever. All the child's still-open
        //    reprofile purchases (the payer + any shared-auth backstop) are fulfilled
        //    by this single play. ──
        if (isReplaySlot && linkedChildId) {
            try {
                await sb.from('one_purchases')
                    .update({ reprofile_status: 'completed' })
                    .eq('child_id', linkedChildId)
                    .eq('kind', 'reprofile')
                    .in('reprofile_status', ['pending_payment', 'awaiting_auth']);
            } catch (e) { console.warn('[one-complete] reprofile_status terminal update failed (non-blocking):', e); }
        }

        // ── Fase 3: notify the PAYER of a re-profile (coach case, payer != the
        //    authorizing adult): the new report + their included puente, so §5's
        //    "el informe nuevo va al adulto Y al pagador" holds via an active send
        //    (the adult gets it through the normal report email to their address). ──
        try {
            const { data: op } = await sb
                .from('one_purchases')
                .select('email, kind')
                .eq('id', link.purchase_id)
                .maybeSingle();
            const payer = (op?.email || '').trim().toLowerCase();
            const adult = (session_data.adult_email || '').trim().toLowerCase();
            if (op?.kind === 'reprofile' && payer && payer !== adult) {
                const origin = process.env.SITE_URL || 'https://argomethod.com';
                const escPayer = payer.replace(/([\\%_])/g, '\\$1');
                const { data: pp } = await sb.from('puentes_purchases').select('magic_token').ilike('recipient_email', escPayer).eq('source_session_id', perfilamiento.id).eq('status', 'paid').maybeSingle();
                const hasBridge = !!pp?.magic_token;
                // Tokenized panel link for the payer (mint the adult_profile if needed);
                // the report + bridge both live there — one destination, one button.
                let panelUrl = `${origin}/one/panel`;
                try {
                    const { data: ap } = await sb.from('adult_profiles').select('access_token').ilike('email', escPayer).maybeSingle();
                    let apToken = ap?.access_token as string | undefined;
                    if (!apToken) {
                        const { data: ins } = await sb.from('adult_profiles').insert({ email: payer, lang }).select('access_token').maybeSingle();
                        apToken = ins?.access_token as string | undefined;
                        if (!apToken) {
                            const { data: again } = await sb.from('adult_profiles').select('access_token').ilike('email', escPayer).maybeSingle();
                            apToken = again?.access_token as string | undefined;
                        }
                    }
                    if (apToken) panelUrl = `${origin}/one/panel?token=${apToken}`;
                } catch { /* tokenless fallback */ }
                const childFirst = (session_data.child_name || '').trim().split(/\s+/)[0] || (lang === 'en' ? 'the child' : lang === 'pt' ? 'a criança' : 'el niño');
                const resendKey = process.env.RESEND_API_KEY;
                if (resendKey) {
                    const P = lang === 'en'
                        ? { s: `${childFirst}'s new report is ready`, e: 'ArgoOne® · Your report', b: `The new profile for ${childFirst} is ready. The report${hasBridge ? ' and your own bridge are' : ' is'} in your panel.`, c: 'Go to my panel', n: 'One-time purchase. No subscription. Everything stays in your panel.' }
                        : lang === 'pt'
                        ? { s: `O novo relatório de ${childFirst} está pronto`, e: 'ArgoOne® · Seu relatório', b: `O novo perfil de ${childFirst} está pronto. O relatório${hasBridge ? ' e a sua própria ponte estão' : ' está'} no seu painel.`, c: 'Ir para o meu painel', n: 'Compra única. Sem assinatura. Tudo fica no seu painel.' }
                        : { s: `El nuevo informe de ${childFirst} está listo`, e: 'ArgoOne® · Tu informe', b: `El nuevo perfil de ${childFirst} está listo. El informe${hasBridge ? ' y tu propio puente están' : ' está'} en tu panel.`, c: 'Ir a mi panel', n: 'Compra única. Sin suscripción. Todo queda en tu panel.' };
                    // Unified ArgoOne shell (matches send-email buildHtmlV4; blue accent).
                    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="padding:28px 12px 40px;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E8E8ED;border-radius:16px;overflow:hidden;">
    <div style="background:#1D1D1F;padding:22px 32px;"><span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.01em;">Argo</span><span style="font-size:18px;font-weight:300;color:#fff;">One</span><span style="font-size:10px;font-weight:300;color:#fff;vertical-align:super;">&reg;</span></div>
    <div style="padding:26px 32px 0;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#AEAEB2;">${P.e}</div>
      <div style="font-size:22px;font-weight:600;color:#1D1D1F;letter-spacing:-0.02em;margin-top:6px;">${P.s}</div>
    </div>
    <div style="padding:18px 32px 0;"><div style="font-size:13.5px;color:#424245;line-height:1.6;">${P.b}</div></div>
    <div style="padding:22px 32px 0;text-align:center;">
      <a href="${panelUrl}" style="display:inline-block;background:#0071E3;color:#FFFFFF;font-size:15px;font-weight:600;padding:13px 28px;border-radius:12px;letter-spacing:-0.01em;text-decoration:none;">${P.c}</a>
    </div>
    <div style="padding:26px 32px 0;"><div style="height:1px;background:#E8E8ED;"></div></div>
    <div style="padding:18px 32px 26px;">
      <div style="font-size:11.5px;color:#AEAEB2;line-height:1.6;">${P.n}</div>
      <div style="font-size:11.5px;color:#AEAEB2;line-height:1.6;margin-top:14px;"><span style="font-weight:800;color:#86868B;">Argo</span><span style="font-weight:300;color:#AEAEB2;">Method®</span></div>
    </div>
  </div>
</div>
</body></html>`;
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: 'Argo Method <hola@argomethod.com>', to: [payer], subject: P.s, html }),
                    });
                }
            }
        } catch (payerErr) {
            console.warn('[one-complete] reprofile payer notify failed (non-blocking):', payerErr instanceof Error ? payerErr.message : payerErr);
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
