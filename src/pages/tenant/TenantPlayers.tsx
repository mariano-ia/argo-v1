import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Clock, AlertCircle, UserCircle, Users, Send, Loader2, Download, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getReportData, getLocalizedTendenciaContent, getLocalizedTendenciaLabel } from '../../lib/argosEngine';
import { sendReport } from '../../lib/emailService';
import { AXIS_CONFIG } from '../../lib/groupBalanceRules';
import { buildDownloadableReportHtml } from '../../lib/buildDownloadableReport';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';
import { SectionIntro } from '../../components/dashboard/SectionIntro';
import { LockedSection } from '../../components/dashboard/LockedSection';
import { AXIS_COLORS, AXIS_CHIP_STYLE, MOTOR_CHIP_STYLE } from '../../lib/designTokens';
import { Tooltip } from '../../components/ui/Tooltip';
import {
    classifyDecisionPattern,
    getPatternCopy,
    getPatternSectionLabel,
} from '../../lib/decisionPattern';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData { id: string; slug: string; display_name: string; plan: string; credits_remaining: number; }
interface AnswerRecord { axis: string; responseTimeMs: number; }
interface AISections { wow?: string; motorDesc?: string; combustible?: string; corazon?: string; reseteo?: string; ecos?: string; checklist?: { antes: string; durante: string; despues: string }; label?: string; bienvenida?: string; grupoEspacio?: string; guia?: { situacion: string; activador: string; desmotivacion: string }[]; palabrasPuente?: string[]; palabrasRuido?: string[]; tendenciaParagraph?: string; tendenciaLabel?: string; palabrasPuenteExtra?: string[]; palabrasRuidoExtra?: string[]; }
interface SessionRow { id: string; child_name: string; child_age: number; adult_name: string; adult_email: string; sport: string | null; archetype_label: string; eje: string; motor: string; eje_secundario: string | null; lang: string | null; created_at: string; answers: AnswerRecord[] | null; ai_sections: AISections | null; }

/* ── Helpers ───────────────────────────────────────────────────────────────── */


const formatDate = (iso: string, lang: string) => {
    const locale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-AR';
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

const monthsSince = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

/* ── PlayerRow ─────────────────────────────────────────────────────────────── */

const PlayerRow: React.FC<{ session: SessionRow; dt: ReturnType<typeof getDashboardT>; lang: string; locked?: boolean }> = ({ session, dt, lang, locked = false }) => {
    const [expanded, setExpanded] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendOk, setResendOk] = useState<boolean | null>(null);

    const axisCfg = AXIS_CONFIG[session.eje];
    const dot = AXIS_COLORS[session.eje] ?? '#6366f1';
    const chip = AXIS_CHIP_STYLE[session.eje] ?? AXIS_CHIP_STYLE.C;
    const motorCfg = MOTOR_CHIP_STYLE[session.motor] ?? MOTOR_CHIP_STYLE['Medio'];
    const needsReprofile = monthsSince(session.created_at) >= 6;
    const months = monthsSince(session.created_at);

    const sessionLang = session.lang || 'es';

    // Returns a full report in the session's original language with AI sections merged.
    // Used only for email/download (not for card display).
    const getSessionReport = () => {
        const r = getReportData(session.eje as any, session.motor as any, session.eje_secundario ?? '', session.child_name, sessionLang);
        if (session.eje_secundario) {
            const t = getLocalizedTendenciaContent(session.eje, session.eje_secundario, sessionLang);
            if (t) {
                r.tendenciaLabel = getLocalizedTendenciaLabel(session.eje_secundario, sessionLang);
                r.tendenciaParagraph = t.parrafo.replace(/\{nombre\}/g, session.child_name);
                r.palabrasPuenteExtra = t.palabrasPuenteExtra;
                r.palabrasRuidoExtra = t.palabrasRuidoExtra;
            }
        }
        const ai = session.ai_sections;
        if (ai) {
            if (ai.label)               r.arquetipo.label    = ai.label;
            if (ai.motorDesc)           r.motorDesc          = ai.motorDesc;
            if (ai.combustible)         r.combustible        = ai.combustible;
            if (ai.ecos)                r.ecos               = ai.ecos;
            if (ai.reseteo)             r.reseteo            = ai.reseteo;
            if (ai.checklist)           r.checklist          = ai.checklist;
            if (ai.guia)                r.guia               = ai.guia;
            if (ai.palabrasPuente)      r.palabrasPuente     = ai.palabrasPuente;
            if (ai.palabrasRuido)       r.palabrasRuido      = ai.palabrasRuido;
            if (ai.tendenciaLabel)      r.tendenciaLabel     = ai.tendenciaLabel;
            if (ai.tendenciaParagraph)  r.tendenciaParagraph = ai.tendenciaParagraph;
            if (ai.palabrasPuenteExtra) r.palabrasPuenteExtra = ai.palabrasPuenteExtra;
            if (ai.palabrasRuidoExtra)  r.palabrasRuidoExtra  = ai.palabrasRuidoExtra;
        }
        return r;
    };

    // Card display: use dashboard UI language. AI sections merged only when lang matches session lang.
    const reportData = useMemo(() => {
        try {
            const r = getReportData(session.eje as any, session.motor as any, session.eje_secundario ?? '', session.child_name, lang);
            if (session.eje_secundario) {
                const t = getLocalizedTendenciaContent(session.eje, session.eje_secundario, lang);
                if (t) {
                    r.tendenciaLabel = getLocalizedTendenciaLabel(session.eje_secundario, lang);
                    r.tendenciaParagraph = t.parrafo.replace(/\{nombre\}/g, session.child_name);
                    r.palabrasPuenteExtra = t.palabrasPuenteExtra;
                    r.palabrasRuidoExtra = t.palabrasRuidoExtra;
                }
            }
            // Only merge AI sections when dashboard language matches the session language
            if (lang === sessionLang) {
                const ai = session.ai_sections;
                if (ai) {
                    if (ai.label)               r.arquetipo.label    = ai.label;
                    if (ai.motorDesc)           r.motorDesc          = ai.motorDesc;
                    if (ai.combustible)         r.combustible        = ai.combustible;
                    if (ai.ecos)                r.ecos               = ai.ecos;
                    if (ai.reseteo)             r.reseteo            = ai.reseteo;
                    if (ai.checklist)           r.checklist          = ai.checklist;
                    if (ai.guia)                r.guia               = ai.guia;
                    if (ai.palabrasPuente)      r.palabrasPuente     = ai.palabrasPuente;
                    if (ai.palabrasRuido)       r.palabrasRuido      = ai.palabrasRuido;
                    if (ai.tendenciaLabel)      r.tendenciaLabel     = ai.tendenciaLabel;
                    if (ai.tendenciaParagraph)  r.tendenciaParagraph = ai.tendenciaParagraph;
                    if (ai.palabrasPuenteExtra) r.palabrasPuenteExtra = ai.palabrasPuenteExtra;
                    if (ai.palabrasRuidoExtra)  r.palabrasRuidoExtra  = ai.palabrasRuidoExtra;
                }
            }
            return r;
        }
        catch { return null; }
    }, [session.eje, session.motor, session.eje_secundario, session.child_name, session.ai_sections, lang, sessionLang]);

    const tendenciaContent = useMemo(() => {
        if (!session.eje_secundario) return null;
        return getLocalizedTendenciaContent(session.eje, session.eje_secundario, lang);
    }, [session.eje, session.eje_secundario, lang]);

    const tendencia = session.eje_secundario
        ? (dt.profile?.tendenciaLabels?.[session.eje_secundario] ?? '')
        : '';

    const decisionPattern = useMemo(() => {
        if (!session.answers?.length) return null;
        return classifyDecisionPattern(session.answers);
    }, [session.answers]);

    const handleResend = async () => {
        setResending(true);
        try {
            const report = getSessionReport();
            const arquetipoFull = report.tendenciaLabel ? `${report.arquetipo.label}, ${report.tendenciaLabel}` : report.arquetipo.label;
            await sendReport({
                toEmail:        session.adult_email,
                nombreAdulto:   session.adult_name,
                nombreNino:     session.child_name,
                deporte:        session.sport ?? '',
                edad:           session.child_age,
                eje:            session.eje,
                motor:          session.motor,
                arquetipo:      arquetipoFull,
                perfil:         sessionLang === 'es' ? report.perfil : '',
                palabrasPuente: report.palabrasPuente,
                sessionId:      session.id,
                lang:           sessionLang,
            });
            setResendOk(true);
        } catch { setResendOk(false); }
        finally { setResending(false); setTimeout(() => setResendOk(null), 3000); }
    };

    const handleDownload = async () => {
        const locale = sessionLang === 'pt' ? 'pt-BR' : sessionLang === 'en' ? 'en-US' : 'es-AR';
        const report = getSessionReport();
        const html = buildDownloadableReportHtml({
            report,
            childName: session.child_name,
            childAge: session.child_age,
            sport: session.sport ?? '',
            adultName: session.adult_name,
            date: new Date(session.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }),
            lang: sessionLang,
            answers: session.answers ?? [],
        });

        // Create hidden iframe, render HTML, capture as PDF
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.width = '800px';
        iframe.style.height = '1200px';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (!iframeDoc) { document.body.removeChild(iframe); return; }
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Wait for fonts/images to load
        await new Promise(r => setTimeout(r, 500));

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(iframeDoc.body, {
                scale: 2,
                useCORS: true,
                width: 800,
                windowWidth: 800,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Handle multi-page if content is tall
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            while (position < pdfHeight) {
                if (position > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, -position, pdfWidth, pdfHeight);
                position += pageHeight;
            }

            pdf.save(`argo-informe-${session.child_name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        } catch (err) {
            console.error('PDF generation failed, falling back to HTML:', err);
            // Fallback: download as HTML
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `argo-informe-${session.child_name.toLowerCase().replace(/\s+/g, '-')}.html`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            document.body.removeChild(iframe);
        }
    };

    return (
        <div className="border-b border-argo-border last:border-b-0">
            {/* ── Row (collapsed) ─────────────────────────────────────── */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3.5 py-4 px-6 text-left hover:bg-argo-bg/30 transition-colors"
            >
                {/* Axis dot */}
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-argo-navy truncate">{session.child_name}</p>
                    <p className="text-xs text-argo-grey mt-0.5">
                        {session.child_age} {dt.common.anos}{session.sport ? `  ·  ${session.sport}` : ''}  ·  {formatDate(session.created_at, lang)}
                    </p>
                </div>

                {/* Profile chip */}
                <span
                    className="text-[11px] font-medium px-3 py-1 rounded-full bg-transparent flex-shrink-0 hidden md:inline-block"
                    style={{ border: `1px solid ${chip.border}`, color: chip.text }}
                >
                    {reportData?.arquetipo.label ?? session.archetype_label}
                </span>

                {/* Motor */}
                <Tooltip text={lang === 'en' ? 'Processing speed during the experience' : lang === 'pt' ? 'Velocidade de processamento durante a experiência' : 'Velocidad de procesamiento durante la experiencia'}>
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline-block"
                        style={{ background: motorCfg.bg, color: motorCfg.text }}
                    >
                        {dt.profile.motorNames[session.motor] ?? session.motor}
                    </span>
                </Tooltip>

                {/* Re-profile badge */}
                {needsReprofile && (
                    <Tooltip text={lang === 'en' ? `${months} months since last profile — we recommend a new session` : lang === 'pt' ? `${months} meses desde o último perfil — recomendamos uma nova sessão` : `${months} meses desde el último perfil — recomendamos una nueva sesión`} maxWidth={220}>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0 hidden sm:flex">
                            <AlertCircle size={10} />
                            {dt.players.rePerfilar}
                        </span>
                    </Tooltip>
                )}

                {/* Chevron */}
                {expanded ? <ChevronUp size={14} className="text-argo-light flex-shrink-0" /> : <ChevronDown size={14} className="text-argo-light flex-shrink-0" />}
            </button>

            {/* ── Expanded detail ──────────────────────────────────────── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-2">
                            {/* 2-column layout for detail */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left column: profile info */}
                                <div className="space-y-4">
                                    {/* Key insight */}
                                    {reportData && (
                                        <div>
                                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.players.loEsencial}</p>
                                            <p className="text-sm text-argo-navy leading-relaxed">{reportData.perfilExtended ?? reportData.perfil}</p>
                                        </div>
                                    )}

                                    {/* Decision pattern */}
                                    {decisionPattern && (() => {
                                        const p = getPatternCopy(decisionPattern, lang);
                                        return (
                                            <div>
                                                <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">
                                                    {getPatternSectionLabel(lang)}
                                                </p>
                                                <p className="text-xs font-semibold text-argo-navy mb-0.5">{p.label}</p>
                                                <p className="text-xs text-argo-grey leading-relaxed">{p.desc}</p>
                                            </div>
                                        );
                                    })()}

                                    {/* Tendencia */}
                                    {tendenciaContent && (
                                        <div>
                                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">
                                                {dt.players.brujulaSecundaria}: {tendencia}
                                            </p>
                                            <p className="text-xs text-argo-grey leading-relaxed">{(() => {
                                                const full = tendenciaContent.parrafo.replace(/\{nombre\}/g, session.child_name);
                                                const end = full.indexOf('. ');
                                                return end !== -1 ? full.slice(0, end + 1) : full;
                                            })()}</p>
                                        </div>
                                    )}

                                    {/* Bridge words */}
                                    {reportData && (locked ? (
                                        <LockedSection
                                            label={dt.players.palabrasPuente}
                                            cta={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}
                                        >
                                            <div className="flex flex-wrap gap-1.5">
                                                {reportData.palabrasPuente.map((w, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium border" style={{ background: axisCfg?.bgColor, color: axisCfg?.color, borderColor: axisCfg?.borderColor }}>{w}</span>
                                                ))}
                                            </div>
                                        </LockedSection>
                                    ) : (
                                        <div>
                                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.players.palabrasPuente}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {reportData.palabrasPuente.map((w, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium border" style={{ background: axisCfg?.bgColor, color: axisCfg?.color, borderColor: axisCfg?.borderColor }}>{w}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Noise words */}
                                    {reportData && (locked ? (
                                        <LockedSection
                                            label={dt.players.evitarComunicacion}
                                            cta={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}
                                        >
                                            <div className="flex flex-wrap gap-1.5">
                                                {reportData.palabrasRuido.map((w, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">{w}</span>
                                                ))}
                                            </div>
                                        </LockedSection>
                                    ) : (
                                        <div>
                                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.players.evitarComunicacion}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {reportData.palabrasRuido.map((w, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">{w}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Right column: coaching + checklist */}
                                <div className="space-y-4">
                                    {locked ? (
                                        <>
                                            {reportData && reportData.guia?.length > 0 && (
                                                <LockedSection
                                                    label={dt.players.guiaRapida}
                                                    cta={lang === 'en' ? 'Activators and demotivators per situation. Available in paid plans.' : lang === 'pt' ? 'Ativadores e desmotivadores por situação. Disponível nos planos pagos.' : 'Activadores y desmotivadores por situación. Disponible en planes pagos.'}
                                                >
                                                    <div className="space-y-2">
                                                        {reportData.guia.map((g, i) => (
                                                            <div key={i} className="bg-argo-bg rounded-xl p-3 space-y-1">
                                                                <p className="text-xs font-semibold text-argo-navy">{g.situacion}</p>
                                                                <p className="text-[11px] text-emerald-700"><span className="font-semibold">{dt.players.activar}:</span> {g.activador}</p>
                                                                <p className="text-[11px] text-red-600"><span className="font-semibold">{dt.players.aConsiderar}:</span> {g.desmotivacion}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </LockedSection>
                                            )}
                                            {reportData?.checklist && (
                                                <LockedSection
                                                    label={dt.players.checklistEntrenamiento}
                                                    cta={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}
                                                >
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { label: dt.players.antes, text: reportData.checklist.antes },
                                                            { label: dt.players.durante, text: reportData.checklist.durante },
                                                            { label: dt.players.despues, text: reportData.checklist.despues },
                                                        ].map(c => (
                                                            <div key={c.label} className="bg-argo-bg rounded-xl p-3">
                                                                <p className="text-[10px] font-bold text-argo-violet-500 uppercase">{c.label}</p>
                                                                <p className="text-[11px] text-argo-grey leading-relaxed mt-1">{c.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </LockedSection>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {reportData && reportData.guia?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.players.guiaRapida}</p>
                                                    <div className="space-y-2">
                                                        {reportData.guia.map((g, i) => (
                                                            <div key={i} className="bg-argo-bg rounded-xl p-3 space-y-1">
                                                                <p className="text-xs font-semibold text-argo-navy">{g.situacion}</p>
                                                                <p className="text-[11px] text-emerald-700"><span className="font-semibold">{dt.players.activar}:</span> {g.activador}</p>
                                                                <p className="text-[11px] text-red-600"><span className="font-semibold">{dt.players.aConsiderar}:</span> {g.desmotivacion}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {reportData?.checklist && (
                                                <div>
                                                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.players.checklistEntrenamiento}</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { label: dt.players.antes, text: reportData.checklist.antes },
                                                            { label: dt.players.durante, text: reportData.checklist.durante },
                                                            { label: dt.players.despues, text: reportData.checklist.despues },
                                                        ].map(c => (
                                                            <div key={c.label} className="bg-argo-bg rounded-xl p-3">
                                                                <p className="text-[10px] font-bold text-argo-violet-500 uppercase">{c.label}</p>
                                                                <p className="text-[11px] text-argo-grey leading-relaxed mt-1">{c.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bottom bar */}
                            <div className="mt-5 pt-4 border-t border-argo-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-4 text-xs text-argo-grey">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(session.created_at, lang)}
                                        {months > 0 && <span className="text-argo-light">· {months} {dt.players.meses}</span>}
                                    </span>
                                    <span className="text-argo-light">
                                        <span className="text-argo-grey">{lang === 'en' ? 'Responsible adult' : lang === 'pt' ? 'Adulto responsável' : 'Adulto responsable'}:</span> {session.adult_name} ({session.adult_email})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {locked ? (
                                        <Tooltip text={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border text-argo-light cursor-not-allowed">
                                                <Lock size={11} />
                                                {lang === 'en' ? 'Download PDF' : lang === 'pt' ? 'Baixar PDF' : 'Descargar PDF'}
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border text-argo-secondary hover:bg-argo-violet-50 hover:border-argo-violet-200 transition-all"
                                        >
                                            <Download size={12} />
                                            {lang === 'en' ? 'Download PDF' : lang === 'pt' ? 'Baixar PDF' : 'Descargar PDF'}
                                        </button>
                                    )}
                                    {locked ? (
                                        <Tooltip text={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border text-argo-light cursor-not-allowed">
                                                <Lock size={11} />
                                                {dt.home.reenviarInforme}
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleResend(); }}
                                            disabled={resending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border text-argo-secondary hover:bg-argo-violet-50 hover:border-argo-violet-200 transition-all disabled:opacity-50"
                                        >
                                            {resending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                            {resendOk === true ? (lang === 'en' ? 'Sent' : 'Enviado') : resendOk === false ? 'Error' : dt.home.reenviarInforme}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── Main Component ────────────────────────────────────────────────────────── */

const DEV_SESSIONS: SessionRow[] = [
    { id: 'dev-1', child_name: 'Valentina López', child_age: 11, adult_name: 'Carlos López', adult_email: 'carlos@example.com', sport: 'Fútbol', archetype_label: 'El Capitán', eje: 'D', motor: 'Rápido', eje_secundario: 'I', lang: 'es', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), answers: Array(12).fill({ axis: 'D', responseTimeMs: 3200 }), ai_sections: null },
    { id: 'dev-2', child_name: 'Tomás Herrera', child_age: 9, adult_name: 'Ana Herrera', adult_email: 'ana@example.com', sport: 'Básquet', archetype_label: 'El Explorador', eje: 'I', motor: 'Medio', eje_secundario: 'S', lang: 'es', created_at: new Date(Date.now() - 30 * 86400000).toISOString(), answers: Array(12).fill({ axis: 'I', responseTimeMs: 7500 }), ai_sections: null },
    { id: 'dev-3', child_name: 'Sofía Martínez', child_age: 13, adult_name: 'Luis Martínez', adult_email: 'luis@example.com', sport: 'Natación', archetype_label: 'La Brújula', eje: 'C', motor: 'Lento', eje_secundario: 'S', lang: 'es', created_at: new Date(Date.now() - 210 * 86400000).toISOString(), answers: Array(12).fill({ axis: 'C', responseTimeMs: 14000 }), ai_sections: null },
];

export const TenantPlayers: React.FC = () => {
    const { tenant, devBypass } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void; devBypass?: boolean }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [ejeFilter, setEjeFilter] = useState<string | null>(null);
    const [showReprofileOnly, setShowReprofileOnly] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    const fetchSessions = useCallback(async () => {
        if (devBypass) { setSessions(DEV_SESSIONS); setLoading(false); return; }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/tenant-sessions', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) { const data = await res.json(); setSessions(data.sessions); }
        } finally { setLoading(false); }
    }, [devBypass]);

    useEffect(() => { if (tenant) fetchSessions(); }, [tenant, fetchSessions]);

    const filtered = useMemo(() => {
        return sessions.filter(s => {
            if (ejeFilter && s.eje !== ejeFilter) return false;
            if (showReprofileOnly && monthsSince(s.created_at) < 6) return false;
            if (search) {
                const q = search.toLowerCase();
                return s.child_name.toLowerCase().includes(q) || s.archetype_label.toLowerCase().includes(q) || (s.sport ?? '').toLowerCase().includes(q);
            }
            return true;
        });
    }, [sessions, search, ejeFilter, showReprofileOnly]);

    // Reset page when filters or page size change
    useEffect(() => { setPage(0); }, [search, ejeFilter, showReprofileOnly, pageSize]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const reprofileCount = sessions.filter(s => monthsSince(s.created_at) >= 6).length;

    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    const playerIntroBody = lang === 'en'
        ? 'Each profile was generated by a completed odyssey. Access the full report, resend the email, or add the athlete to a group.'
        : lang === 'pt'
            ? 'Cada perfil foi gerado por uma odisseia completa. Acesse o relatório completo, reenvie o email ou adicione o atleta a um grupo.'
            : 'Cada perfil fue generado por una odisea completada. Accede al informe completo, reenvía el email o agrega al deportista a un grupo.';

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
            <SectionIntro
                storageKey="argo_intro_players_v1"
                icon={<Users size={16} />}
                title={lang === 'en' ? 'Players' : lang === 'pt' ? 'Jogadores' : 'Jugadores'}
                body={playerIntroBody}
            />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.nav.jugadores}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.players.subtitulo}</p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} disabled={tenant.credits_remaining === 0} />}
            </div>

            {/* Re-profile alert */}
            {reprofileCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">{dt.players.rePerfilarAlerta(reprofileCount)}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{dt.players.rePerfilarAlertaDesc}</p>
                    </div>
                </div>
            )}

            {/* Search + filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={dt.players.buscarPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-argo-border text-sm outline-none focus:border-argo-violet-200 transition-colors"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {(['D', 'I', 'S', 'C'] as const).map(eje => {
                        const cfg = AXIS_CONFIG[eje];
                        const isActive = ejeFilter === eje;
                        return (
                            <button
                                key={eje}
                                onClick={() => setEjeFilter(isActive ? null : eje)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                    isActive ? 'text-white border-transparent' : 'border-argo-border text-argo-grey hover:border-argo-violet-200'
                                }`}
                                style={isActive ? { background: cfg?.color } : {}}
                            >
                                <span className={`w-3 h-3 rounded ${isActive ? 'bg-white/30' : ''}`} style={!isActive ? { background: cfg?.color, opacity: 0.6 } : {}} />
                                {dt.profile.axisNames[eje] ?? cfg?.name}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setShowReprofileOnly(!showReprofileOnly)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            showReprofileOnly ? 'bg-amber-500 text-white border-amber-500' : 'border-argo-border text-argo-grey hover:border-amber-300'
                        }`}
                    >
                        <AlertCircle size={12} />
                        {dt.players.rePerfilar} ({reprofileCount})
                    </button>
                </div>
            </div>

            {/* Players list */}
            {loading ? (
                <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-argo-border last:border-b-0">
                            <div className="flex items-center gap-3.5">
                                <div className="w-2 h-2 rounded-full bg-argo-bg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-32 bg-argo-bg rounded animate-pulse" />
                                    <div className="h-3 w-48 bg-argo-bg rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-[14px] bg-argo-violet-50 flex items-center justify-center mx-auto mb-3">
                        <UserCircle size={20} className="text-argo-violet-500" />
                    </div>
                    <p className="text-sm text-argo-secondary">{sessions.length === 0 ? dt.players.sinJugadores : dt.players.sinResultados}</p>
                </div>
            ) : (
                <>
                    {/* Count + page size selector */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-argo-grey">
                            {filtered.length} {filtered.length === 1 ? dt.common.jugador : dt.common.jugadores}
                            {totalPages > 1 && <span className="text-argo-light"> · {lang === 'en' ? 'page' : 'página'} {page + 1}/{totalPages}</span>}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-argo-light">{lang === 'en' ? 'Show' : lang === 'pt' ? 'Mostrar' : 'Mostrar'}</span>
                            {PAGE_SIZE_OPTIONS.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setPageSize(size)}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                        pageSize === size
                                            ? 'bg-argo-navy text-white'
                                            : 'text-argo-grey hover:bg-argo-bg'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                            <button
                                onClick={() => setPageSize(filtered.length)}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                    pageSize >= filtered.length
                                        ? 'bg-argo-navy text-white'
                                        : 'text-argo-grey hover:bg-argo-bg'
                                }`}
                            >
                                {lang === 'en' ? 'All' : lang === 'pt' ? 'Todos' : 'Todos'}
                            </button>
                        </div>
                    </div>

                    {/* List card */}
                    <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                        {paginated.map(s => (
                            <PlayerRow key={s.id} session={s} dt={dt} lang={lang} locked={tenant.plan === 'trial'} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border text-argo-secondary hover:bg-argo-bg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {lang === 'en' ? 'Previous' : lang === 'pt' ? 'Anterior' : 'Anterior'}
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                        page === i
                                            ? 'bg-argo-navy text-white'
                                            : 'text-argo-grey hover:bg-argo-bg'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border text-argo-secondary hover:bg-argo-bg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {lang === 'en' ? 'Next' : lang === 'pt' ? 'Próximo' : 'Siguiente'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};
