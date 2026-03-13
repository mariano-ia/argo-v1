import React from 'react';
import { useOutletContext } from 'react-router-dom';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

export const TenantSettings: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-argo-navy mb-1">Ajustes</h1>
            <p className="text-sm text-argo-grey mb-8">Configura tu cuenta y preferencias.</p>

            <div className="bg-white border border-argo-border rounded-2xl p-6 shadow-sm space-y-6">
                {/* Account info */}
                <div>
                    <h2 className="text-xs font-semibold text-argo-grey uppercase tracking-widest mb-3">Cuenta</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] text-argo-grey uppercase tracking-widest mb-0.5">Nombre</p>
                            <p className="text-sm text-argo-navy font-medium">{tenant.display_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-argo-grey uppercase tracking-widest mb-0.5">Slug</p>
                            <p className="text-sm text-argo-navy font-mono">{tenant.slug}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-argo-grey uppercase tracking-widest mb-0.5">Plan</p>
                            <p className="text-sm text-argo-navy font-medium capitalize">{tenant.plan}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-argo-border" />

                {/* Placeholder for future settings */}
                <div className="text-center py-4">
                    <p className="text-sm text-argo-grey/60">
                        Más opciones de configuración próximamente.
                    </p>
                </div>
            </div>
        </div>
    );
};
