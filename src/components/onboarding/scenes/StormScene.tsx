import React from 'react';
import { motion } from 'framer-motion';

/** Scene 3: Tormenta — Q5-Q7. Dark sky, rough waves, rain, lightning flashes. */
export const StormScene: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Sky gradient — stormy dark */}
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #1A2A3A 0%, #2C3E50 15%, #3D4F5F 30%, #4A5B6A 45%, #4A6B7A 55%, #3A5A6A 65%, #2A4A5A 80%, #1A3A4A 100%)',
            }}
        />

        {/* Lightning flash — full screen white pulse */}
        <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            animate={{ opacity: [0, 0, 0, 0, 1, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.2, 0, 0, 0, 0, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* Second flash — offset timing for variety */}
        <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(200,220,255,0.1)' }}
            animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />

        {/* Storm clouds — heavier, darker */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '0%', left: '-5%', width: '60%', height: 60, background: 'rgba(30,40,50,0.8)', filter: 'blur(25px)' }}
            animate={{ x: [0, 15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '5%', left: '30%', width: '70%', height: 65, background: 'rgba(40,50,60,0.7)', filter: 'blur(28px)' }}
            animate={{ x: [0, -10, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '-2%', left: '55%', width: '50%', height: 50, background: 'rgba(25,35,45,0.75)', filter: 'blur(22px)' }}
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Rain — diagonal streaks, more organic */}
        {[...Array(30)].map((_, i) => {
            const left = (i / 30) * 120 - 10; // spread wider than viewport
            const height = 20 + Math.random() * 30;
            const opacity = 0.15 + Math.random() * 0.2;
            const duration = 0.4 + Math.random() * 0.3;
            const delay = Math.random() * 1.5;
            return (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${left}%`,
                        top: '-10%',
                        width: 1.5,
                        height: `${height}px`,
                        background: `rgba(180,200,220,${opacity})`,
                        borderRadius: '1px',
                        transform: 'rotate(12deg)',
                    }}
                    animate={{ y: ['0vh', '110vh'] }}
                    transition={{
                        duration,
                        repeat: Infinity,
                        ease: 'linear',
                        delay,
                    }}
                />
            );
        })}

        {/* Wave 1 — rough, higher amplitude */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '52%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,30 C120,0 240,50 360,25 C480,0 600,50 720,25 C840,0 960,50 1080,25 C1200,0 1320,45 1400,25 L1400,300 L0,300 Z" fill="#3A5A6A" />
            </svg>
        </motion.div>

        {/* Wave 2 — agitated */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '58%', bottom: 0 }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,22 C90,4 180,36 270,18 C360,0 450,36 540,18 C630,0 720,36 810,18 C900,0 990,36 1080,18 C1170,0 1260,36 1350,18 L1400,18 L1400,300 L0,300 Z" fill="#2E4A5C" />
            </svg>
        </motion.div>

        {/* Wave 3 — fast, dark */}
        <motion.div
            className="absolute left-0 w-[200%]"
            style={{ top: '64%', bottom: 0 }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
        >
            <svg viewBox="0 0 1400 300" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,16 C60,2 120,28 180,14 C240,2 300,28 360,14 C420,2 480,28 540,14 C600,2 660,28 720,14 C780,2 840,28 900,14 C960,2 1020,28 1080,14 C1140,2 1200,28 1260,14 C1320,2 1400,22 1400,14 L1400,300 L0,300 Z" fill="#1E3A4C" />
            </svg>
        </motion.div>

        {/* Spray / foam */}
        <motion.div
            className="absolute pointer-events-none w-[150%]"
            style={{ top: '60%', left: '0%' }}
            animate={{ x: ['0%', '3%', '0%'], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 900 10" className="w-full" style={{ height: 8 }}>
                <path d="M50,5 Q150,0 280,6 Q400,10 520,3 Q650,0 780,5" stroke="rgba(200,220,240,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
        </motion.div>
    </div>
);
