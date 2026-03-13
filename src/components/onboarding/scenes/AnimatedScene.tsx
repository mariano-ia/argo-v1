import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Scene phase mapping ─────────────────────────────────────────────────────

type Phase = 'port' | 'open-sea' | 'storm' | 'calm' | 'island';

const SCENE_ASSETS: Record<Phase, string[]> = {
    'port':     ['/scenes/port.png', '/scenes/port-2.png'],
    'open-sea': ['/scenes/open-sea.png', '/scenes/open-sea-2.png', '/scenes/open-sea-3.png'],
    'storm':    ['/scenes/storm.png', '/scenes/storm-2.png', '/scenes/storm-3.png'],
    'calm':     ['/scenes/calm.png', '/scenes/calm-2.png'],
    'island':   ['/scenes/island.png'],
};

function getPhase(questionIndex: number): Phase {
    if (questionIndex <= 1) return 'port';
    if (questionIndex <= 3) return 'open-sea';
    if (questionIndex <= 6) return 'storm';
    if (questionIndex <= 9) return 'calm';
    return 'island';
}

// ─── Big SVG ocean waves (scrolling sine, very visible) ──────────────────────

const OceanWaves: React.FC<{
    layers?: number; color?: string; speed?: number; height?: string; amplitude?: number; yBase?: number;
}> = ({ layers = 3, color = '70,160,210', speed = 8, height = '30%', amplitude = 22, yBase = 0 }) => (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height }}>
        {[...Array(layers)].map((_, i) => {
            const alpha = 0.18 + i * 0.08;
            const yOff = yBase + i * 18;
            const dur = Math.max(speed - i * 1.2, 2.5);
            const bobAmount = amplitude * 0.4 + i * 3;
            return (
                <motion.svg
                    key={i}
                    className="absolute w-full"
                    style={{ bottom: yOff }}
                    height={amplitude * 2 + 20}
                    viewBox={`0 0 600 ${amplitude * 2 + 20}`}
                    preserveAspectRatio="none"
                    animate={{ y: [0, -bobAmount, 0, bobAmount * 0.6, 0] }}
                    transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <path
                        d={`M0,${amplitude} ${Array.from({ length: 13 }, (_, j) =>
                            `Q${j * 50 + 25},${j % 2 === 0 ? 2 : amplitude * 2 - 2} ${(j + 1) * 50},${amplitude}`
                        ).join(' ')} L600,${amplitude * 2 + 20} L0,${amplitude * 2 + 20} Z`}
                        fill={`rgba(${color},${alpha})`}
                    />
                </motion.svg>
            );
        })}
    </div>
);

// ─── Water sparkles (little flashes of light on the water) ───────────────────

const WaterSparkles: React.FC<{ count?: number; zone?: [number, number] }> = ({ count = 20, zone = [50, 85] }) => (
    <>
        {[...Array(count)].map((_, i) => {
            const left = 2 + Math.random() * 96;
            const top = zone[0] + Math.random() * (zone[1] - zone[0]);
            const size = 2 + Math.random() * 3;
            const dur = 1 + Math.random() * 2;
            const delay = Math.random() * 5;
            return (
                <motion.div
                    key={`sparkle-${i}`}
                    className="absolute rounded-full bg-white pointer-events-none"
                    style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
            );
        })}
    </>
);

// ─── Flying birds with wing flap ─────────────────────────────────────────────

const Bird: React.FC<{ size: number; top: number; dur: number; delay: number; color: string; reverse?: boolean }> = ({
    size, top, dur, delay, color, reverse,
}) => (
    <motion.div
        className="absolute pointer-events-none"
        style={{ top: `${top}%` }}
        animate={{ x: reverse ? ['108vw', '-8vw'] : ['-8vw', '108vw'] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay }}
    >
        <motion.svg
            width={size} height={size * 0.5} viewBox="0 0 40 22"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 0.4 + Math.random() * 0.2, repeat: Infinity, ease: 'easeInOut' }}
        >
            <path d="M0 18 Q8 2 20 11 Q32 2 40 18" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </motion.svg>
    </motion.div>
);

const FlyingBirds: React.FC<{ count?: number; color?: string }> = ({ count = 5, color = 'rgba(30,30,40,0.55)' }) => (
    <>
        {[...Array(count)].map((_, i) => (
            <Bird
                key={`b-${i}`}
                size={22 + Math.random() * 16}
                top={3 + Math.random() * 25}
                dur={10 + Math.random() * 12}
                delay={i * 2.5 + Math.random() * 3}
                color={color}
                reverse={i % 3 === 0}
            />
        ))}
    </>
);

// ─── Cloud shapes (multi-circle, highly visible) ─────────────────────────────

const CloudShape: React.FC<{ y: number; scale: number; dur: number; delay: number; opacity: number }> = ({
    y, scale, dur, delay, opacity,
}) => (
    <motion.div
        className="absolute pointer-events-none"
        style={{ top: `${y}%` }}
        animate={{ x: ['-25vw', '110vw'] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay }}
    >
        <div style={{ transform: `scale(${scale})`, opacity }}>
            <div className="relative" style={{ width: 140, height: 55 }}>
                <div className="absolute rounded-full bg-white" style={{ width: 55, height: 35, left: 0, top: 20 }} />
                <div className="absolute rounded-full bg-white" style={{ width: 70, height: 48, left: 30, top: 7 }} />
                <div className="absolute rounded-full bg-white" style={{ width: 50, height: 32, left: 72, top: 23 }} />
                <div className="absolute rounded-full bg-white" style={{ width: 60, height: 42, left: 48, top: 0 }} />
                <div className="absolute rounded-full bg-white" style={{ width: 40, height: 25, left: 95, top: 27 }} />
            </div>
        </div>
    </motion.div>
);

const DriftingClouds: React.FC<{ count?: number; opacity?: number }> = ({ count = 4, opacity = 0.3 }) => (
    <>
        {[...Array(count)].map((_, i) => (
            <CloudShape
                key={`c-${i}`}
                y={1 + i * 8 + Math.random() * 4}
                scale={0.5 + Math.random() * 0.7}
                dur={30 + Math.random() * 20}
                delay={i * 7 + Math.random() * 5}
                opacity={opacity - i * 0.03}
            />
        ))}
    </>
);

// ─── Sun rays ────────────────────────────────────────────────────────────────

const SunRays: React.FC = () => (
    <motion.div
        className="absolute pointer-events-none"
        style={{
            top: '-15%', right: '-10%', width: '70%', height: '80%',
            background: 'conic-gradient(from 200deg, transparent 0deg, rgba(255,220,130,0.12) 8deg, transparent 16deg, transparent 36deg, rgba(255,220,130,0.1) 44deg, transparent 52deg, transparent 72deg, rgba(255,220,130,0.11) 80deg, transparent 88deg, transparent 140deg, rgba(255,220,130,0.08) 148deg, transparent 156deg, transparent 200deg, rgba(255,220,130,0.12) 208deg, transparent 216deg, transparent 280deg, rgba(255,220,130,0.09) 288deg, transparent 296deg, transparent 360deg)',
            filter: 'blur(2px)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
    />
);

// ─── Rocking boat overlay (for port scene — positioned over the anchored Argo) ─

const RockingBoat: React.FC = () => (
    <motion.div
        className="absolute pointer-events-none"
        style={{ bottom: '38%', left: '30%', width: 80, transformOrigin: 'center bottom' }}
        animate={{
            rotate: [-3, 3, -3],
            y: [0, -5, 0, -3, 0],
        }}
        transition={{
            rotate: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
    >
        <svg viewBox="0 0 80 60" fill="none">
            {/* Hull */}
            <path d="M10 40 Q40 52 70 40 L65 30 H15 Z" fill="rgba(139,101,32,0.7)" stroke="rgba(160,120,48,0.8)" strokeWidth="1.5" />
            {/* Mast */}
            <line x1="40" y1="8" x2="40" y2="35" stroke="rgba(160,120,48,0.7)" strokeWidth="2" />
            {/* Sail */}
            <motion.path
                d="M40 8 L62 22 L40 28 Z"
                fill="rgba(255,200,100,0.5)"
                stroke="rgba(255,200,100,0.6)"
                strokeWidth="1"
                animate={{ d: ['M40 8 L62 22 L40 28 Z', 'M40 8 L60 20 L40 28 Z', 'M40 8 L62 22 L40 28 Z'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    </motion.div>
);

// ─── Parallax background ─────────────────────────────────────────────────────

const ParallaxBg: React.FC<{ src: string }> = ({ src }) => (
    <motion.div
        className="absolute inset-0"
        animate={{ scale: [1.02, 1.06, 1.02] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    >
        <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
        />
    </motion.div>
);

// ─── Phase overlays ──────────────────────────────────────────────────────────

const PortOverlay: React.FC = () => (
    <>
        <SunRays />
        <DriftingClouds count={3} opacity={0.35} />
        <FlyingBirds count={5} color="rgba(50,40,20,0.5)" />
        <RockingBoat />
        <OceanWaves layers={3} color="80,180,200" speed={10} height="22%" amplitude={16} />
        <WaterSparkles count={15} zone={[60, 85]} />
    </>
);

const OpenSeaOverlay: React.FC = () => (
    <>
        <DriftingClouds count={5} opacity={0.3} />
        <FlyingBirds count={3} color="rgba(40,50,70,0.4)" />
        <OceanWaves layers={4} color="60,140,210" speed={7} height="28%" amplitude={24} />
        <WaterSparkles count={25} zone={[45, 90]} />
    </>
);

const StormOverlay: React.FC = () => (
    <>
        {/* Dense rain — 60 streaks */}
        {[...Array(60)].map((_, i) => {
            const left = (i / 60) * 140 - 20;
            const h = 35 + Math.random() * 50;
            const alpha = 0.25 + Math.random() * 0.3;
            const dur = 0.2 + Math.random() * 0.15;
            const delay = Math.random() * 0.6;
            return (
                <motion.div
                    key={`r-${i}`}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${left}%`, top: '-10%',
                        width: 2.5, height: h,
                        background: `rgba(180,200,230,${alpha})`,
                        transform: 'rotate(14deg)',
                        borderRadius: 3,
                    }}
                    animate={{ y: ['0vh', '120vh'] }}
                    transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay }}
                />
            );
        })}
        {/* Lightning — bright, fast */}
        <motion.div
            className="absolute inset-0 pointer-events-none bg-white"
            animate={{ opacity: [0, 0, 0, 0.85, 0, 0.5, 0, 0, 0, 0, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 pointer-events-none bg-black/20" />
        {/* Violent waves */}
        <OceanWaves layers={4} color="140,170,210" speed={2.5} height="32%" amplitude={30} />
    </>
);

const CalmOverlay: React.FC = () => (
    <>
        {/* Many bright stars */}
        {[...Array(35)].map((_, i) => {
            const size = 2 + Math.random() * 4;
            return (
                <motion.div
                    key={`s-${i}`}
                    className="absolute rounded-full bg-white pointer-events-none"
                    style={{
                        width: size, height: size,
                        left: `${2 + Math.random() * 96}%`,
                        top: `${1 + Math.random() * 45}%`,
                        boxShadow: `0 0 ${3 + size}px ${size * 0.5}px rgba(255,255,255,0.5)`,
                    }}
                    animate={{ opacity: [0.1, 1, 0.1], scale: [0.7, 1.3, 0.7] }}
                    transition={{ duration: 1.2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
                />
            );
        })}
        {/* Warm sky glow */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(255,160,80,0.1) 0%, transparent 55%)' }}
        />
        {/* Water reflections */}
        <WaterSparkles count={18} zone={[55, 88]} />
        <OceanWaves layers={2} color="255,170,110" speed={12} height="18%" amplitude={12} />
    </>
);

const IslandOverlay: React.FC = () => (
    <>
        <SunRays />
        <DriftingClouds count={3} opacity={0.25} />
        <FlyingBirds count={7} color="rgba(170,50,30,0.45)" />
        <OceanWaves layers={3} color="0,170,170" speed={8} height="24%" amplitude={18} />
        <WaterSparkles count={20} zone={[50, 85]} />
    </>
);

// ─── Main Component ──────────────────────────────────────────────────────────

interface AnimatedSceneProps {
    questionIndex: number;
    screenIndex?: number;
}

export const AnimatedScene: React.FC<AnimatedSceneProps> = ({ questionIndex, screenIndex = 0 }) => {
    const phase = getPhase(questionIndex);
    const images = SCENE_ASSETS[phase];
    // Change image every 2 screens within a phase, cycle without immediate repeat
    const imageIndex = Math.floor(screenIndex / 2) % images.length;
    const src = images[imageIndex];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${phase}-${imageIndex}`}
                className="absolute inset-0 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Background with parallax sway */}
                <ParallaxBg src={src} />

                {/* Phase overlays */}
                {phase === 'port' && <PortOverlay />}
                {phase === 'open-sea' && <OpenSeaOverlay />}
                {phase === 'storm' && <StormOverlay />}
                {phase === 'calm' && <CalmOverlay />}
                {phase === 'island' && <IslandOverlay />}

                {/* Vignette */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.3) 100%)' }}
                />
            </motion.div>
        </AnimatePresence>
    );
};
