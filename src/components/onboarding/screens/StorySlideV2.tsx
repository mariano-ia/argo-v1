import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StorySlideData } from '../../../lib/onboardingData';

interface Props {
    slide: StorySlideData;
    nombreNino: string;
    deporte: string;
    onContinue: () => void;
    continueLabel?: string;
}

// ─── Typewriter hook ─────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 30): { displayed: string; done: boolean } {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [text]);

    useEffect(() => {
        if (index >= text.length) return;
        const t = setTimeout(() => setIndex(i => i + 1), speed);
        return () => clearTimeout(t);
    }, [index, text, speed]);

    return { displayed: text.slice(0, index), done: index >= text.length };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const StorySlideV2: React.FC<Props> = ({
    slide, nombreNino, deporte, onContinue, continueLabel,
}) => {
    const body = slide.body
        .replace(/\{\{NOMBRE_NIÑO\}\}/g, nombreNino)
        .replace(/\{\{DEPORTE\}\}/g, deporte);

    const { displayed, done } = useTypewriter(body, 28);

    return (
        <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex flex-col justify-end"
            style={{ zIndex: 2 }}
        >
            {/* ── Content panel (bottom) ── */}
            <div
                className="relative px-6 pb-8 pt-10"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                }}
            >
                <div className="max-w-lg mx-auto space-y-5">
                    {/* Title */}
                    {slide.title && (
                        <motion.h2
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
                            className="font-adventure text-3xl text-white text-adventure leading-tight"
                        >
                            {slide.title}
                        </motion.h2>
                    )}

                    {/* Body — typewriter */}
                    <p className="font-quest font-medium text-lg text-white/90 leading-relaxed min-h-[4.5em]">
                        {displayed}
                        {!done && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="inline-block ml-0.5 w-0.5 h-5 bg-white/70 align-middle"
                            />
                        )}
                    </p>

                    {/* Continue button — appears when typewriter finishes */}
                    <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        onClick={onContinue}
                        disabled={!done}
                        whileTap={done ? { y: 3 } : {}}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-quest font-bold text-base text-white cursor-pointer"
                        style={{
                            background: '#4EA8DE',
                            boxShadow: '0 4px 0 #3478A6',
                        }}
                    >
                        {continueLabel || 'Continuar'} <ChevronRight size={18} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
