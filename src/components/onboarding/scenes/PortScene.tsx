import React from 'react';
import { motion } from 'framer-motion';

/** Scene 1: Puerto — Q1-Q2. Warm sunlight, wooden dock, calm water. */
export const PortScene: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Sky gradient — warm morning */}
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #87CEEB 0%, #B0DAF0 25%, #E8D5A8 48%, #C8B07A 55%, #6AAFC8 60%, #4A90AD 78%, #3A7A96 100%)',
            }}
        />

        {/* Sun */}
        <motion.div
            className="absolute rounded-full"
            style={{ top: '8%', right: '18%', width: 48, height: 48, background: 'radial-gradient(circle, #FFE082 0%, #FFD54F 50%, transparent 70%)', filter: 'blur(2px)' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sun glow */}
        <div
            className="absolute rounded-full"
            style={{ top: '5%', right: '14%', width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,224,130,0.3) 0%, transparent 60%)', filter: 'blur(15px)' }}
        />

        {/* Clouds */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '10%', left: '15%', width: 80, height: 22, background: 'rgba(255,255,255,0.6)', filter: 'blur(10px)' }}
            animate={{ x: [0, 12, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '6%', left: '55%', width: 60, height: 16, background: 'rgba(255,255,255,0.45)', filter: 'blur(8px)' }}
            animate={{ x: [0, -8, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Seagulls */}
        <motion.svg
            className="absolute"
            style={{ top: '15%', left: '30%' }}
            width="20" height="10" viewBox="0 0 20 10"
            animate={{ y: [0, -4, 0], x: [0, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
            <path d="M0,5 Q5,0 10,5 Q15,0 20,5" stroke="rgba(60,60,80,0.5)" strokeWidth="1.2" fill="none" />
        </motion.svg>
        <motion.svg
            className="absolute"
            style={{ top: '12%', left: '42%' }}
            width="14" height="7" viewBox="0 0 20 10"
            animate={{ y: [0, -3, 0], x: [0, -2, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
            <path d="M0,5 Q5,0 10,5 Q15,0 20,5" stroke="rgba(60,60,80,0.4)" strokeWidth="1.5" fill="none" />
        </motion.svg>

        {/* Dock — wooden planks */}
        <svg className="absolute" style={{ bottom: '26%', left: '0', width: '35%', height: '12%' }} viewBox="0 0 200 60" preserveAspectRatio="none">
            <rect x="0" y="10" width="200" height="50" fill="#8B6914" rx="2" />
            <rect x="0" y="10" width="200" height="6" fill="#9B7824" rx="1" />
            <rect x="0" y="22" width="200" height="6" fill="#7A5B0D" rx="1" />
            <rect x="0" y="34" width="200" height="6" fill="#9B7824" rx="1" />
            {/* Dock posts */}
            <rect x="15" y="0" width="8" height="60" fill="#6B4D0A" rx="2" />
            <rect x="80" y="0" width="8" height="60" fill="#6B4D0A" rx="2" />
            <rect x="150" y="0" width="8" height="60" fill="#6B4D0A" rx="2" />
            {/* Rope coils */}
            <circle cx="20" cy="6" r="5" fill="none" stroke="#C8A86E" strokeWidth="2" />
            <circle cx="155" cy="6" r="4" fill="none" stroke="#C8A86E" strokeWidth="1.5" />
        </svg>

        {/* Water — calm waves */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '60%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,20 C175,10 350,28 525,18 C700,8 875,28 1050,18 C1225,8 1400,26 1400,18 L1400,300 L0,300 Z" fill="#5A9AB8" />
            </svg>
        </motion.div>

        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '65%', bottom: 0 }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,14 C140,6 280,22 420,14 C560,6 700,22 840,14 C980,6 1120,22 1260,14 C1400,6 1400,18 1400,14 L1400,300 L0,300 Z" fill="#4A8AA6" />
            </svg>
        </motion.div>

        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '70%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,10 C100,4 200,18 300,10 C400,4 500,18 600,10 C700,4 800,18 900,10 C1000,4 1100,18 1200,10 C1300,4 1400,16 1400,10 L1400,300 L0,300 Z" fill="#3E7A94" />
            </svg>
        </motion.div>

        {/* Shimmer on water */}
        <motion.div
            className="absolute pointer-events-none w-[160%]"
            style={{ top: '66%', left: '-5%' }}
            animate={{ x: ['0%', '2%', '0%'], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 900 10" className="w-full" style={{ height: 6 }}>
                <path d="M20,4 Q120,1 250,5 Q380,8 500,3 Q620,0 740,4 Q860,7 900,3"
                    stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
    </div>
);
