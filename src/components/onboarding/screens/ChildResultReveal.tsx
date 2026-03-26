import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Lottie from 'lottie-react';

// ─── Props ──────────────────────────────────────────────────────────────────────

interface Props {
    nombreNino: string;
    arquetipoLabel: string;
    adultEmail: string;
    resultText: string;
    lang?: string;
}

const REVEAL_STRINGS = {
    es: { title: 'Misión cumplida, navegante', sentTo: 'Informe enviado a:' },
    en: { title: 'Mission accomplished, navigator', sentTo: 'Report sent to:' },
    pt: { title: 'Missão cumprida, navegante', sentTo: 'Relatório enviado para:' },
};

// ─── Confetti Lottie ────────────────────────────────────────────────────────────

const LottieConfetti: React.FC = () => {
    const [data, setData] = useState<object | null>(null);

    useEffect(() => {
        fetch('/lottie/confetti.json')
            .then(r => r.json())
            .then(setData)
            .catch(() => {});
    }, []);

    if (!data) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
            <Lottie animationData={data} loop={false} autoplay style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

// ─── Animated scene elements (island phase from AnimatedScene.tsx) ───────────────

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

const OceanWaves: React.FC = () => (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '24%' }}>
        {[0, 1, 2].map(i => {
            const alpha = 0.18 + i * 0.08;
            const yOff = i * 18;
            const dur = Math.max(8 - i * 1.2, 2.5);
            const bobAmount = 18 * 0.4 + i * 3;
            return (
                <motion.svg
                    key={i}
                    className="absolute w-full"
                    style={{ bottom: yOff }}
                    height={56}
                    viewBox="0 0 600 56"
                    preserveAspectRatio="none"
                    animate={{ y: [0, -bobAmount, 0, bobAmount * 0.6, 0] }}
                    transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <path
                        d={`M0,18 ${Array.from({ length: 13 }, (_, j) =>
                            `Q${j * 50 + 25},${j % 2 === 0 ? 2 : 34} ${(j + 1) * 50},18`
                        ).join(' ')} L600,56 L0,56 Z`}
                        fill={`rgba(0,170,170,${alpha})`}
                    />
                </motion.svg>
            );
        })}
    </div>
);

const WaterSparkles: React.FC = () => (
    <>
        {[...Array(20)].map((_, i) => {
            const left = 2 + Math.random() * 96;
            const top = 50 + Math.random() * 35;
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


// ─── Main Component ─────────────────────────────────────────────────────────────

export const ChildResultReveal: React.FC<Props> = ({
    nombreNino, arquetipoLabel: _arquetipoLabel, adultEmail, resultText, lang = 'es',
}) => {
    const strings = REVEAL_STRINGS[lang as keyof typeof REVEAL_STRINGS] ?? REVEAL_STRINGS.es;
    const fullText = resultText.replace(/\{\{NOMBRE\}\}/g, nombreNino);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShowContent(true), 1200);
        return () => clearTimeout(t);
    }, []);

    // Birds (stable positions)
    const birds = [
        { size: 28, top: 5, dur: 14, delay: 1, color: 'rgba(170,50,30,0.45)', reverse: false },
        { size: 22, top: 10, dur: 18, delay: 3, color: 'rgba(170,50,30,0.45)', reverse: true },
        { size: 32, top: 3, dur: 12, delay: 5, color: 'rgba(170,50,30,0.45)', reverse: false },
        { size: 20, top: 15, dur: 16, delay: 7, color: 'rgba(170,50,30,0.45)', reverse: false },
        { size: 25, top: 8, dur: 20, delay: 2, color: 'rgba(170,50,30,0.45)', reverse: true },
    ];

    // Clouds (stable positions)
    const clouds = [
        { y: 2, scale: 0.6, dur: 35, delay: 0, opacity: 0.25 },
        { y: 10, scale: 0.8, dur: 42, delay: 8, opacity: 0.22 },
        { y: 6, scale: 0.5, dur: 38, delay: 15, opacity: 0.19 },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden bg-black">
            {/* Island background with parallax */}
            <motion.div
                className="absolute inset-0"
                animate={{ scale: [1.02, 1.06, 1.02] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            >
                <img
                    src="/scenes/island.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />
            </motion.div>

            {/* Animated overlays — island phase */}
            <SunRays />
            {clouds.map((c, i) => <CloudShape key={`c-${i}`} {...c} />)}
            {birds.map((b, i) => <Bird key={`b-${i}`} {...b} />)}
            <OceanWaves />
            <WaterSparkles />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.3) 100%)' }}
            />

            {/* Confetti */}
            <LottieConfetti />


            {/* Content overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 flex flex-col"
                style={{ zIndex: 10 }}
            >
                {/* Gradient overlay — stronger at bottom for text readability */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(34,25,16,0.6) 50%, rgba(34,25,16,0.92) 70%, rgba(34,25,16,0.98) 100%)',
                    }}
                />

                {/* Spacer — scene + crew visible above */}
                <div className="flex-1" />

                {/* Bottom content — left-aligned, StorySlideV2 pattern */}
                <div className="relative px-6 pb-6 flex flex-col gap-4" style={{ zIndex: 2 }}>

                    {/* Title — same style as StorySlideV2 titles */}
                    <motion.h1
                        initial={{ opacity: 0, y: -12 }}
                        animate={showContent ? { opacity: 1, y: 0 } : {}}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        className="font-adventure text-white text-3xl font-light leading-tight tracking-normal"
                    >
                        {strings.title}
                    </motion.h1>

                    {/* Body text — fade-in, left-aligned, respects line breaks */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={showContent ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full"
                    >
                        {fullText.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                            <p key={i} className={`font-quest text-white text-base sm:text-lg font-medium leading-relaxed text-left ${i > 0 ? 'mt-3' : ''}`}>
                                {paragraph}
                            </p>
                        ))}
                    </motion.div>

                    {/* Email notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={showContent ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        <Mail size={16} className="text-white/60 shrink-0" />
                        <p className="font-quest text-white/70 text-sm leading-snug">
                            {strings.sentTo}{' '}
                            <span className="text-white/90 font-semibold">{adultEmail}</span>
                        </p>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
};
