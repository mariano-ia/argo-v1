import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StorySlideData } from '../../../lib/onboardingData';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';

interface Props {
    slide: StorySlideData;
    slideIndex: number;
    totalSlides: number;
    onContinue: () => void;
}

export const AdultIntroSlide: React.FC<Props> = ({ slide, slideIndex, totalSlides, onContinue }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);
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
            {/* Progress bar */}
            <div className="flex items-center gap-2">
                {Array.from({ length: totalSlides }, (_, i) => (
                    <div
                        key={i}
                        className={`h-0.5 rounded-full flex-1 transition-all duration-500 ${
                            i <= slideIndex ? 'bg-[#1D1D1F]' : 'bg-[#D2D2D7]'
                        }`}
                    />
                ))}
            </div>

            {/* Content — left aligned */}
            <div className="flex flex-col gap-5">
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em]">
                    {slideIndex + 1} / {totalSlides}
                </div>
                <h2
                    className="font-display text-3xl font-light text-[#1D1D1F] leading-tight"
                    style={{ letterSpacing: '-0.02em' }}
                >
                    {slide.title}
                </h2>
                <p className="text-base text-[#424245] leading-relaxed">
                    {slide.body}
                </p>
            </div>

            {/* CTA */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
                {isLast ? ot.startRegistration : ot.next}
                <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
