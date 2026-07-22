import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/send-puentes-email
 * Body: { puentes_session_id }
 *
 * Sends the ArgoPuente® "your bridge is ready" NOTICE to the recipient_email
 * via Resend. Since 2026-07-19 the email is a short notice (brújula preview of
 * the adult profile + greeting + one CTA), NOT the full report inline: the full
 * bridge lives at its destination. Styled to match the ArgoOne report email
 * (send-email.ts buildHtmlV4) — same shell, violet accent as ArgoPuente identity.
 * The CTA depends on the recipient's role:
 *   - has a panel (buyer / responsible adult) → "Ir a mi panel" (tokenized).
 *   - no panel (the invited "abuela", reached via a shared bridge_link) →
 *     "Verlo en línea" → the bridge magic link.
 */

interface PuenteBlock {
    titulo: string;
    como_esta_el: string;
    lo_que_traes: string;
    el_puente: string;
    pregunta_reflexion: string;
}

interface AiSections {
    saludo: string;
    perfil_adulto_breve: string;
    puentes: PuenteBlock[];
    cierre: string;
}

interface AdultProfile {
    eje_primary: 'D' | 'I' | 'S' | 'C';
    eje_secondary: 'D' | 'I' | 'S' | 'C' | null;
    motor: 'agil' | 'equilibrado' | 'profundo';
    pressure_style: 'regulado' | 'reactivo' | 'evitativo';
    axis_counts?: Record<'D' | 'I' | 'S' | 'C', number>;
}

const AXIS_COLOR: Record<string, string> = {
    D: '#f97316',
    I: '#f59e0b',
    S: '#22c55e',
    C: '#6366f1',
};

const AXIS_LABEL: Record<string, Record<string, string>> = {
    es: { D: 'Impulsor', I: 'Conector', S: 'Sostén', C: 'Estratega' },
    en: { D: 'Driver',   I: 'Connector', S: 'Supporter', C: 'Strategist' },
    pt: { D: 'Impulsor', I: 'Conector', S: 'Sustento', C: 'Estrategista' },
};

const MOTOR_LABEL: Record<string, Record<string, string>> = {
    es: { agil: 'Ágil', equilibrado: 'Equilibrado', profundo: 'Profundo' },
    en: { agil: 'Agile', equilibrado: 'Balanced', profundo: 'Deep' },
    pt: { agil: 'Ágil', equilibrado: 'Equilibrado', profundo: 'Profundo' },
};

const PRESSURE_LABEL: Record<string, Record<string, string>> = {
    es: { regulado: 'Regulado', reactivo: 'Reactivo', evitativo: 'Evitativo' },
    en: { regulado: 'Regulated', reactivo: 'Reactive', evitativo: 'Avoidant' },
    pt: { regulado: 'Regulado', reactivo: 'Reativo', evitativo: 'Evitativo' },
};

function getCopy(lang: string) {
    if (lang === 'en') return {
        eyebrow: 'ArgoPuente® · Your bond',
        subjectPrefix: 'Your ArgoPuente®: bond with',
        yourStyle: 'Your natural style',
        pressure: 'Style under pressure',
        bondReady: (n: string) => `Your bridge with ${n} is ready`,
        panelCta: 'Go to my panel',
        onlineCta: 'View it online',
        panelNote: 'You can always find it in your panel. Sign in with your email anytime.',
        onlineNote: 'You can open it online from the button above whenever you want.',
        foreverNote: 'We keep your profile so we can reuse it for new bridges without repeating the questionnaire. If you want us to delete it, write to hola@argomethod.com.',
        disclaimer: 'This report is not a clinical or therapeutic service. It is an invitation to reflect.',
    };
    if (lang === 'pt') return {
        eyebrow: 'ArgoPuente® · Seu vínculo',
        subjectPrefix: 'Seu ArgoPuente®: vínculo com',
        yourStyle: 'Seu estilo natural',
        pressure: 'Estilo sob pressão',
        bondReady: (n: string) => `Sua ponte com ${n} está pronta`,
        panelCta: 'Ir para o meu painel',
        onlineCta: 'Ver online',
        panelNote: 'Você sempre encontra no seu painel. Entre com seu email quando quiser.',
        onlineNote: 'Você pode abri-lo online pelo botão acima quando quiser.',
        foreverNote: 'Guardamos seu perfil para reutilizá-lo em novas pontes sem repetir o questionário. Se quiser que apaguemos, escreva para hola@argomethod.com.',
        disclaimer: 'Este relatório não é um serviço clínico nem terapêutico. É um convite à reflexão.',
    };
    return {
        eyebrow: 'ArgoPuente® · Tu vínculo',
        subjectPrefix: 'Tu ArgoPuente®: vínculo con',
        yourStyle: 'Tu estilo natural',
        pressure: 'Estilo bajo presión',
        bondReady: (n: string) => `Tu puente con ${n} está listo`,
        panelCta: 'Ir a mi panel',
        onlineCta: 'Verlo en línea',
        panelNote: 'Lo encuentras siempre en tu panel. Entra con tu email cuando quieras.',
        onlineNote: 'Puedes abrirlo en línea desde el botón de arriba cuando quieras.',
        foreverNote: 'Guardamos tu perfil para reutilizarlo en nuevos puentes sin repetir el cuestionario. Si quieres que lo eliminemos, escríbenos a hola@argomethod.com.',
        disclaimer: 'Este informe no es un servicio clínico ni terapéutico. Es una invitación a la reflexión.',
    };
}

function renderAxisBars(counts: Record<string, number>, dominant: string, lang: string): string {
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    const order: Array<'D' | 'I' | 'S' | 'C'> = ['D', 'I', 'S', 'C'];
    const labels = AXIS_LABEL[lang] ?? AXIS_LABEL.es;
    return order.map(axis => {
        const pct = Math.round(((counts[axis] || 0) / total) * 100);
        const isDominant = axis === dominant;
        const color = AXIS_COLOR[axis];
        return `
            <tr><td style="padding-bottom:10px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="14" valign="middle"><div style="width:10px;height:10px;border-radius:50%;background:${color};"></div></td>
                        <td width="90" valign="middle" style="font-size:12px;font-weight:${isDominant ? '800' : '600'};color:#1D1D1F;padding-left:6px;">${labels[axis]}</td>
                        <td valign="middle" style="padding:0 8px;">
                            <div style="background:rgba(0,0,0,0.06);border-radius:4px;height:8px;width:100%;">
                                <div style="background:${color};width:${pct}%;height:8px;border-radius:4px;"></div>
                            </div>
                        </td>
                        <td width="40" valign="middle" align="right" style="font-size:11px;font-weight:${isDominant ? '700' : '600'};color:${isDominant ? '#1D1D1F' : '#86868B'};">${pct}%</td>
                    </tr>
                </table>
            </td></tr>`;
    }).join('');
}

function renderPressureIndicator(active: 'regulado' | 'reactivo' | 'evitativo', lang: string): string {
    const order: Array<'regulado' | 'reactivo' | 'evitativo'> = ['regulado', 'reactivo', 'evitativo'];
    const labels = PRESSURE_LABEL[lang] ?? PRESSURE_LABEL.es;
    const violet = '#955FB5';
    const t = getCopy(lang);
    const segments = order.map(p => {
        const bg = p === active ? violet : 'rgba(0,0,0,0.06)';
        return `<td style="padding:0 1.5px;"><div style="height:4px;background:${bg};border-radius:2px;"></div></td>`;
    }).join('');
    const names = order.map(p => {
        const isActive = p === active;
        return `<td style="font-size:10px;color:${isActive ? violet : '#86868B'};font-weight:${isActive ? '700' : '500'};${p === 'regulado' ? 'text-align:left;' : p === 'evitativo' ? 'text-align:right;' : 'text-align:center;'}">${labels[p]}</td>`;
    }).join('');
    return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(0,0,0,0.06);">
            <tr><td>
                <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#86868B;margin-bottom:8px;">${t.pressure}</div>
                <table width="100%" cellpadding="0" cellspacing="0"><tr>${segments}</tr></table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;"><tr>${names}</tr></table>
            </td></tr>
        </table>`;
}

// Short "your bridge is ready" notice, styled to match the ArgoOne report email
// (send-email.ts buildHtmlV4): same shell — system font, single white container
// (radius 16), dark masthead, eyebrow + title, inner card (radius 14), CTA,
// divider, footer — with violet as the ArgoPuente accent. Preview = the adult's
// brújula; the full 4-bridge report lives at ctaUrl.
export function buildHtml(args: {
    saludo: string;
    childName: string;
    adultProfile?: AdultProfile | null;
    ctaUrl: string;
    ctaLabel: string;
    ctaNote: string;
    lang: string;
}): string {
    const t = getCopy(args.lang);
    const violet = '#955FB5';
    const subject = `${t.subjectPrefix} ${args.childName}`;

    const adultAxis = args.adultProfile?.eje_primary;
    const adultAxisColor = adultAxis ? AXIS_COLOR[adultAxis] : violet;
    const axisLabels = AXIS_LABEL[args.lang] ?? AXIS_LABEL.es;
    const motorLabels = MOTOR_LABEL[args.lang] ?? MOTOR_LABEL.es;

    const pillsHtml = args.adultProfile ? `
        <table cellpadding="0" cellspacing="0" style="margin-top:14px;">
            <tr>
                <td style="padding-right:6px;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;color:#fff;background:${adultAxisColor};">${axisLabels[args.adultProfile.eje_primary]}</span>
                </td>
                <td style="padding-right:6px;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;color:#fff;background:#1D1D1F;">${motorLabels[args.adultProfile.motor]}</span>
                </td>
                ${args.adultProfile.eje_secondary ? `<td>
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid ${AXIS_COLOR[args.adultProfile.eje_secondary]};color:${AXIS_COLOR[args.adultProfile.eje_secondary]};background:#fff;">+${axisLabels[args.adultProfile.eje_secondary]}</span>
                </td>` : ''}
            </tr>
        </table>` : '';

    const axisBarsHtml = args.adultProfile?.axis_counts
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;margin-bottom:2px;">${renderAxisBars(args.adultProfile.axis_counts, args.adultProfile.eje_primary, args.lang)}</table>`
        : '';

    const pressureHtml = args.adultProfile
        ? renderPressureIndicator(args.adultProfile.pressure_style, args.lang)
        : '';

    const brujula = args.adultProfile ? `
    <div style="padding:22px 32px 0;">
      <div style="background:#F9F5FC;border:1px solid #E8D9F2;border-radius:14px;padding:20px 22px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${violet};">${t.yourStyle}</div>
        ${pillsHtml}
        ${axisBarsHtml}
        ${pressureHtml}
      </div>
    </div>` : '';

    return `<!doctype html>
<html lang="${args.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="padding:28px 12px 40px;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E8E8ED;border-radius:16px;overflow:hidden;">
    <div style="background:#1D1D1F;padding:22px 32px;"><span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.01em;">Argo</span><span style="font-size:18px;font-weight:300;color:#fff;">Puente</span><span style="font-size:10px;font-weight:300;color:#fff;vertical-align:super;">&reg;</span></div>
    <div style="padding:26px 32px 0;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#AEAEB2;">${t.eyebrow}</div>
      <div style="font-size:22px;font-weight:600;color:#1D1D1F;letter-spacing:-0.02em;margin-top:6px;">${t.bondReady(args.childName)}</div>
    </div>
    ${brujula}
    <div style="padding:22px 32px 0;">
      <div style="font-size:13.5px;color:#424245;line-height:1.6;">${args.saludo.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</div>
    </div>
    <div style="padding:22px 32px 0;text-align:center;">
      <a href="${args.ctaUrl}" style="display:inline-block;background:${violet};color:#FFFFFF;font-size:15px;font-weight:600;padding:13px 28px;border-radius:12px;letter-spacing:-0.01em;text-decoration:none;">${args.ctaLabel}</a>
      <div style="font-size:12px;color:#AEAEB2;margin-top:10px;">${args.ctaNote}</div>
    </div>
    <div style="padding:26px 32px 0;"><div style="height:1px;background:#E8E8ED;"></div></div>
    <div style="padding:22px 32px 26px;">
      <div style="font-size:11.5px;color:#86868B;line-height:1.6;">${t.disclaimer}</div>
      <div style="font-size:10.5px;color:#C4C4CC;line-height:1.6;margin-top:12px;">${t.foreverNote}</div>
      <div style="font-size:11.5px;color:#AEAEB2;line-height:1.6;margin-top:16px;"><span style="font-weight:800;color:#86868B;">Argo</span><span style="font-weight:300;color:#AEAEB2;">Method®</span> · ArgoPuente®</div>
    </div>
  </div>
</div>
</body></html>`;
}

// Decide the recipient's destination: an adult with a panel (buyer of ArgoOne,
// or responsible/authorizing adult of some child) goes to their tokenized panel;
// the invited "abuela" (only holds a bridge, reached via a shared link) goes to
// the bridge's own online page. Inlined (no cross-file imports on Vercel).
async function resolvePanelDestination(
    sb: ReturnType<typeof createClient<any, any>>,
    email: string,
    lang: string,
    origin: string,
    bridgeMagicLink: string,
): Promise<{ ctaUrl: string; hasPanel: boolean }> {
    const esc = email.trim().toLowerCase().replace(/([\\%_])/g, '\\$1');
    let hasPanel = false;
    try {
        const [{ count: respCount }, { count: adultCount }, { count: buyerCount }] = await Promise.all([
            sb.from('children').select('id', { count: 'exact', head: true }).ilike('responsible_adult_email', esc).is('deleted_at', null),
            sb.from('children').select('id', { count: 'exact', head: true }).ilike('adult_email', esc).is('deleted_at', null),
            sb.from('one_purchases').select('id', { count: 'exact', head: true }).ilike('email', esc),
        ]);
        hasPanel = (respCount ?? 0) > 0 || (adultCount ?? 0) > 0 || (buyerCount ?? 0) > 0;
    } catch (e) {
        console.warn('[send-puentes-email] panel role lookup failed, treating as online:', e instanceof Error ? e.message : e);
    }
    if (!hasPanel) return { ctaUrl: bridgeMagicLink, hasPanel: false };

    // Resolve (or mint) the adult_profile access_token for a direct panel link.
    let panelUrl = `${origin}/one/panel`;
    try {
        const { data: ap } = await sb.from('adult_profiles').select('access_token').ilike('email', esc).maybeSingle();
        let apToken = (ap as { access_token?: string } | null)?.access_token;
        if (!apToken) {
            const { data: ins } = await sb.from('adult_profiles').insert({ email, lang }).select('access_token').maybeSingle();
            apToken = (ins as { access_token?: string } | null)?.access_token;
            if (!apToken) {
                const { data: again } = await sb.from('adult_profiles').select('access_token').ilike('email', esc).maybeSingle();
                apToken = (again as { access_token?: string } | null)?.access_token;
            }
        }
        if (apToken) panelUrl = `${origin}/one/panel?token=${apToken}`;
    } catch (e) {
        console.warn('[send-puentes-email] panel token mint failed, tokenless fallback:', e instanceof Error ? e.message : e);
    }
    return { ctaUrl: panelUrl, hasPanel: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !supabaseUrl) return res.status(500).json({ error: 'Server configuration error' });
    if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY missing' });

    const sb = createClient(supabaseUrl, serviceKey);

    try {
        const { puentes_session_id } = req.body as { puentes_session_id?: string };
        if (!puentes_session_id) return res.status(400).json({ error: 'Missing puentes_session_id' });

        const { data: anchor, error } = await sb
            .from('puentes_sessions')
            .select('id, purchase_id, lang')
            .eq('id', puentes_session_id)
            .maybeSingle();
        if (error || !anchor) return res.status(404).json({ error: 'Puentes session not found' });

        // Multi-child: send a single email covering ALL children of the same
        // purchase. We use the "anchor" puentes_session as the trigger.
        const { data: purchase } = await sb
            .from('puentes_purchases')
            .select('id, magic_token, recipient_email, child_name, lang')
            .eq('id', anchor.purchase_id)
            .maybeSingle();
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

        const { data: allSessions } = await sb
            .from('puentes_sessions')
            .select('id, status, ai_sections, adult_profile, source_session_id, created_at')
            .eq('purchase_id', anchor.purchase_id)
            .order('created_at', { ascending: true });
        const sessions = (allSessions ?? []).filter(s => !!s.ai_sections);
        if (sessions.length === 0) return res.status(400).json({ error: 'No ai_sections to send' });

        const adultProfile: AdultProfile | null = (sessions[0].adult_profile as AdultProfile | null) ?? null;

        // Lookup child name for the anchor session
        const sourceIds = sessions.map(s => s.source_session_id).filter(Boolean) as string[];
        const childMap: Record<string, { child_name?: string }> = {};
        if (sourceIds.length > 0) {
            const { data: childRows } = await sb
                .from('perfilamientos')
                .select('id, child_name')
                .in('id', sourceIds);
            for (const c of childRows ?? []) {
                childMap[c.id] = { child_name: c.child_name };
            }
        }

        const lang = anchor.lang || purchase.lang || 'es';
        const t = getCopy(lang);
        const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : (process.env.SITE_URL || 'https://argomethod.com');
        const bridgeMagicLink = `${origin}/puentes/${purchase.magic_token}`;

        const anchorSession = sessions.find(s => s.id === puentes_session_id) ?? sessions[sessions.length - 1];
        const anchorChildName = anchorSession.source_session_id
            ? childMap[anchorSession.source_session_id]?.child_name ?? purchase.child_name ?? ''
            : purchase.child_name ?? '';

        const recipientEmail = purchase.recipient_email || '';
        // Role-aware destination: panel (buyer/responsible) vs online (abuela).
        const { ctaUrl, hasPanel } = await resolvePanelDestination(sb, recipientEmail, lang, origin, bridgeMagicLink);

        const html = buildHtml({
            saludo: (anchorSession.ai_sections as AiSections).saludo,
            childName: anchorChildName,
            adultProfile,
            ctaUrl,
            ctaLabel: hasPanel ? t.panelCta : t.onlineCta,
            ctaNote: hasPanel ? t.panelNote : t.onlineNote,
            lang,
        });

        const subject = `${t.subjectPrefix} ${anchorChildName}`;

        const sendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [recipientEmail],
                subject,
                html,
            }),
        });

        if (!sendRes.ok) {
            const err = await sendRes.text();
            console.error('[send-puentes-email] Resend error:', err);
            return res.status(502).json({ error: 'Resend failed', detail: err });
        }

        // Mark all generated children as 'sent' (the email aggregates them)
        const idsToMark = sessions.map(s => s.id);
        await sb.from('puentes_sessions').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
        }).in('id', idsToMark);

        return res.status(200).json({ ok: true, children_sent: idsToMark.length, has_panel: hasPanel });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[send-puentes-email] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
