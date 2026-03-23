import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    mode: 'idle' | 'sail';
}

// SVG Argo ship — matches the art style from port.png / storm.png
const ShipSVG: React.FC<{ size?: number }> = ({ size = 40 }) => (
    <svg width={size} height={size * 0.85} viewBox="0 0 52 44" fill="none">
        {/* Main sail with sun */}
        <path d="M26 4 L40 28 L26 28 Z" fill="rgba(255,220,150,0.9)" />
        <path d="M26 10 L14 24 L26 24 Z" fill="rgba(255,220,150,0.7)" />
        {/* Sun emblem on sail */}
        <circle cx="31" cy="18" r="3.5" fill="rgba(200,168,112,0.5)" />
        {/* Mast */}
        <line x1="26" y1="3" x2="26" y2="32" stroke="#C8A870" strokeWidth="1.5" strokeLinecap="round" />
        {/* Hull */}
        <path d="M8 28 Q26 38 44 28" stroke="#A07830" strokeWidth="2" fill="#8B6520" fillOpacity="0.85" strokeLinecap="round" />
        {/* Hull decoration */}
        <path d="M12 30 Q26 36 40 30" stroke="#C8A870" strokeWidth="0.5" fill="none" opacity="0.4" />
    </svg>
);

export const ArgoShip: React.FC<Props> = ({ mode }) => {
    if (mode === 'idle') {
        return (
            <motion.div
                className="absolute pointer-events-none"
                style={{ top: '18%', right: '8%', opacity: 0.15 }}
                animate={{
                    y: [0, -3, 0, -2, 0],
                    rotate: [0, 1.5, 0, -1, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <ShipSVG size={32} />
            </motion.div>
        );
    }

    // Sail across mode (completion)
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ top: '30%' }}
            initial={{ x: '110vw', opacity: 0 }}
            animate={{
                x: [null, '-15vw'],
                opacity: [0, 1, 1, 1, 0.6],
                y: [0, -6, 0, -4, 0],
                rotate: [0, 2, 0, -1.5, 0],
            }}
            transition={{
                x: { duration: 4, ease: 'easeInOut' },
                opacity: { duration: 4, times: [0, 0.1, 0.5, 0.8, 1] },
                y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            }}
        >
            <ShipSVG size={72} />
        </motion.div>
    );
};
