import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    nombreNino: string;
    nombreAdulto: string;
    onContinue: () => void;
}

export const ChildCompletion: React.FC<Props> = ({ nombreNino, nombreAdulto, onContinue }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-8 max-w-md mx-auto py-10"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-7xl"
            >
                🏆
            </motion.div>

            <div className="space-y-3">
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em]">
                    ¡Misión cumplida!
                </div>
                <h2 className="font-display text-3xl font-bold text-argo-navy">
                    ¡Bienvenido a la tripulación, {nombreNino}!
                </h2>
                <p className="text-base text-argo-grey leading-relaxed">
                    Has ayudado a la tripulación a entender mejor cómo fluís en el equipo.
                    Ahora, por favor, <strong className="text-argo-navy">devolvé el dispositivo a {nombreAdulto}</strong>.
                </p>
                <p className="text-sm text-argo-grey/70 italic">
                    ¡Nos vemos en el próximo entrenamiento!
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="w-full bg-argo-navy text-white font-bold py-5 rounded-argo-sm text-sm uppercase tracking-widest shadow-lg"
            >
                {nombreAdulto} ya tiene el dispositivo →
            </motion.button>
        </motion.div>
    );
};
