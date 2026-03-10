import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const GAME_DURATION_MS  = 13000;
const SPAWN_FIRST_MS    = 1200;
const SPAWN_INTERVAL_MS = 1900;

const OBSTACLE_EMOJIS = ['🪨', '🌊', '🌀'];
const OBSTACLE_SPEEDS = [2.4, 2.7, 3.0]; // slide duration in seconds

// ─── Types ────────────────────────────────────────────────────────────────────

interface ObstacleItem {
    id: number;
    emoji: string;
    duration: number;
}

// ─── Wave background ──────────────────────────────────────────────────────────

const AnimatedWaves: React.FC = () => (
    <div className="absolute bottom-0 left-0 w-full h-[42%] overflow-hidden pointer-events-none">
        <motion.div
            className="absolute bottom-0 w-[220%] h-full"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-full">
                <path
                    d="M0,32 C80,8 160,56 240,32 C320,8 400,56 480,32 C560,8 640,56 720,32 C800,8 880,56 960,32 C1040,8 1120,56 1200,32 L1200,80 L0,80 Z"
                    fill="rgba(30,64,175,0.35)"
                />
            </svg>
        </motion.div>
        <motion.div
            className="absolute bottom-0 w-[220%] h-[60%]"
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1200 56" preserveAspectRatio="none" className="w-full h-full">
                <path
                    d="M0,22 C100,4 200,40 300,22 C400,4 500,40 600,22 C700,4 800,40 900,22 C1000,4 1100,40 1200,22 L1200,56 L0,56 Z"
                    fill="rgba(29,78,216,0.7)"
                />
            </svg>
        </motion.div>
        <div className="absolute bottom-0 w-full h-[30%] bg-blue-800 opacity-80" />
    </div>
);

const Clouds: React.FC = () => (
    <>
        <motion.span className="absolute text-2xl top-[8%] opacity-90 pointer-events-none select-none" style={{ left: '58%' }}
            animate={{ x: [0, 14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>☁️</motion.span>
        <motion.span className="absolute text-xl top-[18%] opacity-65 pointer-events-none select-none" style={{ left: '22%' }}
            animate={{ x: [0, -10, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}>☁️</motion.span>
        <motion.span className="absolute text-lg top-[10%] opacity-50 pointer-events-none select-none" style={{ left: '80%' }}
            animate={{ x: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>☁️</motion.span>
    </>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const MiniGame1: React.FC<Props> = ({ onComplete }) => {
    const [started,   setStarted]   = useState(false);
    const [airborne,  setAirborne]  = useState(false);
    const [obstacles, setObstacles] = useState<ObstacleItem[]>([]);
    const [done,      setDone]      = useState(false);

    const nextIdRef    = useRef(0);
    const jumpTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const airborneRef  = useRef(false);
    useEffect(() => { airborneRef.current = airborne; }, [airborne]);

    const jump = useCallback(() => {
        if (done || airborneRef.current) return;
        setAirborne(true);
        clearTimeout(jumpTimerRef.current);
        jumpTimerRef.current = setTimeout(() => setAirborne(false), 540);
    }, [done]);

    const handleTap = useCallback(() => {
        if (done) return;
        if (!started) { setStarted(true); return; }
        jump();
    }, [started, done, jump]);

    // Game timer
    useEffect(() => {
        if (!started) return;
        const t = setTimeout(() => {
            setDone(true);
            setTimeout(onComplete, 2200);
        }, GAME_DURATION_MS);
        return () => clearTimeout(t);
    }, [started, onComplete]);

    // Obstacle spawner
    useEffect(() => {
        if (!started || done) return;
        const spawn = () =>
            setObstacles(prev => [...prev, {
                id:       nextIdRef.current++,
                emoji:    OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)],
                duration: OBSTACLE_SPEEDS[Math.floor(Math.random() * OBSTACLE_SPEEDS.length)],
            }]);
        const first    = setTimeout(spawn, SPAWN_FIRST_MS);
        const interval = setInterval(spawn, SPAWN_INTERVAL_MS);
        return () => { clearTimeout(first); clearInterval(interval); };
    }, [started, done]);

    const removeObstacle = (id: number) =>
        setObstacles(prev => prev.filter(o => o.id !== id));

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5 max-w-lg mx-auto w-full"
        >
            {/* Header */}
            <div className="text-center space-y-1.5">
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.25em]">
                    Mini-juego · Antes de zarpar
                </div>
                <h2 className="font-display text-2xl font-bold text-argo-navy">
                    ¡Esquivá las olas!
                </h2>
                <p className="text-sm text-argo-grey">
                    {done
                        ? '¡Bien navegado! Estamos listos para zarpar.'
                        : started
                        ? 'Tocá la pantalla para saltar sobre los obstáculos'
                        : 'Tocá la pantalla para empezar'}
                </p>
            </div>

            {/* Game area */}
            <div
                className="relative w-full rounded-3xl overflow-hidden cursor-pointer select-none shadow-2xl shadow-blue-900/30"
                style={{ height: 220, touchAction: 'none' }}
                onClick={handleTap}
                onTouchStart={e => { e.preventDefault(); handleTap(); }}
            >
                {/* Sky */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500" />
                <Clouds />
                <AnimatedWaves />

                {/* Boat */}
                <motion.span
                    className="absolute text-4xl pointer-events-none select-none"
                    style={{ left: '11%', top: 118 }}
                    animate={{
                        y:      airborne ? -88 : [0, -7, 0, -4, 0],
                        rotate: airborne ? -20 : [0, 3, 0, -3, 0],
                    }}
                    transition={
                        airborne
                            ? { type: 'spring', stiffness: 420, damping: 22 }
                            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                    }
                >
                    ⛵
                </motion.span>

                {/* Obstacles */}
                {obstacles.map(obs => (
                    <motion.span
                        key={obs.id}
                        className="absolute text-3xl pointer-events-none select-none"
                        style={{ top: 122, left: 0 }}
                        initial={{ x: 680 }}
                        animate={{ x: -80 }}
                        transition={{ duration: obs.duration, ease: 'linear' }}
                        onAnimationComplete={() => removeObstacle(obs.id)}
                    >
                        {obs.emoji}
                    </motion.span>
                ))}

                {/* Start overlay */}
                <AnimatePresence>
                    {!started && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.25 } }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-blue-950/45 backdrop-blur-[2px]"
                        >
                            <motion.span
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 1.1, repeat: Infinity }}
                                className="text-5xl"
                            >
                                👆
                            </motion.span>
                            <span className="text-white font-black text-xl tracking-wide drop-shadow-md">
                                ¡Tocá para saltar!
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Completion overlay */}
                <AnimatePresence>
                    {done && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-blue-950/60"
                        >
                            <motion.span
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                                className="text-6xl"
                            >
                                ⚓
                            </motion.span>
                            <span className="text-white font-black text-xl drop-shadow-md tracking-wide">
                                ¡Buen trabajo, navegante!
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Timer bar */}
            <AnimatePresence>
                {started && !done && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-2 bg-sky-100 rounded-full overflow-hidden"
                    >
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 origin-left"
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: GAME_DURATION_MS / 1000, ease: 'linear' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
