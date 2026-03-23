import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArgoShip } from './ArgoShip';
import { COMPLETION_GLOW_MS, COMPLETION_SHIP_MS, COMPLETION_CARD_DELAY_MS } from './constants';

interface Props {
    discoveredCount: number;
    onDone: () => void;
}

type Phase = 'glow' | 'confetti' | 'ship' | 'card';

export const CompletionSequence: React.FC<Props> = ({ discoveredCount, onDone }) => {
    const [phase, setPhase] = useState<Phase>('glow');
    const [lottieData, setLottieData] = useState<object | null>(null);

    // Lazy load Lottie confetti
    useEffect(() => {
        fetch('/lottie/confetti.json')
            .then(r => r.json())
            .then(setLottieData)
            .catch(() => {});
    }, []);

    // Phase progression
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        timers.push(setTimeout(() => setPhase('confetti'), COMPLETION_GLOW_MS));
        timers.push(setTimeout(() => setPhase('ship'), COMPLETION_GLOW_MS + 200));
        timers.push(setTimeout(() => setPhase('card'), COMPLETION_GLOW_MS + COMPLETION_SHIP_MS + COMPLETION_CARD_DELAY_MS));
        timers.push(setTimeout(onDone, COMPLETION_GLOW_MS + COMPLETION_SHIP_MS + COMPLETION_CARD_DELAY_MS + 2500));

        return () => timers.forEach(clearTimeout);
    }, [onDone]);

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
            {/* Confetti (Lottie) */}
            <AnimatePresence>
                {(phase === 'confetti' || phase === 'ship' || phase === 'card') && lottieData && (
                    <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <LottieConfetti data={lottieData} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Argo ship sailing across */}
            <AnimatePresence>
                {(phase === 'ship' || phase === 'card') && (
                    <ArgoShip mode="sail" />
                )}
            </AnimatePresence>

            {/* Achievement card */}
            <AnimatePresence>
                {phase === 'card' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className="flex flex-col items-center gap-4 px-10 py-8 rounded-3xl"
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                boxShadow: '0 0 40px rgba(245,158,11,0.15), 0 8px 32px rgba(0,0,0,0.3)',
                            }}
                            initial={{ scale: 0.7, y: 60, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                            {/* Compass icon */}
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            >
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                                    stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                                        fill="rgba(245,158,11,0.4)" stroke="white" />
                                </svg>
                            </motion.div>

                            <span className="font-adventure text-2xl text-white text-center">
                                Todas las islas exploradas
                            </span>
                            <span className="font-quest text-amber-300/70 text-sm">
                                {discoveredCount} descubrimientos
                            </span>

                            {/* Golden glow line */}
                            <motion.div
                                className="w-16 h-0.5 rounded-full"
                                style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }}
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Inline Lottie player (avoids importing lottie-react at top level)
const LottieConfetti: React.FC<{ data: object }> = ({ data }) => {
    const [Lottie, setLottie] = useState<React.ComponentType<{ animationData: object; loop: boolean; autoplay: boolean; style?: React.CSSProperties }> | null>(null);

    useEffect(() => {
        import('lottie-react').then(mod => setLottie(() => mod.default));
    }, []);

    if (!Lottie) return null;

    return (
        <Lottie
            animationData={data}
            loop={false}
            autoplay
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
    );
};
