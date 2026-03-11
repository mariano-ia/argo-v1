import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ReportData } from '../../../lib/argosEngine';
import { AISections } from '../../../lib/openaiService';
import { sendReport } from '../../../lib/emailService';
import { FullReport } from '../../FullReport';

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
    onRestart: () => void;
}

type EmailStatus = 'idle' | 'sending' | 'sent' | 'error';

function buildReportHtml(report: ReportData, aiSections: AISections | null): string {
    const r = aiSections
        ? { ...report, wow: aiSections.wow, motorDesc: aiSections.motorDesc, combustible: aiSections.combustible, corazon: aiSections.corazon, reseteo: aiSections.reseteo, ecos: aiSections.ecos, checklist: aiSections.checklist }
        : report;

    // Convert plain text (possibly with \n\n paragraphs) to <p> tags
    const txt = (t: string) =>
        (t || '').split(/\n\n+/).filter(Boolean)
            .map(p => `<p style="font-size:14px;color:#424245;line-height:1.75;margin:0 0 10px 0;">${p.trim()}</p>`)
            .join('');

    // Section wrapper
    const section = (title: string, body: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
  <tr><td style="padding:24px 28px;background:#ffffff;border:1px solid #D2D2D7;border-radius:14px;">
    <p style="font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#86868B;margin:0 0 16px 0;">${title}</p>
    ${body}
  </td></tr>
</table>`;

    // Pill tags
    const pills = (items: string[], bg: string, color: string, dashed = false) =>
        items.map(p => `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${bg};color:${color};font-size:12px;font-weight:500;margin:3px 3px 3px 0;${dashed ? 'border:1px dashed ' + color + ';' : ''}">${p}</span>`).join('');

    // Guía de Sintonía rows
    const guiaHtml = r.guia.map(row => `
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D2D2D7;border-radius:12px;margin-bottom:10px;border-collapse:collapse;">
  <tr><td colspan="2" style="background:#F5F5F7;padding:8px 14px;border-bottom:1px solid #D2D2D7;">
    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;">${row.situacion}</span>
  </td></tr>
  <tr>
    <td width="50%" valign="top" style="padding:12px 14px;border-right:1px solid #D2D2D7;">
      <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#16a34a;margin:0 0 6px 0;">Activadores</p>
      ${txt(row.activador)}
    </td>
    <td width="50%" valign="top" style="padding:12px 14px;">
      <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#d97706;margin:0 0 6px 0;">A evitar</p>
      ${txt(row.desmotivacion)}
    </td>
  </tr>
</table>`).join('');

    // Extra pills by tendency
    const puenteExtraHtml = (r.palabrasPuenteExtra && r.palabrasPuenteExtra.length > 0)
        ? `<p style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#86868B;margin:10px 0 4px 0;">Por su tendencia</p>
           <p style="margin:0 0 14px 0;">${pills(r.palabrasPuenteExtra, '#dcfce7', '#16a34a', true)}</p>`
        : '';
    const ruidoExtraHtml = (r.palabrasRuidoExtra && r.palabrasRuidoExtra.length > 0)
        ? `<p style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#86868B;margin:10px 0 4px 0;">Por su tendencia</p>
           <p style="margin:0;">${pills(r.palabrasRuidoExtra, '#fef3c7', '#d97706', true)}</p>`
        : '';

    const sections = [
        section('El Contrato de Sintonía',
            `<blockquote style="margin:0;padding-left:16px;border-left:3px solid #6366f1;">${txt(r.bienvenida)}</blockquote>`),
        section('Su lugar en la Nave', txt(r.wow)),
        r.tendenciaParagraph ? section('La Brújula Secundaria', txt(r.tendenciaParagraph)) : '',
        section('El Ritmo del Motor', txt(r.motorDesc)),
        section('El Combustible', txt(r.combustible)),
        section('Vida en el Grupo', txt(r.grupoEspacio)),
        section('Lenguaje de Intención', txt(r.corazon)),
        section('Lenguaje del Capitán', `
<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#16a34a;margin:0 0 6px 0;">Palabras Puente</p>
<p style="margin:0 0 4px 0;">${pills(r.palabrasPuente, '#dcfce7', '#15803d')}</p>
${puenteExtraHtml}
<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#d97706;margin:14px 0 6px 0;">Palabras Ruido</p>
<p style="margin:0 0 4px 0;">${pills(r.palabrasRuido, '#fef3c7', '#b45309')}</p>
${ruidoExtraHtml}`),
        r.guia.length > 0 ? section('Guía de Sintonía', guiaHtml) : '',
        section('Gestión del Desajuste', txt(r.reseteo)),
        section('Ecos de la Nave', txt(r.ecos)),
        section('Checklist del Día', `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
  <tr><td style="border-left:4px solid #6366f1;padding:12px 16px;background:#F5F5F7;border-radius:0 12px 12px 0;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;margin:0 0 6px 0;">Antes del entrenamiento</p>${txt(r.checklist.antes)}
  </td></tr>
  <tr><td style="border-left:4px solid #1D1D1F;padding:12px 16px;background:#F5F5F7;border-radius:0 12px 12px 0;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;margin:0 0 6px 0;">Durante el entrenamiento</p>${txt(r.checklist.durante)}
  </td></tr>
  <tr><td style="border-left:4px solid #22c55e;padding:12px 16px;background:#F5F5F7;border-radius:0 12px 12px 0;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1D1D1F;margin:0 0 6px 0;">Después del entrenamiento</p>${txt(r.checklist.despues)}
  </td></tr>
</table>`),
    ];

    return sections.join('\n');
}

export const AdultReport: React.FC<Props> = ({
    adultData,
    report,
    aiSections,
    aiLoading,
    onRestart: _onRestart,
}) => {
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
            toEmail:           adultData.email,
            nombreAdulto:      adultData.nombreAdulto,
            nombreNino:        adultData.nombreNino,
            deporte:           adultData.deporte,
            edad:              adultData.edad,
            arquetipo:         report.tendenciaLabel
                ? `${report.arquetipo.label}, ${report.tendenciaLabel}`
                : report.arquetipo.label,
            reportHtml:        buildReportHtml(report, aiSections),
            maduracionTemprana,
        })
            .then(() => {
                hasSentRef.current = true;
                setEmailStatus('sent');
            })
            .catch(() => setEmailStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adultData, report.arquetipo.label, aiSections, maduracionTemprana]);

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
                        Arquetipo de {adultData.nombreNino}
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
                            Preparando el informe…
                        </p>
                    )}
                    {emailStatus === 'sent' && (
                        <p className="text-emerald-600 font-medium text-sm">
                            Informe enviado a{' '}
                            <span className="font-semibold text-[#1D1D1F]">{adultData.email}</span>
                        </p>
                    )}
                    {emailStatus === 'error' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-center gap-1.5 text-amber-600 text-sm font-medium">
                                <AlertCircle size={14} /> No pudimos enviar el email
                            </div>
                            <button
                                onClick={() => { hasSentRef.current = false; setEmailStatus('idle'); doSend(); }}
                                className="text-xs text-[#86868B] hover:text-[#1D1D1F] underline transition-colors"
                            >
                                Reintentar envío
                            </button>
                        </div>
                    )}
                </div>

                {/* AI badge — always visible */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em]">
                    {aiLoading ? (
                        <span className="text-[#86868B] animate-pulse flex items-center gap-1.5">
                            <Sparkles size={11} /> Personalizando con IA…
                        </span>
                    ) : (
                        <span className="text-[#424245] flex items-center gap-1.5">
                            <Sparkles size={11} /> Generado por ArgoEngine
                        </span>
                    )}
                </div>
            </div>

            {/* Maduración temprana */}
            {maduracionTemprana && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-argo-md text-sm text-amber-800">
                    <strong className="block mb-1">Nota: Maduración Temprana</strong>
                    Los perfiles en la infancia temprana (menores de 7 años) son altamente plásticos.
                    Se recomienda revisitar este perfil en <strong>6 meses</strong> para observar la evolución.
                </div>
            )}

            {/* Full report */}
            <div className="space-y-2">
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em]">
                    Informe completo
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
