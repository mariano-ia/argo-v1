import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { getAdultIntroSlides, getStorySlides, getQuestions } from '../../lib/onboardingDataI18n';
import { getOdysseyT } from '../../lib/odysseyTranslations';
import { useLang } from '../../context/LangContext';
import { QuestionAnswer, resolveFromAnswers, resolveEvidenceFicha } from '../../lib/profileResolver';

// Instrument version stamped on every perfilamiento (panel audit 2026-07-08 / M3):
// bump on ANY change to items, option order behavior or scoring so cohorts are
// separable. v3 folds the shuffle (random option order, Fisher-Yates) AND the
// expert-panel item rewrite (de-magnet Q1/Q5/Q7/Q8/Q10, S-function restored,
// Q9 -> substitution scene, lexicon to the 8yo floor) into ONE launch so the
// norm clock resets only once (never shipped v2 to prod).
// Bump on every material item-wording change so the norm clock / analysis never
// pools answers across different wordings. 20260715 = final expert-panel set (the
// ARGO-PREGUNTAS-V3-NINOS PDF) + reworked Q5 ("la tormenta se acerca", anti strong-situation).
const INSTRUMENT_VERSION = 'v3-items-20260715';
import { getReportData, getLocalizedTendenciaContent, getLocalizedTendenciaLabel } from '../../lib/argosEngine';
import { runReportPipeline } from '../../lib/reportPipeline';
import { sportFrame, buildReportV4 } from '../../lib/reportV4';
import { makeCapa2 } from '../../lib/reportCapa2';
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
import { AnimatedScene, videoBackgroundsEnabled } from './scenes/AnimatedScene';
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
    // MiniGame A — "El Cofre de Jasón" (measures impulse)
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
    /** ArgoOne®: sport chosen by the buyer at link generation (shown read-only). */
    linkSport?: string;
    /** Club flow: institution name shown read-only as play context. */
    institutionName?: string;
    /** Club flow: institution sport shown read-only (the club defines it). */
    institutionSport?: string;
    /** Club flow: plantel the play link came from. Threaded into the consent request
     *  so an under-13 play returns to /play/<slug>/<teamSlug> and re-attaches to the plantel. */
    teamSlug?: string;
    /**
     * When provided (via the /consent/:token landing redirect), the flow
     * skips LanguageSelect → AdultIntros → AdultRegistration → WaitingScreen
     * and jumps directly to DeviceHandoff with the pre-populated adult data.
     */
    initialConsent?: InitialConsent | null;
    /**
     * Re-profile: pre-fill the EXISTING child's identity and skip the adult form.
     * 13+ jump straight to device-handoff; under-13 land on adult-registration so
     * fresh parental consent is re-collected. The reprofile play_token (passed as
     * playToken) carries the signed child id, so /api/session appends a NEW
     * perfilamiento to that child instead of creating a new child.
     */
    initialAdultData?: AdultData | null;
    /** Re-profile: the child's reprofile_token, threaded into the consent request so an
     *  under-13 re-profile returns to /play/r/<token> after consent (appends, not new child). */
    reprofileToken?: string;
    /**
     * When true (used by /demo, "Jugar gratis"), the flow runs the SAME full
     * onboarding as a normal play (language, registration incl. sport, parental
     * consent, the odyssey) but flags the session is_demo and renders
     * DemoEndScreen (an abridged report) instead of ChildResultReveal.
     */
    demoMode?: boolean;
    /** Called in demo mode when the responsible adult's email already played a demo. */
    onDemoBlocked?: () => void;
}

export const OnboardingFlowV2: React.FC<OnboardingV2Props> = ({ userEmail = '', onPlayComplete, tenantId, playToken, oneLinkId, linkSport, institutionName, institutionSport, teamSlug, initialConsent, initialAdultData, reprofileToken, demoMode = false, onDemoBlocked }) => {
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
    const ADULT_REGISTRATION_INDEX = SCREENS.findIndex(s => s.type === 'adult-registration');
    // Re-profile goes through the adult registration screen (pre-filled), so it follows
    // the SAME flow as the first play: the responsible adult confirms identity + accepts
    // T&C, and for under-13 children the parental consent step is re-collected.
    // Only a re-profile (which carries reprofileToken) skips the intro screens and
    // jumps to the pre-filled registration. A first-time One play may ALSO receive
    // initialAdultData (child name + adult email captured at link generation) to
    // pre-fill the form, but it must still show the normal intro flow.
    const reprofileStartIndex = reprofileToken ? ADULT_REGISTRATION_INDEX : null;
    // The demo (demoMode, no initialConsent) runs the SAME full onboarding as a
    // normal play — language, registration (incl. sport), parental consent — so it
    // can personalize by sport; only the end report is abridged.
    const [screenIndex, setScreenIndex] = useState(
        initialConsent ? DEVICE_HANDOFF_INDEX
            : reprofileStartIndex ?? 0,
    );
    const [adultData, setAdultData]     = useState<AdultData | null>(
        initialConsent ? initialConsent.adultData : (initialAdultData ?? null),
    );
    const [answers, setAnswers]         = useState<QuestionAnswer[]>([]);
    const [aiSections, setAiSections]   = useState<AISections | null>(null);
    const [aiLoading, setAiLoading]     = useState(false);
    // Flips true the instant the (synchronous) profile is resolved, so the child's
    // final reveal mounts immediately — NOT after the ~4 sequential network writes
    // (variant/profile save/shadow/one-complete) that used to gate the first
    // re-render via setAiLoading(true). reportRef is a ref, so setting it alone
    // never re-renders; this state is what surfaces the reveal.
    const [revealReady, setRevealReady] = useState(false);
    const [saveError, setSaveError]     = useState<string | null>(null);
    const reportRef        = useRef<ReturnType<typeof getReportData> | null>(null);
    const profileRef       = useRef<{ eje: string; motor: string; ejeSecundario?: string; tendenciaLabel?: string } | null>(null);
    const playCountedRef   = useRef(false);
    // ArgoOne: set once the EARLY one-complete (pre-AI, v2 builds) succeeded, so
    // the late block doesn't double-call.
    const oneCompleteDoneRef = useRef(false);

    // Mini-game metrics for motor calculation
    const gameAMetricsRef  = useRef<IslandMetrics | null>(null);
    const gameBMetricsRef  = useRef<RhythmMetrics | null>(null);
    const gameCMetricsRef  = useRef<AdaptationMetrics | null>(null);

    // ── QA test seam (?qa=fastplay) ──────────────────────────────────────────
    // Only active when the build has VITE_QA_SEAMS_ENABLED=1 (preview / CI only,
    // never prod). Lets Playwright drive past the canvas mini-games by feeding
    // synthetic metrics + auto-advancing. Dead code in prod bundles.
    const fastplayRef = useRef<boolean>(false);
    if (typeof window !== 'undefined' && fastplayRef.current === false) {
        const seamsEnabled = import.meta.env.VITE_QA_SEAMS_ENABLED === '1';
        const param = new URLSearchParams(window.location.search).get('qa');
        fastplayRef.current = seamsEnabled && param === 'fastplay';
    }

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
            oneLinkId: oneLinkId || undefined,
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

    /** Fire-and-forget telemetry beam. Every audio self-heal pings
     *  /api/audio-telemetry so the superadmin dashboard can show a
     *  real-world recovery-rate signal (by screen / device / type).
     *  Uses sendBeacon when available — survives page navigation,
     *  doesn't block. Failures are swallowed silently. */
    // Per-recovery-type cooldown so a persistent fault doesn't spam 120 rows
    // per minute. 5s window — long enough to dedupe but short enough that a
    // genuine intermittent issue still gets multiple data points.
    const beamCooldownRef = useRef<Record<string, number>>({});
    const beamAudioEvent = (recovery_type: string) => {
        try {
            const now = Date.now();
            const last = beamCooldownRef.current[recovery_type] ?? 0;
            if (now - last < 5000) return;
            beamCooldownRef.current[recovery_type] = now;

            const ctx = audioCtxRef.current;
            const body = JSON.stringify({
                session_id: sessionIdRef.current,
                screen_index: screenIndexRef.current,
                recovery_type,
                ctx_state: ctx?.state ?? null,
                effect_src: currentEffectSrc.current,
                ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                is_demo: demoMode === true,
            });
            let sent = false;
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                const blob = new Blob([body], { type: 'application/json' });
                sent = navigator.sendBeacon('/api/audio-telemetry', blob);
            }
            if (!sent && typeof fetch !== 'undefined') {
                fetch('/api/audio-telemetry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    keepalive: true,
                }).catch(() => {});
            }
        } catch { /* never block on telemetry */ }
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

        // 1b. If the ctx WAS suspended and we resumed it, beam telemetry.
        if (ctx && ctx.state === 'suspended') beamAudioEvent('ctx_resume');

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
                beamAudioEvent('effect_replay');
                // If gain is silenced (failed fade-in), force it to target.
                const g = effectGainRef.current;
                if (g && !mutedRef.current && g.gain.value < 0.01) {
                    g.gain.setValueAtTime(EFFECT_VOL, g.context.currentTime);
                    beamAudioEvent('gain_rescue');
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
        // Reset stall tracker on screen change — different screens may pick
        // up a fresh audio element, and an old `lastEffectTime` from another
        // src would falsely trigger `effect_stall_nudge` on the new one.
        watchdogTickRef.current = { lastEffectTime: 0, stallCount: 0 };
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
                beamAudioEvent('ctx_resume');
            }

            // (b) Effect paused but should play → restart, AND re-arm gain.
            //     If a prior play() resolved while a transition was in flight,
            //     the fade-in was skipped and gain is stuck at 0 — audio is
            //     "playing" silently. Forcing gain to EFFECT_VOL here heals it.
            if (effect && effect.paused && currentEffectSrc.current) {
                console.info('[audio:watchdog] effect paused, restarting');
                effect.play().catch(() => {});
                beamAudioEvent('effect_replay');
            }
            const g = effectGainRef.current;
            if (effect && !effect.paused && g && !mutedRef.current && g.gain.value < 0.01 && currentEffectSrc.current) {
                console.warn('[audio:watchdog] effect playing at gain≈0, re-arming', { src: currentEffectSrc.current });
                g.gain.cancelScheduledValues(g.context.currentTime);
                g.gain.setValueAtTime(EFFECT_VOL, g.context.currentTime);
                beamAudioEvent('gain_rescue');
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
                        beamAudioEvent('effect_stall_nudge');
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
            beamAudioEvent('ended_restart');
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

        if (wantedSrc === activeSrc) {
            // Same track expected — but iOS may have silently suspended the
            // element during the prior screen's heavy mount (e.g. slide_3 at
            // idx 22 inheriting effects_03 from minigame_c). Defensive revive.
            const e = effectRef.current;
            const g = effectGainRef.current;
            if (e && e.paused) {
                console.warn('[audio] same-src revive: effect was paused', { src: activeSrc, idx: nextIdx });
                e.play().catch(err => console.warn('[audio] same-src revive play failed:', err));
                beamAudioEvent('same_src_revive');
            }
            if (e && !e.paused && g && !mutedRef.current && g.gain.value < 0.01) {
                console.warn('[audio] same-src revive: gain stuck at 0', { src: activeSrc, idx: nextIdx });
                g.gain.cancelScheduledValues(g.context.currentTime);
                g.gain.setValueAtTime(EFFECT_VOL, g.context.currentTime);
                beamAudioEvent('gain_rescue');
            }
            return;
        }

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
            if (document.visibilityState === 'visible') {
                beamAudioEvent('visibility_recover');
                recoverAudioIfNeeded();
            }
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
        (videoBackgroundsEnabled()
            ? [
                // video mode: prime every clip's first-frame poster (what paints at each
                // phase/variant mount) plus the lightning bolt overlay
                '/scenes/video/posters/port.webp', '/scenes/video/posters/port-2.webp',
                '/scenes/video/posters/open-sea.webp',
                '/scenes/video/posters/storm.webp', '/scenes/video/posters/storm-2.webp', '/scenes/video/posters/storm-3.webp',
                '/scenes/video/posters/calm.webp',
                '/scenes/video/posters/island.webp', '/scenes/video/posters/island-intro.webp',
                '/scenes/video/bolt.webp',
            ]
            : [
                '/scenes/port.png', '/scenes/port-2.png',
                '/scenes/open-sea.png', '/scenes/open-sea-2.png', '/scenes/open-sea-3.png',
                '/scenes/storm.png', '/scenes/storm-2.png', '/scenes/storm-3.png',
                '/scenes/calm.png', '/scenes/calm-2.png',
                '/scenes/island.png',
            ]
        ).forEach(src => { const img = new Image(); img.src = src; });
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

    // QA fastplay: when ?qa=fastplay is set AND seams are enabled in this
    // build, mini-game screens auto-advance with synthetic metrics so
    // Playwright can drive past the canvas screens. No-op in prod bundles.
    useEffect(() => {
        if (!fastplayRef.current) return;
        const s = SCREENS[screenIndex];
        if (s?.type !== 'minigame') return;
        const t = setTimeout(() => {
            if (s.gameId === 'minigame_a') {
                gameAMetricsRef.current = { latencies: [800, 850, 900], avgLatency: 850, stdDevLatency: 50, totalTimeMs: 2550, trend: 0 };
            } else if (s.gameId === 'minigame_b') {
                gameBMetricsRef.current = { reactionTimes: [400, 420, 410], avgReaction: 410, totalTaps: 10, extraTaps: 1, avgCadence: 500, trend: 0, totalTimeMs: 5000 };
            } else if (s.gameId === 'minigame_c') {
                gameCMetricsRef.current = { adaptationTimes: [600, 650, 620], avgAdaptation: 623, inertiaErrors: 1, correctTaps: 12, wrongTaps: 2, totalTimeMs: 8000 };
            }
            advance();
        }, 300);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenIndex]);

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
            // Group tiebreaker context REMOVED (2026-07-08, expert-panel audit): the
            // profile must depend only on this child's answers, never on which
            // profiles the group already had. /api/session-context is no longer used.
            let profile: ReturnType<typeof resolveFromAnswers>;
            let report: ReturnType<typeof getReportData>;
            try {
                profile = resolveFromAnswers(answers, undefined, {
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
            // Surface the child's reveal NOW (profile is deterministic + done). The
            // saves + v4 shadow + one-complete + ~30s AI generation below all run in
            // the background; none of them feed the child screen. Before this, the
            // reveal waited behind that whole chain and the child stared at a blank
            // scene for seconds (owner-reported).
            setRevealReady(true);

            if (profile.tiebreakerApplied) {
                console.info('[profileResolver] Tiebreaker applied → eje:', profile.eje, 'motor:', profile.motor);
            }

            // ── v4 method (SHADOW, owner 2026-07-07 option 1) ───────────────
            // Compute the deterministic v4 report + fail-closed gate verdict for
            // observability against real traffic. NEVER sets report_status (delivery
            // stays legacy; the server never accepts report_status from the client)
            // and NEVER throws (wrapped). Purely additive telemetry until we activate.
            let v4Shadow: Record<string, unknown> = {};
            try {
                const edadMeses = Math.round(((adultData.edad as number) || 11) * 12);
                const ficha = resolveEvidenceFicha(answers, {
                    edadMeses,
                    questionVersion: INSTRUMENT_VERSION,
                    games: {
                        impulse: gameAMetricsRef.current ?? undefined,
                        rhythm: gameBMetricsRef.current ?? undefined,
                        adaptation: gameCMetricsRef.current ?? undefined,
                    },
                });
                const v4ctx = { nombre: adultData.nombreNino, frame: sportFrame(adultData.deporte) };
                const v4lang = (lang === 'en' || lang === 'pt' ? lang : 'es') as 'es' | 'en' | 'pt';

                // ── Capa 2 (variación por IA): best-effort. El endpoint /api/report-variant está gateado por
                //    V4_CAPA2 (off => variant null). makeCapa2 aplica los recaudos (distinción + hechos) y el
                //    pipeline corre el gate completo; si algo no da, cae a Capa 1. NUNCA bloquea (todo try/catch).
                let capa2Hook: ReturnType<typeof makeCapa2> | undefined;
                try {
                    const base = buildReportV4(ficha, { ...v4ctx, lang: v4lang });
                    const vr = await fetch('/api/report-variant', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ report_v4: base, lang: v4lang, nombre: adultData.nombreNino }),
                    });
                    if (vr.ok) {
                        const { variant } = await vr.json();
                        if (variant) capa2Hook = makeCapa2(variant, {}, (reason, detail) => console.info('[v4:capa2] reject:', reason, detail ?? ''));
                    }
                } catch (e) { console.warn('[v4:capa2] variant fetch failed (non-blocking):', e); }

                const pipe = runReportPipeline(ficha, v4ctx, { lang: v4lang, capa2: capa2Hook });
                v4Shadow = { evidence_ficha: ficha, report_v4: pipe.report, report_qc: pipe.qc };
                console.info('[v4:shadow] gate:', pipe.status, '·', pipe.qc.reasons.map((r) => r.code).join(',') || 'clean', '· origen:', pipe.origen);
            } catch (e) {
                console.warn('[v4:shadow] non-blocking failure:', e);
            }

            // ── Option 1: Save profile data IMMEDIATELY (before AI) ─────────
            // CRITICAL path: only the profile fields. The v4 shadow is persisted SEPARATELY
            // below so a v4 issue can NEVER block/fail the profile save or the report.
            const profileFields = {
                eje:             profile.eje,
                motor:           profile.motor,
                archetype_label: report.arquetipo.label,
                eje_secundario:  profile.ejeSecundario ?? null,
                answers,
                question_version: INSTRUMENT_VERSION,
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
                    questionVersion: INSTRUMENT_VERSION,
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

            // ── v4 shadow persist (ISOLATED, best-effort) ───────────────────
            // Fully decoupled from the critical profile save above: a failure here can
            // NEVER block the report. report_status is left NULL (never client-set), so
            // delivery stays legacy. Pure observability until activation.
            if (sessionIdRef.current && Object.keys(v4Shadow).length > 0) {
                try {
                    await updateSession(sessionIdRef.current, v4Shadow, shareTokenRef.current ?? undefined);
                } catch (e) {
                    console.warn('[v4:shadow] persist failed (non-blocking):', e);
                }
            }

            // ── ArgoOne completion, EARLY (v2 builds) ───────────────────────
            // The ~30s AI generation below is the fragile window: if the tab is
            // closed/locked there (the child hands the device back), everything
            // after it dies — the QA cycle hit exactly this (link stuck pending,
            // no responsible stamp, no comp puente; only the email had a cron
            // backstop). Under V2 one-complete LINKS the row-A perfilamiento and
            // does not need ai_sections (row A gets them later via updateSession),
            // so we complete the link NOW, with keepalive so even a closing tab
            // delivers it. Legacy builds keep the old post-email order (row B
            // needs ai_sections). The late block is skipped once this succeeds.
            if (import.meta.env.VITE_BRIDGES_V2 === '1' && oneLinkId && sessionIdRef.current && !oneCompleteDoneRef.current) {
                try {
                    const res = await fetch('/api/one-complete', {
                        method: 'POST',
                        keepalive: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            link_id: oneLinkId,
                            session_id: sessionIdRef.current,
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
                                lang,
                            },
                        }),
                    });
                    if (res.ok) oneCompleteDoneRef.current = true;
                    else console.warn('[Argo] early one-complete non-ok:', res.status);
                } catch (err) {
                    console.warn('[Argo] early one-complete failed (late block will retry):', err);
                }
            }

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
            // Demo plays never auto-send a report email: the abridged report is
            // shown on-screen (DemoEndScreen), and the full report is only ever
            // delivered later when the player unlocks it ($9.99) or we gift it
            // (admin full_access grant). This avoids (a) emailing the full report
            // for free and (b) pitching ArgoPuente® to someone who only has a demo.
            if (demoMode) {
                console.log('[Argo] Demo play: skipping auto report email. sessionId:', sessionIdRef.current);
            } else if (finalSections) {
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

            // Mark ArgoOne® link as completed if applicable (skipped when the
            // early v2 completion above already succeeded).
            if (oneLinkId && sessionIdRef.current && !oneCompleteDoneRef.current) {
                try {
                    await fetch('/api/one-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            link_id: oneLinkId,
                            // The row-A perfilamiento already created + resolved by
                            // /api/session (with report_v4). Under ONE_V2_COMPLETE,
                            // one-complete LINKS this instead of creating a duplicate
                            // (closes G2). Forward-safe: ignored when the flag is off.
                            session_id: sessionIdRef.current,
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
                        isDemo={demoMode}
                        tenantId={tenantId}
                        oneLinkId={oneLinkId}
                        teamSlug={teamSlug}
                        reprofileToken={reprofileToken}
                        initialValues={initialAdultData ?? undefined}
                        lockIdentity={!!initialAdultData}
                        readOnlySport={oneLinkId ? (linkSport || undefined) : tenantId ? (institutionSport || undefined) : undefined}
                        institutionName={tenantId ? (institutionName || undefined) : undefined}
                        onComplete={async data => {
                            // One demo per email: if this email already completed a demo,
                            // signal the page to show the notice instead of playing again.
                            if (demoMode) {
                                try {
                                    const r = await fetch('/api/check-demo', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: data.email }),
                                    });
                                    if (r.ok) { const d = await r.json(); if (d?.already_played) { onDemoBlocked?.(); return; } }
                                } catch { /* fail open */ }
                            }
                            setAdultData(data); advance();
                        }}
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
                            isDemo: demoMode,
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

                {/* Bridge the (near-instant) gap between the last answer and the
                    resolved profile so the child never faces a blank scene. */}
                {screen.type === 'child-result' && !demoMode && !revealReady && (
                    <motion.div
                        key="child-result-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-[#0b1a2a] px-8 text-center"
                        style={{ zIndex: 10 }}
                    >
                        <motion.div
                            className="w-12 h-12 rounded-full border-[3px] border-white/20 border-t-white/80"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        />
                        <p className="font-quest text-white/80 text-lg font-medium leading-snug">
                            {lang === 'en' ? 'Charting your course…'
                                : lang === 'pt' ? 'Traçando tua rota…'
                                : 'Trazando tu rumbo…'}
                        </p>
                    </motion.div>
                )}

                {screen.type === 'child-result' && !demoMode && revealReady && reportRef.current && adultData && (
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
