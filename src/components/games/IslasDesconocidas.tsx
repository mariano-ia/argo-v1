import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { OceanScene } from './islas/OceanScene';
import { CardEntity, CardState } from './islas/CardEntity';
import { useHaptics } from './islas/useHaptics';
import { useSoundTriggers } from './islas/useSoundTriggers';
import { getMiniGameTexts } from './islas/translations';
import {
    ISLAND_COUNT, DISCOVERY_IMAGES,
    DISCOVERY_DISPLAY_MS, SCREEN_FLASH_MS, CAMERA_SHAKE_MS,
    Z, preloadImages,
} from './islas/constants';

/* ──────────────────────────── Types ──────────────────────────── */

export interface IslandMetrics {
    latencies: number[];
    avgLatency: number;
    stdDevLatency: number;
    totalTimeMs: number;
    trend: number;
}

interface Props {
    onComplete: (metrics: IslandMetrics) => void;
    lang?: string;
}

interface CardData {
    id: number;
    discoveryImg: string;
    discoveryName: string;
    appearedAt: number;
    state: CardState;
}

/* ──────────────────────────── Component ──────────────────────────── */

export const IslasDesconocidas: React.FC<Props> = ({ onComplete, lang = 'es' }) => {
    const t = getMiniGameTexts(lang);
    const [phase, setPhase] = useState<'loading' | 'intro' | 'playing' | 'complete'>('loading');
    const [cards, setCards] = useState<CardData[]>([]);
    const [activeCardIdx, setActiveCardIdx] = useState(-1);
    const [showCompletion, setShowCompletion] = useState(false);
    const [screenFlash, setScreenFlash] = useState(0);
    const [cameraShake, setCameraShake] = useState(0);

    const gameStartRef = useRef(0);
    const latenciesRef = useRef<number[]>([]);
    const metricsRef = useRef<IslandMetrics | null>(null);
    const processingRef = useRef(false);

    const { vibrate } = useHaptics();
    const { trigger } = useSoundTriggers();

    // Preload images
    useEffect(() => {
        preloadImages().then(() => setPhase('intro'));
    }, []);

    const progress = cards.length > 0
        ? cards.filter(c => c.state === 'faceup').length / ISLAND_COUNT
        : 0;

    // ─── Start game ─────────────────────────────────────────────

    const handleStart = useCallback(() => {
        if (phase !== 'intro') return;
        setPhase('playing');
        gameStartRef.current = Date.now();
        trigger('ambient_ocean_start');

        // Build discovery items with translated names
        const items = DISCOVERY_IMAGES.map((img, i) => ({
            img,
            name: t.discoveries[i] ?? '',
        }));
        const shuffled = [...items].sort(() => Math.random() - 0.5);

        // All cards start hidden — they appear one at a time
        const newCards: CardData[] = shuffled.map((disc, i) => ({
            id: i,
            discoveryImg: disc.img,
            discoveryName: disc.name,
            appearedAt: 0,
            state: 'hidden' as CardState,
        }));

        setCards(newCards);

        // Show first card after a brief delay
        setTimeout(() => {
            setCards(prev => prev.map((c, i) =>
                i === 0
                    ? { ...c, state: 'entering' as CardState, appearedAt: Date.now() }
                    : c
            ));
            setActiveCardIdx(0);
            // Transition entering → facedown after entrance animation
            setTimeout(() => {
                setCards(prev => prev.map((c, i) =>
                    i === 0 && c.state === 'entering'
                        ? { ...c, state: 'facedown' as CardState, appearedAt: Date.now() }
                        : c
                ));
            }, 500);
        }, 600);
    }, [phase, trigger]);

    // ─── Handle card tap ────────────────────────────────────────

    const handleCardTap = useCallback((id: number) => {
        if (processingRef.current || phase !== 'playing') return;

        const card = cards.find(c => c.id === id);
        if (!card || card.state !== 'facedown') return;

        // Only the active (highlighted) card can be tapped
        if (id !== cards[activeCardIdx]?.id) return;

        processingRef.current = true;

        // Record latency
        const latency = Date.now() - card.appearedAt;
        latenciesRef.current.push(latency);

        // Game juice
        trigger('tap_island');
        vibrate();
        setScreenFlash(f => f + 1);
        setCameraShake(s => s + 1);

        // Flip the card
        setCards(prev => prev.map(c =>
            c.id === id ? { ...c, state: 'flipping' as CardState } : c
        ));

        // After flip completes → faceup
        setTimeout(() => {
            trigger('discovery_reveal');
            setCards(prev => prev.map(c =>
                c.id === id ? { ...c, state: 'faceup' as CardState } : c
            ));
        }, 600);

        // After reveal display → keep faceup, activate next
        setTimeout(() => {
            // Card stays faceup (no state change needed)
            const nextIdx = activeCardIdx + 1;
            if (nextIdx >= ISLAND_COUNT) {
                finishGame();
            } else {
                // Show next card quickly
                setCards(prev => prev.map((c, i) =>
                    i === nextIdx
                        ? { ...c, state: 'entering' as CardState }
                        : c
                ));
                setActiveCardIdx(nextIdx);

                setTimeout(() => {
                    setCards(prev => prev.map((c, i) =>
                        i === nextIdx && c.state === 'entering'
                            ? { ...c, state: 'facedown' as CardState, appearedAt: Date.now() }
                            : c
                    ));
                    processingRef.current = false;
                }, 400);
            }
        }, 600 + DISCOVERY_DISPLAY_MS);
    }, [cards, activeCardIdx, phase, trigger, vibrate]);

    // ─── Finish game ────────────────────────────────────────────

    const finishGame = useCallback(() => {
        const lats = latenciesRef.current;
        const totalTime = Date.now() - gameStartRef.current;
        const avg = lats.reduce((s, v) => s + v, 0) / lats.length;
        const variance = lats.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / lats.length;
        const stdDev = Math.sqrt(variance);

        const half = Math.floor(lats.length / 2);
        const avgFirst = lats.slice(0, half).reduce((s, v) => s + v, 0) / half;
        const avgSecond = lats.slice(half).reduce((s, v) => s + v, 0) / (lats.length - half);

        metricsRef.current = {
            latencies: lats,
            avgLatency: Math.round(avg),
            stdDevLatency: Math.round(stdDev),
            totalTimeMs: totalTime,
            trend: Math.round(avgSecond - avgFirst),
        };

        setPhase('complete');
        setShowCompletion(true);

        // Auto-advance after brief message
        setTimeout(() => {
            trigger('ambient_ocean_stop');
            if (metricsRef.current) {
                console.log('[IslasDesconocidas] Metrics:', metricsRef.current);
                onComplete(metricsRef.current);
            }
        }, 2200);
    }, [trigger, onComplete]);

    return (
        <motion.div
            className="fixed inset-0 overflow-hidden select-none"
            style={{ zIndex: 50, touchAction: 'none' }}
            // Camera shake
            animate={cameraShake > 0 ? {
                x: [0, 3, -2, 1, 0],
                y: [0, -2, 1, -1, 0],
            } : {}}
            transition={{ duration: CAMERA_SHAKE_MS / 1000 }}
            key={`shake-${cameraShake}`}
        >
            {/* Ocean scene background */}
            <OceanScene progress={progress} showShip={!showCompletion} />

            {/* Screen flash */}
            <AnimatePresence>
                {screenFlash > 0 && (
                    <motion.div
                        key={`flash-${screenFlash}`}
                        className="absolute inset-0 pointer-events-none bg-white"
                        style={{ zIndex: Z.screenFlash }}
                        initial={{ opacity: 0.15 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: SCREEN_FLASH_MS / 1000 }}
                    />
                )}
            </AnimatePresence>

            {/* ──── Card grid (3x2) ──── */}
            {phase === 'playing' && !showCompletion && (
                <div
                    className="absolute inset-0 flex items-center justify-center px-6 sm:px-10"
                    style={{ zIndex: Z.islands }}
                >
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-[280px] max-h-[82vh]">
                        {cards.map((card) => (
                            <CardEntity
                                key={`card-${card.id}`}
                                discoveryImg={card.discoveryImg}
                                discoveryName={card.discoveryName}
                                state={card.state}
                                onTap={() => handleCardTap(card.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Progress dots removed — this mini-game lives inside the main game flow
               which has its own progress bar */}

            {/* Completion — simple transition message */}
            <AnimatePresence>
                {showCompletion && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ zIndex: Z.overlay }}
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
                                {t.cardCompletion}
                            </span>
                            <span className="font-quest text-white/50 text-xs">
                                {t.continueAdventure}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ──── Intro overlay ──── */}
            <AnimatePresence>
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.4 } }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-6"
                        style={{ zIndex: Z.overlay }}
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
                            {/* Treasure chest icon */}
                            <motion.div
                                animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <svg width="44" height="40" viewBox="0 0 48 44" fill="none">
                                    {/* Chest body */}
                                    <rect x="6" y="18" width="36" height="20" rx="3" fill="rgba(139,101,32,0.7)" />
                                    <rect x="6" y="18" width="36" height="9" rx="2" fill="rgba(160,120,48,0.8)" />
                                    {/* Lock */}
                                    <rect x="19" y="16" width="10" height="12" rx="2" fill="rgba(200,168,112,0.6)" />
                                    <circle cx="24" cy="24" r="2" fill="rgba(245,158,11,0.7)" />
                                    {/* Glow rays */}
                                    <path d="M14,16 L18,6 M24,14 L24,4 M34,16 L30,6" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                                    {/* Metal bands */}
                                    <line x1="6" y1="28" x2="42" y2="28" stroke="rgba(200,168,112,0.3)" strokeWidth="1" />
                                </svg>
                            </motion.div>

                            <h2 className="font-adventure text-2xl text-white leading-tight text-center">
                                {t.cardTitle}
                            </h2>

                            <p className="font-quest text-white/75 text-sm text-center leading-relaxed">
                                {t.cardBody}
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

            {/* Loading */}
            {phase === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: Z.overlay + 1 }}>
                    <motion.div
                        className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white/80"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            )}

            {/* Metrics logged to console in dev — no visible debug UI */}
        </motion.div>
    );
};
