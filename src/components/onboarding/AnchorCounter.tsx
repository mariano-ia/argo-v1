import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    count: number;
    total: number;
}

/** Displays "⚓ × N/12" with a +1 pop animation when count increases. */
export const AnchorCounter: React.FC<Props> = ({ count, total }) => {
    const prevCount = useRef(count);
    const [showPlus, setShowPlus] = useState(false);

    useEffect(() => {
        if (count > prevCount.current) {
            setShowPlus(true);
            const t = setTimeout(() => setShowPlus(false), 700);
            prevCount.current = count;
            return () => clearTimeout(t);
        }
        prevCount.current = count;
    }, [count]);

    return (
        <div className="flex items-center gap-1.5 relative">
            <motion.span
                key={count}
                initial={{ scale: 1.4, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="text-lg"
            >
                ⚓
            </motion.span>
            <span className="text-white/80 text-sm font-semibold tabular-nums">
                {count}/{total}
            </span>

            {/* Floating +1 */}
            <AnimatePresence>
                {showPlus && (
                    <motion.span
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -24, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute -top-1 left-6 text-yellow-300 font-bold text-sm pointer-events-none"
                    >
                        +1
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
};
