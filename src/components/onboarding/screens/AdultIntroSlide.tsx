import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Anchor } from 'lucide-react';
import { StorySlideData } from '../../../lib/onboardingData';

const STEP_ICONS = ['🧭', '⚓', '📬'];

interface Props {
    slide: StorySlideData;
    slideIndex: number;
    totalSlides: number;
    onContinue: () => void;
}

export const AdultIntroSlide: React.FC<Props> = ({ slide, slideIndex, totalSlides, onContinue }) => {
    const isLast = slideIndex === totalSlides - 1;

    return (
        <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="flex flex-col min-h-[80vh] max-w-md mx-auto w-full justify-between py-10 px-2"
        >
            {/* Top: step indicator */}
            <div className="flex items-center gap-2">
                {Array.from({ length: totalSlides }, (_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                            i <= slideIndex ? 'bg-argo-indigo' : 'bg-argo-border'
                        }`}
                    />
                ))}
            </div>

            {/* Center: content */}
            <div className="flex flex-col items-center text-center gap-8 py-10">
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.15, stiffness: 300, damping: 20 }}
                    className="w-20 h-20 rounded-2xl bg-argo-navy flex items-center justify-center shadow-lg shadow-argo-navy/20"
                >
                    <span className="text-4xl" role="img" aria-hidden>
                        {STEP_ICONS[slideIndex] ?? <Anchor className="text-white" />}
                    </span>
                </motion.div>

                {/* Text */}
                <div className="space-y-4">
                    <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.25em]">
                        {slideIndex + 1} de {totalSlides}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-argo-navy leading-tight">
                        {slide.title}
                    </h2>
                    <p className="text-base text-argo-grey leading-relaxed">
                        {slide.body}
                    </p>
                </div>
            </div>

            {/* Bottom: CTA */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="w-full bg-argo-navy text-white font-bold py-5 rounded-argo-sm flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg shadow-argo-navy/20"
            >
                {isLast ? 'Comenzar el registro' : 'Siguiente'}
                <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
