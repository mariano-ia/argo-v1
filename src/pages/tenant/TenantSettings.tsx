import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

export const TenantSettings: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-[26px] font-bold text-argo-navy tracking-tight mb-1">{dt.settings.titulo}</h1>
            <p className="text-sm text-argo-secondary mb-8">{dt.settings.descripcion}</p>

            <div className="bg-white rounded-[14px] p-6 shadow-argo space-y-6">
                {/* Account info */}
                <div>
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-3">{dt.settings.cuenta}</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-0.5">{dt.settings.nombre}</p>
                            <p className="text-sm text-argo-navy font-medium">{tenant.display_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-0.5">{dt.settings.slug}</p>
                            <p className="text-sm text-argo-navy font-mono">{tenant.slug}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-0.5">{dt.settings.plan}</p>
                            <p className="text-sm text-argo-navy font-medium capitalize">{tenant.plan}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-argo-border" />

                {/* Placeholder for future settings */}
                <div className="text-center py-4">
                    <p className="text-sm text-argo-grey/60">
                        {dt.settings.masOpciones}
                    </p>
                </div>
            </div>
        </div>
    );
};
