import React from 'react';
import { motion } from 'framer-motion';

/** Scene 2: Mar Abierto — Q3-Q4. Broad horizon, clear sky, deep blue. */
export const OpenSeaScene: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Sky gradient — clear day at sea */}
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #A8CCE2 0%, #BED8EE 26%, #D4E8F6 40%, #E2C890 52%, #C89860 59%, #78AECA 61%, #5A8EAE 78%, #3E6E8E 100%)',
            }}
        />

        {/* Clouds */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '7%', left: '62%', width: 92, height: 26, background: 'rgba(255,255,255,0.52)', filter: 'blur(13px)' }}
            animate={{ x: [0, 14, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '14%', left: '14%', width: 58, height: 18, background: 'rgba(255,255,255,0.38)', filter: 'blur(10px)' }}
            animate={{ x: [0, -9, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '5%', left: '36%', width: 108, height: 30, background: 'rgba(255,255,255,0.44)', filter: 'blur(15px)' }}
            animate={{ x: [0, 7, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Wave 1 — far */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '57%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,20 C175,8 350,32 525,20 C700,8 875,32 1050,20 C1225,8 1400,32 1400,20 L1400,300 L0,300 Z" fill="#6496B4" />
            </svg>
        </motion.div>

        {/* Wave 2 — mid */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '62%', bottom: 0 }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,16 C116,6 233,26 350,16 C466,6 583,26 700,16 C816,6 933,26 1050,16 C1166,6 1283,26 1400,16 L1400,300 L0,300 Z" fill="#5282A6" />
            </svg>
        </motion.div>

        {/* Wave 3 — near */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '67%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="seaFrontWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86B6D2" stopOpacity="0.7" />
                        <stop offset="12%" stopColor="#40709C" stopOpacity="1" />
                        <stop offset="100%" stopColor="#2E5A7C" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path d="M0,12 C70,4 140,20 210,12 C280,4 350,20 420,12 C490,4 560,20 630,12 C700,4 770,20 840,12 C910,4 980,20 1050,12 C1120,4 1190,20 1260,12 C1330,4 1400,18 1400,12 L1400,300 L0,300 Z" fill="url(#seaFrontWave)" />
            </svg>
        </motion.div>

        {/* Shimmer streaks */}
        <motion.div
            className="absolute pointer-events-none w-[160%]"
            style={{ top: '64%', left: '-5%' }}
            animate={{ x: ['0%', '3%', '0%'], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 900 16" className="w-full" style={{ height: 8 }}>
                <path d="M20,5 Q120,2 250,6 Q380,10 500,4 Q620,0 740,5 Q860,9 900,4"
                    stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M0,11 Q110,8 250,12 Q390,16 510,10 Q650,5 780,11 Q880,15 900,10"
                    stroke="rgba(255,255,255,0.16)" strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
    </div>
);
