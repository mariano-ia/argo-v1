import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface Props {
    nombreNino: string;
    nombreAdulto: string;
    onContinue: () => void;
}

// ─── Confetti burst ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7',
    '#DDA0DD', '#FF9F43', '#74B9FF', '#A29BFE',
    '#FD79A8', '#55EFC4', '#FDCB6E', '#6C5CE7',
];

const Confetti: React.FC = () => {
    const pieces = useMemo(() =>
        Array.from({ length: 48 }, (_, i) => ({
            id: i,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            width:  6 + Math.random() * 8,
            height: 3 + Math.random() * 5,
            angle:  (i / 48) * 360 + (Math.random() - 0.5) * 25,
            distance: 90 + Math.random() * 200,
            delay:  Math.random() * 0.3,
            spin:   360 + Math.random() * 360,
            speed:  0.9 + Math.random() * 0.5,
        })),
    []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center" style={{ zIndex: 60 }}>
            {pieces.map(p => {
                const rad = (p.angle * Math.PI) / 180;
                const ex = Math.cos(rad) * p.distance;
                const ey = Math.sin(rad) * p.distance;
                return (
                    <motion.div
                        key={p.id}
                        className="absolute"
                        style={{
                            width: p.width,
                            height: p.height,
                            backgroundColor: p.color,
                            borderRadius: '2px',
                            top: '48%',
                            left: '50%',
                        }}
                        initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
                        animate={{
                            x: [0, ex * 0.5, ex],
                            y: [0, ey * 0.5 - 40, ey + 320],
                            opacity: [0, 1, 1, 0],
                            rotate: [0, p.spin],
                            scale:  [0, 1, 0.9],
                        }}
                        transition={{
                            duration: 1.6 * p.speed,
                            delay: p.delay,
                            ease: 'easeOut',
                        }}
                    />
                );
            })}
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChildCompletion: React.FC<Props> = ({ nombreNino, nombreAdulto, onContinue }) => {
    return (
        <>
            <Confetti />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col justify-end min-h-[78vh]"
            >
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0, 0, 1] }}
                    className="bg-white/92 backdrop-blur-md rounded-2xl p-7 space-y-5"
                    style={{ border: '1px solid rgba(255,255,255,0.65)' }}
                >
                    <div className="space-y-1">
                        <div className="text-[10px] font-medium text-[#0071E3] uppercase tracking-[0.2em]">
                            Mision cumplida
                        </div>
                        <h2 className="text-[#1D1D1F] leading-tight"
                            style={{ fontWeight: 300, fontSize: '26px', letterSpacing: '-0.02em' }}>
                            Bienvenido a la tripulacion, {nombreNino}
                        </h2>
                    </div>
                    <p style={{ fontWeight: 400, fontSize: '15px', color: '#424245', lineHeight: 1.7 }}>
                        Tomaste las 12 decisiones. Ahora el Argo conoce tu lugar en la tripulacion.
                        Por favor, <strong style={{ color: '#1D1D1F' }}>devolvé el dispositivo a {nombreAdulto}</strong>.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onContinue}
                        className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                    >
                        {nombreAdulto} ya tiene el dispositivo <ChevronRight size={16} />
                    </motion.button>
                </motion.div>
            </motion.div>
        </>
    );
};
