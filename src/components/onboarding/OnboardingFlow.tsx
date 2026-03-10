import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ADULT_INTRO_SLIDES, STORY_SLIDES } from '../../lib/onboardingData';
import { useQuestions } from '../../lib/useQuestions';
import { QuestionAnswer, resolveFromAnswers } from '../../lib/profileResolver';
import { getReportData } from '../../lib/argosEngine';
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
    | { type: 'story'; slideId: string; continueLabel?: string }
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
    // Child story intro
    { type: 'story', slideId: 'intro_a' },
    { type: 'story', slideId: 'intro_b' },
    { type: 'story', slideId: 'intro_c' },
    { type: 'story', slideId: 'intro_0', continueLabel: '¡A bordo!' },
    // Phase 2: La Partida
    { type: 'question', questionIndex: 0 },
    { type: 'question', questionIndex: 1 },
    { type: 'story', slideId: 'slide_1' },
    // Phase 3: Navegación
    { type: 'question', questionIndex: 2 },
    { type: 'question', questionIndex: 3 },
    // Phase 4: La Tormenta
    { type: 'story', slideId: 'slide_2' },
    { type: 'question', questionIndex: 4 },
    { type: 'question', questionIndex: 5 },
    { type: 'question', questionIndex: 6 },
    // Phase 5: Después de la tormenta — mini-juego de esquiva
    { type: 'minigame1' },
    { type: 'story', slideId: 'slide_3' },
    { type: 'question', questionIndex: 7 },
    { type: 'question', questionIndex: 8 },
    { type: 'question', questionIndex: 9 },
    // Phase 6: Destino
    { type: 'story', slideId: 'slide_4' },
    { type: 'question', questionIndex: 10 },
    { type: 'question', questionIndex: 11 },
    // Closure
    { type: 'child-completion' },
    { type: 'adult-report' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const OnboardingFlow: React.FC = () => {
    const { questions } = useQuestions();
    const [screenIndex, setScreenIndex] = useState(0);
    const [adultData, setAdultData]     = useState<AdultData | null>(null);
    const [answers, setAnswers]         = useState<QuestionAnswer[]>([]);
    const [aiSections, setAiSections]   = useState<AISections | null>(null);
    const [aiLoading, setAiLoading]     = useState(false);
    const reportRef  = useRef<ReturnType<typeof getReportData> | null>(null);
    const profileRef = useRef<{ eje: string; motor: string } | null>(null);

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

        const profile = resolveFromAnswers(answers);
        const report  = getReportData(profile.eje, profile.motor, '', adultData.nombreNino);
        reportRef.current  = report;
        profileRef.current = { eje: profile.eje, motor: profile.motor };

        setAiLoading(true);
        const ctx: ReportContext = {
            nombre:       adultData.nombreNino,
            deporte:      adultData.deporte,
            edad:         adultData.edad,
            destinatario: 'padre',
        };
        generateAISections(report, ctx)
            .then(({ sections, usage }: { sections: AISections; usage: AIUsage }) => {
                setAiSections(sections);
                // Save session silently (best-effort)
                saveSession({
                    adultData,
                    eje:            profile.eje,
                    motor:          profile.motor,
                    archetypeLabel: report.arquetipo.label,
                    answers,
                    aiUsage: {
                        tokensInput:  usage.inputTokens,
                        tokensOutput: usage.outputTokens,
                        costUsd:      usage.costUsd,
                    },
                });
            })
            .catch(() => {
                // Graceful fallback — save session without AI usage
                if (adultData && profileRef.current && reportRef.current) {
                    saveSession({
                        adultData,
                        eje:            profileRef.current.eje,
                        motor:          profileRef.current.motor,
                        archetypeLabel: reportRef.current.arquetipo.label,
                        answers,
                    });
                }
            })
            .finally(() => setAiLoading(false));
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
    );
};
