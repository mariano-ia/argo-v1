import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    count: number;
    total: number;
}

/** Displays "⚓ N/12" with a +1 pop animation when count increases. */
export const AnchorCounter: React.FC<Props> = ({ count, total }) => {
    const prevCount = useRef(count);
    const [showPlus, setShowPlus] = useState(false);

    useEffect(() => {
        if (count > prevCount.current) {
            setShowPlus(true);
            const t = setTimeout(() => setShowPlus(false), 800);
            prevCount.current = count;
            return () => clearTimeout(t);
        }
        prevCount.current = count;
    }, [count]);

    return (
        <div className="flex items-center gap-1.5 relative">
            <motion.span
                key={count}
                initial={{ scale: 1.5, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                className="text-xl"
            >
                ⚓
            </motion.span>
            <motion.span
                key={`n-${count}`}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="font-quest font-bold text-white/90 text-sm tabular-nums"
            >
                {count}/{total}
            </motion.span>

            {/* Floating +1 */}
            <AnimatePresence>
                {showPlus && (
                    <motion.span
                        initial={{ opacity: 1, y: 0, scale: 0.6 }}
                        animate={{ opacity: 0, y: -28, scale: 1.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="absolute -top-2 left-7 font-quest font-bold text-yellow-300 text-base pointer-events-none"
                    >
                        +1
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
};
