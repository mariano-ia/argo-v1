import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CREW_NEEDED = 6;
const AUTO_COMPLETE_DELAY = 2000;

// ─── Crew member images (AI-generated in public/scenes/) ─────────────────────

const CREW_IMAGES = [
    '/scenes/crew-1.png',
    '/scenes/crew-2.png',
    '/scenes/crew-3.png',
    '/scenes/crew-4.png',
    '/scenes/crew-5.png',
    '/scenes/crew-6.png',
];

interface CrewMember {
    id: number;
    imageIndex: number;
    x: number;       // horizontal position (% from left)
    y: number;       // vertical position (% from top)
    boarded: boolean;
}

// ─── Generate crew positions on the dock ─────────────────────────────────────

function generateCrew(): CrewMember[] {
    // Place 6 crew members spread across the lower portion of the dock
    const positions = [
        { x: 12, y: 55 },
        { x: 35, y: 50 },
        { x: 58, y: 57 },
        { x: 78, y: 52 },
        { x: 25, y: 65 },
        { x: 65, y: 66 },
    ];

    return positions.map((pos, i) => ({
        id: i,
        imageIndex: i % CREW_IMAGES.length,
        x: pos.x + (Math.random() * 6 - 3), // slight random offset
        y: pos.y + (Math.random() * 4 - 2),
        boarded: false,
    }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MiniGame0: React.FC<Props> = ({ onComplete }) => {
    const [started, setStarted] = useState(false);
    const [crew, setCrew] = useState<CrewMember[]>(() => generateCrew());
    const [boarded, setBoarded] = useState(0);
    const [done, setDone] = useState(false);

    const handleStart = useCallback(() => {
        if (!started) setStarted(true);
    }, [started]);

    const handleCrewTap = useCallback((id: number) => {
        if (done || !started) return;
        setCrew(prev => prev.map(c =>
            c.id === id && !c.boarded ? { ...c, boarded: true } : c
        ));
        setBoarded(b => b + 1);
    }, [done, started]);

    // Auto-complete when all crew boarded
    useEffect(() => {
        if (!started || done) return;
        if (boarded >= CREW_NEEDED) {
            setDone(true);
            setTimeout(onComplete, AUTO_COMPLETE_DELAY);
        }
    }, [boarded, started, done, onComplete]);

    return (
        <div
            className="fixed inset-0 overflow-hidden select-none"
            style={{ zIndex: 50, touchAction: 'none' }}
            onClick={handleStart}
        >
            {/* Background — port dock scene */}
            <img
                src="/scenes/port-dock.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)' }}
            />

            {/* Boarded counter — top right */}
            {started && !done && (
                <div className="absolute top-12 right-6" style={{ zIndex: 10 }}>
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{
                            background: 'rgba(15,23,42,0.6)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="text-white font-quest font-bold text-lg">
                            {boarded}/{CREW_NEEDED}
                        </span>
                    </div>
                </div>
            )}

            {/* Instruction text — top center */}
            {started && !done && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-12 left-0 right-0 flex justify-center"
                    style={{ zIndex: 10 }}
                >
                    <div
                        className="px-5 py-2 rounded-full"
                        style={{
                            background: 'rgba(15,23,42,0.6)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        <span className="text-white font-quest font-bold text-sm tracking-wide">
                            Toca los tripulantes para subirlos al barco
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Crew members — standing on dock */}
            <AnimatePresence>
                {started && crew.filter(c => !c.boarded).map(member => (
                    <motion.div
                        key={member.id}
                        className="absolute cursor-pointer"
                        style={{
                            left: `${member.x}%`,
                            top: `${member.y}%`,
                            zIndex: 5,
                            transform: 'translateX(-50%)',
                        }}
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ scale: 0.3, opacity: 0, y: -100, x: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={e => { e.stopPropagation(); handleCrewTap(member.id); }}
                        onTouchStart={e => { e.stopPropagation(); handleCrewTap(member.id); }}
                        whileTap={{ scale: 1.15 }}
                    >
                        {/* Subtle idle animation — slight bounce */}
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 1.5 + member.id * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <img
                                src={CREW_IMAGES[member.imageIndex]}
                                alt=""
                                className="w-16 h-auto pointer-events-none"
                                draggable={false}
                            />
                        </motion.div>
                        {/* Tap hint glow */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                                transform: 'scale(1.4)',
                            }}
                            animate={{ opacity: [0.6, 0.2, 0.6] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Start overlay */}
            <AnimatePresence>
                {!started && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.25 } }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                        style={{ zIndex: 20 }}
                    >
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
                            <h2 className="font-adventure text-4xl text-white leading-tight text-center">
                                Llama a la tripulacion
                            </h2>
                            <p className="font-quest text-white/80 text-base text-center leading-snug max-w-[240px]">
                                Toca los marineros para subirlos al barco
                            </p>
                            <motion.div
                                className="w-14 h-14 rounded-full border-2 border-white/60 flex items-center justify-center"
                                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.3, 0.7] }}
                                transition={{ duration: 1.1, repeat: Infinity }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </motion.div>
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
                        style={{ zIndex: 20 }}
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
                                <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
                                    stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="5" r="2" />
                                    <line x1="12" y1="7" x2="12" y2="20" />
                                    <path d="M5 12 C5 17 19 17 19 12" />
                                    <line x1="5" y1="12" x2="9" y2="12" />
                                    <line x1="15" y1="12" x2="19" y2="12" />
                                </svg>
                            </motion.div>
                            <span className="font-adventure text-3xl text-white text-center">
                                Tripulacion lista!
                            </span>
                            <span className="font-quest text-white/60 text-sm">
                                {boarded} marineros a bordo
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
