import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
    startSession, updateSession, saveSession,
    saveProgressToLocal, getRecoverableSession, clearRecoveryData,
    RecoverableSession,
} from '../../lib/sessionStore';
import { LanguageSelect } from './screens/LanguageSelect';
import { AdultIntroSlide } from './screens/AdultIntroSlide';
import { AdultRegistration } from './screens/AdultRegistration';
import { DeviceHandoff } from './screens/DeviceHandoff';
import { StorySlideV2 } from './screens/StorySlideV2';
import { QuestionScreenV2 } from './screens/QuestionScreenV2';
import { ChildResultReveal } from './screens/ChildResultReveal';
import { buildReportHtml } from './screens/AdultReport';
import { sendReport } from '../../lib/emailService';
import { CHILD_REVEAL_TEXTS } from '../../lib/childRevealTexts';
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
    | { type: 'child-result' }
;

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
    { type: 'child-result' },      // resolves profile + shows archetype result to child (final screen)
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
    const [, setAiSections]   = useState<AISections | null>(null);
    const [, setAiLoading]     = useState(false);
    const [, setSaveError]     = useState<string | null>(null);
    const reportRef        = useRef<ReturnType<typeof getReportData> | null>(null);
    const profileRef       = useRef<{ eje: string; motor: string; ejeSecundario?: string; tendenciaLabel?: string } | null>(null);
    const playCountedRef   = useRef(false);

    // ── Session persistence (Options 1, 2, 3) ──────────────────────────────
    const sessionIdRef = useRef<string | null>(null);
    const [recoveryData, setRecoveryData] = useState<RecoverableSession | null>(null);

    // Option 2: Check for recoverable session on mount
    useEffect(() => {
        const recovered = getRecoverableSession();
        if (recovered) setRecoveryData(recovered);
    }, []);

    // Option 2: Resume from recovery
    const handleResume = useCallback((data: RecoverableSession) => {
        // Validate screenIndex is within bounds
        const safeScreenIndex = Math.min(Math.max(0, data.screenIndex), SCREENS.length - 1);
        setAdultData(data.adultData);
        setAnswers(data.answers);
        setScreenIndex(safeScreenIndex);
        if (data.sessionId) sessionIdRef.current = data.sessionId;
        setRecoveryData(null);
    }, []);

    // Option 2: Dismiss recovery
    const handleDismissRecovery = useCallback(() => {
        clearRecoveryData();
        setRecoveryData(null);
    }, []);

    // Option 3: Create "started" session when odyssey begins
    const startingSessionRef = useRef(false);
    useEffect(() => {
        if (screenIndex !== ODYSSEY_START || !adultData || sessionIdRef.current || startingSessionRef.current) return;
        startingSessionRef.current = true;
        startSession({ adultData, tenantId, lang }).then(result => {
            if (result.ok && result.id) {
                sessionIdRef.current = result.id;
                console.info('[session] Started session created:', result.id);
            } else {
                console.warn('[session] Failed to create started session:', result.error);
            }
        }).finally(() => { startingSessionRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

    // ── Audio (Web Audio API for iOS volume control) ───────────────────────
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(false);

    const effectRef        = useRef<HTMLAudioElement | null>(null);
    const currentEffectSrc = useRef<string | null>(null);

    const audioCtxRef    = useRef<AudioContext | null>(null);
    const musicGainRef   = useRef<GainNode | null>(null);
    const effectGainRef  = useRef<GainNode | null>(null);

    const TARGET_VOL     = 0.18;
    const FADE_IN_MS     = 5000;
    const FADE_OUT_MS    = 3000;
    const ODYSSEY_START  = 6;
    const ODYSSEY_END    = 26;
    const LOOP_MARGIN    = 0.3;

    const EFFECT_VOL         = 0.25;
    const EFFECT_FADE_IN_MS  = 2000;
    const EFFECT_FADE_OUT_MS = 1500;

    const getEffectSrc = (idx: number): string | null => {
        if (idx >= 6 && idx <= 11)  return '/audio/effects_01.mp3'; // intro + puerto
        if (idx >= 12 && idx <= 14) return '/audio/effects_02.mp3'; // mar abierto
        if (idx >= 15 && idx <= 18) return '/audio/effects_03.mp3'; // tormenta
        if (idx >= 19 && idx <= 26) return '/audio/effects_02.mp3'; // calma + isla + completion
        return null;
    };

    /** Get or create shared AudioContext (call within user gesture on iOS) */
    const ensureAudioCtx = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    /** Route audio element through a GainNode (works on iOS unlike audio.volume) */
    const connectWithGain = (audio: HTMLAudioElement, initialGain: number): GainNode => {
        const ctx = ensureAudioCtx();
        const source = ctx.createMediaElementSource(audio);
        const gain = ctx.createGain();
        gain.gain.value = initialGain;
        source.connect(gain);
        gain.connect(ctx.destination);
        return gain;
    };

    /** Fade a GainNode using Web Audio scheduling (no setInterval needed) */
    const doGainFade = (gain: GainNode, to: number, ms: number, then?: () => void) => {
        const ctx = gain.context;
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(Math.max(0, to), ctx.currentTime + ms / 1000);
        if (then) setTimeout(then, ms);
    };

    /** Seamless loop via requestAnimationFrame (more reliable than timeupdate on iOS) */
    const setupSeamlessLoop = (audio: HTMLAudioElement) => {
        const check = () => {
            if (audio.duration && audio.currentTime > audio.duration - LOOP_MARGIN) {
                audio.currentTime = 0;
            }
            if (!audio.paused) requestAnimationFrame(check);
        };
        audio.addEventListener('play', () => requestAnimationFrame(check));
        audio.addEventListener('ended', () => {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        });
    };

    const startAudioIfNeeded = (nextIndex: number) => {
        if (nextIndex === ODYSSEY_START) {
            ensureAudioCtx();
            if (!audioRef.current) {
                const a = new Audio('/audio/argo_background.mp3');
                a.volume = 1; // volume controlled via GainNode, not audio.volume
                a.loop = false;
                setupSeamlessLoop(a);
                musicGainRef.current = connectWithGain(a, 0);
                audioRef.current = a;
            }
            const a = audioRef.current;
            const gain = musicGainRef.current!;
            gain.gain.setValueAtTime(0, gain.context.currentTime);
            a.play().then(() => {
                if (!mutedRef.current) doGainFade(gain, TARGET_VOL, FADE_IN_MS);
            }).catch(e => console.warn('[audio] autoplay blocked:', e));
        }
    };

    const startEffectIfNeeded = (nextIdx: number) => {
        const wantedSrc = getEffectSrc(nextIdx);
        const activeSrc = currentEffectSrc.current;

        if (wantedSrc === activeSrc) return;

        // Fade out current effect (each effect has its own GainNode — independent)
        if (effectRef.current && activeSrc && effectGainRef.current) {
            const old = effectRef.current;
            const oldGain = effectGainRef.current;
            doGainFade(oldGain, 0, EFFECT_FADE_OUT_MS, () => { old.pause(); });
            effectRef.current = null;
            effectGainRef.current = null;
            currentEffectSrc.current = null;
        }

        if (wantedSrc) {
            const a = new Audio(wantedSrc);
            a.volume = 1;
            a.loop = false;
            setupSeamlessLoop(a);
            const gain = connectWithGain(a, 0);
            effectRef.current = a;
            effectGainRef.current = gain;
            currentEffectSrc.current = wantedSrc;
            a.play().then(() => {
                if (!mutedRef.current) doGainFade(gain, EFFECT_VOL, EFFECT_FADE_IN_MS);
            }).catch(e => console.warn('[audio] effect autoplay blocked:', e));
        }
    };

    // Fade out MUSIC when reaching child-result (final screen)
    useEffect(() => {
        if (screenIndex === ODYSSEY_END && audioRef.current && musicGainRef.current) {
            doGainFade(musicGainRef.current, 0, FADE_OUT_MS, () => {
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
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            if (effectRef.current) { effectRef.current.pause(); effectRef.current = null; }
            if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
        };
    }, []);

    const toggleMute = () => {
        setMuted(prev => {
            const next = !prev;
            mutedRef.current = next;
            if (musicGainRef.current) {
                const g = musicGainRef.current;
                g.gain.cancelScheduledValues(g.context.currentTime);
                g.gain.setValueAtTime(next ? 0 : TARGET_VOL, g.context.currentTime);
            }
            if (effectGainRef.current) {
                const g = effectGainRef.current;
                g.gain.cancelScheduledValues(g.context.currentTime);
                g.gain.setValueAtTime(next ? 0 : EFFECT_VOL, g.context.currentTime);
            }
            return next;
        });
    };

    const advance = () => {
        const nextIdx = screenIndex + 1;
        try { startAudioIfNeeded(nextIdx); } catch (e) { console.warn('[audio] startAudio error:', e); }
        try { startEffectIfNeeded(nextIdx); } catch (e) { console.warn('[audio] startEffect error:', e); }
        setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));
    };

    // Option 2: Save progress to localStorage on each answer
    const handleAnswer = (answer: QuestionAnswer) => {
        const nextAnswers = [...answers, answer];
        setAnswers(nextAnswers);
        if (adultData) {
            saveProgressToLocal({
                adultData,
                answers: nextAnswers,
                screenIndex: screenIndex + 1,
                sessionId: sessionIdRef.current ?? undefined,
                tenantId,
                lang,
                timestamp: Date.now(),
            });
        }
        advance();
    };

    // When child completes → resolve profile + generate AI sections
    useEffect(() => {
        const screen = SCREENS[screenIndex];
        if (screen.type !== 'child-result') return;
        if (!adultData || answers.length < questions.length) return;

        const run = async () => {
            let sessionCtx: SessionContext | undefined;
            try {
                const { data } = await supabase
                    .from('sessions')
                    .select('eje,motor')
                    .is('deleted_at', null)
                    .not('eje', 'eq', '_pending')
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

            let profile: ReturnType<typeof resolveFromAnswers>;
            let report: ReturnType<typeof getReportData>;
            try {
                profile = resolveFromAnswers(answers, sessionCtx);
                report  = getReportData(profile.eje, profile.motor, '', adultData.nombreNino);
                report.ejeSecundario  = profile.ejeSecundario;
                report.tendenciaLabel = profile.tendenciaLabel;

                const tendencia = getTendenciaContent(profile.eje, profile.ejeSecundario);
                if (tendencia) {
                    const injectNombre = (t: string) => t.replace(/\{nombre\}/g, adultData.nombreNino);
                    report.tendenciaParagraph  = injectNombre(tendencia.parrafo);
                    report.palabrasPuenteExtra = tendencia.palabrasPuenteExtra;
                    report.palabrasRuidoExtra  = tendencia.palabrasRuidoExtra;
                }
            } catch (err) {
                console.error('[Argo] Profile resolution failed:', err);
                setSaveError(`Profile error: ${err instanceof Error ? err.message : 'unknown'}`);
                setAiLoading(false);
                return;
            }

            // Attach axis counts for visual bars
            report.axisCounts = {
                D: profile.counts.IMP,
                I: profile.counts.CON,
                S: profile.counts.SOS,
                C: profile.counts.EST,
            };

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

            // ── Option 1: Save profile data IMMEDIATELY (before AI) ─────────
            const profileFields = {
                eje:             profile.eje,
                motor:           profile.motor,
                archetype_label: report.arquetipo.label,
                eje_secundario:  profile.ejeSecundario ?? null,
                answers,
            };

            if (sessionIdRef.current) {
                // Update the "started" session with real profile data
                const earlyResult = await updateSession(sessionIdRef.current, profileFields);
                if (!earlyResult.ok) {
                    console.warn('[session] Early update failed:', earlyResult.error);
                }
            } else {
                // No started session — save full session now as fallback
                const fallback = await saveSession({
                    adultData,
                    eje:            profile.eje,
                    motor:          profile.motor,
                    archetypeLabel: report.arquetipo.label,
                    ejeSecundario:  profile.ejeSecundario,
                    answers, tenantId, lang,
                });
                if (!fallback.ok) {
                    console.warn('[session] Fallback save failed:', fallback.error);
                    setSaveError(fallback.error ?? 'Failed to save session');
                }
            }

            // Option 2: Clear localStorage — profile is safely in DB now
            clearRecoveryData();

            // ── Generate AI sections ────────────────────────────────────────
            setAiLoading(true);
            const ctx: ReportContext = {
                nombre:       adultData.nombreNino,
                deporte:      adultData.deporte,
                edad:         adultData.edad,
                destinatario: 'padre',
                lang,
            };

            let finalSections: AISections | null = null;
            try {
                const { sections, usage }: { sections: AISections; usage: AIUsage } =
                    await generateAISections(report, ctx);
                finalSections = sections;
                setAiSections(sections);

                // Option 1: Update session with AI usage data
                if (sessionIdRef.current) {
                    await updateSession(sessionIdRef.current, {
                        ai_tokens_input:  usage.inputTokens,
                        ai_tokens_output: usage.outputTokens,
                        ai_cost_usd:      usage.costUsd,
                    });
                }
            } catch (err) {
                console.warn('[Argo] AI generation failed:', err);
                // Session already saved with profile data — email will send with base report
            } finally {
                setAiLoading(false);
            }

            // ── Send report email ────────────────────────────────────────────
            const maduracionTemprana = adultData.edad < 10;
            const arquetipoFull = report.tendenciaLabel
                ? `${report.arquetipo.label}, ${report.tendenciaLabel}`
                : report.arquetipo.label;
            try {
                await sendReport({
                    toEmail:           adultData.email,
                    nombreAdulto:      adultData.nombreAdulto,
                    nombreNino:        adultData.nombreNino,
                    deporte:           adultData.deporte,
                    edad:              adultData.edad,
                    arquetipo:         arquetipoFull,
                    reportHtml:        buildReportHtml(report, finalSections, ot),
                    maduracionTemprana,
                    sessionId:         sessionIdRef.current ?? undefined,
                    lang,
                    emailSubject:      ot.emailSubject(adultData.nombreNino, arquetipoFull),
                    emailHeader:       ot.emailHeader,
                    emailPreparedFor:  ot.emailPreparedFor(adultData.nombreAdulto),
                    emailArchetypeOf:  ot.emailArchetypeOf(adultData.nombreNino),
                    emailFooter:       ot.emailFooter,
                    emailMaturationTitle: ot.emailMaturationTitle,
                    emailMaturationBody:  ot.emailMaturationBody,
                });
                console.log('[Argo] Report email sent to', adultData.email);
            } catch (err) {
                console.warn('[Argo] Email send failed:', err);
            }

            if (!playCountedRef.current) {
                playCountedRef.current = true;
                await onPlayComplete?.();
            }
        };

        run().catch(err => {
            console.error('[Argo] Unexpected error in completion flow:', err);
            setSaveError(`Unexpected error: ${err instanceof Error ? err.message : 'unknown'}`);
            setAiLoading(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

    const screen  = SCREENS[screenIndex];
    const nombre  = adultData?.nombreNino  ?? '';
    const adulto  = adultData?.nombreAdulto ?? '';
    const deporte = adultData?.deporte     ?? '';

    // Determine whether to show scene backgrounds (child-facing screens)
    const showScene = screen.type === 'question'
        || screen.type === 'story'
        || screen.type === 'child-result';
    const sceneQuestionIndex = getCurrentQuestionIndex(screenIndex);
    const showMuteBtn = screenIndex >= ODYSSEY_START && screenIndex <= ODYSSEY_END;

    // ── Option 2: Recovery overlay ──────────────────────────────────────────
    if (recoveryData) {
        const L = (es: string, en: string, pt: string) =>
            lang === 'es' ? es : lang === 'pt' ? pt : en;
        return (
            <div className="max-w-md mx-auto py-16 px-6 text-center space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-[#D2D2D7] space-y-5">
                    <p className="text-lg font-semibold text-[#1D1D1F]">
                        {L(
                            `Encontramos una sesión sin terminar de ${recoveryData.adultData.nombreNino}`,
                            `We found an unfinished session for ${recoveryData.adultData.nombreNino}`,
                            `Encontramos uma sessão inacabada de ${recoveryData.adultData.nombreNino}`,
                        )}
                    </p>
                    <p className="text-sm text-[#86868B]">
                        {L(
                            `${recoveryData.answers.length} de ${questions.length} preguntas respondidas`,
                            `${recoveryData.answers.length} of ${questions.length} questions answered`,
                            `${recoveryData.answers.length} de ${questions.length} perguntas respondidas`,
                        )}
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        <button
                            onClick={() => handleResume(recoveryData)}
                            className="px-6 py-2.5 bg-[#1D1D1F] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
                        >
                            {L('Continuar', 'Resume', 'Continuar')}
                        </button>
                        <button
                            onClick={handleDismissRecovery}
                            className="px-6 py-2.5 bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-sm font-medium hover:bg-[#E8E8ED] transition-colors border border-[#D2D2D7]"
                        >
                            {L('Empezar de nuevo', 'Start over', 'Recomecar')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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

                {screen.type === 'child-result' && reportRef.current && adultData && (
                    <ChildResultReveal
                        key="child-result"
                        nombreNino={nombre}
                        arquetipoLabel={reportRef.current.arquetipo.label}
                        adultEmail={adultData.email}
                        resultText={CHILD_REVEAL_TEXTS[reportRef.current.arquetipo.id] ?? CHILD_REVEAL_TEXTS['impulsor_decidido']}
                    />
                )}

            </AnimatePresence>
            </div>
        </div>
    );
};
