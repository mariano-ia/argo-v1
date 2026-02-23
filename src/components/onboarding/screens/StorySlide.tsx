import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Anchor } from 'lucide-react';
import { StorySlideData } from '../../../lib/onboardingData';

interface Props {
    slide: StorySlideData;
    nombreNino: string;
    deporte: string;
    onContinue: () => void;
    continueLabel?: string;
}

export const StorySlide: React.FC<Props> = ({ slide, nombreNino, deporte, onContinue, continueLabel }) => {
    // Inject dynamic names into body text
    const body = slide.body
        .replace(/\{\{NOMBRE_NIÑO\}\}/g, nombreNino)
        .replace(/\{\{DEPORTE\}\}/g, deporte);

    return (
        <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center space-y-8 max-w-md mx-auto py-6"
        >
            <div className="w-16 h-16 rounded-full bg-argo-navy/10 flex items-center justify-center">
                <Anchor size={28} className="text-argo-navy" />
            </div>

            <div className="space-y-4">
                {slide.title && (
                    <h2 className="font-display text-2xl font-bold text-argo-navy">
                        {slide.title}
                    </h2>
                )}
                <p className="text-base text-argo-grey leading-relaxed">
                    {body}
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className="flex items-center gap-2 bg-argo-navy text-white font-bold px-8 py-4 rounded-argo-sm uppercase tracking-widest text-xs shadow-lg"
            >
                {continueLabel || 'Continuar'} <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
