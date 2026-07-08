import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// Inlined Principia activity logger (best-effort, never throws). Vercel serverless
// functions here do NOT bundle cross-directory imports — importing ../src/lib
// throws ERR_MODULE_NOT_FOUND at runtime (this previously broke this function).
type ActivityInput = { area: string; action: string; sourceType?: string; eventType?: string; actor?: string; resourceType?: string; resourceId?: string; severity?: string; status?: string; reason?: Record<string, unknown>; result?: Record<string, unknown>; relatedLogs?: string[]; incidentId?: number; occurredAt?: string };
async function logActivity(sb: { from: (table: string) => { insert: (values: unknown) => unknown } }, input: ActivityInput): Promise<void> {
    try {
        await sb.from('system_activity_log').insert({
            area: input.area, source_type: input.sourceType ?? 'system', event_type: input.eventType ?? null,
            actor: input.actor ?? null, action: input.action, resource_type: input.resourceType ?? null,
            resource_id: input.resourceId ?? null, severity: input.severity ?? 'info', status: input.status ?? null,
            reason: input.reason ?? null, result: input.result ?? null, related_logs: input.relatedLogs ?? [],
            incident_id: input.incidentId ?? null, occurred_at: input.occurredAt ?? null,
        });
    } catch (err) { console.warn('[principia:logActivity] non-blocking write failed:', err); }
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildHtml(params: {
    nombreAdulto: string;
    nombreNino: string;
    deporte: string;
    edad: number;
    eje: string;
    motor: string;
    arquetipo: string;
    perfil: string;
    palabrasPuente: string[];
    sessionId?: string;
    shareToken?: string;
    lang?: string;
    resumenPerfil?: string;
    siteUrl?: string;
    // If the parent already purchased ArgoPuente®, we swap the upsell CTA
    // for a "your bridges now include {nombre}" message linking to their
    // existing report instead of charging them again.
    existingPuentesMagicLink?: string;
    // Renders the upsell price in the currency the parent previously paid
    // in (ArgoOne®). Undefined means "show both".
    preferredCurrency?: 'usd' | 'ars' | null;
    // Locked demo (is_demo && !full_access): suppress the ArgoPuente® block
    // entirely. We never pitch the adult Puente to someone who only has a demo
    // report; it only appears once they have a full report (paid or gifted).
    suppressPuentes?: boolean;
}): string {
    const langAttr = (params.lang || 'es') as 'es' | 'en' | 'pt';
    const baseUrl = params.siteUrl || 'https://argomethod.com';
    const tokenParam = params.shareToken ? `?token=${params.shareToken}` : '';
    const reportUrl = params.sessionId ? `${baseUrl}/report/${params.sessionId}${tokenParam}` : baseUrl;
    // reportUrl already carries ?token=…, so extra query params must use & (a
    // second ? would corrupt the token and make the report 403 / "not found").
    const fbSep = reportUrl.includes('?') ? '&' : '?';

    const AXIS_DOT: Record<string, string> = {
        D: '#f97316', I: '#f59e0b', S: '#22c55e', C: '#6366f1',
    };
    const axisColor = AXIS_DOT[params.eje] ?? '#955FB5';

    // Canonical motor labels — mirror of docs/archetype-naming.md (kept in
    // sync with src/lib/dashboardTranslations.ts + odysseyTranslations.ts).
    // Rápido→Dinámico · Medio→Rítmico · Lento→Sereno (NOT the old
    // Decidido/Persistente adjective scheme).
    const MOTOR_LABELS: Record<string, Record<string, string>> = {
        es: { Rápido: 'Dinámico',  Medio: 'Rítmico',  Lento: 'Sereno' },
        en: { Rápido: 'Dynamic',   Medio: 'Rhythmic', Lento: 'Serene' },
        pt: { Rápido: 'Dinâmico',  Medio: 'Rítmico',  Lento: 'Sereno' },
    };
    const MOTOR_STYLE: Record<string, { bg: string; text: string }> = {
        Rápido: { bg: 'rgba(245,158,11,0.13)', text: '#b45309' },
        Medio:  { bg: 'rgba(149,95,181,0.1)',  text: '#7A4D96' },
        Lento:  { bg: 'rgba(59,130,246,0.1)',  text: '#1d4ed8' },
    };
    const motorLabelMap = MOTOR_LABELS[langAttr] ?? MOTOR_LABELS.es;
    // Exception: on axis C + Lento the visible motor name is "Observador"
    // (per docs/archetype-naming.md), not "Sereno".
    const isObservador = params.eje === 'C' && params.motor === 'Lento';
    const motorLabel = isObservador
        ? ({ es: 'Observador', en: 'Observant', pt: 'Observador' } as Record<string, string>)[langAttr] ?? 'Observador'
        : motorLabelMap[params.motor] ?? params.motor;
    const motorStyle = MOTOR_STYLE[params.motor] ?? MOTOR_STYLE.Medio;
    const motorPrefix = langAttr === 'en' ? 'Engine' : 'Motor';

    const violet = '#955FB5';
    const violetShadow = 'rgba(149,95,181,0.28)';
    const pillColor = '#16a34a';
    const pillBg = 'rgba(34,197,94,0.09)';
    const pillBorder = 'rgba(34,197,94,0.25)';

    const pill = (word: string) =>
        `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:500;color:${pillColor};background:${pillBg};border:1px solid ${pillBorder};margin:0 5px 6px 0;">${word}</span>`;

    const copy = {
        es: {
            headerTitle: `El informe de <strong style="font-weight:700;">${params.nombreNino}</strong> está listo.`,
            headerSub: `Para ${params.nombreAdulto} · ${params.deporte} · ${params.edad} años`,
            eyebrow: 'Arquetipo',
            bridgeLabel: 'Palabras que lo activan',
            ctaSub: 'El informe completo incluye patrón de decisión, guía de comunicación, checklist del día, tendencia secundaria y más.',
            ctaBtn: 'Ver informe completo →',
            security: '🔒 Este link es personal e intransferible. Solo tú lo recibiste.',
            privacyLink: 'Política de Privacidad de ArgoMethod®',
            reviewTitle: 'Tu opinión nos ayuda a mejorar',
            reviewQ: '¿Qué tan claro te resultó el informe?',
            chips: ['Muy claro', 'Algo claro', 'Confuso'],
            reviewSub: 'Son solo 4 preguntas · 30 segundos',
            footerLine1: 'ArgoMethod® · Informe de Sintonía',
            footerLine2: 'Este informe es una fotografía del presente, no una etiqueta permanente.',
            privacy: 'Privacidad',
            terms: 'Términos',
        },
        en: {
            headerTitle: `<strong style="font-weight:700;">${params.nombreNino}</strong>'s report is ready.`,
            headerSub: `For ${params.nombreAdulto} · ${params.deporte} · ${params.edad} years`,
            eyebrow: 'Archetype',
            bridgeLabel: 'Activating words',
            ctaSub: 'The full report includes decision pattern, communication guide, daily checklist, secondary tendency, and more.',
            ctaBtn: 'View full report →',
            security: '🔒 This link is personal and non-transferable. Only you received it.',
            privacyLink: 'ArgoMethod® Privacy Policy',
            reviewTitle: 'Your feedback helps us improve',
            reviewQ: 'How clear was the report?',
            chips: ['Very clear', 'Somewhat clear', 'Confusing'],
            reviewSub: 'Just 4 questions · 30 seconds',
            footerLine1: 'ArgoMethod® · Profile Report',
            footerLine2: 'This report is a snapshot of the present, not a permanent label.',
            privacy: 'Privacy',
            terms: 'Terms',
        },
        pt: {
            headerTitle: `O relatório de <strong style="font-weight:700;">${params.nombreNino}</strong> está pronto.`,
            headerSub: `Para ${params.nombreAdulto} · ${params.deporte} · ${params.edad} anos`,
            eyebrow: 'Arquétipo',
            bridgeLabel: 'Palavras que o ativam',
            ctaSub: 'O relatório completo inclui padrão de decisão, guia de comunicação, checklist do dia, tendência secundária e mais.',
            ctaBtn: 'Ver relatório completo →',
            security: '🔒 Este link é pessoal e intransferível. Só você o recebeu.',
            privacyLink: 'Política de Privacidade do ArgoMethod®',
            reviewTitle: 'Sua opinião nos ajuda a melhorar',
            reviewQ: 'Quão claro foi o relatório?',
            chips: ['Muito claro', 'Um pouco claro', 'Confuso'],
            reviewSub: 'São apenas 4 perguntas · 30 segundos',
            footerLine1: 'ArgoMethod® · Relatório de Perfil',
            footerLine2: 'Este relatório é uma fotografia do presente, não um rótulo permanente.',
            privacy: 'Privacidade',
            terms: 'Termos',
        },
    };
    const c = copy[langAttr] ?? copy.es;

    // ArgoPuente® upsell CTA (shown only when we have a sessionId so the
    // user can be tied back to their source child session).
    const puentesCheckoutUrl = params.sessionId
        ? `${baseUrl}/puentes/checkout?source_session_id=${params.sessionId}&lang=${langAttr}`
        : `${baseUrl}/puentes/checkout`;

    // ArgoPuente® cuesta USD 4.99. Fase 0 = Stripe USD únicamente (el path ARS está bypassed,
    // ver api/puentes-checkout.ts), así que TODOS pagan USD 4.99. Se muestra siempre USD 4.99:
    // el viejo 'ARS 4.999' para padres con preferencia ARS era un precio arbitrario y engañoso
    // (igual pagaban en USD). Fase 1 TODO: cuando se habilite ARS nativo, mostrar el precio ARS real.
    const priceLine = 'USD 4.99';

    // Two copy variants: upsell (parent has not paid) vs included (parent
    // already has ArgoPuente®, this child is now part of their bond report).
    // The upsell copy follows Variant A: anchor on the moment, propose the
    // next step, surface the "one purchase forever, all children" value.
    const upsellCopy = {
        es: {
            eyebrow: 'ArgoPuente® · Tu complemento',
            title: `Ahora que conoces a ${params.nombreNino}, conócete a ti.`,
            body: `Cinco minutos de cuestionario. Un informe propio que revela tu estilo y cuatro puentes específicos para acompañar a ${params.nombreNino} mejor en su deporte.`,
            highlight: 'Una compra te cubre para cada niño, para siempre.',
            cta: 'Empezar mi ArgoPuente®',
            price: priceLine,
        },
        en: {
            eyebrow: 'ArgoPuente® · Your companion piece',
            title: `Now that you know ${params.nombreNino}, get to know yourself.`,
            body: `A five-minute questionnaire. Your own profile, with four specific bridges to better accompany ${params.nombreNino} in sport.`,
            highlight: 'One purchase covers you for every child, forever.',
            cta: 'Start my ArgoPuente®',
            price: priceLine,
        },
        pt: {
            eyebrow: 'ArgoPuente® · Seu complemento',
            title: `Agora que conhece ${params.nombreNino}, conheça a si.`,
            body: `Cinco minutos de questionário. Seu próprio relatório, com quatro pontes específicas para acompanhar ${params.nombreNino} melhor no esporte.`,
            highlight: 'Uma compra cobre você para cada criança, para sempre.',
            cta: 'Começar meu ArgoPuente®',
            price: priceLine,
        },
    };
    const includedCopy = {
        es: {
            eyebrow: 'Tu ArgoPuente® ahora incluye más',
            title: `Sumamos a ${params.nombreNino} a tu informe`,
            body: `Como ya tienes ArgoPuente® activo, generamos automáticamente los puentes con ${params.nombreNino}. Tu informe ahora los incluye a todos en un solo lugar, sin volver a cobrarte.`,
            highlight: '',
            cta: 'Ver mi informe actualizado',
            price: '',
        },
        en: {
            eyebrow: 'Your ArgoPuente® now includes more',
            title: `${params.nombreNino} has been added to your report`,
            body: `Since you already have ArgoPuente® active, we automatically generated the bridges with ${params.nombreNino}. Your report now covers every child in one place, with no extra charge.`,
            highlight: '',
            cta: 'View my updated report',
            price: '',
        },
        pt: {
            eyebrow: 'Seu ArgoPuente® agora inclui mais',
            title: `${params.nombreNino} foi adicionado(a) ao seu relatório`,
            body: `Como você já tem ArgoPuente® ativo, geramos automaticamente as pontes com ${params.nombreNino}. Seu relatório agora cobre todos eles em um só lugar, sem cobrança adicional.`,
            highlight: '',
            cta: 'Ver meu relatório atualizado',
            price: '',
        },
    };

    const isIncluded = Boolean(params.existingPuentesMagicLink);
    const puentesCopy = isIncluded ? includedCopy : upsellCopy;
    const pc = puentesCopy[langAttr] ?? puentesCopy.es;
    const puentesActionUrl = isIncluded ? (params.existingPuentesMagicLink as string) : puentesCheckoutUrl;

    const puentesWidget = (params.sessionId && !params.suppressPuentes) ? `
  <!-- SEPARATOR -->
  <tr><td style="padding:0 28px;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- ARGO PUENTES UPSELL -->
  <tr>
    <td style="padding:24px 28px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5FC;border-radius:14px;border:1px solid #ECE3F3;">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${violet};">${pc.eyebrow}</p>
          <h3 style="margin:0 0 10px;font-size:19px;font-weight:600;color:#1D1D1F;letter-spacing:-0.01em;line-height:1.3;">${pc.title}</h3>
          <p style="margin:0 0 14px;font-size:14px;color:#424245;line-height:1.65;">${pc.body}</p>
          ${pc.highlight ? `<p style="margin:0 0 20px;font-size:13px;color:${violet};font-weight:600;line-height:1.5;">${pc.highlight}</p>` : ''}
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <a href="${puentesActionUrl}" style="display:inline-block;background:${violet};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;box-shadow:0 2px 8px ${violetShadow};">${pc.cta}</a>
              </td>
              ${pc.price ? `<td style="vertical-align:middle;padding-left:14px;">
                <span style="font-size:13px;color:#86868B;font-weight:500;">${pc.price}</span>
              </td>` : ''}
            </tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>` : '';

    const reviewChip = (feedback: string, label: string, selected = false) =>
        selected
            ? `<a href="${reportUrl}${fbSep}feedback=${feedback}" style="display:inline-block;background:#1D1D1F;color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;padding:8px 18px;border-radius:24px;margin:0 3px 8px;border:1px solid #1D1D1F;">✓ ${label}</a>`
            : `<a href="${reportUrl}${fbSep}feedback=${feedback}" style="display:inline-block;background:#ffffff;color:#86868B;font-size:12px;font-weight:500;text-decoration:none;padding:8px 18px;border-radius:24px;margin:0 3px 8px;border:1px solid #E8E8ED;">${label}</a>`;

    const reviewWidget = params.sessionId ? `
  <!-- SEPARATOR -->
  <tr><td style="padding:30px 28px 0;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- REVIEW (lightweight, footer-style — must not compete with the CTA/upsell above) -->
  <tr>
    <td style="padding:22px 28px 4px;text-align:center;">
      <p style="margin:0 0 13px;font-size:12px;color:#86868B;">${c.reviewQ}</p>
      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="padding:0 4px;"><![endif]-->
      ${reviewChip('muy_claro', c.chips[0], true)}
      <!--[if mso]></td><td style="padding:0 4px;"><![endif]-->
      ${reviewChip('algo_claro', c.chips[1])}
      <!--[if mso]></td><td style="padding:0 4px;"><![endif]-->
      ${reviewChip('confuso', c.chips[2])}
      <!--[if mso]></td></tr></table><![endif]-->
      <p style="margin:10px 0 0;font-size:11px;color:#AEAEB2;">${c.reviewSub}</p>
    </td>
  </tr>` : '';

    return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${params.arquetipo} · ArgoMethod®</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(29,29,31,0.07);">

  <!-- HEADER -->
  <tr>
    <td style="background:#1D1D1F;padding:26px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:800;">Argo</span><span style="font-size:18px;letter-spacing:-0.02em;color:#fff;font-weight:100;"> Method</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:14px;">
            <p style="margin:0;font-size:23px;font-weight:300;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">
              ${c.headerTitle}
            </p>
            <p style="margin:7px 0 0;font-size:13px;color:#86868B;">${c.headerSub}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO: ARQUETIPO -->
  <tr>
    <td style="padding:30px 28px 26px;">

      <!-- Eyebrow -->
      <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:#AEAEB2;">${c.eyebrow}</p>

      <!-- Archetype name row -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:9px;">
            <span style="display:block;width:11px;height:11px;border-radius:50%;background:${axisColor};"></span>
          </td>
          <td style="vertical-align:middle;padding-right:12px;">
            <span style="font-size:29px;font-weight:300;color:#1D1D1F;letter-spacing:-0.04em;line-height:1;">${params.arquetipo}</span>
          </td>
          <td style="vertical-align:middle;">
            <span style="background:${motorStyle.bg};color:${motorStyle.text};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;white-space:nowrap;">${motorPrefix} ${motorLabel}</span>
          </td>
        </tr>
      </table>

      <!-- Perfil sentence -->
      <p style="margin:18px 0 0;font-size:15px;color:#424245;line-height:1.7;max-width:480px;">
        ${params.perfil}
      </p>

      <!-- Bridge words -->
      <div style="margin-top:20px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#AEAEB2;">${c.bridgeLabel}</p>
        <div style="line-height:1;">
          ${params.palabrasPuente.map(pill).join('')}
        </div>
      </div>

    </td>
  </tr>

  ${params.resumenPerfil ? `<!-- CONTRATO DE SINTONÍA -->
  <tr>
    <td style="padding:0 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D2D2D7;border-radius:14px;">
        <tr><td style="padding:20px 18px;">
          <p style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#86868B;margin:0 0 14px 0;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#86868B;vertical-align:middle;margin-right:8px;"></span>
            ${langAttr === 'en' ? 'THE TUNING CONTRACT' : langAttr === 'pt' ? 'O CONTRATO DE SINTONIA' : 'EL CONTRATO DE SINTONÍA'}
          </p>
          ${params.resumenPerfil.split(/\n\n+/).filter(Boolean).map(p => {
              // Strip any leaked HTML before converting markdown bold so tags
              // don't render as real markup in the email (defensive: generate-ai
              // sanitizes at the source).
              const html = p.trim()
                  .replace(/<[^>]+>/g, '')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
              return `<p style="font-size:14px;color:#424245;line-height:1.75;margin:0 0 10px 0;">${html}</p>`;
          }).join('')}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr><td style="padding:12px 14px;background:#F5F5F7;border-radius:12px;">
              <p style="font-size:11px;color:#86868B;line-height:1.6;margin:0;">
                ℹ️ ${langAttr === 'en' ? 'This report does not evaluate talent or predict athletic future. It describes present tendencies that may evolve. It is a snapshot, not a permanent label.' : langAttr === 'pt' ? 'Este relatório não avalia talento nem prevê o futuro esportivo. Descreve tendências presentes que podem evoluir. É uma fotografia do momento, não um rótulo permanente.' : 'Este informe no evalúa talento ni predice el futuro deportivo. Describe tendencias presentes que pueden evolucionar. Es una fotografía del momento, no una etiqueta permanente.'}
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- SEPARATOR -->
  <tr><td style="padding:0 28px;"><div style="height:1px;background:#E8E8ED;"></div></td></tr>

  <!-- CTA -->
  <tr>
    <td style="padding:28px 28px 8px;text-align:center;">

      <p style="margin:0 0 22px;font-size:14px;color:#86868B;line-height:1.65;max-width:420px;margin-left:auto;margin-right:auto;">
        ${c.ctaSub}
      </p>

      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td><![endif]-->
      <a href="${reportUrl}"
         style="display:inline-block;background:${violet};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:17px 44px;border-radius:12px;letter-spacing:-0.01em;box-shadow:0 4px 18px ${violetShadow};">
        ${c.ctaBtn}
      </a>
      <!--[if mso]></td></tr></table><![endif]-->

      <!-- Security note -->
      <p style="margin:20px auto 0;font-size:11px;color:#AEAEB2;line-height:1.7;max-width:400px;">
        ${c.security}<br/>
        <a href="https://argomethod.com/privacy" style="color:#AEAEB2;text-decoration:underline;">${c.privacyLink}</a>
      </p>

    </td>
  </tr>
  ${puentesWidget}
  ${reviewWidget}

  <!-- FOOTER -->
  <tr>
    <td style="background:#F5F5F7;border-top:1px solid #E8E8ED;padding:18px 28px;text-align:center;">
      <p style="margin:0 0 5px;font-size:11px;color:#AEAEB2;letter-spacing:0.07em;text-transform:uppercase;">
        ${c.footerLine1}
      </p>
      <p style="margin:0;font-size:11px;color:#AEAEB2;line-height:1.6;">
        ${c.footerLine2}
        <br/>
        <a href="https://argomethod.com/privacy" style="color:#AEAEB2;text-decoration:underline;">${c.privacy}</a>
        &nbsp;·&nbsp;
        <a href="https://argomethod.com/terms" style="color:#AEAEB2;text-decoration:underline;">${c.terms}</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

// ─── Email v4 (diseño aprobado por el owner 2026-07-07) ───────────────────────
// Render del informe v4 en el email: arquetipo eje×veta (SIN chip de motor legacy), voz nueva,
// ArgoPuente USD 4.99. Se usa cuando el informe está sellado v4 (report_status ready/sent); si no,
// el email legacy (buildHtml). i18n es/en/pt (el v4 se sella en cualquiera de los tres). El conector
// de la veta ("con veta / con tonos de / con destellos de" y sus pares en/pt) sale de las piezas
// hero.veta (pre/word/post), nunca hardcodeado. Maqueta aprobada: scratchpad/email-v4.html.
type HeroV4 = {
    primarioLabel?: string; vetaLabel?: string | null; ejePrimario?: string; ejeSecundario?: string; lead?: string;
    veta?: { pre: string; word: string; post: string } | null;
};
export function buildHtmlV4(hero: HeroV4, params: {
    nombreNino: string; nombreAdulto?: string; edad?: number; deporte?: string;
    sessionId?: string; shareToken?: string; siteUrl?: string; lang?: string;
    suppressPuentes?: boolean; existingPuentesMagicLink?: string;
}): string {
    const lg = (params.lang === 'en' || params.lang === 'pt') ? params.lang : 'es';
    const n = params.nombreNino;
    const AXIS: Record<string, string> = { D: '#F97316', I: '#F59E0B', S: '#22C55E', C: '#6366F1' };
    const accent = AXIS[hero.ejePrimario ?? ''] ?? '#955FB5';
    const vetaColor = AXIS[hero.ejeSecundario ?? ''] ?? '#86868B';
    const rich = (s: string) => (s || '').replace(/\*\*([^*]+)\*\*/g, '<b style="color:#1D1D1F;">$1</b>');
    const baseUrl = params.siteUrl || 'https://argomethod.com';
    const tokenParam = params.shareToken ? `?token=${params.shareToken}` : '';
    const reportUrl = params.sessionId ? `${baseUrl}/report/${params.sessionId}${tokenParam}` : baseUrl;
    const puentesUrl = params.sessionId ? `${baseUrl}/puentes/checkout?source_session_id=${params.sessionId}&lang=${lg}` : `${baseUrl}/puentes/checkout`;

    const T = {
        es: {
            eyebrow: 'Informe de perfil', title: `El informe de ${n} ya está listo`, ageWord: 'años', forWord: 'para',
            ctaBtn: `Ver el informe completo de ${n}`, ctaSub: 'Su mezcla, cómo cambia según la situación, su motor, cómo acompañarlo y más.',
            puenteEyebrow: 'ArgoPuente® · Tu complemento', puenteTitle: `Ahora que conoces a ${n}, conócete a ti.`,
            puenteBody: `Cinco minutos de cuestionario. Un informe propio que revela tu estilo y cuatro puentes específicos para acompañar a ${n} mejor en su deporte.`,
            puenteBtn: 'Empezar mi ArgoPuente®',
            existingPuente: `Tu ArgoPuente® ya incluye a ${n}. <a href="__LINK__" style="color:#7A4D96;font-weight:600;text-decoration:none;">Ver el informe del vínculo</a>.`,
            footerTail: 'Perfil conductual para el deporte formativo.', footerNote: 'Este informe es una foto del presente, no una etiqueta permanente.',
        },
        en: {
            eyebrow: 'Profile report', title: `${n}'s report is ready`, ageWord: 'years', forWord: 'for',
            ctaBtn: `View ${n}'s full report`, ctaSub: `Their blend, how it shifts by situation, their engine, how to support them, and more.`,
            puenteEyebrow: 'ArgoPuente® · Your complement', puenteTitle: `Now that you know ${n}, get to know yourself.`,
            puenteBody: `Five minutes of questions. Your own report revealing your style and four specific bridges to support ${n} better in their sport.`,
            puenteBtn: 'Start my ArgoPuente®',
            existingPuente: `Your ArgoPuente® already includes ${n}. <a href="__LINK__" style="color:#7A4D96;font-weight:600;text-decoration:none;">See the bond report</a>.`,
            footerTail: 'Behavioral profile for youth sport.', footerNote: 'This report is a snapshot of the present, not a permanent label.',
        },
        pt: {
            eyebrow: 'Relatório de perfil', title: `O relatório de ${n} já está pronto`, ageWord: 'anos', forWord: 'para',
            ctaBtn: `Ver o relatório completo de ${n}`, ctaSub: 'A mistura dele, como muda conforme a situação, seu motor, como acompanhá-lo e mais.',
            puenteEyebrow: 'ArgoPuente® · Seu complemento', puenteTitle: `Agora que você conhece ${n}, conheça você mesmo.`,
            puenteBody: `Cinco minutos de perguntas. Um relatório próprio que revela seu estilo e quatro pontes específicas para acompanhar ${n} melhor no esporte.`,
            puenteBtn: 'Começar meu ArgoPuente®',
            existingPuente: `Seu ArgoPuente® já inclui ${n}. <a href="__LINK__" style="color:#7A4D96;font-weight:600;text-decoration:none;">Ver o relatório do vínculo</a>.`,
            footerTail: 'Perfil comportamental para o esporte formativo.', footerNote: 'Este relatório é uma foto do presente, não um rótulo permanente.',
        },
    }[lg];

    const kidLine = [n, params.edad ? `${params.edad} ${T.ageWord}` : '', params.deporte, params.nombreAdulto ? `${T.forWord} ${params.nombreAdulto}` : ''].filter(Boolean).join(' &nbsp;·&nbsp; ');

    // Veta con sus piezas (pre/word/post) para colorear la palabra del segundo eje y dejar el conector
    // ("con veta / with a … streak / com veta") en gris. Si un blob viejo no trae hero.veta, lo deriva
    // de vetaLabel (retrocompatible es/en/pt). Sin veta => solo el eje primario.
    const vd = hero.veta
        ? hero.veta
        : (hero.vetaLabel
            ? { pre: /^\s*with a/i.test(hero.vetaLabel) ? 'with a' : /^\s*com veta/i.test(hero.vetaLabel) ? 'com veta' : 'con veta',
                word: hero.vetaLabel.replace(/^\s*(con veta|with a|com veta)\s+/i, '').replace(/\s+(lean|streak)\s*$/i, ''),
                post: /\s+lean\s*$/i.test(hero.vetaLabel) ? 'lean' : /\s+streak\s*$/i.test(hero.vetaLabel) ? 'streak' : '' }
            : null);
    const arquetipo = `<span style="color:${accent};">${hero.primarioLabel ?? ''}</span>`
        + (vd && vd.word
            ? ` <span style="color:#86868B;font-weight:400;">${vd.pre}</span> <span style="color:${vetaColor};">${vd.word}</span>${vd.post ? ` <span style="color:#86868B;font-weight:400;">${vd.post}</span>` : ''}`
            : '');

    let puente = '';
    if (params.existingPuentesMagicLink) {
        puente = `<div style="padding:24px 32px 0;"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A4D96;">ArgoPuente®</div><div style="font-size:15px;color:#424245;margin-top:8px;line-height:1.5;">${T.existingPuente.replace('__LINK__', params.existingPuentesMagicLink)}</div></div>`;
    } else if (!params.suppressPuentes) {
        puente = `<div style="padding:24px 32px 0;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A4D96;">${T.puenteEyebrow}</div>
      <div style="font-size:18px;font-weight:600;color:#1D1D1F;letter-spacing:-0.01em;margin-top:8px;line-height:1.3;">${T.puenteTitle}</div>
      <div style="font-size:13.5px;color:#424245;margin-top:8px;line-height:1.55;">${T.puenteBody}</div>
      <div style="margin-top:16px;">
        <a href="${puentesUrl}" style="display:inline-block;background:#7A4D96;color:#FFFFFF;font-size:14px;font-weight:600;padding:11px 22px;border-radius:11px;text-decoration:none;">${T.puenteBtn}</a>
        <span style="font-size:14px;color:#1D1D1F;font-weight:600;margin-left:12px;">USD 4.99</span>
      </div>
    </div>`;
    }

    return `<!doctype html>
<html lang="${lg}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${(hero.primarioLabel ?? 'Informe')} · ArgoMethod®</title></head>
<body style="margin:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="padding:28px 12px 40px;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E8E8ED;border-radius:16px;overflow:hidden;">
    <div style="padding:22px 32px 0;"><span style="font-size:17px;font-weight:800;color:#1D1D1F;letter-spacing:-0.01em;">Argo</span><span style="font-size:17px;font-weight:300;color:#86868B;">Method®</span></div>
    <div style="padding:26px 32px 0;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#AEAEB2;">${T.eyebrow}</div>
      <div style="font-size:22px;font-weight:600;color:#1D1D1F;letter-spacing:-0.02em;margin-top:6px;">${T.title}</div>
      <div style="font-size:13px;color:#86868B;margin-top:6px;">${kidLine}</div>
    </div>
    <div style="padding:22px 32px 0;">
      <div style="background:#F8F8FA;border:1px solid #E8E8ED;border-radius:14px;padding:20px 22px;">
        <div style="font-size:26px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;">${arquetipo}</div>
        <div style="font-size:13.5px;color:#424245;margin-top:10px;line-height:1.55;">${rich(hero.lead ?? '')}</div>
      </div>
    </div>
    <div style="padding:22px 32px 0;text-align:center;">
      <a href="${reportUrl}" style="display:inline-block;background:#0071E3;color:#FFFFFF;font-size:15px;font-weight:600;padding:13px 28px;border-radius:12px;letter-spacing:-0.01em;text-decoration:none;">${T.ctaBtn}</a>
      <div style="font-size:12px;color:#AEAEB2;margin-top:10px;">${T.ctaSub}</div>
    </div>
    <div style="padding:26px 32px 0;"><div style="height:1px;background:#E8E8ED;"></div></div>
    ${puente}
    <div style="padding:28px 32px 26px;">
      <div style="height:1px;background:#E8E8ED;margin-bottom:16px;"></div>
      <div style="font-size:11.5px;color:#AEAEB2;line-height:1.6;"><span style="font-weight:800;color:#86868B;">Argo</span><span style="font-weight:300;color:#AEAEB2;">Method®</span> · ${T.footerTail}<br>${T.footerNote}</div>
    </div>
  </div>
</div>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('[send-email] RESEND_API_KEY is not set');
            return res.status(500).json({ error: 'RESEND_API_KEY no está configurada en las variables de entorno de Vercel.' });
        }

        const body = req.body;
        if (!body || typeof body !== 'object') {
            console.error('[send-email] req.body is missing or not an object:', typeof body);
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const {
            toEmail,
            nombreAdulto,
            nombreNino,
            deporte,
            edad,
            eje,
            motor,
            arquetipo,
            perfil,
            palabrasPuente,
            sessionId,
            shareToken,
            lang,
            emailSubject,
            resumenPerfil,
        } = body as {
            toEmail: string;
            nombreAdulto: string;
            nombreNino: string;
            deporte: string;
            edad: number;
            eje: string;
            motor: string;
            arquetipo: string;
            perfil: string;
            palabrasPuente: string[];
            sessionId?: string;
            shareToken?: string;
            lang?: string;
            emailSubject?: string;
            resumenPerfil?: string;
        };

        console.log('[send-email] Request received:', {
            toEmail,
            nombreNino,
            eje,
            motor,
            lang,
            sessionId,
            hasApiKey: !!apiKey,
        });

        if (!toEmail || !nombreNino) {
            // qa-monitor CHECK 8 probes this endpoint hourly with an empty body ({}) to
            // confirm it boots (a 4xx here = healthy, a 5xx = crashed). That inert probe
            // must NOT surface as an error. Only log a call that actually carried a payload
            // but was still missing required fields — that's a real malformed caller.
            const carriedPayload = !!body && typeof body === 'object' && Object.keys(body).length > 0;
            if (carriedPayload) {
                console.error('[send-email] Missing required fields — toEmail:', toEmail, 'nombreNino:', nombreNino);
            }
            return res.status(400).json({ error: 'Missing required fields: toEmail, nombreNino' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(toEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Single session fetch reused for idempotency, share_token, and
        // report-content hydration below. Pulls the stored ai_sections so we
        // can backfill the full report regardless of what the caller passed.
        type SessionRow = {
            email_sent_at?: string | null;
            share_token?: string | null;
            ai_sections?: { resumenPerfil?: string; palabrasPuente?: string[] } | null;
            is_demo?: boolean | null;
            full_access?: boolean | null;
            report_status?: string | null;
            report_v4?: { hero?: { primarioLabel?: string; vetaLabel?: string | null; ejePrimario?: string; ejeSecundario?: string; lead?: string; veta?: { pre: string; word: string; post: string } | null } } | null;
        };
        let sessionRow: SessionRow | null = null;
        if (sessionId) {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            if (serviceKey && supabaseUrl) {
                const sb = createClient(supabaseUrl, serviceKey);
                const { data } = await sb
                    .from('perfilamientos')
                    .select('email_sent_at, share_token, ai_sections, is_demo, full_access, report_status, report_v4')
                    .eq('id', sessionId)
                    .maybeSingle();
                sessionRow = (data as SessionRow) ?? null;

                // Idempotency: skip if already sent for this session
                if (sessionRow?.email_sent_at) {
                    console.log('[send-email] Already sent for session', sessionId);
                    return res.status(200).json({ success: true, already_sent: true });
                }

                // ── Fail-closed choke-point (doc METODO-FALLBACK-INFORME.md §3) ──
                // The ONLY place a report leaves the system. A v4 report ships ONLY if the
                // quality gate sealed report_status='ready'. NULL = legacy row (ungated,
                // backward-compat). 'held'/'pending' => never send; the recovery cron / admin
                // approval flow resolves it. This inverts today's fail-OPEN behaviour.
                const rs = sessionRow?.report_status ?? null;
                if (rs !== null && rs !== 'ready' && rs !== 'sent') {
                    console.warn('[send-email] BLOCKED: report_status=', rs, 'for session', sessionId);
                    return res.status(409).json({
                        success: false,
                        blocked: true,
                        report_status: rs,
                        message: 'Report is not ready (held/pending). Not sent.',
                    });
                }
            }
        }

        // If no shareToken provided but we have one on the session, use it
        const finalShareToken = shareToken || sessionRow?.share_token || undefined;

        // Derive siteUrl from the request host so preview deploys receive
        // emails that link back to the preview (not to argomethod.com which
        // wouldn't have the session). Falls back to SITE_URL env and then
        // to argomethod.com for production.
        const hostHeader = (req.headers['x-forwarded-host'] ?? req.headers.host) as string | undefined;
        const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
        const derivedSiteUrl = hostHeader ? `${protoHeader}://${hostHeader}` : null;
        const siteUrl = derivedSiteUrl || process.env.SITE_URL || 'https://argomethod.com';

        // Look up the parent's preferred currency from their ArgoOne®
        // purchase history (if any). Lets the upsell CTA mirror the
        // currency they have already paid in (ARS-only or USD-only).
        // Safe wrapper: failure falls back to showing both currencies.
        let preferredCurrency: 'usd' | 'ars' | null = null;
        try {
            if (toEmail) {
                const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                const sUrl = process.env.VITE_SUPABASE_URL;
                if (sKey && sUrl) {
                    const sbForCurrency = createClient(sUrl, sKey);
                    const { data: lastPurchase } = await sbForCurrency
                        .from('one_purchases')
                        .select('currency, paid_at')
                        .eq('email', toEmail)
                        .eq('payment_status', 'paid')
                        .order('paid_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (lastPurchase?.currency === 'ars') preferredCurrency = 'ars';
                    else if (lastPurchase?.currency === 'usd') preferredCurrency = 'usd';
                }
            }
        } catch (currErr) {
            console.warn('[send-email] Currency lookup failed, falling back to dual price:', currErr instanceof Error ? currErr.message : currErr);
            preferredCurrency = null;
        }

        // ArgoPuente® multi-child: if this adult email already has a paid
        // ArgoPuente® purchase, we replace the upsell with "included" copy
        // and AUTO-CREATE the puentes_session for this child + trigger
        // generation, so the parent gets the new bridges automatically.
        //
        // SAFETY: this whole block is wrapped in try/catch so any failure in
        // the Puentes lookup or insert can never block the child report
        // email itself. If it fails we just fall back to showing the
        // standard upsell CTA.
        // Locked demo: the adult only has a demo report, so never pitch (or
        // auto-create) ArgoPuente®. The Puente only makes sense once they have a
        // full report (after paying $9.99 to unlock, or an admin full_access gift).
        const isLockedDemo = Boolean(sessionRow?.is_demo) && !sessionRow?.full_access;
        let existingPuentesMagicLink: string | undefined;
        try {
            if (sessionId && toEmail && !isLockedDemo) {
                const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                const sUrl = process.env.VITE_SUPABASE_URL;
                if (sKey && sUrl) {
                    const sbForPuentes = createClient(sUrl, sKey);
                    const { data: paidPurchase } = await sbForPuentes
                        .from('puentes_purchases')
                        .select('id, magic_token, lang')
                        .eq('recipient_email', toEmail)
                        .eq('status', 'paid')
                        .maybeSingle();
                    if (paidPurchase) {
                        existingPuentesMagicLink = `${siteUrl}/puentes/${paidPurchase.magic_token}`;

                        // Ensure a puentes_session exists for this source_session
                        const { data: existingSession } = await sbForPuentes
                            .from('puentes_sessions')
                            .select('id, status, ai_sections')
                            .eq('purchase_id', paidPurchase.id)
                            .eq('source_session_id', sessionId)
                            .maybeSingle();

                        if (!existingSession) {
                            // Get adult_profile from any sibling session of the
                            // same purchase so the new bridge inherits the
                            // already-resolved adult profile.
                            const { data: sibling } = await sbForPuentes
                                .from('puentes_sessions')
                                .select('adult_answers, adult_profile')
                                .eq('purchase_id', paidPurchase.id)
                                .not('adult_profile', 'is', null)
                                .limit(1)
                                .maybeSingle();

                            const insertPayload: any = {
                                purchase_id: paidPurchase.id,
                                source_session_id: sessionId,
                                lang: paidPurchase.lang,
                                status: sibling ? 'answered' : 'created',
                            };
                            if (sibling) {
                                insertPayload.adult_answers = sibling.adult_answers;
                                insertPayload.adult_profile = sibling.adult_profile;
                            }
                            const { data: newSession } = await sbForPuentes
                                .from('puentes_sessions')
                                .insert(insertPayload)
                                .select('id')
                                .single();

                            // Fire-and-forget generation if we already had an
                            // adult profile (no need to wait for it here).
                            if (newSession && sibling) {
                                const internalOrigin = process.env.VERCEL_URL
                                    ? `https://${process.env.VERCEL_URL}`
                                    : siteUrl;
                                fetch(`${internalOrigin}/api/generate-puentes`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ puentes_session_id: newSession.id }),
                                }).catch(err => console.warn('[send-email] auto-generate-puentes failed:', err));
                            }
                        }
                    }
                }
            }
        } catch (puentesErr) {
            console.warn('[send-email] Puentes lookup failed, falling back to default upsell CTA:', puentesErr instanceof Error ? puentesErr.message : puentesErr);
            existingPuentesMagicLink = undefined;
        }

        // ── Hydrate report content so EVERY send path emails the full
        // template ───────────────────────────────────────────────────────────
        // The auto-send after play and both dashboard "resend" buttons used to
        // pass partial data (e.g. no resumenPerfil, empty perfil on non-es),
        // so the Contrato de Sintonía + hero copy silently dropped out of the
        // delivered email. We backfill any missing field from the session's
        // stored ai_sections. Caller-provided values always win; we only fill
        // gaps.
        let finalPerfil = perfil;
        let finalPalabrasPuente = Array.isArray(palabrasPuente) ? palabrasPuente : [];
        let finalResumenPerfil = resumenPerfil;
        // Backfill from the session's ai_sections if the caller passed gaps.
        // (We can't pull the deterministic-engine perfil here without an
        // /src import, which breaks Vercel's serverless bundle.)
        if (sessionRow?.ai_sections) {
            const ai = sessionRow.ai_sections;
            if (!finalPalabrasPuente.length && ai.palabrasPuente?.length) {
                finalPalabrasPuente = ai.palabrasPuente;
            }
            if ((!finalResumenPerfil || !finalResumenPerfil.trim()) && ai.resumenPerfil) {
                finalResumenPerfil = ai.resumenPerfil;
            }
        }

        // v4 email when the report is sealed v4 (report_status ready/sent + report_v4 present);
        // otherwise the legacy email. Until V4_SEAL activates, report_status is NULL => legacy.
        // buildHtmlV4 is now i18n (es/en/pt), so it wraps sealed reports in any of the three
        // languages; the veta connector comes from hero.veta pieces (banda-aware), never hardcoded.
        const rv4 = sessionRow?.report_v4;
        const useV4 = !!rv4?.hero && (sessionRow?.report_status === 'ready' || sessionRow?.report_status === 'sent');
        const html = useV4
            ? buildHtmlV4(rv4!.hero!, {
                nombreNino, nombreAdulto, edad, deporte,
                sessionId, shareToken: finalShareToken, siteUrl, lang,
                suppressPuentes: isLockedDemo, existingPuentesMagicLink,
            })
            : buildHtml({
                nombreAdulto, nombreNino, deporte, edad, eje, motor, arquetipo,
                perfil: finalPerfil,
                palabrasPuente: finalPalabrasPuente,
                sessionId, shareToken: finalShareToken, lang, resumenPerfil: finalResumenPerfil,
                siteUrl,
                existingPuentesMagicLink,
                preferredCurrency,
                suppressPuentes: isLockedDemo,
            });

        const langAttr = lang || 'es';
        const autoSubject = langAttr === 'en'
            ? `${nombreNino}'s ArgoMethod® report is ready`
            : langAttr === 'pt'
            ? `O relatório de ${nombreNino} pelo ArgoMethod® está pronto`
            : `El informe de ${nombreNino} en ArgoMethod® está listo`;
        const subject = emailSubject || autoSubject;

        console.log('[send-email] Calling Resend API — to:', toEmail, 'subject:', subject);

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Argo Method <hola@argomethod.com>',
                to: [toEmail],
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido de Resend' }));
            console.error('[send-email] Resend API error — status:', response.status, 'body:', JSON.stringify(error));
            // Principia ingestion (area=producto): report email failed to send.
            try {
                const supabaseUrl = process.env.VITE_SUPABASE_URL;
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (supabaseUrl && serviceKey) {
                    const sbErr = createClient(supabaseUrl, serviceKey);
                    await logActivity(sbErr, {
                        area: 'producto',
                        action: 'report_email_failed',
                        sourceType: 'actuator',
                        severity: 'medio',
                        resourceType: 'session',
                        resourceId: sessionId ? String(sessionId) : undefined,
                        reason: { session_id: sessionId, resend_status: response.status },
                        relatedLogs: sessionId ? [`sessions.${sessionId}`] : [],
                    });
                }
            } catch { /* non-blocking */ }
            return res.status(response.status).json({ error });
        }

        const resendData = await response.json().catch(() => ({}));
        console.log('[send-email] Success — Resend response:', JSON.stringify(resendData));

        // Mark email as sent for idempotency
        if (sessionId) {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            if (serviceKey && supabaseUrl) {
                const sb = createClient(supabaseUrl, serviceKey);
                try { await sb.from('perfilamientos').update({ email_sent_at: new Date().toISOString() }).eq('id', sessionId); } catch { /* non-blocking */ }
                // v4 rows: transition 'ready' -> 'sent' (legacy NULL rows are left untouched by the .eq filter).
                try { await sb.from('perfilamientos').update({ report_status: 'sent' }).eq('id', sessionId).eq('report_status', 'ready'); } catch { /* non-blocking */ }
                // Principia ingestion (area=producto): the report email reached the adult.
                await logActivity(sb, {
                    area: 'producto',
                    action: 'report_email_sent',
                    sourceType: 'actuator',
                    severity: 'info',
                    resourceType: 'session',
                    resourceId: String(sessionId),
                    reason: { session_id: sessionId },
                    relatedLogs: [`sessions.${sessionId}`],
                });
            }
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('[send-email] Unhandled exception:', err instanceof Error ? err.message : err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
