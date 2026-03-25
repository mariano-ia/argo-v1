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
    label, percentage, color, bgColor: _, levelLabel, description,
}) => {
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className="space-y-1.5">
            {/* Label + level + percentage */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-argo-navy">{label}</span>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: color + '15', color }}
                    >
                        {levelLabel}
                    </span>
                    <span className="text-[10px] font-bold text-argo-grey">{percentage}%</span>
                </div>
            </div>

            {/* Thin bar */}
            <div className="w-full h-1.5 rounded-full bg-argo-bg overflow-hidden">
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
                className="text-[10px] font-medium text-argo-grey hover:text-argo-navy flex items-center gap-1 transition-colors"
            >
                <motion.svg
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-2.5 h-2.5"
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
                        className="text-xs text-argo-grey leading-relaxed pl-3 border-l-2 border-argo-border overflow-hidden"
                    >
                        {description}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};
