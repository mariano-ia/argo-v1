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

// ─── Cloud shapes (no emojis) ──────────────────────────────────────────────────

const CloudShapes: React.FC = () => (
    <>
        <motion.div className="absolute rounded-full pointer-events-none"
            style={{ top: '7%', left: '60%', width: 82, height: 24, background: 'rgba(255,255,255,0.52)', filter: 'blur(13px)' }}
            animate={{ x: [0, 14, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute rounded-full pointer-events-none"
            style={{ top: '14%', left: '16%', width: 56, height: 18, background: 'rgba(255,255,255,0.38)', filter: 'blur(10px)' }}
            animate={{ x: [0, -9, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute rounded-full pointer-events-none"
            style={{ top: '5%', left: '36%', width: 106, height: 30, background: 'rgba(255,255,255,0.43)', filter: 'blur(15px)' }}
            animate={{ x: [0, 7, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
    </>
);

// ─── Wave layers ───────────────────────────────────────────────────────────────

const GameWaves: React.FC = () => (
    <>
        <motion.div className="absolute left-0 w-[200%]" style={{ top: '57%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,20 C175,8 350,32 525,20 C700,8 875,32 1050,20 C1225,8 1400,32 1400,20 L1400,300 L0,300 Z" fill="#6496B4" />
            </svg>
        </motion.div>
        <motion.div className="absolute left-0 w-[200%]" style={{ top: '62%', bottom: 0 }}
            animate={{ x: ['-50%', '0%'] }} transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}>
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,16 C116,6 233,26 350,16 C466,6 583,26 700,16 C816,6 933,26 1050,16 C1166,6 1283,26 1400,16 L1400,300 L0,300 Z" fill="#5282A6" />
            </svg>
        </motion.div>
        <motion.div className="absolute left-0 w-[200%]" style={{ top: '67%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}>
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="gameFrontWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86B6D2" stopOpacity="0.7" />
                        <stop offset="12%" stopColor="#40709C" stopOpacity="1" />
                        <stop offset="100%" stopColor="#2E5A7C" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path d="M0,12 C70,4 140,20 210,12 C280,4 350,20 420,12 C490,4 560,20 630,12 C700,4 770,20 840,12 C910,4 980,20 1050,12 C1120,4 1190,20 1260,12 C1330,4 1400,18 1400,12 L1400,300 L0,300 Z" fill="url(#gameFrontWave)" />
            </svg>
        </motion.div>
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
            {/* Ocean background */}
            <div className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, #A8CCE2 0%, #BED8EE 26%, #D4E8F6 40%, #E2C890 52%, #C89860 59%, #78AECA 61%, #5A8EAE 78%, #3E6E8E 100%)' }} />

            <CloudShapes />
            <GameWaves />

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

            {/* Timer bar */}
            <AnimatePresence>
                {started && !done && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-8 left-6 right-6 h-1 bg-white/25 rounded-full overflow-hidden"
                    >
                        <motion.div
                            className="h-full rounded-full bg-white/65 origin-left"
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
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#0A1628]/48 backdrop-blur-sm"
                    >
                        <h2 className="text-white text-3xl tracking-tight drop-shadow-md" style={{ fontWeight: 300, letterSpacing: '-0.02em' }}>
                            Esquivá las olas
                        </h2>
                        <motion.div
                            className="w-16 h-16 rounded-full border-2 border-white/70"
                            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.3, 0.8] }}
                            transition={{ duration: 1.1, repeat: Infinity }}
                        />
                        <p className="text-white/80 text-sm font-medium tracking-wide">Tocá para empezar</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion overlay */}
            <AnimatePresence>
                {done && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0A1628]/58 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                        >
                            <AnchorSVG size={56} color="white" />
                        </motion.div>
                        <span className="text-white text-2xl drop-shadow-md tracking-tight" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
                            ¡Buen trabajo, navegante!
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
