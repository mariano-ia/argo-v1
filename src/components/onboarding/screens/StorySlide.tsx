import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StorySlideData } from '../../../lib/onboardingData';

interface Props {
    slide: StorySlideData;
    nombreNino: string;
    deporte: string;
    onContinue: () => void;
    continueLabel?: string;
    useOceanBg?: boolean;
}

export const StorySlide: React.FC<Props> = ({
    slide, nombreNino, deporte, onContinue, continueLabel, useOceanBg,
}) => {
    const body = slide.body
        .replace(/\{\{NOMBRE_NIÑO\}\}/g, nombreNino)
        .replace(/\{\{DEPORTE\}\}/g, deporte);

    // ── Ocean background variant ──────────────────────────────────────────────
    if (useOceanBg) {
        return (
            <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full min-h-[78vh] flex flex-col justify-end"
            >
                {/* Floating content card — landing design system */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0, 0, 1] }}
                    className="bg-white/92 backdrop-blur-md rounded-2xl p-7 space-y-4"
                    style={{ border: '1px solid rgba(255,255,255,0.65)' }}
                >
                    {slide.title && (
                        <h2
                            className="text-[#1D1D1F] leading-tight"
                            style={{ fontWeight: 300, fontSize: '22px', letterSpacing: '-0.02em' }}
                        >
                            {slide.title}
                        </h2>
                    )}
                    <p style={{ fontWeight: 400, fontSize: '15px', color: '#424245', lineHeight: 1.7 }}>
                        {body}
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onContinue}
                        className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm mt-1"
                    >
                        {continueLabel || 'Continuar'} <ChevronRight size={16} />
                    </motion.button>
                </motion.div>
            </motion.div>
        );
    }

    // ── Default variant (white, clean) ───────────────────────────────────────
    return (
        <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center space-y-8 max-w-md mx-auto py-6"
        >
            <div className="w-10 h-10 rounded-full bg-argo-navy/8 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-argo-navy/30" />
            </div>

            <div className="space-y-4">
                {slide.title && (
                    <h2
                        className="font-display text-2xl font-light text-[#1D1D1F]"
                        style={{ letterSpacing: '-0.02em' }}
                    >
                        {slide.title}
                    </h2>
                )}
                <p className="text-base text-argo-grey leading-relaxed">{body}</p>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className="flex items-center gap-2 bg-[#1D1D1F] text-white font-medium px-8 py-4 rounded-xl text-sm"
            >
                {continueLabel || 'Continuar'} <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
