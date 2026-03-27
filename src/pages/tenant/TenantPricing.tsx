import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../../context/LangContext';

export const TenantPricing: React.FC = () => {
    const { lang } = useLang();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">
                    {lang === 'en' ? 'Plans' : lang === 'pt' ? 'Planos' : 'Planes'}
                </h1>
                <p className="text-[13px] text-argo-grey mt-1">
                    {lang === 'en'
                        ? 'Choose the plan that best fits your team.'
                        : lang === 'pt'
                            ? 'Escolha o plano que melhor se adapta à sua equipe.'
                            : 'Elige el plan que mejor se adapte a tu equipo.'}
                </p>
            </div>

            <div className="bg-white rounded-[14px] shadow-argo px-8 py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-[14px] bg-argo-violet-50 flex items-center justify-center mb-4">
                    <span className="text-2xl">🚀</span>
                </div>
                <p className="text-base font-semibold text-argo-navy mb-2">
                    {lang === 'en' ? 'Coming soon' : lang === 'pt' ? 'Em breve' : 'Próximamente'}
                </p>
                <p className="text-xs text-argo-light leading-relaxed">
                    {lang === 'en'
                        ? 'Paid plans are coming soon. Stay tuned.'
                        : lang === 'pt'
                            ? 'Os planos pagos estão chegando em breve. Fique de olho.'
                            : 'Los planes pagos están llegando pronto. Mantente atento.'}
                </p>
            </div>
        </motion.div>
    );
};
