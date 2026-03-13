import React from 'react';
import { motion } from 'framer-motion';

/** Scene 4: Calma — Q8-Q10. Sunset, warm colors, gentle waves. */
export const CalmScene: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Sky gradient — sunset */}
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #4A6FA5 0%, #7B8FBF 15%, #C4A882 30%, #E8B87A 42%, #F0A860 50%, #D89050 56%, #6A90AC 62%, #4A78A0 78%, #3A6890 100%)',
            }}
        />

        {/* Setting sun */}
        <motion.div
            className="absolute rounded-full"
            style={{ top: '38%', left: '50%', transform: 'translateX(-50%)', width: 56, height: 56, background: 'radial-gradient(circle, #FFB74D 0%, #FF9800 40%, #F57C00 70%, transparent 100%)', filter: 'blur(3px)' }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sun reflection on water */}
        <motion.div
            className="absolute pointer-events-none"
            style={{ top: '56%', left: '45%', width: '10%', height: '30%', background: 'linear-gradient(180deg, rgba(255,180,80,0.3) 0%, rgba(255,152,0,0.1) 50%, transparent 100%)', filter: 'blur(8px)' }}
            animate={{ scaleX: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Clouds — soft, warm-tinted */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '10%', left: '10%', width: 90, height: 24, background: 'rgba(255,220,180,0.4)', filter: 'blur(12px)' }}
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '6%', left: '70%', width: 70, height: 20, background: 'rgba(255,200,160,0.35)', filter: 'blur(10px)' }}
            animate={{ x: [0, -7, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Early stars */}
        {[
            { top: '5%', left: '80%', delay: 0 },
            { top: '8%', left: '20%', delay: 1.5 },
            { top: '3%', left: '50%', delay: 0.8 },
            { top: '12%', left: '90%', delay: 2.2 },
        ].map((star, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full"
                style={{ top: star.top, left: star.left, width: 3, height: 3, background: 'rgba(255,255,255,0.7)' }}
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: star.delay }}
            />
        ))}

        {/* Wave 1 — gentle */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '58%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,16 C200,8 400,24 600,16 C800,8 1000,24 1200,16 C1400,8 1400,20 1400,16 L1400,300 L0,300 Z" fill="#4A7898" />
            </svg>
        </motion.div>

        {/* Wave 2 */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '63%', bottom: 0 }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,12 C150,5 300,20 450,12 C600,5 750,20 900,12 C1050,5 1200,20 1350,12 L1400,12 L1400,300 L0,300 Z" fill="#3A688A" />
            </svg>
        </motion.div>

        {/* Wave 3 — near */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '68%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="calmFrontWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5A8AAA" stopOpacity="0.7" />
                        <stop offset="15%" stopColor="#2E587A" stopOpacity="1" />
                        <stop offset="100%" stopColor="#1E4868" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path d="M0,10 C80,4 160,16 240,10 C320,4 400,16 480,10 C560,4 640,16 720,10 C800,4 880,16 960,10 C1040,4 1120,16 1200,10 C1280,4 1400,14 1400,10 L1400,300 L0,300 Z" fill="url(#calmFrontWave)" />
            </svg>
        </motion.div>

        {/* Shimmer */}
        <motion.div
            className="absolute pointer-events-none w-[140%]"
            style={{ top: '65%', left: '0%' }}
            animate={{ x: ['0%', '2%', '0%'], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 900 10" className="w-full" style={{ height: 6 }}>
                <path d="M30,4 Q130,1 270,5 Q400,8 530,3 Q660,0 790,4"
                    stroke="rgba(255,200,120,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
    </div>
);
