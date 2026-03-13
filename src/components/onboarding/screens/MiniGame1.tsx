import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const GAME_DURATION_MS  = 13000;
const SPAWN_FIRST_MS    = 1200;
const SPAWN_INTERVAL_MS = 1900;

type ObstacleType = 'rock' | 'wave' | 'vortex';
const OBSTACLE_TYPES: ObstacleType[] = ['rock', 'wave', 'vortex'];
const OBSTACLE_SPEEDS = [2.4, 2.7, 3.0];

interface ObstacleItem {
    id: number;
    type: ObstacleType;
    duration: number;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const GameBoatSVG: React.FC = () => (
    <svg width="52" height="44" viewBox="0 0 52 44" fill="none">
        <path d="M26 2 L44 32 L26 32 Z" fill="white" opacity="0.95" />
        <path d="M26 10 L10 28 L26 28 Z" fill="white" opacity="0.78" />
        <line x1="26" y1="1" x2="26" y2="36" stroke="#C8A870" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 32 Q26 42 46 32" stroke="#A07830" strokeWidth="2.5" fill="#8B6520" fillOpacity="0.8" strokeLinecap="round" />
    </svg>
);

const AnchorSVG: React.FC<{ size?: number; color?: string }> = ({ size = 52, color = 'white' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="20" />
        <path d="M5 12 C5 17 19 17 19 12" />
        <line x1="5" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="19" y2="12" />
    </svg>
);

const RockObs: React.FC = () => (
    <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
        <ellipse cx="19" cy="17" rx="16" ry="12" fill="#4A4A4F" opacity="0.92" />
        <ellipse cx="13" cy="11" rx="6" ry="4" fill="#8A8A8F" opacity="0.30" />
        <ellipse cx="25" cy="13" rx="3.5" ry="2.5" fill="#8A8A8F" opacity="0.22" />
    </svg>
);

const WaveObs: React.FC = () => (
    <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
        <path d="M2,10 C8,2 14,18 20,10 C26,2 32,18 38,10" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M2,20 C8,12 14,28 20,20 C26,12 32,28 38,20" stroke="#60A5FA" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.70" />
    </svg>
);

const VortexObs: React.FC = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}>
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <circle cx="17" cy="17" r="14" stroke="#7C3AED" strokeWidth="1.8" fill="none" opacity="0.72" />
            <circle cx="17" cy="17" r="9" stroke="#8B5CF6" strokeWidth="1.5" fill="none" opacity="0.82" />
            <circle cx="17" cy="17" r="4" fill="#7C3AED" opacity="0.88" />
        </svg>
    </motion.div>
);

const OBSTACLE_COMPONENTS: Record<ObstacleType, React.FC> = {
    rock: RockObs,
    wave: WaveObs,
    vortex: VortexObs,
};

// ─── Animated overlays (matching AnimatedScene.tsx style) ─────────────────────

const WaterWaves: React.FC = () => (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '18%' }}>
        {[0, 1, 2].map(i => (
            <motion.div
                key={i}
                className="absolute w-[200%]"
                style={{
                    bottom: `${i * 12}px`,
                    height: 20,
                    background: `repeating-linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 25%, transparent 50%)`,
                    backgroundSize: '200px 20px',
                }}
                animate={{ x: [0, i % 2 === 0 ? -200 : 200] }}
                transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: 'linear' }}
            />
        ))}
    </div>
);

const FlyingBirds: React.FC = () => (
    <>
        {[...Array(3)].map((_, i) => {
            const size = 10 + Math.random() * 6;
            const top = 5 + Math.random() * 20;
            const dur = 14 + Math.random() * 8;
            const delay = i * 3 + Math.random() * 2;
            return (
                <motion.svg
                    key={`bird-${i}`}
                    className="absolute pointer-events-none"
                    style={{ top: `${top}%` }}
                    width={size} height={size * 0.5} viewBox="0 0 20 10"
                    animate={{ x: ['-5vw', '105vw'], y: [0, -4, 2, -2, 0] }}
                    transition={{
                        x: { duration: dur, repeat: Infinity, ease: 'linear', delay },
                        y: { duration: 2 + Math.random(), repeat: Infinity, ease: 'easeInOut', delay },
                    }}
                >
                    <path d="M0 8 Q5 0 10 5 Q15 0 20 8" stroke="rgba(80,80,100,0.3)" strokeWidth="1.5" fill="none" />
                </motion.svg>
            );
        })}
    </>
);

const DriftingClouds: React.FC = () => (
    <>
        {[...Array(3)].map((_, i) => {
            const top = 3 + i * 7 + Math.random() * 4;
            const w = 70 + Math.random() * 50;
            const h = 18 + Math.random() * 12;
            const dur = 25 + Math.random() * 15;
            return (
                <motion.div
                    key={`cloud-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        top: `${top}%`, width: w, height: h,
                        background: 'rgba(255,255,255,0.2)', filter: 'blur(8px)',
                    }}
                    animate={{ x: ['-15vw', '115vw'] }}
                    transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay: i * 5 }}
                />
            );
        })}
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
                type:     OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)],
                duration: OBSTACLE_SPEEDS[Math.floor(Math.random() * OBSTACLE_SPEEDS.length)],
            }]);
        const first    = setTimeout(spawn, SPAWN_FIRST_MS);
        const interval = setInterval(spawn, SPAWN_INTERVAL_MS);
        return () => { clearTimeout(first); clearInterval(interval); };
    }, [started, done]);

    const removeObstacle = (id: number) =>
        setObstacles(prev => prev.filter(o => o.id !== id));

    return (
        <div
            className="fixed inset-0 overflow-hidden cursor-pointer select-none"
            style={{ zIndex: 50, touchAction: 'none' }}
            onClick={handleTap}
            onTouchStart={e => { e.preventDefault(); handleTap(); }}
        >
            {/* Scene background — uses the open-sea AI illustration */}
            <img
                src="/scenes/ocean-only.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
            />

            {/* Animated overlays matching AnimatedScene style */}
            <DriftingClouds />
            <FlyingBirds />
            <WaterWaves />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 100%)' }}
            />

            {/* Boat */}
            <motion.div
                className="absolute pointer-events-none"
                style={{ left: '12%', top: 'calc(60% - 44px)' }}
                animate={{
                    y:      airborne ? -130 : [0, -8, 0, -5, 0],
                    rotate: airborne ? -18  : [0, 3, 0, -3, 0],
                }}
                transition={
                    airborne
                        ? { type: 'spring', stiffness: 420, damping: 22 }
                        : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                }
            >
                <GameBoatSVG />
            </motion.div>

            {/* Obstacles */}
            {obstacles.map(obs => {
                const ObsComponent = OBSTACLE_COMPONENTS[obs.type];
                return (
                    <motion.div
                        key={obs.id}
                        className="absolute pointer-events-none"
                        style={{ top: 'calc(60% - 32px)', left: 0 }}
                        initial={{ x: 800 }}
                        animate={{ x: -120 }}
                        transition={{ duration: obs.duration, ease: 'linear' }}
                        onAnimationComplete={() => removeObstacle(obs.id)}
                    >
                        <ObsComponent />
                    </motion.div>
                );
            })}

            {/* Timer bar — gradient matching progress bar style */}
            <AnimatePresence>
                {started && !done && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-8 left-6 right-6 h-1.5 bg-white/15 rounded-full overflow-hidden"
                    >
                        <motion.div
                            className="h-full rounded-full origin-left"
                            style={{ background: 'linear-gradient(90deg, #4EA8DE, #F4A261, #5EC08D)' }}
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: GAME_DURATION_MS / 1000, ease: 'linear' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Start overlay */}
            <AnimatePresence>
                {!started && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.25 } }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                    >
                        {/* Frosted card */}
                        <div
                            className="flex flex-col items-center gap-5 px-10 py-8 rounded-3xl"
                            style={{
                                background: 'rgba(15,23,42,0.55)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                        >
                            <h2
                                className="font-adventure text-4xl text-white leading-tight"
                            >
                                Esquiva las olas
                            </h2>
                            <p className="font-quest text-white/80 text-base text-center leading-snug max-w-[240px]">
                                Toca la pantalla para saltar los obstaculos
                            </p>
                            <motion.div
                                className="w-14 h-14 rounded-full border-2 border-white/60"
                                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.3, 0.7] }}
                                transition={{ duration: 1.1, repeat: Infinity }}
                            />
                            <p className="font-quest font-medium text-white/70 text-sm tracking-wide">Toca para empezar</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion overlay */}
            <AnimatePresence>
                {done && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                    >
                        <div
                            className="flex flex-col items-center gap-4 px-10 py-8 rounded-3xl"
                            style={{
                                background: 'rgba(15,23,42,0.55)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                            >
                                <AnchorSVG size={52} color="white" />
                            </motion.div>
                            <span
                                className="font-adventure text-3xl text-white"
                            >
                                ¡Buen trabajo, navegante!
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
