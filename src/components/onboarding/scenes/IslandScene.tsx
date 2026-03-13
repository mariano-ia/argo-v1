import React from 'react';
import { motion } from 'framer-motion';

/** Scene 5: Isla — Q11-Q12. Beach, palm trees, arrival. */
export const IslandScene: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Sky gradient — bright tropical */}
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #5BB5E0 0%, #7EC8E8 20%, #A8DAF0 35%, #D4ECF6 45%, #F0E8C8 52%, #E0D0A0 56%, #60B8D0 60%, #48A8C0 75%, #38929E 100%)',
            }}
        />

        {/* Sun — higher, brighter */}
        <motion.div
            className="absolute rounded-full"
            style={{ top: '6%', left: '75%', width: 42, height: 42, background: 'radial-gradient(circle, #FFF9C4 0%, #FFE082 40%, #FFD54F 70%, transparent 100%)', filter: 'blur(2px)' }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Clouds — light tropical */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '8%', left: '10%', width: 70, height: 20, background: 'rgba(255,255,255,0.55)', filter: 'blur(10px)' }}
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '12%', left: '50%', width: 50, height: 14, background: 'rgba(255,255,255,0.4)', filter: 'blur(8px)' }}
            animate={{ x: [0, -6, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Island silhouette in background */}
        <svg className="absolute" style={{ bottom: '30%', right: '5%', width: '30%', height: '20%' }} viewBox="0 0 200 100" preserveAspectRatio="none">
            <path d="M0,100 Q30,40 60,50 Q90,20 120,35 Q150,15 180,45 Q200,60 200,100 Z" fill="#3A8A6A" opacity="0.6" />
            {/* Palm tree trunks */}
            <path d="M80,50 Q82,30 78,15" stroke="#5A4A20" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M140,35 Q142,18 138,5" stroke="#5A4A20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Palm fronds */}
            <ellipse cx="78" cy="12" rx="18" ry="8" fill="#2E7A4A" opacity="0.8" />
            <ellipse cx="78" cy="15" rx="15" ry="6" fill="#3A8A5A" opacity="0.7" />
            <ellipse cx="138" cy="3" rx="15" ry="6" fill="#2E7A4A" opacity="0.75" />
            <ellipse cx="138" cy="6" rx="12" ry="5" fill="#3A8A5A" opacity="0.65" />
        </svg>

        {/* Beach / sand at bottom */}
        <div
            className="absolute left-0 right-0"
            style={{ bottom: 0, height: '22%', background: 'linear-gradient(180deg, #E8D5A0 0%, #D4C090 40%, #C8B480 100%)', borderTopLeftRadius: '30% 60%', borderTopRightRadius: '40% 50%' }}
        />

        {/* Water — shallow tropical */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '56%', bottom: '20%' }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 200" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,16 C175,6 350,26 525,16 C700,6 875,26 1050,16 C1225,6 1400,22 1400,16 L1400,200 L0,200 Z" fill="#48A8B8" />
            </svg>
        </motion.div>

        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '62%', bottom: '20%' }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 200" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,12 C120,4 240,20 360,12 C480,4 600,20 720,12 C840,4 960,20 1080,12 C1200,4 1320,18 1400,12 L1400,200 L0,200 Z" fill="#3A98A8" />
            </svg>
        </motion.div>

        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '67%', bottom: '18%' }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 200" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,8 C80,2 160,14 240,8 C320,2 400,14 480,8 C560,2 640,14 720,8 C800,2 880,14 960,8 C1040,2 1120,14 1200,8 C1280,2 1400,12 1400,8 L1400,200 L0,200 Z" fill="#2E8898" />
            </svg>
        </motion.div>

        {/* Shimmer on tropical water */}
        <motion.div
            className="absolute pointer-events-none w-[160%]"
            style={{ top: '63%', left: '-5%' }}
            animate={{ x: ['0%', '2%', '0%'], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 900 10" className="w-full" style={{ height: 6 }}>
                <path d="M20,4 Q130,1 270,5 Q400,8 530,3 Q660,0 790,4"
                    stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
    </div>
);
