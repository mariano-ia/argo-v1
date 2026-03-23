import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ParticleBurst } from './ParticleBurst';
import { BURST_COLORS_GOLD } from './constants';

interface Props {
    imgSrc: string;
    name: string;
}

// 8 sparkle dots orbiting the discovery item
const OrbitSparkles: React.FC = () => {
    const dots = useRef(
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            angle: (i / 8) * 360,
            size: 2 + Math.random() * 2,
        }))
    ).current;

    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
            {dots.map(d => (
                <motion.div
                    key={`orb-${d.id}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: d.size,
                        height: d.size,
                        background: '#FBBF24',
                        boxShadow: '0 0 6px #F59E0B',
                        left: '50%',
                        top: '50%',
                        transform: `rotate(${d.angle}deg) translateY(-36px)`,
                        marginLeft: -d.size / 2,
                        marginTop: -d.size / 2,
                    }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d.id * 0.15, ease: 'easeInOut' }}
                />
            ))}
        </motion.div>
    );
};

// Light rays from the item
const LightRays: React.FC = () => (
    <>
        {[0, 45, 90, 135].map(angle => (
            <motion.div
                key={`ray-${angle}`}
                className="absolute pointer-events-none"
                style={{
                    left: '50%',
                    top: '50%',
                    width: 1.5,
                    height: 40,
                    background: 'linear-gradient(180deg, rgba(251,191,36,0.6) 0%, transparent 100%)',
                    transformOrigin: 'top center',
                    transform: `rotate(${angle}deg)`,
                    marginLeft: -0.75,
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 0.7, 0.3, 0.7, 0], scaleY: [0, 1, 0.8, 1, 0.5] }}
                transition={{ duration: 1.3, ease: 'easeInOut' }}
            />
        ))}
    </>
);

export const DiscoveryReveal: React.FC<Props> = ({ imgSrc, name }) => (
    <motion.div
        className="absolute flex flex-col items-center"
        style={{
            left: '50%',
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
        }}
        initial={{ scale: 0, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0, y: -30 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
        {/* Radial glow */}
        <motion.div
            className="absolute pointer-events-none"
            style={{
                width: 140,
                height: 140,
                left: '50%',
                top: '50%',
                marginLeft: -70,
                marginTop: -70,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.1) 40%, transparent 70%)',
            }}
            animate={{ scale: [0.8, 1.15, 0.9], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Light rays */}
        <LightRays />

        {/* Particle burst on appear */}
        <ParticleBurst count={10} colors={BURST_COLORS_GOLD} radius={55} duration={0.8} />

        {/* Orbiting sparkles */}
        <div className="relative" style={{ width: 80, height: 80 }}>
            <OrbitSparkles />

            {/* Discovery item image — floats and has subtle spin */}
            <motion.img
                src={imgSrc}
                alt=""
                className="w-20 h-20 object-contain"
                draggable={false}
                initial={{ rotate: -8, y: 10 }}
                animate={{
                    rotate: [0, 3, -3, 0],
                    y: [0, -5, 0],
                }}
                transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                    y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                }}
            />
        </div>

        {/* Name label */}
        <motion.div
            className="mt-2 px-4 py-1.5 rounded-full"
            style={{
                background: 'rgba(15,23,42,0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
            <span className="font-quest text-white text-xs font-medium whitespace-nowrap">
                {name}
            </span>
        </motion.div>
    </motion.div>
);
