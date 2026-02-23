import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

interface Props {
    nombreAdulto: string;
    nombreNino: string;
    onContinue: () => void;
}

export const DeviceHandoff: React.FC<Props> = ({ nombreAdulto, nombreNino, onContinue }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-8 max-w-md mx-auto py-8"
        >
            <div className="w-20 h-20 rounded-full bg-argo-indigo/10 flex items-center justify-center">
                <Smartphone size={36} className="text-argo-indigo" />
            </div>

            <div className="space-y-3">
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em]">
                    El Traspaso
                </div>
                <h2 className="font-display text-2xl font-bold text-argo-navy">
                    {nombreAdulto}, es el turno de {nombreNino}
                </h2>
                <p className="text-base text-argo-grey leading-relaxed">
                    El juego consta de <strong className="text-argo-navy">12 decisiones rápidas</strong>.
                    Es importante que las responda <strong className="text-argo-navy">por su cuenta</strong>,
                    sin ayuda, en un ambiente tranquilo.
                </p>
                <p className="text-sm text-argo-grey/70 italic">
                    No hay respuestas correctas ni incorrectas.
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="w-full bg-argo-indigo text-white font-bold py-5 rounded-argo-sm text-sm uppercase tracking-widest shadow-lg shadow-argo-indigo/20"
            >
                Entregar dispositivo a {nombreNino} para comenzar la aventura
            </motion.button>
        </motion.div>
    );
};
