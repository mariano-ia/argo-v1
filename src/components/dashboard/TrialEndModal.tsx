import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from '../ui';

interface Props {
    open: boolean;
    lang: string;
    rosterCount: number;
    onUpgrade: () => void;
    onClose: () => void;
}

const COPY = {
    es: {
        badge: 'Periodo de prueba finalizado',
        title: 'Tu prueba de Argo terminó',
        body: 'Tus jugadores y reportes siguen aquí. Para sumar nuevos jugadores y usar todas las funciones, elige un plan.',
        keepTitle: 'Lo que conservas',
        keep: 'Todos los perfiles y reportes que ya generaste.',
        unlockTitle: 'Lo que activas con un plan',
        unlock: 'Más jugadores en tu equipo, consultor IA y todas las funciones.',
        cta: 'Ver planes',
        later: 'Quizás más tarde',
    },
    en: {
        badge: 'Trial period ended',
        title: 'Your Argo trial has ended',
        body: 'Your players and reports are still here. To add new players and use every feature, choose a plan.',
        keepTitle: 'What you keep',
        keep: 'Every profile and report you already generated.',
        unlockTitle: 'What a plan unlocks',
        unlock: 'More players on your team, the AI consultant and every feature.',
        cta: 'See plans',
        later: 'Maybe later',
    },
    pt: {
        badge: 'Período de teste finalizado',
        title: 'Seu teste do Argo terminou',
        body: 'Seus jogadores e relatórios continuam aqui. Para adicionar novos jogadores e usar todas as funções, escolha um plano.',
        keepTitle: 'O que você mantém',
        keep: 'Todos os perfis e relatórios que você já gerou.',
        unlockTitle: 'O que um plano ativa',
        unlock: 'Mais jogadores no seu time, consultor de IA e todas as funções.',
        cta: 'Ver planos',
        later: 'Talvez mais tarde',
    },
};

export const TrialEndModal: React.FC<Props> = ({ open, lang, onUpgrade, onClose }) => {
    const c = COPY[lang as keyof typeof COPY] ?? COPY.es;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        className="relative z-10 w-full max-w-md bg-white rounded-[20px] shadow-lg overflow-hidden"
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    >
                        <button
                            onClick={onClose}
                            aria-label="close"
                            className="absolute top-4 right-4 text-argo-light hover:text-argo-grey transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="px-7 pt-8 pb-7">
                            <div className="w-11 h-11 rounded-full bg-argo-violet-50 text-argo-violet-500 flex items-center justify-center mb-4">
                                <Sparkles size={20} />
                            </div>

                            <p className="text-[11px] font-bold text-argo-violet-500 uppercase tracking-widest mb-1.5">
                                {c.badge}
                            </p>
                            <h2 className="text-2xl font-bold text-argo-navy tracking-tight">{c.title}</h2>
                            <p className="text-sm text-argo-grey mt-2 leading-relaxed">{c.body}</p>

                            <div className="mt-5 space-y-3">
                                <div className="rounded-xl border border-argo-border bg-argo-neutral px-4 py-3">
                                    <p className="text-[11px] font-bold text-argo-secondary uppercase tracking-wide">{c.keepTitle}</p>
                                    <p className="text-[13px] text-argo-grey mt-0.5 leading-relaxed">{c.keep}</p>
                                </div>
                                <div className="rounded-xl border border-argo-violet-100 bg-argo-violet-50 px-4 py-3">
                                    <p className="text-[11px] font-bold text-argo-violet-500 uppercase tracking-wide">{c.unlockTitle}</p>
                                    <p className="text-[13px] text-argo-violet-400 mt-0.5 leading-relaxed">{c.unlock}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2.5">
                                <Button variant="violet" size="lg" className="w-full" onClick={onUpgrade}>
                                    {c.cta}
                                </Button>
                                <button
                                    onClick={onClose}
                                    className="w-full text-center text-[13px] text-argo-grey hover:text-argo-navy transition-colors py-1"
                                >
                                    {c.later}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
