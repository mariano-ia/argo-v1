import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-argo-navy">{label}</span>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: bgColor, color }}
                    >
                        {levelLabel}
                    </span>
                    <span className="text-xs font-bold text-argo-navy">{percentage}%</span>
                </div>
            </div>

            {/* Bar */}
            <div className="w-full h-2 rounded-full bg-argo-neutral overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, percentage)}%`, background: color }}
                />
            </div>

            {/* Expandable description */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] text-argo-grey hover:text-argo-navy transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 rounded-lg"
            >
                <svg
                    className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {expanded ? 'Ocultar detalle' : 'Ver detalle'}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-argo-grey leading-relaxed pl-4 border-l-2 overflow-hidden"
                        style={{ borderColor: bgColor }}
                    >
                        {description}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};
