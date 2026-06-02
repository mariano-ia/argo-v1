import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { getAdultIntroSlides, getStorySlides, getQuestions } from '../../lib/onboardingDataI18n';
import { getOdysseyT } from '../../lib/odysseyTranslations';
import { useLang } from '../../context/LangContext';
import { QuestionAnswer, SessionContext, resolveFromAnswers } from '../../lib/profileResolver';
import { getReportData, getLocalizedTendenciaContent, getLocalizedTendenciaLabel } from '../../lib/argosEngine';
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
import { ParentalConsentWaiting } from './screens/ParentalConsentWaiting';
import { StorySlideV2 } from './screens/StorySlideV2';
import { QuestionScreenV2 } from './screens/QuestionScreenV2';
import { ChildResultReveal } from './screens/ChildResultReveal';
import { DemoEndScreen } from './screens/DemoEndScreen';
import { sendReport } from '../../lib/emailService';
import { CHILD_REVEAL_TEXTS, CHILD_REVEAL_TEXTS_EN, CHILD_REVEAL_TEXTS_PT } from '../../lib/childRevealTexts';
import { AnimatedScene } from './scenes/AnimatedScene';
import { IslasDesconocidas, IslandMetrics } from '../games/IslasDesconocidas';
import { MiniGame1, RhythmMetrics } from './screens/MiniGame1';
import { LaTormenta, AdaptationMetrics } from '../games/LaTormenta';

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
    | { type: 'parental-consent-waiting' }
    | { type: 'device-handoff' }
    | { type: 'story'; slideId: string; useContinueLabelFromT?: boolean }
    | { type: 'question'; questionIndex: number }
    | { type: 'minigame'; gameId: 'minigame_a' | 'minigame_b' | 'minigame_c' }
    | { type: 'child-result' }
;

const SCREENS: ScreenDef[] = [
    // Language selection
    { type: 'language-select' },                                    // 0
    // Adult onboarding (intro + registration)
    { type: 'adult-intro', slideIndex: 0 },                        // 1
    { type: 'adult-intro', slideIndex: 1 },                        // 2
    { type: 'adult-intro', slideIndex: 2 },                        // 3
    { type: 'adult-registration' },                                 // 4
    { type: 'parental-consent-waiting' },                           // 5 (conditional; skipped when age >= 13)
    { type: 'device-handoff' },                                     // 6
    // Child story intro
    { type: 'story', slideId: 'intro_a' },                         // 6
    { type: 'story', slideId: 'intro_b' },                         // 7
    { type: 'story', slideId: 'intro_c' },                         // 8
    { type: 'story', slideId: 'intro_0', useContinueLabelFromT: true }, // 9
    // MiniGame A — "El cofre del Capitán" (measures impulse)
    { type: 'minigame', gameId: 'minigame_a' },                    // 10
    // Phase: Puerto (Q1-Q2)
    { type: 'question', questionIndex: 0 },                        // 11
    { type: 'question', questionIndex: 1 },                        // 12
    { type: 'story', slideId: 'slide_1' },                         // 13
    // MiniGame B — "Mar abierto" (measures rhythm)
    { type: 'minigame', gameId: 'minigame_b' },                    // 14
    // Phase: Mar Abierto (Q3-Q4)
    { type: 'question', questionIndex: 2 },                        // 15
    { type: 'question', questionIndex: 3 },                        // 16
    // Phase: Tormenta (Q5-Q7)
    { type: 'story', slideId: 'slide_2' },                         // 17
    { type: 'question', questionIndex: 4 },                        // 18
    { type: 'question', questionIndex: 5 },                        // 19
    { type: 'question', questionIndex: 6 },                        // 20
    // MiniGame C — "La tormenta" (measures adaptation)
    { type: 'minigame', gameId: 'minigame_c' },                    // 21
    // Calma (Q8-Q10)
    { type: 'story', slideId: 'slide_3' },                         // 22
    { type: 'question', questionIndex: 7 },                        // 23
    { type: 'question', questionIndex: 8 },                        // 24
    { type: 'question', questionIndex: 9 },                        // 25
    // Phase: Isla (Q11-Q12)
    { type: 'story', slideId: 'slide_4' },                         // 26
    { type: 'question', questionIndex: 10 },                       // 27
    { type: 'question', questionIndex: 11 },                       // 28
    // Closure
    { type: 'child-result' },                                       // 29
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

interface InitialConsent {
    token: string;
    adultData: AdultData;
}

interface OnboardingV2Props {
    userEmail?: string;
    onPlayComplete?: () => void;
    tenantId?: string;
    /** Short-lived token from /api/start-play, required to attach to a tenant. */
    playToken?: string;
    oneLinkId?: string;
    /**
     * When provided (via the /consent/:token landing redirect), the flow
     * skips LanguageSelect → AdultIntros → AdultRegistration → WaitingScreen
     * and jumps directly to DeviceHandoff with the pre-populated adult data.
     */
    initialConsent?: InitialConsent | null;
    /**
     * When true (used by /demo), the flow skips ALL onboarding screens, runs
     * the game with adult data provided via initialConsent, never writes to
     * the DB (no startSession/saveSession/updateSession), and renders
     * DemoEndScreen instead of ChildResultReveal at completion.
     */
    demoMode?: boolean;
}

export const OnboardingFlowV2: React.FC<OnboardingV2Props> = ({ userEmail = '', onPlayComplete, tenantId, playToken, oneLinkId, initialConsent, demoMode = false }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    // Language-aware data
    const adultIntroSlides = getAdultIntroSlides(lang);
    const storySlides = getStorySlides(lang);
    const questions = getQuestions(lang);

    // If we're resuming from a confirmed parental consent, pre-populate
    // adultData and jump straight to the device-handoff screen (index 6).
    // `device-handoff` is always the screen immediately after
    // `parental-consent-waiting` in the SCREENS array.
    const DEVICE_HANDOFF_INDEX = SCREENS.findIndex(s => s.type === 'device-handoff');
    // Demo: jump straight to the first story slide (skips all adult onboarding screens)
    const DEMO_START_INDEX = SCREENS.findIndex(
        (s): s is Extract<ScreenDef, { type: 'story' }> => s.type === 'story' && s.slideId === 'intro_a',
    );
    const [screenIndex, setScreenIndex] = useState(
        demoMode ? DEMO_START_INDEX : initialConsent ? DEVICE_HANDOFF_INDEX : 0,
    );
    const [adultData, setAdultData]     = useState<AdultData | null>(
        initialConsent ? initialConsent.adultData : null,
    );
    const [answers, setAnswers]         = useState<QuestionAnswer[]>([]);
    const [aiSections, setAiSections]   = useState<AISections | null>(null);
    const [aiLoading, setAiLoading]     = useState(false);
    const [saveError, setSaveError]     = useState<string | null>(null);
    const reportRef        = useRef<ReturnType<typeof getReportData> | null>(null);
    const profileRef       = useRef<{ eje: string; motor: string; ejeSecundario?: string; tendenciaLabel?: string } | null>(null);
    const playCountedRef   = useRef(false);

    // Mini-game metrics for motor calculation
    const gameAMetricsRef  = useRef<IslandMetrics | null>(null);
    const gameBMetricsRef  = useRef<RhythmMetrics | null>(null);
    const gameCMetricsRef  = useRef<AdaptationMetrics | null>(null);

    // ── Session persistence (Options 1, 2, 3) ──────────────────────────────
    const sessionIdRef = useRef<string | null>(null);
    // share_token returned by start/save — proves ownership on later updates.
    const shareTokenRef = useRef<string | null>(null);
    const [recoveryData, setRecoveryData] = useState<RecoverableSession | null>(null);

    // ── Parental consent (VPC, COPPA) ──
    // Initialize consentTokenRef from initialConsent so /api/session action=start
    // receives the confirmed token when resuming via the /consent/:token landing.
    const consentTokenRef = useRef<string | null>(initialConsent?.token ?? null);
    const [consentCtx, setConsentCtx] = useState<{ token: string; adultData: AdultData } | null>(null);

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
        if (data.shareToken) shareTokenRef.current = data.shareToken;
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
        startSession({
            adultData,
            tenantId,
            playToken,
            lang,
            consentToken: consentTokenRef.current ?? undefined,
            isDemo: demoMode,
        }).then(result => {
            if (result.ok && result.id) {
                sessionIdRef.current = result.id;
                shareTokenRef.current = result.share_token ?? null;
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

    // Audio recovery state — `recoverAudioIfNeeded` reads these to decide
    // whether to restart paused audio. Refs (not state) so the recovery
    // function can read the latest value without re-subscribing listeners.
    const screenIndexRef = useRef(0);
    const musicEndedRef  = useRef(false);

    const TARGET_VOL     = 0.18;
    const FADE_IN_MS     = 5000;
    const FADE_OUT_MS    = 3000;
    const ODYSSEY_START  = 7;
    const ODYSSEY_END    = 30;


    const EFFECT_VOL         = 0.25;
    const EFFECT_FADE_IN_MS  = 2000;
    const EFFECT_FADE_OUT_MS = 1500;

    const getEffectSrc = (idx: number): string | null => {
        if (idx >= 7 && idx <= 13)  return '/audio/effects_01.mp3'; // intro + minigame_a + puerto
        if (idx >= 14 && idx <= 17) return '/audio/effects_02.mp3'; // mar abierto + minigame_b
        if (idx >= 18 && idx <= 22) return '/audio/effects_03.mp3'; // tormenta (Q4-Q6 + minigame_c + slide_3 "Después de la Tormenta")
        if (idx >= 23 && idx <= 30) return '/audio/effects_02.mp3'; // calma (Q7+) + isla + completion
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

    /** Promise-returning ctx ready signal — await before calling .play() on
     *  audios that go through the AudioContext. Resolves immediately if the
     *  context is already running. Used to avoid the iOS race where the ctx
     *  was suspended at click time and play() succeeds silently. */
    const awaitCtxRunning = (): Promise<void> => {
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'suspended') return Promise.resolve();
        return ctx.resume().catch(err => {
            // iOS rare-case rejection — log so we can spot if it ever surfaces.
            console.warn('[audio] ctx.resume rejected:', err);
        });
    };

    /** Recover audio after a likely browser/OS suspension. iOS Safari suspends
     *  the AudioContext (and silently pauses HTMLAudioElements) on notifications,
     *  app switches, screen lock, AirPods change, etc. Called from `advance()`
     *  and on `visibilitychange`. Safe to call when no recovery is needed —
     *  every branch is gated on a "should be playing" check. */
    const recoverAudioIfNeeded = () => {
        // 1. Resume the context if the OS suspended it.
        const ctx = audioCtxRef.current;
        const ctxReady = ctx && ctx.state === 'suspended'
            ? ctx.resume().catch(() => {})
            : Promise.resolve();

        ctxReady.then(() => {
            // 2. Music should be playing whenever we are inside the odyssey
            //    range and haven't fired the deliberate fade-out at ODYSSEY_END.
            const idx = screenIndexRef.current;
            const music = audioRef.current;
            if (music && music.paused && idx >= ODYSSEY_START && idx < ODYSSEY_END && !musicEndedRef.current) {
                console.info('[audio] recover: resuming music', { state: ctx?.state });
                music.play().catch(e => console.warn('[audio] recover music.play failed:', e));
            }

            // 3. Effect should be playing whenever a current source is set.
            //    Fades nullify currentEffectSrc when ramping out, so this won't
            //    fire mid-fade.
            const effect = effectRef.current;
            if (effect && effect.paused && currentEffectSrc.current) {
                console.info('[audio] recover: resuming effect', { src: currentEffectSrc.current, state: ctx?.state });
                effect.play().catch(e => console.warn('[audio] recover effect.play failed:', e));
                // If gain is silenced (failed fade-in), force it to target.
                const g = effectGainRef.current;
                if (g && !mutedRef.current && g.gain.value < 0.01) {
                    g.gain.setValueAtTime(EFFECT_VOL, g.context.currentTime);
                }
            }
        });
    };

    /** Watchdog — runs every 500ms during the odyssey. iOS Safari can starve
     *  the AudioContext silently during heavy scene crossfades (e.g. the
     *  ~122 concurrent framer-motion animations at the storm→calm boundary
     *  on slide_3). When that happens nothing fires visibilitychange and the
     *  user doesn't click for several seconds. The watchdog detects three
     *  failure modes and self-heals: ctx suspended, effect paused, effect
     *  currentTime not advancing (decoder stall). */
    const watchdogTickRef = useRef({ lastEffectTime: 0, stallCount: 0 });
    useEffect(() => {
        if (screenIndex < ODYSSEY_START || screenIndex > ODYSSEY_END) return;
        const interval = window.setInterval(() => {
            const ctx = audioCtxRef.current;
            const effect = effectRef.current;
            const w = watchdogTickRef.current;
            // Heartbeat — surfaces on window.__argoAudio.lastTick so devtools can
            // detect a frozen main thread (lastTick stale > 2s = stall window).
            const dbg = (window as unknown as { __argoAudio?: { lastTick?: number; ctxState?: string; effectPaused?: boolean; effectTime?: number } }).__argoAudio;
            if (dbg) {
                dbg.lastTick = Date.now();
                dbg.ctxState = ctx?.state;
                dbg.effectPaused = effect?.paused;
                dbg.effectTime = effect?.currentTime;
            }

            // (a) Context suspended → resume.
            if (ctx && ctx.state === 'suspended') {
                console.info('[audio:watchdog] ctx suspended, resuming');
                ctx.resume().catch(() => {});
            }

            // (b) Effect paused but should play → restart, AND re-arm gain.
            //     If a prior play() resolved while a transition was in flight,
            //     the fade-in was skipped and gain is stuck at 0 — audio is
            //     "playing" silently. Forcing gain to EFFECT_VOL here heals it.
            if (effect && effect.paused && currentEffectSrc.current) {
                console.info('[audio:watchdog] effect paused, restarting');
                effect.play().catch(() => {});
            }
            const g = effectGainRef.current;
            if (effect && !effect.paused && g && !mutedRef.current && g.gain.value < 0.01 && currentEffectSrc.current) {
                console.warn('[audio:watchdog] effect playing at gain≈0, re-arming', { src: currentEffectSrc.current });
                g.gain.cancelScheduledValues(g.context.currentTime);
                g.gain.setValueAtTime(EFFECT_VOL, g.context.currentTime);
            }

            // (c) Effect "playing" but currentTime not advancing → decoder
            //     stall. Nudge currentTime forward and re-issue play. iOS
            //     occasionally stalls VBR MP3 mid-stream during heavy CPU.
            if (effect && !effect.paused) {
                const t = effect.currentTime;
                if (t === w.lastEffectTime) {
                    w.stallCount++;
                    if (w.stallCount >= 2) { // ~1s of no advance
                        console.warn('[audio:watchdog] effect stalled, nudging', { t });
                        try {
                            effect.currentTime = t + 0.01;
                            effect.play().catch(() => {});
                        } catch { /* ignore */ }
                        w.stallCount = 0;
                    }
                } else {
                    w.stallCount = 0;
                    w.lastEffectTime = t;
                }
            }
        }, 500);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

    /** Expose audio state on window for devtools / Playwright inspection.
     *  No production behavior depends on this; it's read-only debug surface. */
    useEffect(() => {
        const w = window as unknown as { __argoAudio?: unknown };
        w.__argoAudio = {
            get effect() { return effectRef.current; },
            get music() { return audioRef.current; },
            get ctx() { return audioCtxRef.current; },
            get currentSrc() { return currentEffectSrc.current; },
            get screenIndex() { return screenIndexRef.current; },
            get muted() { return mutedRef.current; },
            recover: recoverAudioIfNeeded,
        };
        return () => { delete (window as unknown as { __argoAudio?: unknown }).__argoAudio; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    /** Enable seamless loop — use native loop (avoids rAF glitches during heavy interaction).
     *  Also wires `stalled`, `waiting`, and `pause` event listeners that trigger
     *  proactive recovery. effects_03.mp3 is VBR-encoded with LAME gapless
     *  tags, which iOS Safari occasionally mishandles (firing `ended` despite
     *  loop=true, or stalling the decoder mid-stream). These listeners catch
     *  the symptom early. */
    const setupSeamlessLoop = (audio: HTMLAudioElement) => {
        audio.loop = true;
        audio.addEventListener('ended', () => {
            console.info('[audio] ended fired despite loop=true, restarting');
            audio.currentTime = 0;
            audio.play().catch(e => console.warn('[audio] ended-restart play failed:', e));
        });
        audio.addEventListener('stalled', () => {
            console.warn('[audio] stalled event, attempting recovery');
            recoverAudioIfNeeded();
        });
        audio.addEventListener('waiting', () => {
            console.info('[audio] waiting event (buffering)');
        });
        audio.addEventListener('pause', () => {
            // Programmatic pauses (fade-out before transition) are expected;
            // unexpected pauses (iOS revoking audio focus) are not. The
            // watchdog will catch the latter within 500ms.
            console.info('[audio] pause event', { src: audio.src.split('/').pop() });
        });
    };

    const startAudioIfNeeded = (nextIndex: number) => {
        if (nextIndex === ODYSSEY_START) {
            ensureAudioCtx();
            if (!audioRef.current) {
                const a = new Audio('/audio/argo_background.mp3');
                a.volume = 1; // volume controlled via GainNode, not audio.volume
                setupSeamlessLoop(a);
                musicGainRef.current = connectWithGain(a, 0);
                audioRef.current = a;
            }
            const a = audioRef.current;
            const gain = musicGainRef.current!;
            gain.gain.setValueAtTime(0, gain.context.currentTime);
            awaitCtxRunning()
                .then(() => {
                    // Bail if this audio was replaced while we waited for ctx.resume.
                    if (audioRef.current !== a) return;
                    return a.play();
                })
                .then(() => {
                    if (audioRef.current !== a) return;
                    if (!mutedRef.current) doGainFade(gain, TARGET_VOL, FADE_IN_MS);
                })
                .catch(e => console.warn('[audio] autoplay blocked:', e));
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
            setupSeamlessLoop(a);
            const gain = connectWithGain(a, 0);
            effectRef.current = a;
            effectGainRef.current = gain;
            // NOTE: currentEffectSrc is set only AFTER play() resolves. If play()
            // rejects, src stays null so the next startEffectIfNeeded call can
            // retry instead of early-returning at the same-src check above.
            console.info('[audio] effect transition start', { wantedSrc, idx: nextIdx });
            awaitCtxRunning()
                .then(() => {
                    if (effectRef.current !== a) return;
                    return a.play();
                })
                .then(() => {
                    if (effectRef.current !== a) return;
                    currentEffectSrc.current = wantedSrc;
                    console.info('[audio] effect play resolved', { wantedSrc });
                    if (!mutedRef.current) {
                        doGainFade(gain, EFFECT_VOL, EFFECT_FADE_IN_MS, () => {
                            console.info('[audio] effect fade-in done', { wantedSrc, gain: gain.gain.value });
                        });
                    }
                })
                .catch(e => {
                    console.warn('[audio] effect autoplay blocked:', e);
                    (window as unknown as { __argoAudio?: { lastError?: unknown } }).__argoAudio &&
                        ((window as unknown as { __argoAudio: { lastError?: unknown } }).__argoAudio.lastError = { src: wantedSrc, err: String(e), at: Date.now() });
                });
        }
    };

    // Fade out MUSIC when reaching child-result (final screen)
    useEffect(() => {
        if (screenIndex === ODYSSEY_END && audioRef.current && musicGainRef.current) {
            doGainFade(musicGainRef.current, 0, FADE_OUT_MS, () => {
                audioRef.current?.pause();
                // Signal to recoverAudioIfNeeded that music shouldn't be
                // auto-resumed anymore — the odyssey is over.
                musicEndedRef.current = true;
            });
        }
    }, [screenIndex]);

    // Mirror screenIndex into a ref so recoverAudioIfNeeded reads the
    // latest value without re-subscribing the visibilitychange listener.
    useEffect(() => { screenIndexRef.current = screenIndex; }, [screenIndex]);

    // Recover audio when the tab comes back to foreground. iOS Safari
    // routinely suspends the AudioContext on app switch / notification /
    // lock — without this, audio stays silent for the rest of the session.
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible') recoverAudioIfNeeded();
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Preload audio + scene images during adult screens. Decoding the scene
    // image inline at first paint (e.g. calm-2.png on slide_3 entry) was
    // saturating the main thread and starving the AudioContext on iOS
    // Safari, causing the storm effect to go silent mid-screen. `new Image()`
    // here primes the browser cache + decode for every scene image up front.
    useEffect(() => {
        ['/audio/argo_background.mp3', '/audio/effects_01.mp3', '/audio/effects_02.mp3', '/audio/effects_03.mp3']
            .forEach(src => { fetch(src).catch(() => {}); });
        [
            '/scenes/port.png', '/scenes/port-2.png',
            '/scenes/open-sea.png', '/scenes/open-sea-2.png', '/scenes/open-sea-3.png',
            '/scenes/storm.png', '/scenes/storm-2.png', '/scenes/storm-3.png',
            '/scenes/calm.png', '/scenes/calm-2.png',
            '/scenes/island.png',
        ].forEach(src => { const img = new Image(); img.src = src; });
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
        // Recover any audio that the OS silently suspended since the last
        // user gesture. Runs every advance() — this is the "retry on next
        // click" path the user explicitly asked for.
        try { recoverAudioIfNeeded(); } catch (e) { console.warn('[audio] recover error:', e); }
        const nextIdx = screenIndex + 1;
        try { startAudioIfNeeded(nextIdx); } catch (e) { console.warn('[audio] startAudio error:', e); }
        try { startEffectIfNeeded(nextIdx); } catch (e) { console.warn('[audio] startEffect error:', e); }
        setScreenIndex(i => {
            let next = Math.min(i + 1, SCREENS.length - 1);
            // Skip the parental-consent-waiting screen unless a token is pending
            if (SCREENS[next]?.type === 'parental-consent-waiting' && !consentCtx) {
                next = Math.min(next + 1, SCREENS.length - 1);
            }
            return next;
        });
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
                shareToken: shareTokenRef.current ?? undefined,
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
                const res = await fetch('/api/session-context');
                if (res.ok) {
                    const ctx = await res.json() as { ejes: string[]; motors: string[] };
                    if (ctx.ejes.length > 0) {
                        sessionCtx = { priorEjes: ctx.ejes, priorMotors: ctx.motors };
                    }
                }
            } catch {
                // proceed without tiebreaker
            }

            let profile: ReturnType<typeof resolveFromAnswers>;
            let report: ReturnType<typeof getReportData>;
            try {
                profile = resolveFromAnswers(answers, sessionCtx, {
                    impulse: gameAMetricsRef.current,
                    rhythm: gameBMetricsRef.current,
                    adaptation: gameCMetricsRef.current,
                });
                report  = getReportData(profile.eje, profile.motor, '', adultData.nombreNino, lang);
                report.ejeSecundario  = profile.ejeSecundario;
                report.tendenciaLabel = getLocalizedTendenciaLabel(profile.ejeSecundario, lang);

                const tendencia = getLocalizedTendenciaContent(profile.eje, profile.ejeSecundario, lang);
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
                const earlyResult = await updateSession(sessionIdRef.current, profileFields, shareTokenRef.current ?? undefined);
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
                    answers, tenantId, playToken, lang,
                    isDemo:         demoMode,
                });
                if (fallback.ok && fallback.id) {
                    sessionIdRef.current = fallback.id;
                    shareTokenRef.current = fallback.share_token ?? null;
                }
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
            // The server already falls back Gemini→OpenAI, so reaching here is
            // rare. We add one client-side retry because the adult is not at the
            // screen (the child is) — automatic recovery matters more than UI.
            for (let attempt = 1; attempt <= 2 && !finalSections; attempt++) {
                try {
                    const { sections, usage }: { sections: AISections; usage: AIUsage } =
                        await generateAISections(report, ctx);
                    finalSections = sections;
                    setAiSections(sections);

                    // Persist AI usage + sections on the session
                    if (sessionIdRef.current) {
                        await updateSession(sessionIdRef.current, {
                            ai_tokens_input:  usage.inputTokens,
                            ai_tokens_output: usage.outputTokens,
                            ai_cost_usd:      usage.costUsd,
                            ai_sections:      sections,
                        }, shareTokenRef.current ?? undefined);
                    }
                } catch (err) {
                    console.warn(`[Argo] AI generation attempt ${attempt} failed:`, err);
                    if (attempt < 2) await new Promise(r => setTimeout(r, 2500));
                }
            }
            setAiLoading(false);

            // ── Send report email ────────────────────────────────────────────
            // Only ever send a fully personalized (AI-generated) report. If AI
            // generation failed, we deliberately do NOT email a base/generic
            // report. The session is left with ai_sections=null, which the
            // admin regeneration flow detects to rebuild + send it later.
            if (finalSections) {
                // Use AI-translated labels for non-es languages
                const translatedLabel = finalSections.label ?? report.arquetipo.label;
                const translatedTendencia = finalSections.tendenciaLabel ?? report.tendenciaLabel;
                const arquetipoFull = translatedTendencia
                    ? `${translatedLabel}, ${translatedTendencia}`
                    : translatedLabel;

                console.log('[Argo] Attempting email send to:', adultData.email, '— sessionId:', sessionIdRef.current);
                try {
                    await sendReport({
                        toEmail:        adultData.email,
                        nombreAdulto:   adultData.nombreAdulto,
                        nombreNino:     adultData.nombreNino,
                        deporte:        adultData.deporte,
                        edad:           adultData.edad,
                        eje:            profile.eje,
                        motor:          profile.motor,
                        arquetipo:      arquetipoFull,
                        perfil:         lang === 'es' ? report.perfil : '',
                        palabrasPuente: finalSections.palabrasPuente ?? report.palabrasPuente,
                        sessionId:      sessionIdRef.current ?? undefined,
                        lang,
                    });
                    console.log('[Argo] Report email sent to', adultData.email);
                } catch (err) {
                    console.error('[Argo] Email send failed:', err);
                }
            } else {
                console.error('[Argo] AI generation failed after retries — NOT sending report email (would be non-personalized). Session left with ai_sections=null for regeneration. sessionId:', sessionIdRef.current);
            }

            // Mark Argo One link as completed if applicable
            if (oneLinkId && sessionIdRef.current) {
                try {
                    await fetch('/api/one-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            link_id: oneLinkId,
                            session_data: {
                                adult_name: adultData.nombreAdulto,
                                adult_email: adultData.email,
                                child_name: adultData.nombreNino,
                                child_age: adultData.edad,
                                sport: adultData.deporte,
                                eje: profile.eje,
                                motor: profile.motor,
                                eje_secundario: profile.ejeSecundario,
                                archetype_label: report.arquetipo.label,
                                answers,
                                ai_sections: finalSections,
                                lang,
                            },
                        }),
                    });
                } catch (err) {
                    console.error('[Argo] one-complete failed:', err);
                }
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
                        flowType={tenantId ? 'tenant' : oneLinkId ? 'one' : 'auth'}
                        tenantId={tenantId}
                        oneLinkId={oneLinkId}
                        onComplete={data => { setAdultData(data); advance(); }}
                        onConsentRequired={({ token, adultData: data }) => {
                            setAdultData(data);
                            setConsentCtx({ token, adultData: data });
                            // Direct setScreenIndex (not advance()) because advance() has a
                            // stale closure over consentCtx: React has queued setConsentCtx
                            // but hasn't applied it yet, so advance()'s skip-waiting-screen
                            // check would see consentCtx as null and jump past the waiting
                            // screen entirely. Jump straight to the next index.
                            setScreenIndex(i => Math.min(i + 1, SCREENS.length - 1));
                        }}
                    />
                )}

                {screen.type === 'parental-consent-waiting' && consentCtx && (
                    <ParentalConsentWaiting
                        key="consent-wait"
                        token={consentCtx.token}
                        childName={consentCtx.adultData.nombreNino}
                        adultEmail={consentCtx.adultData.email}
                        resendInput={{
                            adultData: consentCtx.adultData,
                            flowType: tenantId ? 'tenant' : oneLinkId ? 'one' : 'auth',
                            tenantId,
                            oneLinkId,
                            lang,
                        }}
                        onConfirmed={(tok) => {
                            consentTokenRef.current = tok;
                            advance();
                        }}
                        onCancel={() => {
                            setConsentCtx(null);
                            consentTokenRef.current = null;
                            setScreenIndex(i => Math.max(0, i - 1));
                        }}
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

                {screen.type === 'minigame' && screen.gameId === 'minigame_a' && (
                    <IslasDesconocidas
                        key="minigame-a"
                        lang={lang}
                        onComplete={(m) => { gameAMetricsRef.current = m; advance(); }}
                    />
                )}

                {screen.type === 'minigame' && screen.gameId === 'minigame_b' && (
                    <MiniGame1
                        key="minigame-b"
                        lang={lang}
                        onComplete={(m) => { gameBMetricsRef.current = m; advance(); }}
                    />
                )}

                {screen.type === 'minigame' && screen.gameId === 'minigame_c' && (
                    <LaTormenta
                        key="minigame-c"
                        lang={lang}
                        onComplete={(m) => { gameCMetricsRef.current = m; advance(); }}
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

                {screen.type === 'child-result' && demoMode && adultData && (
                    <DemoEndScreen
                        key="demo-end"
                        email={adultData.email}
                        nombre={adultData.nombreNino}
                        report={reportRef.current}
                        aiSections={aiSections}
                        aiPending={aiLoading}
                        error={saveError}
                        deporte={adultData.deporte}
                        edad={adultData.edad}
                        answers={answers}
                        sessionId={sessionIdRef.current}
                        shareToken={shareTokenRef.current}
                    />
                )}

                {screen.type === 'child-result' && !demoMode && reportRef.current && adultData && (
                    <ChildResultReveal
                        key="child-result"
                        nombreNino={nombre}
                        arquetipoLabel={reportRef.current.arquetipo.label}
                        adultEmail={adultData.email}
                        lang={lang}
                        resultText={(() => {
                            const id = reportRef.current!.arquetipo.id;
                            const textMap = lang === 'en' ? CHILD_REVEAL_TEXTS_EN
                                : lang === 'pt' ? CHILD_REVEAL_TEXTS_PT
                                : CHILD_REVEAL_TEXTS;
                            return textMap[id] ?? CHILD_REVEAL_TEXTS[id] ?? CHILD_REVEAL_TEXTS['impulsor_decidido'];
                        })()}
                    />
                )}

            </AnimatePresence>
            </div>
        </div>
    );
};
