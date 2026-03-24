import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardT } from '../../../lib/dashboardTranslations';
import { useLang } from '../../../context/LangContext';

interface Props {
    label: string;
    percentage: number;
    color: string;
    bgColor: string;
    levelLabel: string;
    description: string;
}

export const IndicatorBar: React.FC<Props> = ({
    label, percentage, color, bgColor, levelLabel, description,
}) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div
            className="rounded-xl p-4 space-y-2 transition-colors"
            style={{ backgroundColor: bgColor }}
        >
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-argo-navy">{label}</span>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: color + '22', color }}
                    >
                        {levelLabel}
                    </span>
                    <span className="text-xs font-bold" style={{ color }}>{percentage}%</span>
                </div>
            </div>

            {/* Bar */}
            <div className="w-full h-3 rounded-full bg-white/60 overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, percentage)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                />
            </div>

            {/* Expand button */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-lg transition-opacity hover:opacity-70"
                style={{ color }}
            >
                <motion.svg
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </motion.svg>
                {expanded ? dt.groupBalance.ocultar : dt.groupBalance.queSignifica}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-argo-navy/70 leading-relaxed pl-3 border-l-2 overflow-hidden"
                        style={{ borderColor: color + '55' }}
                    >
                        {description}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};
