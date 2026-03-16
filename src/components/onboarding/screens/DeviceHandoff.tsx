import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';

interface Props {
    nombreAdulto: string;
    nombreNino: string;
    onContinue: () => void;
}

export const DeviceHandoff: React.FC<Props> = ({ nombreAdulto, nombreNino, onContinue }) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col min-h-[80vh] max-w-md mx-auto w-full justify-between py-10 px-2"
        >
            <div />

            {/* Content — left aligned */}
            <div className="flex flex-col gap-5">
                <div className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em]">
                    {ot.handoffLabel}
                </div>
                <h2
                    className="font-display text-3xl font-light text-[#1D1D1F] leading-tight"
                    style={{ letterSpacing: '-0.02em' }}
                >
                    {ot.handoffTitle(nombreAdulto, nombreNino)}
                </h2>
                <p className="text-base text-[#424245] leading-relaxed">
                    {ot.handoffBody}
                </p>
                <p className="text-sm text-[#86868B] italic">
                    {ot.handoffNote}
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
                {ot.handoffCta(nombreNino)} <ChevronRight size={16} />
            </motion.button>
        </motion.div>
    );
};
