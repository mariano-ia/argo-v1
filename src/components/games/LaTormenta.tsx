import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMiniGameTexts } from './islas/translations';

/* ──────────────────────────── Metrics ──────────────────────────── */

export interface AdaptationMetrics {
    /** ms from each rule change to the first CORRECT tap under new rule */
    adaptationTimes: number[];
    /** avg adaptation time */
    avgAdaptation: number;
    /** total taps on the wrong color after a rule change (inertia errors) */
    inertiaErrors: number;
    /** total correct taps */
    correctTaps: number;
    /** total wrong taps (all phases) */
    wrongTaps: number;
    /** total game time ms */
    totalTimeMs: number;
}

/* ──────────────────────────── Config ──────────────────────────── */

interface Props {
    onComplete: (metrics: AdaptationMetrics) => void;
    lang?: string;
}

type TargetColor = 'gold' | 'silver';

interface Star {
    id: number;
    x: number;       // % from left
    y: number;       // % from top
    color: 'gold' | 'silver';
    tapped: boolean;
}

// 3 phases: gold → silver → gold
const PHASES: { target: TargetColor; durationMs: number }[] = [
    { target: 'gold',   durationMs: 8000 },
    { target: 'silver', durationMs: 8000 },
    { target: 'gold',   durationMs: 7000 },
];

const STAR_SPAWN_INTERVAL = 1200;
const STAR_LIFETIME_MS = 3500;

// Safe zones for star placement (avoid edges and center instruction area)
function randomStarPos(): { x: number; y: number } {
    return {
        x: 10 + Math.random() * 80,
        y: 25 + Math.random() * 55,
    };
}

/* ──────────────────────────── Star SVG ──────────────────────────── */

const STAR_IMAGES = {
    gold: '/scenes/islas/star-gold.webp',
    silver: '/scenes/islas/star-silver.webp',
};

const StarItem: React.FC<{ color: 'gold' | 'silver'; size?: number }> = ({ color, size = 56 }) => {
    const borderColor = color === 'gold' ? 'rgba(245,158,11,0.5)' : 'rgba(148,180,220,0.5)';
    const shadowColor = color === 'gold' ? 'rgba(245,158,11,0.3)' : 'rgba(148,180,220,0.25)';

    return (
        <div
            className="rounded-full overflow-hidden"
            style={{
                width: size,
                height: size,
                background: '#ffffff',
                border: `2px solid ${borderColor}`,
                boxShadow: `0 0 12px ${shadowColor}, 0 2px 8px rgba(0,0,0,0.2)`,
            }}
        >
            <img
                src={STAR_IMAGES[color]}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
            />
        </div>
    );
};

/* ──────────────────────────── Lightning flash ──────────────────────────── */

const LightningFlash: React.FC = () => (
    <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 30, background: 'rgba(255,255,255,0.35)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.6, 0.9, 0] }}
        transition={{ duration: 0.4, times: [0, 0.1, 0.2, 1] }}
    />
);

/* ──────────────────────────── Rain effect ──────────────────────────── */

const Rain: React.FC = () => {
    const drops = useRef(
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            dur: 0.4 + Math.random() * 0.3,
            delay: Math.random() * 1,
            height: 12 + Math.random() * 10,
        }))
    ).current;

    return (
        <>
            {drops.map(d => (
                <motion.div
                    key={`rain-${d.id}`}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${d.x}%`,
                        width: 1.5,
                        height: d.height,
                        background: 'rgba(180,200,255,0.25)',
                        borderRadius: 1,
                        zIndex: 5,
                    }}
                    animate={{ y: ['-10vh', '110vh'] }}
                    transition={{ duration: d.dur, repeat: Infinity, ease: 'linear', delay: d.delay }}
                />
            ))}
        </>
    );
};

/* ──────────────────────────── Rule indicator ──────────────────────────── */

const RuleIndicator: React.FC<{ target: TargetColor; goldLabel: string; silverLabel: string }> = ({ target, goldLabel, silverLabel }) => (
    <motion.div
        className="absolute top-10 left-0 right-0 flex justify-center"
        style={{ zIndex: 15 }}
        key={target}
        initial={{ y: -20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 18 }}
    >
        <div
            className="flex items-center gap-2.5 px-5 py-2 rounded-full"
            style={{
                background: 'rgba(15,23,42,0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1.5px solid ${target === 'gold' ? 'rgba(245,158,11,0.4)' : 'rgba(148,163,184,0.4)'}`,
            }}
        >
            <StarItem color={target} size={24} />
            <span className="font-quest text-white/90 text-sm font-medium">
                {target === 'gold' ? goldLabel : silverLabel}
            </span>
        </div>
    </motion.div>
);

/* ──────────────────────────── Component ──────────────────────────── */

export const LaTormenta: React.FC<Props> = ({ onComplete, lang = 'es' }) => {
    const t = getMiniGameTexts(lang);
    const [phase, setPhase] = useState<'intro' | 'playing' | 'complete'>('intro');
    const [phaseIdx, setPhaseIdx] = useState(0);
    const [stars, setStars] = useState<Star[]>([]);
    const [showLightning, setShowLightning] = useState(false);
    const [cameraShake, setCameraShake] = useState(0);

    const gameStartRef = useRef(0);
    const nextStarIdRef = useRef(0);
    const currentTarget = useRef<TargetColor>('gold');
    const phaseStartRef = useRef(0);
    const firstCorrectAfterChangeRef = useRef(false);

    // Metrics refs
    const adaptationTimesRef = useRef<number[]>([]);
    const inertiaErrorsRef = useRef(0);
    const correctTapsRef = useRef(0);
    const wrongTapsRef = useRef(0);

    // ─── Start game ─────────────────────────────────────────────

    const handleStart = useCallback(() => {
        if (phase !== 'intro') return;
        setPhase('playing');
        gameStartRef.current = Date.now();
        currentTarget.current = PHASES[0].target;
        phaseStartRef.current = Date.now();
        firstCorrectAfterChangeRef.current = false;
    }, [phase]);

    // ─── Phase timer ────────────────────────────────────────────

    useEffect(() => {
        if (phase !== 'playing') return;

        const phaseConfig = PHASES[phaseIdx];
        if (!phaseConfig) return;

        const timer = setTimeout(() => {
            const nextIdx = phaseIdx + 1;
            if (nextIdx >= PHASES.length) {
                // Game done
                finishGame();
            } else {
                // Rule change!
                currentTarget.current = PHASES[nextIdx].target;
                phaseStartRef.current = Date.now();
                firstCorrectAfterChangeRef.current = false;

                // Lightning flash + shake
                setShowLightning(true);
                setCameraShake(s => s + 1);
                setTimeout(() => setShowLightning(false), 400);

                setPhaseIdx(nextIdx);
            }
        }, phaseConfig.durationMs);

        return () => clearTimeout(timer);
    }, [phase, phaseIdx]);

    // ─── Star spawner ───────────────────────────────────────────

    useEffect(() => {
        if (phase !== 'playing') return;

        const spawn = () => {
            const pos = randomStarPos();
            const isTarget = Math.random() < 0.5;
            const color: 'gold' | 'silver' = isTarget
                ? currentTarget.current
                : (currentTarget.current === 'gold' ? 'silver' : 'gold');

            const newStar: Star = {
                id: nextStarIdRef.current++,
                x: pos.x,
                y: pos.y,
                color,
                tapped: false,
            };

            setStars(prev => [...prev, newStar]);

            // Auto-remove after lifetime
            const starId = newStar.id;
            setTimeout(() => {
                setStars(prev => prev.filter(s => s.id !== starId));
            }, STAR_LIFETIME_MS);
        };

        // Spawn first immediately
        spawn();
        const interval = setInterval(spawn, STAR_SPAWN_INTERVAL);
        return () => clearInterval(interval);
    }, [phase, phaseIdx]);

    // ─── Handle star tap ────────────────────────────────────────

    const handleStarTap = useCallback((star: Star) => {
        if (star.tapped || phase !== 'playing') return;

        // Mark as tapped
        setStars(prev => prev.map(s =>
            s.id === star.id ? { ...s, tapped: true } : s
        ));

        const isCorrect = star.color === currentTarget.current;

        if (isCorrect) {
            correctTapsRef.current++;

            // Track adaptation time (first correct after rule change)
            if (!firstCorrectAfterChangeRef.current && phaseIdx > 0) {
                const adaptTime = Date.now() - phaseStartRef.current;
                adaptationTimesRef.current.push(adaptTime);
                firstCorrectAfterChangeRef.current = true;
            } else if (phaseIdx === 0 && !firstCorrectAfterChangeRef.current) {
                // First phase — just mark as started
                firstCorrectAfterChangeRef.current = true;
            }
        } else {
            wrongTapsRef.current++;

            // If we haven't made first correct after change, this is inertia
            if (!firstCorrectAfterChangeRef.current && phaseIdx > 0) {
                inertiaErrorsRef.current++;
            }
        }

        // Remove star after brief feedback
        const starId = star.id;
        setTimeout(() => {
            setStars(prev => prev.filter(s => s.id !== starId));
        }, 300);
    }, [phase, phaseIdx]);

    // ─── Finish game ────────────────────────────────────────────

    const finishGame = useCallback(() => {
        const totalTime = Date.now() - gameStartRef.current;
        const adaptTimes = adaptationTimesRef.current;
        const avgAdaptation = adaptTimes.length > 0
            ? Math.round(adaptTimes.reduce((s, v) => s + v, 0) / adaptTimes.length)
            : 0;

        const metrics: AdaptationMetrics = {
            adaptationTimes: adaptTimes,
            avgAdaptation,
            inertiaErrors: inertiaErrorsRef.current,
            correctTaps: correctTapsRef.current,
            wrongTaps: wrongTapsRef.current,
            totalTimeMs: totalTime,
        };

        console.log('[LaTormenta] Adaptation Metrics:', metrics);
        setPhase('complete');

        setTimeout(() => onComplete(metrics), 2200);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 overflow-hidden select-none"
            style={{ zIndex: 50, touchAction: 'none' }}
            animate={cameraShake > 0 ? { x: [0, 4, -3, 2, 0], y: [0, -3, 2, -1, 0] } : {}}
            transition={{ duration: 0.2 }}
            key={`shake-${cameraShake}`}
        >
            {/* Solid dark bg behind everything to prevent any gaps */}
            <div className="absolute inset-0" style={{ background: '#1a1530' }} />

            {/* Storm background — swaying inside an overflow-hidden container */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.img
                    src="/scenes/storm.png"
                    alt=""
                    className="absolute object-cover"
                    style={{
                        top: '-20%', left: '-20%',
                        width: '140%', height: '140%',
                        minWidth: '140vw', minHeight: '140vh',
                    }}
                    draggable={false}
                    animate={{
                        x: [0, 4, -3, 2, 0],
                        y: [0, -3, 2, -1, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Dark overlay — pulses darker during storm */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.25, 0.4, 0.25] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'rgba(15,23,42,1)' }}
            />

            {/* Rolling cloud layer */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    top: 0, left: '-10%',
                    width: '120%', height: '35%',
                    background: 'linear-gradient(180deg, rgba(30,20,50,0.7) 0%, transparent 100%)',
                    filter: 'blur(6px)',
                }}
                animate={{ x: [0, 20, -15, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Second cloud layer — opposite direction */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    top: '5%', left: '-5%',
                    width: '110%', height: '25%',
                    background: 'linear-gradient(180deg, rgba(50,30,70,0.4) 0%, transparent 100%)',
                    filter: 'blur(10px)',
                }}
                animate={{ x: [0, -18, 12, -8, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Storm waves at bottom */}
            <motion.svg
                className="absolute w-full pointer-events-none"
                style={{ bottom: 0, height: 50, zIndex: 3 }}
                viewBox="0 0 400 50"
                preserveAspectRatio="none"
                animate={{ y: [0, -6, 0, 4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <path
                    d={`M0,20 ${Array.from({ length: 9 }, (_, j) =>
                        `Q${j * 50 + 25},${j % 2 === 0 ? 5 : 35} ${(j + 1) * 50},20`
                    ).join(' ')} L400,50 L0,50 Z`}
                    fill="rgba(15,23,42,0.5)"
                />
            </motion.svg>
            <motion.svg
                className="absolute w-full pointer-events-none"
                style={{ bottom: '-2%', height: 40, zIndex: 3 }}
                viewBox="0 0 400 40"
                preserveAspectRatio="none"
                animate={{ y: [0, 4, 0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
                <path
                    d={`M0,15 ${Array.from({ length: 9 }, (_, j) =>
                        `Q${j * 50 + 25},${j % 2 === 0 ? 3 : 28} ${(j + 1) * 50},15`
                    ).join(' ')} L400,40 L0,40 Z`}
                    fill="rgba(15,23,42,0.35)"
                />
            </motion.svg>

            {/* Rain */}
            {phase !== 'intro' && <Rain />}

            {/* Vignette — heavier for storm */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.45) 100%)' }}
            />

            {/* Lightning flash on rule change */}
            <AnimatePresence>
                {showLightning && <LightningFlash />}
            </AnimatePresence>

            {/* Rule indicator */}
            {phase === 'playing' && (
                <RuleIndicator target={PHASES[phaseIdx]?.target ?? 'gold'} goldLabel={t.stormTapGold} silverLabel={t.stormTapSilver} />
            )}

            {/* Stars */}
            <AnimatePresence>
                {stars.map(star => (
                    <motion.div
                        key={`star-${star.id}`}
                        className="absolute"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={star.tapped
                            ? {
                                scale: star.color === currentTarget.current ? 1.4 : 0.3,
                                opacity: 0,
                            }
                            : { scale: [0, 1.1, 1], opacity: 1 }
                        }
                        exit={{ scale: 0, opacity: 0 }}
                        transition={star.tapped
                            ? { duration: 0.25 }
                            : { duration: 0.35, ease: 'easeOut' }
                        }
                    >
                        {/* Tap target */}
                        <div
                            className="cursor-pointer p-2"
                            onClick={(e) => { e.stopPropagation(); handleStarTap(star); }}
                            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleStarTap(star); }}
                        >
                            <StarItem color={star.color} size={56} />
                        </div>

                        {/* Feedback flash on tap */}
                        {star.tapped && (
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    className="w-6 h-6 rounded-full"
                                    style={{
                                        background: star.color === currentTarget.current
                                            ? 'rgba(74,222,128,0.5)'
                                            : 'rgba(248,113,113,0.5)',
                                    }}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* ──── Intro overlay ──── */}
            <AnimatePresence>
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.4 } }}
                        className="absolute inset-0 flex items-center justify-center px-6"
                        style={{ zIndex: 20 }}
                        onClick={handleStart}
                        onTouchStart={(e) => { e.preventDefault(); handleStart(); }}
                    >
                        <motion.div
                            className="flex flex-col items-center gap-4 px-8 py-7 rounded-3xl max-w-xs w-full"
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                            {/* Lightning bolt icon */}
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <svg width="40" height="44" viewBox="0 0 24 24" fill="none"
                                    stroke="rgba(245,158,11,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(245,158,11,0.2)" />
                                </svg>
                            </motion.div>

                            <h2 className="font-adventure text-2xl text-white leading-tight text-center">
                                {t.stormTitle}
                            </h2>

                            <p className="font-quest text-white/75 text-sm text-center leading-relaxed">
                                {t.stormBody}
                            </p>

                            <motion.div
                                className="w-11 h-11 rounded-full border-2 border-white/40 flex items-center justify-center mt-1"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.25, 0.5] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="white" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="1.5" />
                                </svg>
                            </motion.div>

                            <p className="font-quest font-medium text-white/45 text-[11px] tracking-wide">
                                {t.tapToStart}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ──── Completion overlay ──── */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ zIndex: 20 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.div
                            className="flex flex-col items-center gap-3 px-8 py-6 rounded-3xl"
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                            initial={{ scale: 0.85, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                            >
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                                    stroke="rgba(245,158,11,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </motion.div>
                            <span className="font-adventure text-xl text-white text-center">
                                {t.stormCompletion}
                            </span>
                            <span className="font-quest text-white/50 text-xs">
                                {t.continueAdventure}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
