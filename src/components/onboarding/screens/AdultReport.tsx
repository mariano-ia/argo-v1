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

    return `
<h1>Informe de Sintonía Argo — ${report.nombre}</h1>
<h2>Arquetipo: ${report.arquetipo.label}</h2>
<p><strong>Perfil:</strong> ${report.perfil}</p>
<hr/>
<h3>Bienvenida</h3><p>${r.wow}</p>
<h3>El Ritmo del Motor</h3><p>${r.motorDesc}</p>
<h3>El Combustible</h3><p>${r.combustible}</p>
<h3>Vida en el Grupo</h3><p>${r.grupoEspacio}</p>
<h3>Lenguaje de Intención</h3><p>${r.corazon}</p>
<h3>Gestión del Desajuste</h3><p>${r.reseteo}</p>
<h3>Ecos de la Nave</h3><p>${r.ecos}</p>
<h3>Checklist del Día</h3>
<p><strong>Antes:</strong> ${r.checklist.antes}</p>
<p><strong>Durante:</strong> ${r.checklist.durante}</p>
<p><strong>Después:</strong> ${r.checklist.despues}</p>
`.trim();
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
            arquetipo:         report.arquetipo.label,
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
                            <Sparkles size={11} /> Generado con inteligencia artificial
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
