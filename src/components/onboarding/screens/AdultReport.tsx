import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, RefreshCw, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
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
    onRestart,
}) => {
    const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
    const [emailError, setEmailError] = useState('');

    const mergedReport = aiSections
        ? { ...report, wow: aiSections.wow, motorDesc: aiSections.motorDesc, combustible: aiSections.combustible, corazon: aiSections.corazon, reseteo: aiSections.reseteo, ecos: aiSections.ecos, checklist: aiSections.checklist }
        : report;

    const maduracionTemprana = adultData.edad < 7;

    const handleSendEmail = async () => {
        setEmailStatus('sending');
        setEmailError('');
        try {
            await sendReport({
                toEmail:           adultData.email,
                nombreAdulto:      adultData.nombreAdulto,
                nombreNino:        adultData.nombreNino,
                deporte:           adultData.deporte,
                edad:              adultData.edad,
                arquetipo:         report.arquetipo.label,
                reportHtml:        buildReportHtml(report, aiSections),
                maduracionTemprana,
            });
            setEmailStatus('sent');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setEmailError(msg);
            setEmailStatus('error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em] mb-0.5">
                        Informe de Sintonía
                    </div>
                    <h2 className="font-display text-xl font-bold text-argo-navy">
                        {adultData.nombreNino} · {report.arquetipo.label}
                    </h2>
                </div>
                <button
                    onClick={onRestart}
                    className="flex items-center gap-1.5 text-xs font-bold text-argo-grey hover:text-argo-indigo uppercase tracking-widest transition-all"
                >
                    <RefreshCw size={14} /> Nueva sesión
                </button>
            </div>

            {/* AI status */}
            {aiLoading && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-argo-indigo uppercase tracking-widest animate-pulse">
                    <Sparkles size={12} /> Personalizando el informe con IA...
                </div>
            )}
            {!aiLoading && aiSections && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                    <Sparkles size={12} /> Informe personalizado con IA · {adultData.deporte} · {adultData.edad} años
                </div>
            )}

            {/* Maduración temprana banner */}
            {maduracionTemprana && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-argo-md text-sm text-amber-800">
                    <strong className="block mb-1">Nota: Maduración Temprana</strong>
                    Los perfiles DISC en la infancia temprana (menores de 7 años) son altamente plásticos.
                    Se recomienda revisitar este perfil en <strong>6 meses</strong> para observar la evolución de las tendencias.
                </div>
            )}

            {/* Email section */}
            <div className="p-5 bg-argo-neutral border border-argo-border rounded-argo-lg space-y-4">
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                        Enviar informe por email
                    </div>
                    <p className="text-sm text-argo-grey">
                        Se enviará a <strong className="text-argo-navy">{adultData.email}</strong>
                    </p>
                </div>

                {emailStatus === 'idle' && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendEmail}
                        disabled={aiLoading}
                        className="flex items-center gap-2 bg-argo-indigo text-white font-bold px-6 py-3 rounded-argo-sm text-xs uppercase tracking-widest disabled:opacity-50 transition-all"
                    >
                        <Send size={14} />
                        {aiLoading ? 'Esperando IA...' : 'Enviar informe'}
                    </motion.button>
                )}

                {emailStatus === 'sending' && (
                    <div className="flex items-center gap-2 text-sm text-argo-indigo animate-pulse font-semibold">
                        <RefreshCw size={14} className="animate-spin" /> Enviando...
                    </div>
                )}

                {emailStatus === 'sent' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                        <CheckCircle size={16} /> ¡Informe enviado a {adultData.email}!
                    </div>
                )}

                {emailStatus === 'error' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                            <AlertCircle size={16} /> Error al enviar
                        </div>
                        <p className="text-xs text-red-500 font-mono break-all">{emailError}</p>
                        <button
                            onClick={handleSendEmail}
                            className="text-xs font-bold text-argo-indigo underline"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
            </div>

            {/* Full report */}
            <FullReport
                report={mergedReport}
                aiActive={!!aiSections}
                aiLoading={aiLoading}
                deporte={adultData.deporte}
            />
        </div>
    );
};
