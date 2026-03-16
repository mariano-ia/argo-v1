import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StorySlideData } from '../../../lib/onboardingData';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';

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

    useEffect(() => { setIndex(0); }, [text]);

    useEffect(() => {
        if (index >= text.length) return;
        const t = setTimeout(() => setIndex(i => i + 1), speed);
        return () => clearTimeout(t);
    }, [index, text, speed]);

    return { displayed: text.slice(0, index), done: index >= text.length };
}

// ─── Component (Stitch "Golden Fleece" pattern) ──────────────────────────────

export const StorySlideV2: React.FC<Props> = ({
    slide, nombreNino, deporte, onContinue, continueLabel,
}) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);
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
            className="fixed inset-0 flex flex-col"
            style={{ zIndex: 2 }}
        >
            {/* Stitch gradient overlay — from transparent to dark at bottom */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1, background: 'linear-gradient(to bottom, transparent 0%, rgba(34,25,16,0.4) 40%, rgba(34,25,16,0.6) 60%, rgba(34,25,16,0.9) 100%)' }}
            />

            {/* Spacer — scene visible */}
            <div className="flex-1" />

            {/* Bottom content — Stitch pattern */}
            <div className="relative px-6 pb-8 flex flex-col gap-5" style={{ zIndex: 2 }}>
                {/* Title — no background card */}
                {slide.title && (
                    <motion.h1
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
                        className="font-adventure text-white text-3xl font-light leading-tight tracking-normal px-2"
                    >
                        {slide.title}
                    </motion.h1>
                )}

                {/* Body text — Stitch: white, lg, medium, leading-relaxed, italic feel */}
                <div className="px-2">
                    <p
                        className="font-quest text-white text-lg font-medium leading-relaxed text-left min-h-[4em]"
                    >
                        {displayed}
                        {!done && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="inline-block ml-0.5 w-0.5 h-5 bg-white/70 align-middle"
                            />
                        )}
                    </p>
                </div>

                {/* Continue button — Stitch glass-card style button */}
                <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    onClick={onContinue}
                    disabled={!done}
                    whileTap={done ? { scale: 0.95 } : {}}
                    className="w-full flex items-center justify-center gap-3 h-14 rounded-xl font-quest text-white text-lg font-bold tracking-wide cursor-pointer"
                    style={{
                        background: 'rgba(244,140,37,0.15)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(244,140,37,0.2)',
                    }}
                >
                    {continueLabel || ot.continueDefault}
                    <ChevronRight size={20} style={{ color: '#F48C25' }} />
                </motion.button>
            </div>
        </motion.div>
    );
};
