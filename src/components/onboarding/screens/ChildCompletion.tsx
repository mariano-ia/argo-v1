import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Lottie from 'lottie-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';

interface Props {
    nombreNino: string;
    nombreAdulto: string;
    onContinue: () => void;
}

// ─── Lottie confetti (lazy loaded from public/) ──────────────────────────────

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
            <Lottie
                animationData={data}
                loop={false}
                autoplay
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

// ─── Lottie success checkmark ────────────────────────────────────────────────

const LottieSuccess: React.FC = () => {
    const [data, setData] = useState<object | null>(null);

    useEffect(() => {
        fetch('/lottie/success.json')
            .then(r => r.json())
            .then(setData)
            .catch(() => {});
    }, []);

    if (!data) return null;

    return (
        <Lottie
            animationData={data}
            loop={false}
            autoplay
            style={{ width: 64, height: 64 }}
        />
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChildCompletion: React.FC<Props> = ({ nombreNino, nombreAdulto, onContinue }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    return (
        <>
            <LottieConfetti />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 flex flex-col"
                style={{ zIndex: 2 }}
            >
                {/* Gradient overlay — matches story slides */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1, background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(34,25,16,0.85) 100%)' }}
                />

                {/* Spacer — scene visible above */}
                <div className="flex-1" />

                {/* Bottom content — matches StorySlideV2 glass card pattern */}
                <div className="relative px-6 pb-8 flex flex-col items-center gap-5" style={{ zIndex: 2 }}>
                    {/* Success animation — animated entrance */}
                    <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.2 }}
                    >
                        <LottieSuccess />
                    </motion.div>

                    {/* Title card — glass card matching story slides */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.3 }}
                        className="w-full rounded-xl p-6 shadow-2xl"
                        style={{
                            background: 'rgba(244,140,37,0.15)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(244,140,37,0.2)',
                        }}
                    >
                        <h1 className="font-adventure text-white text-3xl font-extrabold leading-tight tracking-normal text-center">
                            {ot.missionComplete}
                        </h1>
                    </motion.div>

                    {/* Body text */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="px-2 space-y-3"
                    >
                        <p className="font-quest text-white text-lg font-medium leading-relaxed text-center">
                            {ot.completionBody(nombreNino)}
                        </p>
                        <p className="font-quest text-white/70 text-base leading-relaxed text-center">
                            {ot.returnDevice(nombreAdulto)}
                        </p>
                    </motion.div>

                    {/* Continue button — matches story slide CTA */}
                    <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 22 }}
                        onClick={onContinue}
                        whileTap={{ scale: 0.95 }}
                        className="w-full flex items-center justify-center gap-3 h-14 rounded-xl font-quest text-white text-lg font-bold tracking-wide cursor-pointer"
                        style={{
                            background: 'rgba(244,140,37,0.15)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(244,140,37,0.2)',
                        }}
                    >
                        {ot.hasDevice(nombreAdulto)}
                        <ChevronRight size={20} style={{ color: '#F48C25' }} />
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};
