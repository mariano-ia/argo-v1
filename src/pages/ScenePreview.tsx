import React, { useEffect, useRef, useState } from 'react';
import { AnimatedScene } from '../components/onboarding/scenes/AnimatedScene';
import { QuestionScreenV2 } from '../components/onboarding/screens/QuestionScreenV2';
import { QUESTIONS_V2 } from '../lib/onboardingDataV2';
import { useLang, type Lang } from '../context/LangContext';

/**
 * Full-game visual preview of the odyssey — no registration/flow needed.
 * Route: /preview/escenas   (optionally ?s=<index> to deep-link a scene)
 *
 * Renders the REAL background (<AnimatedScene>) + the REAL question UI
 * (<QuestionScreenV2>) + the REAL game audio (music bed + per-phase effects),
 * so you can review the complete experience with the video backgrounds.
 * Everything sits behind the ?bgvideo flag; not linked anywhere; no data/PII.
 */
type Fx = 'effects_01' | 'effects_02' | 'effects_03';
type Scene = { label: string; qi: number; si: number; q: number; fx: Fx };

// qi/si drive the background phase+variant; q is the question shown on top; fx is the
// per-phase ambience, matching the real game's screen-range → audio mapping.
const SCENES: Scene[] = [
    { label: 'Puerto 1',    qi: 0,  si: 0, q: 0,  fx: 'effects_01' },
    { label: 'Puerto 2',    qi: 0,  si: 2, q: 1,  fx: 'effects_01' },
    { label: 'Mar Abierto', qi: 2,  si: 0, q: 2,  fx: 'effects_02' },
    { label: 'Tormenta 1',  qi: 5,  si: 0, q: 4,  fx: 'effects_03' },
    { label: 'Tormenta 2',  qi: 5,  si: 2, q: 5,  fx: 'effects_03' },
    { label: 'Tormenta 3',  qi: 5,  si: 4, q: 6,  fx: 'effects_03' },
    { label: 'Calma',       qi: 8,  si: 0, q: 7,  fx: 'effects_02' },
    { label: 'Playa',       qi: 11, si: 0, q: 11, fx: 'effects_02' },
];

function initialIndex(): number {
    if (typeof window === 'undefined') return 0;
    const s = Number(new URLSearchParams(window.location.search).get('s'));
    return Number.isInteger(s) && s >= 0 && s < SCENES.length ? s : 0;
}

export const ScenePreview: React.FC = () => {
    const [idx, setIdx] = useState(initialIndex);
    const [videoOn, setVideoOn] = useState(true);
    const [questionsOn, setQuestionsOn] = useState(true);
    const [soundOn, setSoundOn] = useState(false);

    const musicRef = useRef<HTMLAudioElement>(null);
    const fxRef = useRef<HTMLAudioElement>(null);
    const scene = SCENES[idx];
    const { lang, setLang } = useLang();

    // Sync the preview flag BEFORE the child renders, so AnimatedScene (which reads
    // it during render) picks up the current value with no flicker.
    if (typeof window !== 'undefined') {
        try {
            if (videoOn) window.sessionStorage.setItem('bgvideo', '1');
            else window.sessionStorage.removeItem('bgvideo');
        } catch { /* sessionStorage may be unavailable; ignore */ }
    }

    // Audio: continuous music bed + per-phase effects, mirroring the real game.
    // Starts only after a user gesture (the Sonido toggle), per browser autoplay rules.
    useEffect(() => {
        const music = musicRef.current;
        const fx = fxRef.current;
        if (!music || !fx) return;
        if (soundOn) {
            music.volume = 0.45;
            if (music.paused) music.play().catch(() => {});
            const want = `/audio/${scene.fx}.mp3`;
            if (!fx.src.endsWith(want)) { fx.src = want; fx.load(); }
            fx.volume = 0.7;
            fx.loop = true;
            fx.play().catch(() => {});
        } else {
            music.pause();
            fx.pause();
        }
    }, [soundOn, scene.fx]);

    const pill = (active: boolean, on: string) =>
        `rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? on : 'bg-white/20 text-white hover:bg-white/30'}`;

    return (
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-neutral-900">
            {/* Portrait frame. The `transform` makes QuestionScreenV2's `fixed` layout
                resolve against THIS box (not the viewport), so the question UI lines up
                with the video exactly like on a phone. */}
            <div
                className="relative h-[100dvh] aspect-[9/16] max-w-full overflow-hidden bg-black shadow-2xl"
                style={{ transform: 'translateZ(0)' }}
            >
                <AnimatedScene questionIndex={scene.qi} screenIndex={scene.si} />
                {questionsOn && (
                    <QuestionScreenV2
                        key={scene.q}
                        question={QUESTIONS_V2[scene.q]}
                        questionIndex={scene.q}
                        totalQuestions={QUESTIONS_V2.length}
                        nombreNino="Jasón"
                        anchorsCollected={scene.q}
                        onAnswer={() => {}}
                    />
                )}
            </div>

            {/* Controls (outside the transformed frame → positioned to the viewport) */}
            <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center gap-2 bg-black/50 p-3 backdrop-blur">
                {SCENES.map((sc, i) => (
                    <button key={sc.label} onClick={() => setIdx(i)}
                        className={pill(i === idx, 'bg-white text-black')}>
                        {sc.label}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex gap-1 rounded-full bg-white/10 p-0.5">
                        {(['es', 'en', 'pt'] as Lang[]).map(l => (
                            <button key={l} onClick={() => setLang(l)}
                                className={`rounded-full px-2 py-1 text-xs font-bold uppercase transition ${lang === l ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setQuestionsOn(v => !v)}
                        className={pill(questionsOn, 'bg-emerald-500 text-white')}>
                        {questionsOn ? 'Preguntas ON' : 'Preguntas OFF'}
                    </button>
                    <button onClick={() => setSoundOn(v => !v)}
                        className={pill(soundOn, 'bg-amber-500 text-white')}>
                        {soundOn ? 'Sonido ON' : 'Sonido OFF'}
                    </button>
                    <button onClick={() => setVideoOn(v => !v)}
                        className={pill(videoOn, 'bg-argo-indigo text-white')}>
                        {videoOn ? 'Video' : 'PNG'}
                    </button>
                </div>
            </div>

            <audio ref={musicRef} src="/audio/argo_background.mp3" loop preload="none" />
            <audio ref={fxRef} loop preload="none" />
        </div>
    );
};
