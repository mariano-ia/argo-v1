import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ReportData } from '../../../lib/argosEngine';
import { AISections } from '../../../lib/openaiService';
import { sendReport } from '../../../lib/emailService';
import { FullReport } from '../../FullReport';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT, OdysseyTranslations } from '../../../lib/odysseyTranslations';
import { AXIS_COLORS } from '../../../lib/designTokens';

interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

interface Props {
    adultData: AdultData;
    report: ReportData;
    aiSections: AISections | null;
    aiLoading: boolean;
    saveError?: string | null;
    onRestart: () => void;
}

type EmailStatus = 'idle' | 'sending' | 'sent' | 'error';

export function buildReportHtml(report: ReportData, aiSections: AISections | null, ot: OdysseyTranslations): string {
    const et = ot.emailSections;

    // Merge AI sections over base report (with null-safety — AI JSON may have missing fields)
    // For non-es languages, the AI also returns translated versions of static sections
    const r = aiSections
        ? {
            ...report,
            wow: aiSections.wow ?? report.wow,
            motorDesc: aiSections.motorDesc ?? report.motorDesc,
            combustible: aiSections.combustible ?? report.combustible,
            corazon: aiSections.corazon ?? report.corazon,
            reseteo: aiSections.reseteo ?? report.reseteo,
            ecos: aiSections.ecos ?? report.ecos,
            checklist: aiSections.checklist ?? report.checklist,
            // Non-es translated fields (fall back to Spanish originals if AI didn't provide them)
            bienvenida: aiSections.bienvenida ?? report.bienvenida,
            grupoEspacio: aiSections.grupoEspacio ?? report.grupoEspacio,
            guia: aiSections.guia ?? report.guia,
            palabrasPuente: aiSections.palabrasPuente ?? report.palabrasPuente,
            palabrasRuido: aiSections.palabrasRuido ?? report.palabrasRuido,
            tendenciaParagraph: aiSections.tendenciaParagraph ?? report.tendenciaParagraph,
            tendenciaLabel: aiSections.tendenciaLabel ?? report.tendenciaLabel,
            palabrasPuenteExtra: aiSections.palabrasPuenteExtra ?? report.palabrasPuenteExtra,
            palabrasRuidoExtra: aiSections.palabrasRuidoExtra ?? report.palabrasRuidoExtra,
        }
        : report;

    // Use translated label if available
    const archetypeLabel = aiSections?.label ?? report.arquetipo.label;

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Convert plain text to <p> tags — handles \n\n as paragraphs, \n as <br>, **bold** */
    const txt = (t: string) =>
        (t || '').split(/\n\n+/).filter(Boolean)
            .map(p => {
                let html = p.trim().replace(/\n/g, '<br/>');
                html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                return `<p style="font-size:14px;color:#424245;line-height:1.75;margin:0 0 10px 0;">${html}</p>`;
            })
            .join('');

    /** Pill / chip tags */
    const pills = (items: string[] | undefined, bg: string, color: string, dashed = false) =>
        (items || []).map(p => `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${bg};color:${color};font-size:12px;font-weight:500;margin:3px 3px 3px 0;${dashed ? 'border:1px dashed ' + color + ';' : ''}">${p}</span>`).join('');

    /** Styled callout box */
    const calloutBox = (label: string, text: string, variant: 'purple' | 'amber' | 'red' = 'purple') => {
        if (!text) return '';
        const styles = {
            purple: { border: '#955FB5', bg: '#FAFAFF', color: '#955FB5' },
            amber:  { border: '#d97706', bg: '#FFFBF0', color: '#d97706' },
            red:    { border: '#dc2626', bg: '#FFF5F5', color: '#dc2626' },
        };
        const s = styles[variant];
        return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
  <tr><td style="border-left:3px solid ${s.border};padding:12px 16px;background:${s.bg};border-radius:0 12px 12px 0;">
    <p style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${s.color};margin:0 0 6px 0;">${label.toUpperCase()}</p>
    ${txt(text)}
  </td></tr>
</table>`;
    };

    /** Extract callout text after a marker */
    const extractCallout = (text: string | undefined, marker: string): { body: string; callout: string } => {
        if (!text) return { body: '', callout: '' };
        const idx = text.indexOf(marker);
        if (idx === -1) return { body: text, callout: '' };
        return {
            body: text.substring(0, idx).trim(),
            callout: text.substring(idx + marker.length).trim(),
        };
    };

    /** Strip a callout marker and everything after it */
    const stripMarker = (text: string | undefined, marker: string): string => {
        if (!text) return '';
        const idx = text.indexOf(marker);
        return idx === -1 ? text : text.substring(0, idx).trim();
    };

    /** Section card wrapper with dot icon */
    const section = (title: string, body: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-collapse:collapse;">
  <tr><td style="padding:20px 18px;background:#ffffff;border:1px solid #D2D2D7;border-radius:14px;">
    <p style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#86868B;margin:0 0 14px 0;">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#86868B;vertical-align:middle;margin-right:8px;"></span>
      ${title.toUpperCase()}
    </p>
    ${body}
  </td></tr>
</table>`;

    // ── Extract callouts ─────────────────────────────────────────────────────
    // Callout markers are embedded in the Spanish archetype text.
    // For Spanish: extract callout from text, show in a styled box.
    // For non-es: the AI translates the full text — callout markers won't exist,
    // so we show the full body without separating callouts.
    const hasSpanishMarkers = (r.bienvenida || '').includes('Nota fundamental:') ||
                              (r.bienvenida || '').includes('Nota de seguridad:');

    let bienvenidaCalloutLabel = et.calloutNotaFundamental;
    let bienvenidaParsed = hasSpanishMarkers
        ? extractCallout(r.bienvenida, 'Nota fundamental:')
        : { body: r.bienvenida, callout: '' };
    if (hasSpanishMarkers && !bienvenidaParsed.callout) {
        bienvenidaCalloutLabel = et.calloutNotaSeguridad;
        bienvenidaParsed = extractCallout(r.bienvenida, 'Nota de seguridad:');
    }

    // For AI sections: extract from ORIGINAL Spanish text only if markers present
    const motorOriginal = extractCallout(report.motorDesc, 'Invitación de sintonía:');
    const motorBody = hasSpanishMarkers
        ? stripMarker(r.motorDesc, 'Invitación de sintonía:')
        : (r.motorDesc || '');

    const combustibleOriginal = extractCallout(report.combustible, 'Feedback de sintonía:');
    const combustibleBody = hasSpanishMarkers
        ? stripMarker(r.combustible, 'Feedback de sintonía:')
        : (r.combustible || '');

    const corazonOriginal = extractCallout(report.corazon, 'El termómetro emocional:');
    const corazonBody = hasSpanishMarkers
        ? stripMarker(r.corazon, 'El termómetro emocional:')
        : (r.corazon || '');

    const reseteoOriginal = extractCallout(report.reseteo, 'Acompañamiento sugerido:');
    const reseteoBody = hasSpanishMarkers
        ? stripMarker(r.reseteo, 'Acompañamiento sugerido:')
        : (r.reseteo || '');

    // ── Axis data ───────────────────────────────────────────────────────────

    const axisNames = ot.axisNames;
    const axisCounts = report.axisCounts || { D: 3, I: 3, S: 3, C: 3 };
    const total = Object.values(axisCounts).reduce((s, v) => s + v, 0) || 1;
    const axisOrder = ['D', 'I', 'S', 'C'];

    // Confidence level from axis dominance
    const sortedCounts = axisOrder.map(a => axisCounts[a] || 0).sort((a, b) => b - a);
    const diff = sortedCounts[0] - (sortedCounts[1] || 0);
    const confidenceLevel = diff <= 0 ? 1 : diff <= 1 ? 2 : diff <= 2 ? 3 : diff <= 4 ? 4 : 5;
    const confidenceText = ot.confidenceLevels[confidenceLevel - 1] || '';

    // Motor display
    const motor = report.arquetipo.motor;

    // ── Brújula card (executive summary) ────────────────────────────────────

    const axisBarRows = axisOrder.map(axis => {
        const count = axisCounts[axis] || 0;
        const pct = Math.round((count / total) * 100);
        const name = axisNames[axis] || axis;
        const color = AXIS_COLORS[axis];
        const isDominant = axis === report.arquetipo.eje;
        return `<tr style="height:28px;">
        <td width="12" valign="middle"><div style="width:8px;height:8px;border-radius:50%;background:${color};"></div></td>
        <td width="80" valign="middle" style="font-size:12px;font-weight:${isDominant ? '700' : '500'};color:#1D1D1F;padding-left:8px;">${name}</td>
        <td valign="middle" style="padding:0 8px;">
          <div style="height:6px;background:#e5e5ea;border-radius:3px;overflow:hidden;">
            <div style="width:${pct}%;height:6px;background:${color};border-radius:3px;"></div>
          </div>
        </td>
        <td width="36" valign="middle" style="text-align:right;font-size:11px;font-weight:600;color:#86868B;">${pct}%</td>
      </tr>`;
    }).join('');

    const motorGaugeChips = (['Rápido', 'Medio', 'Lento'] as string[]).map(m => {
        const isActive = m === motor;
        const display = ot.motorDisplayNames[m] || m;
        return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;${isActive ? 'background:#955FB5;color:#fff;font-weight:600;' : 'background:#E5E5EA;color:#86868B;'}font-size:12px;margin-right:6px;">${display}</span>`;
    }).join('');

    const confidenceBlocks = Array.from({ length: 5 }, (_, i) => {
        const color = i < confidenceLevel ? '#22c55e' : '#e5e5ea';
        return `<td width="48" style="padding-right:${i < 4 ? '3' : '0'}px;"><div style="height:6px;border-radius:3px;background:${color};"></div></td>`;
    }).join('');

    const tendenciaTag = r.tendenciaLabel
        ? `<p style="font-size:14px;color:#6366f1;font-style:italic;margin:0 0 16px 0;">${r.tendenciaLabel}</p>`
        : '';

    const brujulaHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#E3E3FF;border:1px solid #C8C8F0;border-radius:14px;margin-bottom:16px;">
  <tr><td style="padding:20px 18px;">
    <p style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#6366f1;margin:0 0 6px 0;">${ot.compassLabel.toUpperCase()}</p>
    <p style="font-size:26px;font-weight:300;color:#1D1D1F;letter-spacing:-0.03em;margin:0 0 4px 0;">${archetypeLabel}</p>
    ${tendenciaTag}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr>
        <td style="padding-right:8px;"><span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#fff;border:1px solid #C8C8F0;font-size:11px;font-weight:600;color:#1D1D1F;">${report.arquetipo.eje} · ${axisNames[report.arquetipo.eje] || report.arquetipo.eje}</span></td>
        <td><span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#fff;border:1px solid #C8C8F0;font-size:11px;font-weight:600;color:#1D1D1F;">${ot.motorDisplayNames[motor] || motor}</span></td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${axisBarRows}
    </table>
    <p style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#86868B;margin:14px 0 8px 0;">${ot.motorGaugeLabel.toUpperCase()}</p>
    <div style="margin-bottom:4px;">${motorGaugeChips}</div>
    <p style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#86868B;margin:14px 0 8px 0;">${ot.confidenceLabel.toUpperCase()}</p>
    <table cellpadding="0" cellspacing="0"><tr>${confidenceBlocks}</tr></table>
    <p style="font-size:11px;color:#86868B;margin:4px 0 0 0;">${confidenceText}</p>
  </td></tr>
</table>`;

    // ── Guía de Sintonía rows ───────────────────────────────────────────────

    const guiaHtml = (r.guia || []).map(row => `
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D2D2D7;border-radius:12px;margin-bottom:10px;border-collapse:collapse;">
  <tr><td colspan="2" style="background:#F5F5F7;padding:8px 14px;border-bottom:1px solid #D2D2D7;">
    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;">${row.situacion}</span>
  </td></tr>
  <tr>
    <td width="50%" valign="top" style="padding:12px 14px;border-right:1px solid #D2D2D7;">
      <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#16a34a;margin:0 0 6px 0;">${et.activators}</p>
      ${txt(row.activador)}
    </td>
    <td width="50%" valign="top" style="padding:12px 14px;">
      <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#d97706;margin:0 0 6px 0;">${et.toAvoid}</p>
      ${txt(row.desmotivacion)}
    </td>
  </tr>
</table>`).join('');

    // ── Palabras — two-column chip layout ───────────────────────────────────

    const puenteExtraHtml = (r.palabrasPuenteExtra && r.palabrasPuenteExtra.length > 0)
        ? `<p style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#86868B;margin:10px 0 4px 0;">${et.byTendency}</p>
           <div>${pills(r.palabrasPuenteExtra, '#dcfce7', '#16a34a', true)}</div>`
        : '';
    const ruidoExtraHtml = (r.palabrasRuidoExtra && r.palabrasRuidoExtra.length > 0)
        ? `<p style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#86868B;margin:10px 0 4px 0;">${et.byTendency}</p>
           <div>${pills(r.palabrasRuidoExtra, '#fef3c7', '#d97706', true)}</div>`
        : '';

    const palabrasBody = `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="50%" valign="top" style="padding-right:10px;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#16a34a;margin:0 0 8px 0;">${et.bridgeWords}</p>
      <div>${pills(r.palabrasPuente, '#dcfce7', '#15803d')}</div>
      ${puenteExtraHtml}
    </td>
    <td width="50%" valign="top" style="padding-left:10px;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#d97706;margin:0 0 8px 0;">${et.noiseWords}</p>
      <div>${pills(r.palabrasRuido, '#fef3c7', '#b45309')}</div>
      ${ruidoExtraHtml}
    </td>
  </tr>
</table>`;

    // ── Day Checklist ───────────────────────────────────────────────────────

    const ck = r.checklist || { antes: '', durante: '', despues: '' };
    const checklistBody = `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
  <tr><td style="border-left:4px solid #6366f1;padding:12px 16px;background:#F5F5F7;border-radius:0 12px 12px 0;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;margin:0 0 6px 0;">${et.beforeTraining}</p>${txt(ck.antes)}
  </td></tr>
  <tr><td style="border-left:4px solid #1D1D1F;padding:12px 16px;background:#F5F5F7;border-radius:0 12px 12px 0;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;margin:0 0 6px 0;">${et.duringTraining}</p>${txt(ck.durante)}
  </td></tr>
  <tr><td style="border-left:4px solid #22c55e;padding:12px 16px;background:#F5F5F7;border-radius:0 12px 12px 0;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;margin:0 0 6px 0;">${et.afterTraining}</p>${txt(ck.despues)}
  </td></tr>
</table>`;

    // ── Build sections ──────────────────────────────────────────────────────

    // Only render callout boxes when we have Spanish text with extractable markers
    const showCallouts = hasSpanishMarkers;

    const sections = [
        brujulaHtml,

        section(et.contract,
            txt(bienvenidaParsed.body) + (showCallouts ? calloutBox(bienvenidaCalloutLabel, bienvenidaParsed.callout, 'amber') : '')),

        section(et.placeInShip, txt(r.wow)),

        r.tendenciaParagraph ? section(et.secondaryCompass, txt(r.tendenciaParagraph)) : '',

        section(et.motorRhythm,
            txt(motorBody) + (showCallouts ? calloutBox(et.calloutInvitacion, motorOriginal.callout, 'purple') : '')),

        section(et.fuel,
            txt(combustibleBody) + (showCallouts ? calloutBox(et.calloutFeedback, combustibleOriginal.callout, 'purple') : '')),

        section(et.groupLife, txt(r.grupoEspacio)),

        section(et.intentionLanguage,
            txt(corazonBody) + (showCallouts ? calloutBox(et.calloutTermometro, corazonOriginal.callout, 'red') : '')),

        section(et.captainLanguage, palabrasBody),

        (r.guia || []).length > 0 ? section(et.tuningGuide, guiaHtml) : '',

        section(et.adjustmentManagement,
            txt(reseteoBody) + (showCallouts ? calloutBox(et.calloutAcompanamiento, reseteoOriginal.callout, 'purple') : '')),

        section(et.shipEchoes, txt(r.ecos)),

        section(et.dayChecklist, checklistBody),
    ];

    return sections.filter(Boolean).join('\n');
}

export const AdultReport: React.FC<Props> = ({
    adultData,
    report,
    aiSections,
    aiLoading,
    saveError,
    onRestart: _onRestart,
}) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);
    const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
    const hasSentRef = useRef(false);

    const mergedReport = aiSections
        ? { ...report, wow: aiSections.wow, motorDesc: aiSections.motorDesc, combustible: aiSections.combustible, corazon: aiSections.corazon, reseteo: aiSections.reseteo, ecos: aiSections.ecos, checklist: aiSections.checklist }
        : report;

    const maduracionTemprana = adultData.edad < 10;

    const doSend = useCallback(() => {
        if (hasSentRef.current) return;
        setEmailStatus('sending');
        sendReport({
            toEmail:        adultData.email,
            nombreAdulto:   adultData.nombreAdulto,
            nombreNino:     adultData.nombreNino,
            deporte:        adultData.deporte,
            edad:           adultData.edad,
            eje:            report.arquetipo.eje,
            motor:          report.arquetipo.motor,
            arquetipo:      report.tendenciaLabel
                ? `${report.arquetipo.label}, ${report.tendenciaLabel}`
                : report.arquetipo.label,
            perfil:         report.perfil,
            palabrasPuente: report.palabrasPuente,
            lang,
        })
            .then(() => {
                hasSentRef.current = true;
                setEmailStatus('sent');
            })
            .catch(() => setEmailStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adultData, report.arquetipo.label, report.arquetipo.eje, report.arquetipo.motor, report.perfil, report.palabrasPuente, lang]);

    // Auto-send once AI finishes (or immediately if AI already done/unavailable)
    useEffect(() => {
        if (aiLoading) return;
        doSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aiLoading]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-2xl mx-auto"
        >
            {/* Save error banner */}
            {saveError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">{ot.saveErrorTitle}</p>
                        <p className="text-xs text-amber-600 mt-1">{saveError}</p>
                    </div>
                </div>
            )}

            {/* Hero: archetype + email confirmation */}
            <div className="bg-white rounded-2xl p-8 text-center space-y-5 border border-[#D2D2D7]">

                {/* Status icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 rounded-2xl bg-[#F5F5F7] border border-[#D2D2D7] flex items-center justify-center mx-auto"
                >
                    {emailStatus === 'sending' && (
                        <Loader2 size={38} className="text-[#424245] animate-spin" />
                    )}
                    {emailStatus === 'sent' && (
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <CheckCircle size={42} className="text-emerald-500" />
                        </motion.div>
                    )}
                    {(emailStatus === 'error' || emailStatus === 'idle') && (
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none"
                            stroke="#424245" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="5" r="2" />
                            <line x1="12" y1="7" x2="12" y2="20" />
                            <path d="M5 12 C5 17 19 17 19 12" />
                            <line x1="5" y1="12" x2="9" y2="12" />
                            <line x1="15" y1="12" x2="19" y2="12" />
                        </svg>
                    )}
                </motion.div>

                {/* Archetype */}
                <div>
                    <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em] mb-1">
                        {ot.archetypeOf(adultData.nombreNino)}
                    </div>
                    <h2 className="font-display text-3xl font-light text-[#1D1D1F] leading-tight" style={{ letterSpacing: '-0.03em' }}>
                        {report.arquetipo.label}
                    </h2>
                    {report.tendenciaLabel && (
                        <p className="text-[#6366f1] text-sm mt-0.5 italic font-medium">{report.tendenciaLabel}</p>
                    )}
                    {report.perfil && (
                        <p className="text-[#86868B] text-sm mt-1 italic">{report.perfil}</p>
                    )}
                </div>

                {/* Email status */}
                <div className="min-h-[24px]">
                    {emailStatus === 'sending' && (
                        <p className="text-[#86868B] text-sm animate-pulse">
                            {ot.preparingReport}
                        </p>
                    )}
                    {emailStatus === 'sent' && (
                        <p className="text-emerald-600 font-medium text-sm">
                            {ot.reportSentTo}{' '}
                            <span className="font-semibold text-[#1D1D1F]">{adultData.email}</span>
                        </p>
                    )}
                    {emailStatus === 'error' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-center gap-1.5 text-amber-600 text-sm font-medium">
                                <AlertCircle size={14} /> {ot.emailError}
                            </div>
                            <button
                                onClick={() => { hasSentRef.current = false; setEmailStatus('idle'); doSend(); }}
                                className="text-xs text-[#86868B] hover:text-[#1D1D1F] underline transition-colors"
                            >
                                {ot.retryEmail}
                            </button>
                        </div>
                    )}
                </div>

                {/* AI badge — always visible */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em]">
                    {aiLoading ? (
                        <span className="text-[#86868B] animate-pulse flex items-center gap-1.5">
                            <Sparkles size={11} /> {ot.personalizingAI}
                        </span>
                    ) : (
                        <span className="text-[#424245] flex items-center gap-1.5">
                            <Sparkles size={11} /> {ot.generatedByArgo}
                        </span>
                    )}
                </div>
            </div>

            {/* Maduración temprana */}
            {maduracionTemprana && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-argo-md text-sm text-amber-800">
                    <strong className="block mb-1">{ot.maturationTitle}</strong>
                    {ot.maturationBody} {ot.maturationRevisit}
                </div>
            )}

            {/* Full report */}
            <div className="space-y-2">
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em]">
                    {ot.fullReport}
                </div>
                <FullReport
                    report={mergedReport}
                    aiActive={!!aiSections}
                    aiLoading={aiLoading}
                    deporte={adultData.deporte}
                />
            </div>
        </motion.div>
    );
};
