import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ADULT_INTRO_SLIDES, STORY_SLIDES } from '../../lib/onboardingData';
import { useQuestions } from '../../lib/useQuestions';
import { QuestionAnswer, SessionContext, resolveFromAnswers } from '../../lib/profileResolver';
import { supabase } from '../../lib/supabase';
import { getReportData } from '../../lib/argosEngine';
import { getTendenciaContent } from '../../lib/archetypeData';
import { generateAISections, AISections, AIUsage, ReportContext } from '../../lib/openaiService';
import { saveSession } from '../../lib/sessionStore';
import { AdultIntroSlide } from './screens/AdultIntroSlide';
import { AdultRegistration } from './screens/AdultRegistration';
import { DeviceHandoff } from './screens/DeviceHandoff';
import { StorySlide } from './screens/StorySlide';
import { MiniGame1 } from './screens/MiniGame1';
import { QuestionScreen } from './screens/QuestionScreen';
import { MiniGame2 } from './screens/MiniGame2';
import { ChildCompletion } from './screens/ChildCompletion';
import { AdultReport } from './screens/AdultReport';

// ─── Ocean background (shown behind question screens) ─────────────────────────

const OceanBackground: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Sky + horizon gradient */}
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #A8CCE2 0%, #BED8EE 26%, #D4E8F6 40%, #E2C890 52%, #C89860 59%, #78AECA 61%, #5A8EAE 78%, #3E6E8E 100%)',
            }}
        />

        {/* Blurred cloud shapes */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '7%', left: '62%', width: 92, height: 26, background: 'rgba(255,255,255,0.52)', filter: 'blur(13px)' }}
            animate={{ x: [0, 14, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '14%', left: '14%', width: 58, height: 18, background: 'rgba(255,255,255,0.38)', filter: 'blur(10px)' }}
            animate={{ x: [0, -9, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '5%', left: '36%', width: 108, height: 30, background: 'rgba(255,255,255,0.44)', filter: 'blur(15px)' }}
            animate={{ x: [0, 7, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Wave 1 — far, slowest */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '57%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path
                    d="M0,20 C175,8 350,32 525,20 C700,8 875,32 1050,20 C1225,8 1400,32 1400,20 L1400,300 L0,300 Z"
                    fill="#6496B4"
                />
            </svg>
        </motion.div>

        {/* Wave 2 — mid */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '62%', bottom: 0 }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path
                    d="M0,16 C116,6 233,26 350,16 C466,6 583,26 700,16 C816,6 933,26 1050,16 C1166,6 1283,26 1400,16 L1400,300 L0,300 Z"
                    fill="#5282A6"
                />
            </svg>
        </motion.div>

        {/* Wave 3 — near, fastest, lighter crest */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '67%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="oceanFrontWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86B6D2" stopOpacity="0.7" />
                        <stop offset="12%" stopColor="#40709C" stopOpacity="1" />
                        <stop offset="100%" stopColor="#2E5A7C" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path
                    d="M0,12 C70,4 140,20 210,12 C280,4 350,20 420,12 C490,4 560,20 630,12 C700,4 770,20 840,12 C910,4 980,20 1050,12 C1120,4 1190,20 1260,12 C1330,4 1400,18 1400,12 L1400,300 L0,300 Z"
                    fill="url(#oceanFrontWave)"
                />
            </svg>
        </motion.div>

        {/* Shimmer streaks on water surface */}
        <motion.div
            className="absolute pointer-events-none w-[160%]"
            style={{ top: '64%', left: '-5%' }}
            animate={{ x: ['0%', '3%', '0%'], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 900 16" className="w-full" style={{ height: 8 }}>
                <path d="M20,5 Q120,2 250,6 Q380,10 500,4 Q620,0 740,5 Q860,9 900,4"
                    stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M0,11 Q110,8 250,12 Q390,16 510,10 Q650,5 780,11 Q880,15 900,10"
                    stroke="rgba(255,255,255,0.16)" strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
        <motion.div
            className="absolute pointer-events-none w-[130%]"
            style={{ top: '73%', left: '0%' }}
            animate={{ x: ['2%', '0%', '2%'], opacity: [0.45, 0.72, 0.45] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 800 14" className="w-full" style={{ height: 6 }}>
                <path d="M0,5 Q90,2 200,6 Q310,10 430,4 Q550,0 670,5 Q770,9 800,4"
                    stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
    </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

// ─── Screen sequence ──────────────────────────────────────────────────────────

type ScreenDef =
    | { type: 'adult-intro'; slideIndex: number }
    | { type: 'adult-registration' }
    | { type: 'device-handoff' }
    | { type: 'story'; slideId: string; continueLabel?: string; useOceanBg?: boolean }
    | { type: 'minigame1' }
    | { type: 'question'; questionIndex: number }
    | { type: 'minigame2' }
    | { type: 'child-completion' }
    | { type: 'adult-report' };

const SCREENS: ScreenDef[] = [
    // Adult onboarding (intro + registration)
    { type: 'adult-intro', slideIndex: 0 },
    { type: 'adult-intro', slideIndex: 1 },
    { type: 'adult-intro', slideIndex: 2 },
    { type: 'adult-registration' },
    { type: 'device-handoff' },
    // Child story intro — ocean background
    { type: 'story', slideId: 'intro_a', useOceanBg: true },
    { type: 'story', slideId: 'intro_b', useOceanBg: true },
    { type: 'story', slideId: 'intro_c', useOceanBg: true },
    { type: 'story', slideId: 'intro_0', continueLabel: '¡A bordo!', useOceanBg: true },
    // Phase 2: La Partida
    { type: 'question', questionIndex: 0 },
    { type: 'question', questionIndex: 1 },
    { type: 'story', slideId: 'slide_1', useOceanBg: true },
    // Phase 3: Navegación
    { type: 'question', questionIndex: 2 },
    { type: 'question', questionIndex: 3 },
    // Phase 4: La Tormenta
    { type: 'story', slideId: 'slide_2', useOceanBg: true },
    { type: 'question', questionIndex: 4 },
    { type: 'question', questionIndex: 5 },
    { type: 'question', questionIndex: 6 },
    // Phase 5: Después de la tormenta — mini-juego de esquiva
    { type: 'minigame1' },
    { type: 'story', slideId: 'slide_3', useOceanBg: true },
    { type: 'question', questionIndex: 7 },
    { type: 'question', questionIndex: 8 },
    { type: 'question', questionIndex: 9 },
    // Phase 6: Destino
    { type: 'story', slideId: 'slide_4', useOceanBg: true },
    { type: 'question', questionIndex: 10 },
    { type: 'question', questionIndex: 11 },
    // Closure
    { type: 'child-completion' },
    { type: 'adult-report' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingProps {
    userEmail?: string;
    onPlayComplete?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingProps> = ({ userEmail = '', onPlayComplete }) => {
    const { questions } = useQuestions();
    const [screenIndex, setScreenIndex] = useState(0);
    const [adultData, setAdultData]     = useState<AdultData | null>(null);
    const [answers, setAnswers]         = useState<QuestionAnswer[]>([]);
    const [aiSections, setAiSections]   = useState<AISections | null>(null);
    const [aiLoading, setAiLoading]     = useState(false);
    const reportRef        = useRef<ReturnType<typeof getReportData> | null>(null);
    const profileRef       = useRef<{ eje: string; motor: string; ejeSecundario?: string; tendenciaLabel?: string } | null>(null);
    const playCountedRef   = useRef(false);

    const advance = () => setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));

    const handleAnswer = (answer: QuestionAnswer) => {
        setAnswers(prev => [...prev, answer]);
        advance();
    };

    // When child completes → resolve profile + generate AI sections
    useEffect(() => {
        const screen = SCREENS[screenIndex];
        if (screen.type !== 'child-completion') return;
        if (!adultData || answers.length < questions.length) return;

        const run = async () => {
            // Fetch recent sessions for tiebreaker dispersion
            let sessionCtx: SessionContext | undefined;
            try {
                const { data } = await supabase
                    .from('sessions')
                    .select('eje,motor')
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (data && data.length > 0) {
                    sessionCtx = {
                        priorEjes: data.map((s: { eje: string }) => s.eje),
                        priorMotors: data.map((s: { motor: string }) => s.motor),
                    };
                }
            } catch {
                // If query fails, proceed without tiebreaker
            }

            const profile = resolveFromAnswers(answers, sessionCtx);
            const report  = getReportData(profile.eje, profile.motor, '', adultData.nombreNino);
            // Attach sub-profile info to report
            report.ejeSecundario  = profile.ejeSecundario;
            report.tendenciaLabel = profile.tendenciaLabel;

            // Attach tendencia content (paragraph + extra words)
            const tendencia = getTendenciaContent(profile.eje, profile.ejeSecundario);
            if (tendencia) {
                const injectNombre = (t: string) => t.replace(/\{nombre\}/g, adultData.nombreNino);
                report.tendenciaParagraph  = injectNombre(tendencia.parrafo);
                report.palabrasPuenteExtra = tendencia.palabrasPuenteExtra;
                report.palabrasRuidoExtra  = tendencia.palabrasRuidoExtra;
            }

            reportRef.current  = report;
            profileRef.current = {
                eje: profile.eje,
                motor: profile.motor,
                ejeSecundario: profile.ejeSecundario,
                tendenciaLabel: profile.tendenciaLabel,
            };

            if (profile.tiebreakerApplied) {
                console.info('[profileResolver] Tiebreaker applied → eje:', profile.eje, 'motor:', profile.motor);
            }

            setAiLoading(true);
            const ctx: ReportContext = {
                nombre:       adultData.nombreNino,
                deporte:      adultData.deporte,
                edad:         adultData.edad,
                destinatario: 'padre',
            };

            try {
                const { sections, usage }: { sections: AISections; usage: AIUsage } =
                    await generateAISections(report, ctx);
                setAiSections(sections);
                await saveSession({
                    adultData,
                    eje:            profile.eje,
                    motor:          profile.motor,
                    archetypeLabel: report.arquetipo.label,
                    ejeSecundario:  profile.ejeSecundario,
                    answers,
                    aiUsage: {
                        tokensInput:  usage.inputTokens,
                        tokensOutput: usage.outputTokens,
                        costUsd:      usage.costUsd,
                    },
                });
            } catch {
                // AI failed — still save session without AI usage
                await saveSession({
                    adultData,
                    eje:            profile.eje,
                    motor:          profile.motor,
                    archetypeLabel: report.arquetipo.label,
                    ejeSecundario:  profile.ejeSecundario,
                    answers,
                });
            } finally {
                setAiLoading(false);
            }

            // Increment play count after session is persisted
            if (!playCountedRef.current) {
                playCountedRef.current = true;
                await onPlayComplete?.();
            }
        };

        run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

    const handleRestart = () => {
        setScreenIndex(0);
        setAdultData(null);
        setAnswers([]);
        setAiSections(null);
        setAiLoading(false);
        reportRef.current  = null;
        profileRef.current = null;
    };

    const screen = SCREENS[screenIndex];
    const nombre  = adultData?.nombreNino  ?? '';
    const adulto  = adultData?.nombreAdulto ?? '';
    const deporte = adultData?.deporte     ?? '';

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 min-h-[80vh]">
            {/* Ocean background — persists across question + ocean story screens */}
            <AnimatePresence>
                {(screen.type === 'question' || (screen.type === 'story' && screen.useOceanBg) || screen.type === 'child-completion') && (
                    <motion.div
                        key="ocean-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="fixed inset-0 overflow-hidden pointer-events-none"
                        style={{ zIndex: 0 }}
                    >
                        <OceanBackground />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative" style={{ zIndex: 1 }}>
            <AnimatePresence mode="wait">
                {screen.type === 'adult-intro' && (
                    <AdultIntroSlide
                        key={`adult-intro-${screen.slideIndex}`}
                        slide={ADULT_INTRO_SLIDES[screen.slideIndex]}
                        slideIndex={screen.slideIndex}
                        totalSlides={ADULT_INTRO_SLIDES.length}
                        onContinue={advance}
                    />
                )}

                {screen.type === 'adult-registration' && (
                    <AdultRegistration
                        key="adult-reg"
                        userEmail={userEmail}
                        onComplete={data => { setAdultData(data); advance(); }}
                    />
                )}

                {screen.type === 'device-handoff' && adultData && (
                    <DeviceHandoff
                        key="handoff"
                        nombreAdulto={adulto}
                        nombreNino={nombre}
                        onContinue={advance}
                    />
                )}

                {screen.type === 'story' && (
                    <StorySlide
                        key={screen.slideId}
                        slide={STORY_SLIDES[screen.slideId]}
                        nombreNino={nombre}
                        deporte={deporte}
                        onContinue={advance}
                        continueLabel={screen.continueLabel}
                        useOceanBg={screen.useOceanBg}
                    />
                )}

                {screen.type === 'minigame1' && (
                    <MiniGame1 key="mg1" onComplete={advance} />
                )}

                {screen.type === 'question' && (
                    <QuestionScreen
                        key={`q-${screen.questionIndex}`}
                        question={questions[screen.questionIndex]}
                        questionIndex={answers.length}
                        totalQuestions={questions.length}
                        nombreNino={nombre}
                        onAnswer={handleAnswer}
                    />
                )}

                {screen.type === 'minigame2' && (
                    <MiniGame2 key="mg2" onComplete={advance} />
                )}

                {screen.type === 'child-completion' && (
                    <ChildCompletion
                        key="child-done"
                        nombreNino={nombre}
                        nombreAdulto={adulto}
                        onContinue={advance}
                    />
                )}

                {screen.type === 'adult-report' && adultData && reportRef.current && (
                    <AdultReport
                        key="adult-report"
                        adultData={adultData}
                        report={reportRef.current}
                        aiSections={aiSections}
                        aiLoading={aiLoading}
                        onRestart={handleRestart}
                    />
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};
