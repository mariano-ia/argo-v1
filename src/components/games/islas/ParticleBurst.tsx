import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { BURST_COLORS_GOLD } from './constants';

interface Props {
    count?: number;
    colors?: string[];
    radius?: number;
    duration?: number;
    gravity?: boolean;
    sizeRange?: [number, number];
}

export const ParticleBurst: React.FC<Props> = ({
    count = 12,
    colors = BURST_COLORS_GOLD,
    radius = 50,
    duration = 0.7,
    gravity = false,
    sizeRange = [3, 6],
}) => {
    const particles = useRef(
        Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const dist = radius * (0.6 + Math.random() * 0.4);
            const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            return {
                id: i,
                tx: Math.cos(angle) * dist,
                ty: Math.sin(angle) * dist + (gravity ? dist * 0.6 : 0),
                size,
                color: colors[i % colors.length],
                delay: Math.random() * 0.08,
            };
        })
    ).current;

    return (
        <>
            {particles.map(p => (
                <motion.div
                    key={`bp-${p.id}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        left: '50%',
                        top: '50%',
                        marginLeft: -p.size / 2,
                        marginTop: -p.size / 2,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0.2 }}
                    transition={{ duration, ease: 'easeOut', delay: p.delay }}
                />
            ))}
        </>
    );
};
