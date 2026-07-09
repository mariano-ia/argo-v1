import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/send-puentes-email
 * Body: { puentes_session_id }
 *
 * Sends the final ArgoPuente® report to the recipient_email via Resend.
 * Visual language mirrors the child report email (brújula card with eje
 * pills + axis bars, content cards with section titles, sub-blocks with
 * coloured stripes for child/adult/bridge, reflection callout, plus an
 * "also sent to your email" footer note).
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
        bondTitle: 'Your bond',
        welcome: 'Welcome',
        yourStyle: 'Your natural style',
        bridge: (n: number) => `Bridge ${n}`,
        childState: 'How they tend to feel',
        adultStrength: 'What you bring',
        theBridge: 'The bridge',
        reflection: 'A question to take with you',
        closing: 'To carry with you',
        pressure: 'Style under pressure',
        viewOnline: 'View report online',
        emailNote: (email: string) => `This report has also been sent to ${email}. You can revisit it at the link above whenever you want.`,
        siblingsLabel: 'This ArgoPuente® also includes',
        foreverNote: 'We keep your profile so we can reuse it for new bridges without repeating the questionnaire. If you want us to delete it, write to hola@argomethod.com.',
        footer: 'ArgoMethod® · ArgoPuente®',
        disclaimer: 'This report is not a clinical or therapeutic service. It is an invitation to reflect.',
    };
    if (lang === 'pt') return {
        eyebrow: 'ArgoPuente® · Seu vínculo',
        subjectPrefix: 'Seu ArgoPuente®: vínculo com',
        bondTitle: 'Seu vínculo',
        welcome: 'Boas-vindas',
        yourStyle: 'Seu estilo natural',
        bridge: (n: number) => `Ponte ${n}`,
        childState: 'Como tende a estar',
        adultStrength: 'O que você traz',
        theBridge: 'A ponte',
        reflection: 'Uma pergunta para levar',
        closing: 'Para levar',
        pressure: 'Estilo sob pressão',
        viewOnline: 'Ver relatório online',
        emailNote: (email: string) => `Este relatório também foi enviado para ${email}. Você pode revisitá-lo no link acima quando quiser.`,
        siblingsLabel: 'Este ArgoPuente® também inclui',
        foreverNote: 'Guardamos seu perfil para reutilizá-lo em novas pontes sem repetir o questionário. Se quiser que apaguemos, escreva para hola@argomethod.com.',
        footer: 'ArgoMethod® · ArgoPuente®',
        disclaimer: 'Este relatório não é um serviço clínico nem terapêutico. É um convite à reflexão.',
    };
    return {
        eyebrow: 'ArgoPuente® · Tu vínculo',
        subjectPrefix: 'Tu ArgoPuente®: vínculo con',
        bondTitle: 'Tu vínculo',
        welcome: 'Te damos la bienvenida',
        yourStyle: 'Tu estilo natural',
        bridge: (n: number) => `Puente ${n}`,
        childState: 'Cómo tiende a estar',
        adultStrength: 'Lo que tú traes',
        theBridge: 'El puente',
        reflection: 'Una pregunta para llevarte',
        closing: 'Para llevar',
        pressure: 'Estilo bajo presión',
        viewOnline: 'Ver informe en línea',
        emailNote: (email: string) => `Este informe también te fue enviado a ${email}. Puedes volver al enlace de arriba cuando quieras.`,
        siblingsLabel: 'Este ArgoPuente® también incluye a',
        foreverNote: 'Guardamos tu perfil para reutilizarlo en nuevos puentes sin repetir el cuestionario. Si quieres que lo eliminemos, escríbenos a hola@argomethod.com.',
        footer: 'ArgoMethod® · ArgoPuente®',
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

function brujulaIcon(): string {
    return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="8" r="6.5"/><path d="M8 3v2M8 11v2M3 8h2M11 8h2"/><circle cx="8" cy="8" r="1.5" fill="#6366f1" stroke="none"/>
    </svg>`;
}

function sectionTitle(label: string, icon?: string): string {
    return `
        <table cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
            <tr>
                ${icon ? `<td valign="middle" style="padding-right:8px;color:#86868B;">${icon}</td>` : ''}
                <td valign="middle" style="font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#86868B;">${label}</td>
            </tr>
        </table>`;
}

function subBlock(label: string, text: string, color: string): string {
    return `
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D2D2D7;border-radius:12px;overflow:hidden;margin-bottom:10px;">
            <tr>
                <td width="4" style="background:${color};"></td>
                <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${label}</p>
                    <p style="margin:0;font-size:13px;color:#424245;line-height:1.65;">${text}</p>
                </td>
            </tr>
        </table>`;
}

function reflectionBlock(label: string, text: string): string {
    const violet = '#955FB5';
    return `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:12px;margin-top:16px;">
            <tr><td style="padding:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="18" valign="top" style="padding-top:2px;">
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="${violet}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 14c3.3 0 6-2.7 6-6S11.3 2 8 2 2 4.7 2 8c0 1.2.4 2.3 1 3.2L2 14l3-1"/>
                            </svg>
                        </td>
                        <td style="padding-left:10px;">
                            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${violet};">${label}</p>
                            <p style="margin:0;font-size:13px;color:#1D1D1F;font-weight:500;line-height:1.6;">${text}</p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>`;
}

function buildHtml(args: {
    aiSections: AiSections;
    childName: string;
    childAxis?: string;
    adultProfile?: AdultProfile | null;
    magicLink: string;
    recipientEmail: string;
    lang: string;
    siblings?: Array<{ child_name: string; child_axis?: string }>;
}): string {
    const t = getCopy(args.lang);
    const violet = '#955FB5';
    const subject = `${t.subjectPrefix} ${args.childName}`;

    const adultAxis = args.adultProfile?.eje_primary;
    const adultAxisColor = adultAxis ? AXIS_COLOR[adultAxis] : violet;
    const childAxisColor = args.childAxis && AXIS_COLOR[args.childAxis] ? AXIS_COLOR[args.childAxis] : '#86868B';
    const axisLabels = AXIS_LABEL[args.lang] ?? AXIS_LABEL.es;
    const motorLabels = MOTOR_LABEL[args.lang] ?? MOTOR_LABEL.es;

    // Pills row: adult eje + motor + optional secondary
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
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;margin-bottom:4px;">${renderAxisBars(args.adultProfile.axis_counts, args.adultProfile.eje_primary, args.lang)}</table>`
        : '';

    const pressureHtml = args.adultProfile
        ? renderPressureIndicator(args.adultProfile.pressure_style, args.lang)
        : '';

    const puentesBlocks = args.aiSections.puentes.map((p, i) => `
        <tr><td style="padding-bottom:12px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #D2D2D7;border-radius:12px;">
                <tr><td style="padding:24px 26px;">
                    ${sectionTitle(`${t.bridge(i + 1)}`)}
                    <h2 style="margin:0 0 18px;font-size:22px;font-weight:300;letter-spacing:-0.015em;color:#1D1D1F;line-height:1.2;">${p.titulo}</h2>
                    ${subBlock(t.childState, p.como_esta_el, childAxisColor)}
                    ${subBlock(t.adultStrength, p.lo_que_traes, adultAxisColor)}
                    ${subBlock(t.theBridge, p.el_puente, violet)}
                    ${reflectionBlock(t.reflection, p.pregunta_reflexion)}
                </td></tr>
            </table>
        </td></tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="${args.lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

    <!-- MASTHEAD -->
    <tr><td style="padding-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1D1D1F;border-radius:12px;">
            <tr><td style="padding:22px 28px;">
                <span style="font-size:18px;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;color:#fff;font-weight:100;">Method®</span>
                <span style="background:${violet};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.06em;margin-left:6px;vertical-align:middle;">PUENTE</span>
                <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.13em;text-transform:uppercase;color:#86868B;">${t.eyebrow}</p>
                <p style="margin:6px 0 0;font-size:24px;font-weight:300;color:#fff;letter-spacing:-0.02em;line-height:1.25;">${subject}</p>
            </td></tr>
        </table>
    </td></tr>

    <!-- BRÚJULA: adult profile header -->
    <tr><td style="padding-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#E3E3FF;border:1px solid #C8C8F0;border-radius:12px;">
            <tr><td style="padding:24px 26px;">
                ${sectionTitle(t.eyebrow, brujulaIcon())}
                <h1 style="margin:0;font-size:26px;font-weight:300;letter-spacing:-0.02em;color:#1D1D1F;line-height:1.2;">${t.bondTitle}</h1>
                <p style="margin:4px 0 0;font-size:13px;color:${violet};font-style:italic;">ArgoPuente®</p>
                ${pillsHtml}
                ${axisBarsHtml}
                ${pressureHtml}
            </td></tr>
        </table>
    </td></tr>

    <!-- SALUDO -->
    <tr><td style="padding-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #D2D2D7;border-radius:12px;">
            <tr><td style="padding:24px 26px;">
                ${sectionTitle(t.welcome)}
                <p style="margin:0;font-size:14px;color:#424245;line-height:1.7;">${args.aiSections.saludo}</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:12px;margin-top:18px;">
                    <tr><td style="padding:14px;">
                        <p style="margin:0;font-size:11px;color:#86868B;line-height:1.6;">${t.disclaimer}</p>
                    </td></tr>
                </table>
            </td></tr>
        </table>
    </td></tr>

    <!-- TU ESTILO NATURAL -->
    <tr><td style="padding-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #D2D2D7;border-radius:12px;">
            <tr><td style="padding:24px 26px;">
                ${sectionTitle(t.yourStyle)}
                <p style="margin:0;font-size:14px;color:#424245;line-height:1.7;">${args.aiSections.perfil_adulto_breve}</p>
            </td></tr>
        </table>
    </td></tr>

    <!-- 4 PUENTES -->
    ${puentesBlocks}

    <!-- CIERRE -->
    <tr><td style="padding-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #D2D2D7;border-radius:12px;">
            <tr><td style="padding:24px 26px;">
                ${sectionTitle(t.closing)}
                <p style="margin:0;font-size:14px;color:#424245;line-height:1.7;">${args.aiSections.cierre}</p>
            </td></tr>
        </table>
    </td></tr>

    ${args.siblings && args.siblings.length > 0 ? `
    <!-- SIBLINGS LIST (other children also covered) -->
    <tr><td style="padding-bottom:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5FC;border:1px solid #E8D9F2;border-radius:12px;">
            <tr><td style="padding:18px 24px;">
                <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${violet};">${t.siblingsLabel}</p>
                <div>${args.siblings.map(s => {
                    const color = s.child_axis && AXIS_COLOR[s.child_axis] ? AXIS_COLOR[s.child_axis] : '#86868B';
                    return `<span style="display:inline-block;margin:0 8px 6px 0;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:#fff;border:1px solid ${color}40;color:#1D1D1F;">
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};vertical-align:middle;margin-right:6px;"></span>
                        ${s.child_name}
                    </span>`;
                }).join('')}</div>
            </td></tr>
        </table>
    </td></tr>` : ''}

    <!-- CTA + EMAIL NOTE -->
    <tr><td style="padding-bottom:12px;text-align:center;">
        <a href="${args.magicLink}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 18px rgba(149,95,181,0.28);">${t.viewOnline}</a>
        <p style="margin:14px auto 0;max-width:420px;font-size:11px;color:#86868B;line-height:1.6;">${t.emailNote(args.recipientEmail)}</p>
        <p style="margin:8px auto 0;max-width:440px;font-size:10px;color:#AEAEB2;line-height:1.6;">${t.foreverNote}</p>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#F5F5F7;border:1px solid #E8E8ED;border-radius:12px;padding:18px 28px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">${t.footer}</p>
    </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
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

        // Multi-child: send a single email covering ALL children of the
        // same purchase. We use the "anchor" puentes_session as the email
        // trigger, but the report covers everyone.
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

        // Lookup child eje + name for each session
        const sourceIds = sessions.map(s => s.source_session_id).filter(Boolean) as string[];
        let childMap: Record<string, { eje?: string; child_name?: string }> = {};
        if (sourceIds.length > 0) {
            const { data: childRows } = await sb
                .from('perfilamientos')
                .select('id, eje, child_name')
                .in('id', sourceIds);
            for (const c of childRows ?? []) {
                childMap[c.id] = { eje: c.eje, child_name: c.child_name };
            }
        }

        const lang = anchor.lang || purchase.lang || 'es';
        const t = getCopy(lang);
        const origin = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : (process.env.SITE_URL || 'https://argomethod.com');
        const magicLink = `${origin}/puentes/${purchase.magic_token}`;

        // Choose which child's content goes in the email body. For
        // multi-child, pick the anchor (the one that triggered this email
        // send), or fall back to the most recent. The full report on the
        // web has the switcher; the email is a digest of the anchor child.
        const anchorSession = sessions.find(s => s.id === puentes_session_id) ?? sessions[sessions.length - 1];
        const anchorChildName = anchorSession.source_session_id
            ? childMap[anchorSession.source_session_id]?.child_name ?? purchase.child_name ?? ''
            : purchase.child_name ?? '';
        const anchorChildAxis = anchorSession.source_session_id
            ? childMap[anchorSession.source_session_id]?.eje
            : undefined;

        const html = buildHtml({
            aiSections: anchorSession.ai_sections as AiSections,
            childName: anchorChildName,
            childAxis: anchorChildAxis,
            adultProfile,
            magicLink,
            recipientEmail: purchase.recipient_email || '',
            lang,
            siblings: sessions
                .filter(s => s.id !== anchorSession.id)
                .map(s => ({
                    child_name: s.source_session_id ? childMap[s.source_session_id]?.child_name ?? '' : '',
                    child_axis: s.source_session_id ? childMap[s.source_session_id]?.eje : undefined,
                }))
                .filter(s => s.child_name),
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
                to: [purchase.recipient_email],
                subject,
                html,
            }),
        });

        if (!sendRes.ok) {
            const err = await sendRes.text();
            console.error('[send-puentes-email] Resend error:', err);
            return res.status(502).json({ error: 'Resend failed', detail: err });
        }

        // Mark all generated children as 'sent' (since the email aggregates them)
        const idsToMark = sessions.map(s => s.id);
        await sb.from('puentes_sessions').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
        }).in('id', idsToMark);

        return res.status(200).json({ ok: true, children_sent: idsToMark.length });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[send-puentes-email] Error:', msg);
        return res.status(500).json({ error: 'Internal error', detail: msg });
    }
}
