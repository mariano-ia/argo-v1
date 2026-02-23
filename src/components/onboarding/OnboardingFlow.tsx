import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { QUESTIONS, STORY_SLIDES } from '../../lib/onboardingData';
import { QuestionAnswer, resolveFromAnswers } from '../../lib/profileResolver';
import { getReportData } from '../../lib/argosEngine';
import { generateAISections, AISections, ReportContext } from '../../lib/openaiService';
import { AdultRegistration } from './screens/AdultRegistration';
import { DeviceHandoff } from './screens/DeviceHandoff';
import { StorySlide } from './screens/StorySlide';
import { MiniGame1 } from './screens/MiniGame1';
import { QuestionScreen } from './screens/QuestionScreen';
import { MiniGame2 } from './screens/MiniGame2';
import { ChildCompletion } from './screens/ChildCompletion';
import { AdultReport } from './screens/AdultReport';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

// ─── Screen sequence definition ───────────────────────────────────────────────

type ScreenDef =
    | { type: 'adult-registration' }
    | { type: 'device-handoff' }
    | { type: 'story'; slideId: string; continueLabel?: string }
    | { type: 'minigame1' }
    | { type: 'question'; questionIndex: number }
    | { type: 'minigame2' }
    | { type: 'child-completion' }
    | { type: 'adult-report' };

const SCREENS: ScreenDef[] = [
    { type: 'adult-registration' },
    { type: 'device-handoff' },
    // Story intro
    { type: 'story', slideId: 'intro_a' },
    { type: 'story', slideId: 'intro_b' },
    { type: 'story', slideId: 'intro_c' },
    { type: 'story', slideId: 'intro_0', continueLabel: '¡A bordo!' },
    // Mini-game 1
    { type: 'minigame1' },
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
    // Phase 5: Desagote
    { type: 'minigame2' },
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
    const [screenIndex, setScreenIndex] = useState(0);
    const [adultData, setAdultData]     = useState<AdultData | null>(null);
    const [answers, setAnswers]         = useState<QuestionAnswer[]>([]);
    const [aiSections, setAiSections]   = useState<AISections | null>(null);
    const [aiLoading, setAiLoading]     = useState(false);
    const reportRef = useRef<ReturnType<typeof getReportData> | null>(null);

    const advance = () => setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));

    const handleAnswer = (answer: QuestionAnswer) => {
        setAnswers(prev => [...prev, answer]);
        advance();
    };

    // When child completes (transitions to child-completion screen),
    // resolve the profile and kick off AI generation in the background.
    useEffect(() => {
        const currentScreen = SCREENS[screenIndex];
        if (currentScreen.type !== 'child-completion') return;
        if (!adultData || answers.length < QUESTIONS.length) return;

        const profile = resolveFromAnswers(answers);
        const report  = getReportData(profile.eje, profile.motor, '', adultData.nombreNino);
        reportRef.current = report;

        // Start AI generation immediately in background
        setAiLoading(true);
        const ctx: ReportContext = {
            nombre:       adultData.nombreNino,
            deporte:      adultData.deporte,
            edad:         adultData.edad,
            destinatario: 'padre',
        };
        generateAISections(report, ctx)
            .then(({ sections }) => {
                setAiSections(sections);
                setAiLoading(false);
            })
            .catch(() => {
                // Graceful fallback: show base report
                setAiLoading(false);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

    const handleRestart = () => {
        setScreenIndex(0);
        setAdultData(null);
        setAnswers([]);
        setAiSections(null);
        setAiLoading(false);
        reportRef.current = null;
    };

    const screen = SCREENS[screenIndex];

    const nombre   = adultData?.nombreNino  ?? '';
    const adulto   = adultData?.nombreAdulto ?? '';
    const deporte  = adultData?.deporte     ?? '';

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 min-h-[70vh]">
            <AnimatePresence mode="wait">
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
                        question={QUESTIONS[screen.questionIndex]}
                        questionIndex={answers.length}
                        totalQuestions={QUESTIONS.length}
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
