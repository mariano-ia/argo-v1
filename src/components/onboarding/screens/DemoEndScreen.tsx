import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ReportPage, SessionData } from '../../../pages/ReportPage';
import { useLang } from '../../../context/LangContext';
import type { QuestionAnswer } from '../../../lib/profileResolver';
import type { ReportData } from '../../../lib/argosEngine';
import type { AISections } from '../../../lib/openaiService';

interface DemoEndScreenProps {
    email: string;
    nombre: string;
    report?: ReportData | null;
    aiSections?: AISections | null;
    answers?: QuestionAnswer[];
    aiPending?: boolean;
    error?: string | null;
    deporte?: string;
    edad?: number;
    sessionId?: string | null;
    shareToken?: string | null;
}

/**
 * Pantalla final del flujo /demo.
 *
 *  PROD: cuando el informe IA está listo y tenemos sessionId real (no "dev-..."),
 *  navega a /report/:sessionId?token=... — el MISMO HTML que abre el padre
 *  desde el email. Cero diferencia.
 *
 *  DEV (Vite local): /api/session no existe localmente, sessionId queda como
 *  "dev-...". Cae al render inline con mockSession para testear visualmente.
 */
export const DemoEndScreen: React.FC<DemoEndScreenProps> = ({
    nombre,
    report,
    aiSections,
    answers,
    aiPending = false,
    error = null,
    deporte,
    edad,
    sessionId,
    shareToken,
}) => {
    const { lang } = useLang();
    const navigate = useNavigate();
    const L = (es: string, en: string, pt: string) =>
        lang === 'es' ? es : lang === 'pt' ? pt : en;

    // Real session ID = saved in Supabase (not the DEV "dev-..." placeholder).
    const hasRealSession = !!sessionId && !sessionId.startsWith('dev-');
    const readyToNavigate = hasRealSession && !aiPending && !error;

    useEffect(() => {
        if (readyToNavigate && sessionId && shareToken) {
            // Navigate to the exact URL the parent opens from the email CTA.
            navigate(`/report/${sessionId}?token=${shareToken}`, { replace: true });
        }
    }, [readyToNavigate, sessionId, shareToken, navigate]);

    const mockSession: SessionData | null = report
        ? {
            id: 'demo',
            child_name: nombre,
            child_age: edad ?? 13,
            sport: deporte ?? 'Argo Demo',
            adult_name: nombre,
            eje: report.arquetipo.eje,
            motor: report.arquetipo.motor,
            eje_secundario: report.ejeSecundario ?? null,
            lang,
            answers: (answers ?? []).map(a => ({
                axis: a.axis,
                responseTimeMs: a.responseTimeMs,
            })),
            created_at: new Date().toISOString(),
            ai_sections: aiSections ?? null,
        }
        : null;

    // ── Spinner / error state ───────────────────────────────────────────────
    if (aiPending || error || !mockSession || readyToNavigate) {
        return (
            <div
                className="fixed inset-0 z-50 bg-white flex items-center justify-center px-6 py-12"
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-md w-full text-center"
                >
                    {error ? (
                        <>
                            <h2 style={{ fontWeight: 300, fontSize: '1.6rem', color: '#1D1D1F', marginBottom: '10px' }}>
                                {L('Hubo un problema con tu informe.', 'There was a problem with your report.', 'Houve um problema com seu relatório.')}
                            </h2>
                            <p style={{ fontSize: '14px', color: '#86868B', lineHeight: 1.55 }}>
                                {error || L(
                                    'Inténtalo de nuevo en unos minutos.',
                                    'Try again in a few minutes.',
                                    'Tente novamente em alguns minutos.',
                                )}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-7">
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 rounded-full border-2 border-argo-violet-100" />
                                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-argo-violet-500 animate-spin" />
                                </div>
                            </div>
                            <h2 style={{ fontWeight: 300, fontSize: '1.6rem', letterSpacing: '-0.02em', lineHeight: 1.2, color: '#1D1D1F', marginBottom: '10px' }}>
                                {L(
                                    `Estamos generando tu informe, ${nombre}.`,
                                    `Generating your report, ${nombre}.`,
                                    `Estamos gerando seu relatório, ${nombre}.`,
                                )}
                            </h2>
                            <p style={{ fontSize: '14px', color: '#86868B', lineHeight: 1.55, margin: 0 }}>
                                {L(
                                    'Esto puede tardar unos segundos.',
                                    'This may take a few seconds.',
                                    'Isso pode levar alguns segundos.',
                                )}
                            </p>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    // ── DEV fallback: no real session, render the same ReportPage inline ────
    // (Used when running on Vite locally where /api/session can't be reached.)
    return <ReportPage mockSession={mockSession} />;
};
