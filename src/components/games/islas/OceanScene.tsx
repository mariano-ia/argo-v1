import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Z } from './constants';
import { WaterCaustics } from './WaterCaustics';
import { ArgoShip } from './ArgoShip';

// ─── Sky gradient (shifts to golden over game duration) ─────────────────────

const SkyGradient: React.FC<{ progress: number }> = ({ progress }) => {
    const warmth = Math.min(progress * 1.2, 1);
    const topColor = `hsl(${205 - warmth * 30}, ${75 - warmth * 15}%, ${72 + warmth * 8}%)`;
    const bottomColor = `hsl(${200 - warmth * 50}, ${70 - warmth * 10}%, ${55 + warmth * 20}%)`;

    return (
        <div
            className="absolute inset-0 pointer-events-none transition-all duration-1000"
            style={{
                zIndex: Z.sky,
                background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 50%, #0c4a6e 100%)`,
            }}
        />
    );
};

// ─── Clouds ─────────────────────────────────────────────────────────────────

const Clouds: React.FC = () => {
    const clouds = useRef(
        Array.from({ length: 5 }, (_, i) => ({
            id: i,
            top: 3 + i * 5 + Math.random() * 3,
            w: 70 + Math.random() * 80,
            h: 18 + Math.random() * 16,
            dur: 35 + Math.random() * 25,
            opacity: 0.12 + Math.random() * 0.12,
        }))
    ).current;

    return (
        <>
            {clouds.map(c => (
                <motion.div
                    key={`cloud-${c.id}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        zIndex: Z.farClouds,
                        top: `${c.top}%`,
                        width: c.w,
                        height: c.h,
                        background: 'rgba(255,255,255,0.9)',
                        filter: 'blur(12px)',
                        opacity: c.opacity,
                    }}
                    animate={{ x: ['-20vw', '120vw'] }}
                    transition={{ duration: c.dur, repeat: Infinity, ease: 'linear', delay: c.id * 5 }}
                />
            ))}
        </>
    );
};

// ─── Vertical-bobbing wave layers (no horizontal scroll) ────────────────────

const BobbingWave: React.FC<{
    z: number; bottom: string; amplitude: number; color: string;
    speed: number; opacity: number; phase?: number;
}> = ({ z, bottom, amplitude, color, speed, opacity, phase = 0 }) => (
    <motion.svg
        className="absolute w-full pointer-events-none"
        style={{ zIndex: z, bottom, height: amplitude * 2 + 16 }}
        viewBox={`0 0 400 ${amplitude * 2 + 16}`}
        preserveAspectRatio="none"
        animate={{
            y: [0, -amplitude * 0.35, 0, amplitude * 0.25, 0],
        }}
        transition={{
            duration: speed,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: phase,
        }}
    >
        <path
            d={`M0,${amplitude} ${Array.from({ length: 9 }, (_, j) =>
                `Q${j * 50 + 25},${j % 2 === 0 ? 4 : amplitude * 2 - 2} ${(j + 1) * 50},${amplitude}`
            ).join(' ')} L400,${amplitude * 2 + 16} L0,${amplitude * 2 + 16} Z`}
            fill={color}
            opacity={opacity}
        />
    </motion.svg>
);

// ─── Water sparkles ─────────────────────────────────────────────────────────

const WaterSparkles: React.FC = () => {
    const sparkles = useRef(
        Array.from({ length: 16 }, (_, i) => ({
            id: i,
            left: 2 + Math.random() * 96,
            top: 55 + Math.random() * 38,
            size: 1.5 + Math.random() * 2.5,
            dur: 1.2 + Math.random() * 2,
            delay: Math.random() * 5,
        }))
    ).current;

    return (
        <>
            {sparkles.map(s => (
                <motion.div
                    key={`sp-${s.id}`}
                    className="absolute rounded-full bg-white pointer-events-none"
                    style={{
                        zIndex: Z.spray,
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        width: s.size,
                        height: s.size,
                    }}
                    animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1.3, 0.4] }}
                    transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
                />
            ))}
        </>
    );
};

// ─── Fish silhouettes ───────────────────────────────────────────────────────

const FishSVG: React.FC<{ size: number; flip?: boolean }> = ({ size, flip }) => (
    <svg
        width={size} height={size * 0.5} viewBox="0 0 30 15" fill="none"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
        <path d="M2,7.5 Q8,2 15,7.5 Q8,13 2,7.5 Z" fill="rgba(15,23,42,0.12)" />
        <path d="M15,7.5 L20,4 L20,11 Z" fill="rgba(15,23,42,0.08)" />
        <circle cx="6" cy="7" r="0.8" fill="rgba(15,23,42,0.15)" />
    </svg>
);

const SwimmingFish: React.FC = () => {
    const fish = useRef([
        { id: 0, size: 24, top: 72, dur: 12, delay: 2, flip: false },
        { id: 1, size: 18, top: 80, dur: 16, delay: 6, flip: true },
        { id: 2, size: 20, top: 88, dur: 14, delay: 0, flip: false },
    ]).current;

    return (
        <>
            {fish.map(f => (
                <motion.div
                    key={`fish-${f.id}`}
                    className="absolute pointer-events-none"
                    style={{ zIndex: Z.marineLife, top: `${f.top}%` }}
                    animate={{
                        x: f.flip ? ['108vw', '-12vw'] : ['-12vw', '108vw'],
                        y: [0, -3, 0, 2, 0],
                    }}
                    transition={{
                        x: { duration: f.dur, repeat: Infinity, ease: 'linear', delay: f.delay },
                        y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                    }}
                >
                    <FishSVG size={f.size} flip={f.flip} />
                </motion.div>
            ))}
        </>
    );
};

// ─── Bird ───────────────────────────────────────────────────────────────────

const FlyingBird: React.FC = () => (
    <motion.div
        className="absolute pointer-events-none"
        style={{ zIndex: Z.marineLife, top: '12%' }}
        animate={{ x: ['-5vw', '105vw'], y: [0, -5, 2, -3, 0] }}
        transition={{
            x: { duration: 18, repeat: Infinity, ease: 'linear', delay: 3 },
            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        }}
    >
        <motion.svg
            width={18} height={9} viewBox="0 0 40 22"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <path d="M0 18 Q8 2 20 11 Q32 2 40 18" stroke="rgba(30,30,40,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </motion.svg>
    </motion.div>
);

// ─── Main Scene Composite ───────────────────────────────────────────────────

interface OceanSceneProps {
    progress: number;
    showShip?: boolean;
}

export const OceanScene: React.FC<OceanSceneProps> = ({ progress, showShip = true }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Sky */}
        <SkyGradient progress={progress} />

        {/* Clouds */}
        <Clouds />

        {/* Far wave — slow bob */}
        <BobbingWave z={Z.farWave} bottom="38%" amplitude={16} color="rgba(14,116,144,0.12)" speed={5} opacity={0.7} phase={0} />
        <BobbingWave z={Z.farWave} bottom="36%" amplitude={14} color="rgba(14,116,144,0.08)" speed={6} opacity={0.5} phase={1.5} />

        {/* Ocean body gradient */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                zIndex: Z.ocean,
                top: '35%',
                background: 'linear-gradient(180deg, rgba(8,145,178,0.4) 0%, rgba(12,74,110,0.7) 50%, rgba(15,23,42,0.85) 100%)',
            }}
        />

        {/* Caustics */}
        <WaterCaustics />

        {/* Mid waves — medium bob */}
        <BobbingWave z={Z.midWave} bottom="22%" amplitude={12} color="rgba(6,182,212,0.1)" speed={4} opacity={0.8} phase={0.5} />
        <BobbingWave z={Z.midWave} bottom="18%" amplitude={10} color="rgba(6,182,212,0.07)" speed={4.5} opacity={0.6} phase={2} />

        {/* Marine life */}
        <SwimmingFish />
        <FlyingBird />

        {/* Argo ship (background idle) */}
        {showShip && <ArgoShip mode="idle" />}

        {/* Near wave — fast bob, foreground */}
        <BobbingWave z={Z.nearWave} bottom="2%" amplitude={8} color="rgba(8,47,73,0.25)" speed={3} opacity={0.9} phase={0.3} />
        <BobbingWave z={Z.nearWave} bottom="0%" amplitude={6} color="rgba(8,47,73,0.15)" speed={3.5} opacity={0.7} phase={1} />

        {/* Water sparkles */}
        <WaterSparkles />

        {/* Vignette */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                zIndex: Z.vignette,
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)',
            }}
        />
    </div>
);
