import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLang, Lang } from '../../../context/LangContext';

interface Props {
    onContinue: () => void;
}

const LANGUAGES: { code: Lang; flag: string; label: string; greeting: string }[] = [
    { code: 'es', flag: '🇪🇸', label: 'Español', greeting: 'Comenzar en español' },
    { code: 'en', flag: '🇬🇧', label: 'English', greeting: 'Start in English' },
    { code: 'pt', flag: '🇧🇷', label: 'Português', greeting: 'Começar em português' },
];

export const LanguageSelect: React.FC<Props> = ({ onContinue }) => {
    const { setLang } = useLang();

    const handleSelect = (code: Lang) => {
        setLang(code);
        onContinue();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="flex flex-col min-h-[80vh] max-w-md mx-auto w-full justify-between py-10 px-2"
        >
            {/* Top: Logo */}
            <div className="flex items-center gap-2">
                <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span>
                    <span style={{ fontWeight: 100 }}> Method</span>
                </span>
                <span
                    style={{
                        background: '#BBBCFF',
                        color: '#1D1D1F',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                    }}
                >
                    beta
                </span>
            </div>

            {/* Center: Prompt — trilingual since no language chosen yet */}
            <div className="flex flex-col gap-5">
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em]">
                    Language / Idioma
                </div>
                <h2
                    className="font-display text-3xl font-light text-[#1D1D1F] leading-tight"
                    style={{ letterSpacing: '-0.02em' }}
                >
                    Choose your language
                </h2>
                <p className="text-base text-[#424245] leading-relaxed">
                    Elige tu idioma · Selecione seu idioma
                </p>
            </div>

            {/* Bottom: Language cards + implicit CTA */}
            <div className="flex flex-col gap-3">
                {LANGUAGES.map((l, i) => (
                    <motion.button
                        key={l.code}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
                        onClick={() => handleSelect(l.code)}
                        whileTap={{ scale: 0.97 }}
                        className="group flex items-center w-full px-5 py-4 rounded-xl border border-[#D2D2D7] bg-white text-left transition-all hover:border-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#EBEBED]"
                    >
                        <span className="text-2xl mr-4">{l.flag}</span>
                        <div className="flex-1 min-w-0">
                            <span className="font-display text-base font-medium text-[#1D1D1F] block">
                                {l.label}
                            </span>
                            <span className="text-xs text-[#86868B]">
                                {l.greeting}
                            </span>
                        </div>
                        <ChevronRight size={16} className="text-[#D2D2D7] group-hover:text-[#1D1D1F] transition-colors flex-shrink-0" />
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};
