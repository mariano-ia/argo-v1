import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { getAdultIntroSlides, getStorySlides, getQuestions } from '../../lib/onboardingDataI18n';
import { getOdysseyT } from '../../lib/odysseyTranslations';
import { useLang } from '../../context/LangContext';
import { QuestionAnswer, SessionContext, resolveFromAnswers } from '../../lib/profileResolver';
import { supabase } from '../../lib/supabase';
import { getReportData } from '../../lib/argosEngine';
import { getTendenciaContent } from '../../lib/archetypeData';
import { generateAISections, AISections, AIUsage, ReportContext } from '../../lib/openaiService';
import { saveSession } from '../../lib/sessionStore';
import { LanguageSelect } from './screens/LanguageSelect';
import { AdultIntroSlide } from './screens/AdultIntroSlide';
import { AdultRegistration } from './screens/AdultRegistration';
import { DeviceHandoff } from './screens/DeviceHandoff';
import { StorySlideV2 } from './screens/StorySlideV2';
import { QuestionScreenV2 } from './screens/QuestionScreenV2';
import { ChildCompletion } from './screens/ChildCompletion';
import { AdultReport } from './screens/AdultReport';
import { AnimatedScene } from './scenes/AnimatedScene';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdultData {
    nombreAdulto: string;
    email: string;
    nombreNino: string;
    edad: number;
    deporte: string;
}

// ─── Screen sequence ─────────────────────────────────────────────────────────

type ScreenDef =
    | { type: 'language-select' }
    | { type: 'adult-intro'; slideIndex: number }
    | { type: 'adult-registration' }
    | { type: 'device-handoff' }
    | { type: 'story'; slideId: string; useContinueLabelFromT?: boolean }
    | { type: 'question'; questionIndex: number }
    | { type: 'child-completion' }
    | { type: 'adult-report' };

const SCREENS: ScreenDef[] = [
    // Language selection
    { type: 'language-select' },
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
    { type: 'story', slideId: 'intro_0', useContinueLabelFromT: true },
    // Phase: Puerto (Q1-Q2)
    { type: 'question', questionIndex: 0 },
    { type: 'question', questionIndex: 1 },
    { type: 'story', slideId: 'slide_1' },
    // Phase: Mar Abierto (Q3-Q4)
    { type: 'question', questionIndex: 2 },
    { type: 'question', questionIndex: 3 },
    // Phase: Tormenta (Q5-Q7)
    { type: 'story', slideId: 'slide_2' },
    { type: 'question', questionIndex: 4 },
    { type: 'question', questionIndex: 5 },
    { type: 'question', questionIndex: 6 },
    // Calma (Q8-Q10)
    { type: 'story', slideId: 'slide_3' },
    { type: 'question', questionIndex: 7 },
    { type: 'question', questionIndex: 8 },
    { type: 'question', questionIndex: 9 },
    // Phase: Isla (Q11-Q12)
    { type: 'story', slideId: 'slide_4' },
    { type: 'question', questionIndex: 10 },
    { type: 'question', questionIndex: 11 },
    // Closure
    { type: 'child-completion' },
    { type: 'adult-report' },
];

/** Get the question index that determines the scene phase.
 *  Story slides look FORWARD to show the phase they introduce.
 *  Questions and other screens look BACKWARD to the most recent question. */
function getCurrentQuestionIndex(screenIndex: number): number {
    const screen = SCREENS[screenIndex];
    // Story slides introduce the NEXT phase — look forward
    if (screen.type === 'story') {
        for (let i = screenIndex + 1; i < SCREENS.length; i++) {
            const s = SCREENS[i];
            if (s.type === 'question') return s.questionIndex;
        }
    }
    // Everything else — look backward
    for (let i = screenIndex; i >= 0; i--) {
        const s = SCREENS[i];
        if (s.type === 'question') return s.questionIndex;
    }
    return 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingV2Props {
    userEmail?: string;
    onPlayComplete?: () => void;
    tenantId?: string;
}

export const OnboardingFlowV2: React.FC<OnboardingV2Props> = ({ userEmail = '', onPlayComplete, tenantId }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    // Language-aware data
    const adultIntroSlides = getAdultIntroSlides(lang);
    const storySlides = getStorySlides(lang);
    const questions = getQuestions(lang);

    const [screenIndex, setScreenIndex] = useState(0);
    const [adultData, setAdultData]     = useState<AdultData | null>(null);
    const [answers, setAnswers]         = useState<QuestionAnswer[]>([]);
    const [aiSections, setAiSections]   = useState<AISections | null>(null);
    const [aiLoading, setAiLoading]     = useState(false);
    const [saveError, setSaveError]     = useState<string | null>(null);
    const reportRef        = useRef<ReturnType<typeof getReportData> | null>(null);
    const profileRef       = useRef<{ eje: string; motor: string; ejeSecundario?: string; tendenciaLabel?: string } | null>(null);
    const playCountedRef   = useRef(false);

    // ── Background music ──────────────────────────────────────────────────────
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeRef  = useRef<number | null>(null);
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(false);

    // ── Ambient effects (layered on top of background music) ────────────────
    const effectRef        = useRef<HTMLAudioElement | null>(null);
    const effectFadeRef    = useRef<number | null>(null);
    const currentEffectSrc = useRef<string | null>(null);

    const TARGET_VOL     = 0.18;
    const FADE_IN_MS     = 5000;   // gentle fade in
    const FADE_OUT_MS    = 3000;
    const ODYSSEY_START  = 6;      // first story slide (intro_a)
    const ODYSSEY_END    = 26;     // child-completion ("mission complete")
    const LOOP_MARGIN    = 0.3;    // seconds before end to seamless-loop

    // Ambient effect config
    const EFFECT_VOL         = 0.25;
    const EFFECT_FADE_IN_MS  = 2000;
    const EFFECT_FADE_OUT_MS = 1500;

    /** Which ambient effect file should play for a given screen index */
    const getEffectSrc = (idx: number): string | null => {
        if (idx >= 6 && idx <= 11)  return '/audio/effects_01.mp3'; // intro + puerto
        if (idx >= 12 && idx <= 14) return '/audio/effects_02.mp3'; // mar abierto
        if (idx >= 15 && idx <= 18) return '/audio/effects_03.mp3'; // tormenta
        if (idx >= 19 && idx <= 26) return '/audio/effects_02.mp3'; // calma + isla + completion
        return null;
    };

    const doFade = (audio: HTMLAudioElement, from: number, to: number, ms: number, then?: () => void) => {
        if (fadeRef.current) clearInterval(fadeRef.current);
        const STEP = 50;
        const steps = ms / STEP;
        const delta = (to - from) / steps;
        let step = 0;
        fadeRef.current = window.setInterval(() => {
            step++;
            audio.volume = Math.min(1, Math.max(0, from + delta * step));
            if (step >= steps) {
                clearInterval(fadeRef.current!);
                fadeRef.current = null;
                audio.volume = Math.min(1, Math.max(0, to));
                then?.();
            }
        }, STEP);
    };

    const doEffectFade = (audio: HTMLAudioElement, from: number, to: number, ms: number, then?: () => void) => {
        if (effectFadeRef.current) clearInterval(effectFadeRef.current);
        const STEP = 50;
        const steps = ms / STEP;
        const delta = (to - from) / steps;
        let step = 0;
        effectFadeRef.current = window.setInterval(() => {
            step++;
            audio.volume = Math.min(1, Math.max(0, from + delta * step));
            if (step >= steps) {
                clearInterval(effectFadeRef.current!);
                effectFadeRef.current = null;
                audio.volume = Math.min(1, Math.max(0, to));
                then?.();
            }
        }, STEP);
    };

    const startAudioIfNeeded = (nextIndex: number) => {
        if (nextIndex === ODYSSEY_START) {
            if (!audioRef.current) {
                const a = new Audio('/audio/argo_background.mp3');
                a.loop   = false; // we handle looping manually to avoid gap
                a.volume = 0;
                // Seamless loop: seek back before the track ends
                a.addEventListener('timeupdate', () => {
                    if (a.duration && a.currentTime > a.duration - LOOP_MARGIN) {
                        a.currentTime = 0;
                    }
                });
                // Safety fallback if timeupdate misses
                a.addEventListener('ended', () => {
                    a.currentTime = 0;
                    a.play().catch(() => {});
                });
                audioRef.current = a;
            }
            const a = audioRef.current;
            a.volume = 0;
            a.play().then(() => {
                if (!mutedRef.current) doFade(a, 0, TARGET_VOL, FADE_IN_MS);
            }).catch(e => console.warn('[audio] autoplay blocked:', e));
        }
    };

    /** Start / stop / crossfade ambient effects based on screen index */
    const startEffectIfNeeded = (nextIdx: number) => {
        const wantedSrc = getEffectSrc(nextIdx);
        const activeSrc = currentEffectSrc.current;

        if (wantedSrc === activeSrc) return; // same effect — nothing to do

        // Fade out current effect (standalone interval — not tied to effectFadeRef
        // so it can run simultaneously with the new effect's fade-in)
        if (effectRef.current && activeSrc) {
            const old = effectRef.current;
            const fromVol = old.volume;
            const STEP = 50;
            const steps = EFFECT_FADE_OUT_MS / STEP;
            const delta = -fromVol / steps;
            let s = 0;
            const id = window.setInterval(() => {
                s++;
                old.volume = Math.max(0, fromVol + delta * s);
                if (s >= steps) { clearInterval(id); old.pause(); }
            }, STEP);
            effectRef.current = null;
            currentEffectSrc.current = null;
        }

        // Start new effect
        if (wantedSrc) {
            const a = new Audio(wantedSrc);
            a.loop = false;
            a.volume = 0;
            a.addEventListener('timeupdate', () => {
                if (a.duration && a.currentTime > a.duration - LOOP_MARGIN) {
                    a.currentTime = 0;
                }
            });
            a.addEventListener('ended', () => {
                a.currentTime = 0;
                a.play().catch(() => {});
            });
            effectRef.current = a;
            currentEffectSrc.current = wantedSrc;
            a.play().then(() => {
                if (!mutedRef.current) doEffectFade(a, 0, EFFECT_VOL, EFFECT_FADE_IN_MS);
            }).catch(e => console.warn('[audio] effect autoplay blocked:', e));
        }
    };

    // Fade out MUSIC when reaching child-completion; effects continue until adult-report
    useEffect(() => {
        if (screenIndex === ODYSSEY_END && audioRef.current) {
            doFade(audioRef.current, audioRef.current.volume, 0, FADE_OUT_MS, () => {
                audioRef.current?.pause();
            });
        }
    }, [screenIndex]);

    // Preload all audio files into browser cache during adult screens
    useEffect(() => {
        ['/audio/argo_background.mp3', '/audio/effects_01.mp3', '/audio/effects_02.mp3', '/audio/effects_03.mp3']
            .forEach(src => { fetch(src).catch(() => {}); });
    }, []);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (fadeRef.current) clearInterval(fadeRef.current);
            if (effectFadeRef.current) clearInterval(effectFadeRef.current);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            if (effectRef.current) { effectRef.current.pause(); effectRef.current = null; }
        };
    }, []);

    const toggleMute = () => {
        setMuted(prev => {
            const next = !prev;
            mutedRef.current = next;
            // Cancel any running fades so they don't overwrite the volume
            if (fadeRef.current) { clearInterval(fadeRef.current); fadeRef.current = null; }
            if (effectFadeRef.current) { clearInterval(effectFadeRef.current); effectFadeRef.current = null; }
            if (audioRef.current) {
                audioRef.current.volume = next ? 0 : TARGET_VOL;
            }
            if (effectRef.current) {
                effectRef.current.volume = next ? 0 : EFFECT_VOL;
            }
            return next;
        });
    };

    const advance = () => {
        const nextIdx = screenIndex + 1;
        startAudioIfNeeded(nextIdx);
        startEffectIfNeeded(nextIdx);
        setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));
    };

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
                // proceed without tiebreaker
            }

            const profile = resolveFromAnswers(answers, sessionCtx);
            const report  = getReportData(profile.eje, profile.motor, '', adultData.nombreNino);
            report.ejeSecundario  = profile.ejeSecundario;
            report.tendenciaLabel = profile.tendenciaLabel;

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
                lang,
            };

            let saveResult: { ok: boolean; error?: string };
            try {
                const { sections, usage }: { sections: AISections; usage: AIUsage } =
                    await generateAISections(report, ctx);
                setAiSections(sections);
                saveResult = await saveSession({
                    adultData,
                    eje:            profile.eje,
                    motor:          profile.motor,
                    archetypeLabel: report.arquetipo.label,
                    ejeSecundario:  profile.ejeSecundario,
                    answers,
                    tenantId,
                    lang,
                    aiUsage: {
                        tokensInput:  usage.inputTokens,
                        tokensOutput: usage.outputTokens,
                        costUsd:      usage.costUsd,
                    },
                });
            } catch {
                saveResult = await saveSession({
                    adultData,
                    eje:            profile.eje,
                    motor:          profile.motor,
                    archetypeLabel: report.arquetipo.label,
                    ejeSecundario:  profile.ejeSecundario,
                    answers,
                    tenantId,
                    lang,
                });
            } finally {
                setAiLoading(false);
            }

            if (!saveResult!.ok) {
                setSaveError(saveResult!.error ?? 'Unknown error saving session');
            }

            if (!playCountedRef.current) {
                playCountedRef.current = true;
                await onPlayComplete?.();
            }
        };

        run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

    const handleRestart = () => {
        if (fadeRef.current) clearInterval(fadeRef.current);
        if (effectFadeRef.current) clearInterval(effectFadeRef.current);
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (effectRef.current) { effectRef.current.pause(); effectRef.current = null; }
        currentEffectSrc.current = null;
        setScreenIndex(0);
        setAdultData(null);
        setAnswers([]);
        setAiSections(null);
        setAiLoading(false);
        reportRef.current  = null;
        profileRef.current = null;
    };

    const screen  = SCREENS[screenIndex];
    const nombre  = adultData?.nombreNino  ?? '';
    const adulto  = adultData?.nombreAdulto ?? '';
    const deporte = adultData?.deporte     ?? '';

    // Determine whether to show scene backgrounds (child-facing screens)
    const showScene = screen.type === 'question'
        || screen.type === 'story'
        || screen.type === 'child-completion';
    const sceneQuestionIndex = getCurrentQuestionIndex(screenIndex);
    const showMuteBtn = screenIndex >= ODYSSEY_START && screenIndex <= ODYSSEY_END;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 min-h-[80vh]">
            {/* Mute toggle — visible during odyssey */}
            <AnimatePresence>
                {showMuteBtn && (
                    <motion.button
                        key="mute-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={toggleMute}
                        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/30 transition-colors"
                        aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Dynamic scene background — changes per phase */}
            <AnimatePresence>
                {showScene && (
                    <motion.div
                        key="scene-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="fixed inset-0 overflow-hidden pointer-events-none"
                        style={{ zIndex: 0 }}
                    >
                        <AnimatedScene questionIndex={sceneQuestionIndex} screenIndex={screenIndex} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative" style={{ zIndex: 1 }}>
            <AnimatePresence mode="wait">
                {screen.type === 'language-select' && (
                    <LanguageSelect
                        key="lang-select"
                        onContinue={advance}
                    />
                )}

                {screen.type === 'adult-intro' && (
                    <AdultIntroSlide
                        key={`adult-intro-${screen.slideIndex}`}
                        slide={adultIntroSlides[screen.slideIndex]}
                        slideIndex={screen.slideIndex}
                        totalSlides={adultIntroSlides.length}
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
                    <StorySlideV2
                        key={screen.slideId}
                        slide={storySlides[screen.slideId]}
                        nombreNino={nombre}
                        deporte={deporte}
                        onContinue={advance}
                        continueLabel={screen.useContinueLabelFromT ? ot.aboard : undefined}
                    />
                )}

                {screen.type === 'question' && (
                    <QuestionScreenV2
                        key={`q-${screen.questionIndex}`}
                        question={questions[screen.questionIndex]}
                        questionIndex={answers.length}
                        totalQuestions={questions.length}
                        nombreNino={nombre}
                        anchorsCollected={answers.length}
                        onAnswer={handleAnswer}
                    />
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
                        saveError={saveError}
                        onRestart={handleRestart}
                    />
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};
