import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

const DURATION_MS = 15000;

const STARS = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 10 + i * 15,
    y: 50 + Math.sin(i * 1.2) * 25,
    delay: i * 0.4,
}));

// ─── SVG Boat ─────────────────────────────────────────────────────────────────

const MiniBoatSVG: React.FC = () => (
    <svg width="38" height="32" viewBox="0 0 38 32" fill="none">
        <path d="M19 2 L32 22 L19 22 Z" fill="white" opacity="0.95" />
        <path d="M19 7 L8 20 L19 20 Z" fill="white" opacity="0.75" />
        <line x1="19" y1="1" x2="19" y2="24" stroke="#C8A870" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 22 Q19 30 34 22" stroke="#A07830" strokeWidth="2" fill="#8B6520" fillOpacity="0.75" strokeLinecap="round" />
    </svg>
);

// ─── Star sparkle SVG ─────────────────────────────────────────────────────────

const SparkSVG: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1 L8.2 5.2 L13 7 L8.2 8.8 L7 13 L5.8 8.8 L1 7 L5.8 5.2 Z" fill="#F59E0B" opacity="0.88" />
    </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const MiniGame2: React.FC<Props> = ({ onComplete }) => {
    const [elapsed, setElapsed] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(prev => {
                const next = prev + 200;
                if (next >= DURATION_MS) {
                    clearInterval(interval);
                    setDone(true);
                    setTimeout(onComplete, 1500);
                }
                return Math.min(next, DURATION_MS);
            });
        }, 200);
        return () => clearInterval(interval);
    }, [onComplete]);

    const progress = elapsed / DURATION_MS;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center space-y-8 max-w-md mx-auto py-6"
        >
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em]">
                    Mini-juego
                </div>
                <h2 className="font-display text-2xl font-bold text-argo-navy">
                    Navega entre las olas
                </h2>
                <p className="text-sm text-argo-grey">
                    El mar vuelve a la calma. Observa el Argo cruzar el horizonte...
                </p>
            </div>

            {/* Animation stage */}
            <div className="relative w-full h-40 bg-gradient-to-b from-sky-100 to-blue-100 rounded-argo-lg overflow-hidden border border-argo-border">
                {/* Waves */}
                {[0, 1, 2].map(w => (
                    <motion.div
                        key={w}
                        className="absolute bottom-0 w-full"
                        style={{ height: `${30 + w * 10}%` }}
                        animate={{ x: [0, -20, 0] }}
                        transition={{ duration: 2 + w * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <div
                            className="w-full h-full rounded-t-full opacity-30"
                            style={{ background: `rgba(99, 102, 241, ${0.2 + w * 0.1})` }}
                        />
                    </motion.div>
                ))}

                {/* Sparkles (replaces ⭐) */}
                {STARS.map(star => (
                    <motion.div
                        key={star.id}
                        className="absolute"
                        style={{ left: `${star.x}%`, top: `${star.y}%` }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                        transition={{ delay: star.delay + elapsed / 1000 * 0.1, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <SparkSVG />
                    </motion.div>
                ))}

                {/* Boat (replaces ⛵) */}
                <motion.div
                    className="absolute"
                    style={{ top: '28%' }}
                    animate={{
                        x: ['8%', '82%'],
                        y: [0, -8, 0, -5, 0],
                    }}
                    transition={{
                        x: { duration: DURATION_MS / 1000, ease: 'linear' },
                        y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    }}
                >
                    <MiniBoatSVG />
                </motion.div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-argo-border rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-argo-indigo rounded-full"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.2 }}
                />
            </div>

            {done && (
                <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-sm font-semibold text-green-600"
                >
                    El mar vuelve a estar en calma. ¡Buen trabajo, navegante!
                </motion.p>
            )}
        </motion.div>
    );
};
