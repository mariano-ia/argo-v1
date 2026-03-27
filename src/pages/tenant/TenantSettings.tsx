import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import type { Lang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';

const LANG_OPTIONS: { value: Lang; label: string; native: string }[] = [
    { value: 'es', label: 'Español',   native: 'ES' },
    { value: 'en', label: 'English',   native: 'EN' },
    { value: 'pt', label: 'Português', native: 'PT' },
];

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

export const TenantSettings: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const { lang, setLang } = useLang();
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.settings.titulo}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.settings.descripcion}</p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} />}
            </div>

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

                {/* Language */}
                <div>
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-0.5">{dt.settings.idioma}</h2>
                    <p className="text-[13px] text-argo-grey mb-4">{dt.settings.idiomaDesc}</p>
                    <div className="inline-flex rounded-xl border border-argo-border overflow-hidden">
                        {LANG_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setLang(value)}
                                className={`px-5 py-2 text-sm font-medium transition-colors border-r border-argo-border last:border-r-0 ${
                                    lang === value
                                        ? 'bg-argo-navy text-white'
                                        : 'bg-white text-argo-grey hover:text-argo-navy hover:bg-argo-bg'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
