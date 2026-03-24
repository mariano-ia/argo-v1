import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: string;
}

export const CollapsibleSection: React.FC<Props> = ({
    title,
    defaultOpen = false,
    children,
    badge,
}) => {
    const [open, setOpen] = React.useState(defaultOpen);

    return (
        <div className="border-b border-argo-border last:border-b-0">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex items-center justify-between py-4 text-left focus:outline-none focus:ring-2 focus:ring-argo-violet-500/30 rounded-xl transition-colors hover:bg-argo-bg/40 px-1 -mx-1"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-argo-navy">{title}</span>
                    {badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-argo-violet-50 text-argo-violet-500">
                            {badge}
                        </span>
                    )}
                </div>
                <motion.svg
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="w-4 h-4 text-argo-grey flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pb-5 pt-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
