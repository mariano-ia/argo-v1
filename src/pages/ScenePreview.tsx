import React, { useState } from 'react';
import { AnimatedScene } from '../components/onboarding/scenes/AnimatedScene';

/**
 * Visual preview of the odyssey background scenes — no registration/flow needed.
 * Route: /preview/escenas   (optionally ?s=<index> to deep-link a specific scene)
 *
 * Renders the REAL <AnimatedScene>, so you preview the exact runtime: a phase wired
 * in SCENE_VIDEOS shows its video, otherwise its PNG. The toggle flips the preview
 * flag (sessionStorage) to compare video vs the current PNG + overlays.
 * Not linked anywhere; renders only backgrounds (no data, no PII).
 */
const SCENES: { label: string; qi: number; si: number }[] = [
    { label: 'Puerto 1',    qi: 0,  si: 0 },
    { label: 'Puerto 2',    qi: 0,  si: 2 },
    { label: 'Mar Abierto', qi: 2,  si: 0 },
    { label: 'Tormenta 1',  qi: 5,  si: 0 },
    { label: 'Tormenta 2',  qi: 5,  si: 2 },
    { label: 'Tormenta 3',  qi: 5,  si: 4 },
    { label: 'Calma',       qi: 8,  si: 0 },
    { label: 'Playa',       qi: 11, si: 0 },
];

function initialIndex(): number {
    if (typeof window === 'undefined') return 0;
    const s = Number(new URLSearchParams(window.location.search).get('s'));
    return Number.isInteger(s) && s >= 0 && s < SCENES.length ? s : 0;
}

export const ScenePreview: React.FC = () => {
    const [idx, setIdx] = useState(initialIndex);
    const [videoOn, setVideoOn] = useState(true);

    // Sync the preview flag BEFORE the child renders, so AnimatedScene (which reads
    // it during render) picks up the current value with no flicker.
    if (typeof window !== 'undefined') {
        try {
            if (videoOn) window.sessionStorage.setItem('bgvideo', '1');
            else window.sessionStorage.removeItem('bgvideo');
        } catch { /* sessionStorage may be unavailable; ignore */ }
    }

    const s = SCENES[idx];

    return (
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-neutral-900">
            {/* Phone-shaped portrait frame so it previews like the real device */}
            <div className="relative h-[100dvh] aspect-[9/16] max-w-full overflow-hidden bg-black shadow-2xl">
                <AnimatedScene questionIndex={s.qi} screenIndex={s.si} />
            </div>

            {/* Controls */}
            <div className="absolute inset-x-0 top-0 z-50 flex flex-wrap items-center gap-2 bg-black/50 p-3 backdrop-blur">
                {SCENES.map((sc, i) => (
                    <button
                        key={sc.label}
                        onClick={() => setIdx(i)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                            i === idx ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        {sc.label}
                    </button>
                ))}
                <button
                    onClick={() => setVideoOn(v => !v)}
                    className="ml-auto rounded-full bg-argo-indigo px-3 py-1.5 text-sm font-semibold text-white"
                >
                    {videoOn ? 'Video ON' : 'PNG (video OFF)'}
                </button>
            </div>
        </div>
    );
};
