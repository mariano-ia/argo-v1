import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

const DURATION_MS = 15000;

// Generates positions for star-of-sea icons along a sine wave
const STARS = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 10 + i * 15,   // % across the screen
    y: 50 + Math.sin(i * 1.2) * 25, // % vertical (sine wave)
    delay: i * 0.4,
}));

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
                    El mar vuelve a la calma. Observá el Argo cruzar el horizonte...
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

                {/* Stars of the sea */}
                {STARS.map(star => (
                    <motion.div
                        key={star.id}
                        className="absolute text-lg"
                        style={{ left: `${star.x}%`, top: `${star.y}%` }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                        transition={{ delay: star.delay + elapsed / 1000 * 0.1, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                        ⭐
                    </motion.div>
                ))}

                {/* Ship */}
                <motion.div
                    className="absolute text-3xl"
                    style={{ top: '35%' }}
                    animate={{
                        x: ['8%', '82%'],
                        y: [0, -8, 0, -5, 0],
                    }}
                    transition={{
                        x: { duration: DURATION_MS / 1000, ease: 'linear' },
                        y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    }}
                >
                    ⛵
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
                    El mar vuelve a estar en calma. ¡Buen trabajo, navegante! ⚓
                </motion.p>
            )}
        </motion.div>
    );
};
