import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ParticleBurst } from './ParticleBurst';
import { BURST_COLORS_GOLD } from './constants';

export type CardState = 'hidden' | 'entering' | 'facedown' | 'flipping' | 'faceup' | 'done';

interface Props {
    discoveryImg: string;
    discoveryName: string;
    state: CardState;
    onTap: () => void;
}

// ─── Card Back ──────────────────────────────────────────────────────────────

const CardBack: React.FC = () => (
    <div
        className="absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{
            background: 'linear-gradient(145deg, #1e3a5f 0%, #0c2240 40%, #162f50 100%)',
            border: '2px solid rgba(200,168,112,0.35)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.25)',
            backfaceVisibility: 'hidden',
        }}
    >
        {/* Inner border */}
        <div
            className="absolute rounded-xl"
            style={{
                inset: 8,
                border: '1px solid rgba(200,168,112,0.15)',
            }}
        />

        {/* Compass rose */}
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
            stroke="rgba(200,168,112,0.4)" strokeWidth="0.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
            <path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4" />
            <path d="M12 7l2 4.5L12 17l-2-5.5z" fill="rgba(200,168,112,0.25)" />
        </svg>

        {/* Question mark */}
        <motion.div
            className="absolute bottom-4 left-0 right-0 text-center"
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
            <span className="font-quest text-amber-400/35 text-xl font-bold">?</span>
        </motion.div>

        {/* Corner dots */}
        {[
            { top: 10, left: 10 },
            { top: 10, right: 10 },
            { bottom: 10, left: 10 },
            { bottom: 10, right: 10 },
        ].map((pos, i) => (
            <div
                key={`c-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ ...pos, background: 'rgba(200,168,112,0.25)' } as React.CSSProperties}
            />
        ))}
    </div>
);

// ─── Card Front ─────────────────────────────────────────────────────────────

const CardFront: React.FC<{ imgSrc: string; name: string }> = ({ imgSrc, name }) => (
    <div
        className="absolute inset-0 rounded-2xl flex flex-col items-center overflow-hidden"
        style={{
            background: 'linear-gradient(145deg, #162f50 0%, #0c2240 40%, #1a3555 100%)',
            border: '2px solid rgba(245,158,11,0.45)',
            boxShadow: 'inset 0 0 25px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.25)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            padding: '10px 10px 12px',
        }}
    >
        {/* Image frame — white rounded container */}
        <div
            className="relative w-full flex-1 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
                background: '#ffffff',
                minHeight: 0,
            }}
        >
            <img
                src={imgSrc}
                alt=""
                className="w-[85%] h-[85%] object-contain"
                draggable={false}
            />
        </div>

        {/* Name label below image */}
        <div className="w-full pt-2 pb-0.5 flex flex-col items-center gap-1">
            <div
                className="w-8 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }}
            />
            <span className="font-quest text-white/90 text-xs sm:text-sm text-center leading-snug font-medium">
                {name}
            </span>
        </div>
    </div>
);

// ─── Card Entity ────────────────────────────────────────────────────────────

export const CardEntity: React.FC<Props> = ({
    discoveryImg, discoveryName, state, onTap,
}) => {
    const [showBurst, setShowBurst] = useState(false);
    const isInteractive = state === 'facedown';
    const isFlipped = state === 'flipping' || state === 'faceup' || state === 'done';

    const handleTap = () => {
        if (!isInteractive) return;
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 800);
        onTap();
    };

    return (
        <motion.div
            className="relative"
            style={{
                perspective: 900,
                width: '100%',
                aspectRatio: '2/3',
            }}
            initial={state === 'hidden' ? { scale: 0, opacity: 0 } : undefined}
            animate={state !== 'hidden' ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
            {/* Already revealed → static CSS transform */}
            {state === 'faceup' ? (
                <div
                    className="relative w-full h-full"
                    style={{ transformStyle: 'preserve-3d', transform: 'rotateY(180deg)' }}
                >
                    <CardBack />
                    <CardFront imgSrc={discoveryImg} name={discoveryName} />
                </div>
            ) : (
                <motion.div
                    className="relative w-full h-full cursor-pointer"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    onClick={handleTap}
                    onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
                    whileHover={isInteractive ? { scale: 1.04 } : undefined}
                    whileTap={isInteractive ? { scale: 0.92 } : undefined}
                >
                    <CardBack />
                    <CardFront imgSrc={discoveryImg} name={discoveryName} />
                </motion.div>
            )}

            {/* Active glow */}
            {isInteractive && (
                <motion.div
                    className="absolute -inset-1 rounded-2xl pointer-events-none"
                    style={{
                        border: '1.5px solid rgba(245,158,11,0.3)',
                        boxShadow: '0 0 15px rgba(245,158,11,0.15)',
                    }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}

            {/* Particle burst on tap */}
            {showBurst && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <ParticleBurst count={10} colors={BURST_COLORS_GOLD} radius={55} duration={0.6} />
                </div>
            )}

            {/* Subtle glow after reveal */}
            {state === 'faceup' && (
                <div
                    className="absolute -inset-0.5 rounded-2xl pointer-events-none"
                    style={{
                        border: '1px solid rgba(245,158,11,0.25)',
                        boxShadow: '0 0 8px rgba(245,158,11,0.1)',
                    }}
                />
            )}
        </motion.div>
    );
};
