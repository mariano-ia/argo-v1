import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OBJECTS = [
    {
        id: 'vellocino',
        emoji: '🌿',
        name: 'Vellocino de Bronce',
        desc: 'El tesoro que guía el viaje',
    },
    {
        id: 'brujula',
        emoji: '🧭',
        name: 'Brújula de Madera',
        desc: 'El rumbo que marca el camino',
    },
    {
        id: 'escudo',
        emoji: '🛡️',
        name: 'Escudo Grabado',
        desc: 'La fuerza que protege la nave',
    },
];

interface Props {
    onComplete: () => void;
}

export const MiniGame1: React.FC<Props> = ({ onComplete }) => {
    const [chosen, setChosen] = useState<string | null>(null);

    const handleChoose = (id: string) => {
        if (chosen) return;
        setChosen(id);
        setTimeout(onComplete, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-8 max-w-md mx-auto py-6"
        >
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em]">
                    El Amuleto de la Suerte
                </div>
                <h2 className="font-display text-2xl font-bold text-argo-navy">
                    Elegí tu objeto de viaje
                </h2>
                <p className="text-sm text-argo-grey">
                    Cada compañero del Argo lleva un amuleto. ¿Cuál es el tuyo?
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full">
                {OBJECTS.map(obj => (
                    <motion.button
                        key={obj.id}
                        onClick={() => handleChoose(obj.id)}
                        whileHover={!chosen ? { scale: 1.05 } : {}}
                        whileTap={!chosen ? { scale: 0.95 } : {}}
                        animate={chosen === obj.id ? { scale: [1, 1.15, 1.1], rotate: [0, -5, 5, 0] } : {}}
                        className={`flex flex-col items-center gap-3 p-5 rounded-argo-lg border-2 transition-all ${
                            chosen === obj.id
                                ? 'border-argo-indigo bg-argo-indigo/10 shadow-lg shadow-argo-indigo/20'
                                : chosen
                                ? 'border-argo-border bg-white opacity-40'
                                : 'border-argo-border bg-white hover:border-argo-indigo'
                        }`}
                    >
                        <span className="text-4xl">{obj.emoji}</span>
                        <span className="text-[10px] font-bold text-argo-navy text-center leading-tight">
                            {obj.name}
                        </span>
                    </motion.button>
                ))}
            </div>

            <AnimatePresence>
                {chosen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-green-50 border border-green-200 rounded-argo-md text-sm text-green-700 font-semibold"
                    >
                        ¡Excelente elección! Este objeto te acompañará en cada remo. ⚓
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
