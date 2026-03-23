import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoveryReveal } from './DiscoveryReveal';
import { ParticleBurst } from './ParticleBurst';
import { BURST_COLORS_WATER, EMERGE_DURATION_MS, TAP_HINT_DELAY_MS, Z } from './constants';

export type IslandState = 'hidden' | 'emerging' | 'idle' | 'tapped' | 'discovering' | 'sinking' | 'done';

interface Props {
    x: number;           // % from left
    y: number;           // % from top
    imgSrc: string;
    discoveryImg: string;
    discoveryName: string;
    state: IslandState;
    onTap: () => void;
}

// Ripple ring expanding from island on emerge
const RippleRing: React.FC = () => (
    <motion.div
        className="absolute pointer-events-none"
        style={{
            left: '50%', top: '60%',
            width: 100, height: 40,
            marginLeft: -50, marginTop: -20,
            borderRadius: '50%',
            border: '2px solid rgba(6,182,212,0.4)',
        }}
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
    />
);

// Tap hint after idle delay
const TapHint: React.FC = () => (
    <motion.div
        className="absolute pointer-events-none"
        style={{
            left: '50%', top: '50%',
            width: 60, height: 60,
            marginLeft: -30, marginTop: -30,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.4, 0.5], opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
);

export const IslandEntity: React.FC<Props> = ({
    x, y, imgSrc, discoveryImg, discoveryName, state, onTap,
}) => {
    const [showHint, setShowHint] = useState(false);
    const [showRipple, setShowRipple] = useState(false);
    const [showWaterSplash, setShowWaterSplash] = useState(false);
    const hintTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const isInteractive = state === 'idle';

    // Tap hint timer
    useEffect(() => {
        if (state === 'idle') {
            hintTimerRef.current = setTimeout(() => setShowHint(true), TAP_HINT_DELAY_MS);
        } else {
            setShowHint(false);
        }
        return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
    }, [state]);

    // Ripple on emerge
    useEffect(() => {
        if (state === 'emerging') {
            setShowRipple(true);
            setShowWaterSplash(true);
            setTimeout(() => setShowRipple(false), EMERGE_DURATION_MS);
            setTimeout(() => setShowWaterSplash(false), 700);
        }
    }, [state]);

    if (state === 'hidden') return null;

    // Animation variants per state
    const getAnimation = () => {
        switch (state) {
            case 'emerging':
                return {
                    initial: { y: 60, scale: 0.3, opacity: 0 },
                    animate: { y: 0, scale: 1, opacity: 1, filter: 'brightness(1.2)' },
                    transition: { type: 'spring' as const, stiffness: 120, damping: 14 },
                };
            case 'idle':
                return {
                    animate: {
                        y: [0, -4, 0],
                        scale: [1, 1.02, 1],
                        filter: 'brightness(1)',
                    },
                    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
                };
            case 'tapped':
                return {
                    animate: {
                        scaleX: [1, 1.15, 0.9, 1.02, 1],
                        scaleY: [1, 0.85, 1.1, 0.98, 1],
                    },
                    transition: { duration: 0.3 },
                };
            case 'discovering':
                return {
                    animate: { y: 0, scale: 1 },
                    transition: { duration: 0.2 },
                };
            case 'sinking':
                return {
                    animate: {
                        scale: 0.55,
                        opacity: 0.2,
                        y: 8,
                        filter: 'grayscale(0.6) brightness(0.65)',
                    },
                    transition: { duration: 0.5, ease: 'easeInOut' as const },
                };
            case 'done':
                return {
                    animate: {
                        scale: 0.55,
                        opacity: 0.2,
                        filter: 'grayscale(0.6) brightness(0.65)',
                    },
                };
            default:
                return {};
        }
    };

    const anim = getAnimation();

    return (
        <motion.div
            className="absolute"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isInteractive || state === 'tapped' || state === 'discovering' ? Z.islands + 1 : Z.islands,
            }}
            {...anim}
        >
            {/* Glow behind island (idle + emerging) */}
            {(state === 'idle' || state === 'emerging') && (
                <motion.div
                    className="absolute pointer-events-none"
                    style={{
                        inset: '-25%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(6,182,212,0.12) 50%, transparent 70%)',
                    }}
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.92, 1.1, 0.92] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}

            {/* Ripple ring on emerge */}
            {showRipple && <RippleRing />}

            {/* Water splash particles on emerge */}
            <AnimatePresence>
                {showWaterSplash && (
                    <div className="absolute" style={{ left: '50%', top: '60%' }}>
                        <ParticleBurst
                            count={8}
                            colors={BURST_COLORS_WATER}
                            radius={45}
                            duration={0.6}
                            gravity
                            sizeRange={[2, 5]}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Tap hint */}
            {showHint && state === 'idle' && <TapHint />}

            {/* Island image */}
            <motion.img
                src={imgSrc}
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain pointer-events-none"
                draggable={false}
                whileTap={isInteractive ? { scale: 0.92 } : undefined}
            />

            {/* Tap target (larger than image for easier tapping) */}
            {isInteractive && (
                <div
                    className="absolute cursor-pointer"
                    style={{
                        inset: '-15%',
                        borderRadius: '50%',
                    }}
                    onClick={(e) => { e.stopPropagation(); onTap(); }}
                    onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); onTap(); }}
                />
            )}

            {/* Tap particle burst */}
            <AnimatePresence>
                {state === 'tapped' && (
                    <div className="absolute" style={{ left: '50%', top: '50%' }}>
                        <ParticleBurst count={14} radius={55} duration={0.6} />
                    </div>
                )}
            </AnimatePresence>

            {/* Discovery reveal */}
            <AnimatePresence>
                {state === 'discovering' && (
                    <DiscoveryReveal imgSrc={discoveryImg} name={discoveryName} />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
