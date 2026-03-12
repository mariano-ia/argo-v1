import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

export const TenantHome: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const [copied, setCopied] = React.useState(false);

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    const playLink = `${window.location.origin}/play/${tenant.slug}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(playLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-argo-navy mb-1">
                Hola, {tenant.display_name}
            </h1>
            <p className="text-sm text-argo-grey mb-8">
                Plan {tenant.plan} · {tenant.credits_remaining} crédito{tenant.credits_remaining !== 1 ? 's' : ''} disponible{tenant.credits_remaining !== 1 ? 's' : ''}
            </p>

            {/* Play link card */}
            <div className="bg-white border border-argo-border rounded-2xl p-6 shadow-sm mb-6">
                <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest mb-3">
                    Tu link de invitación
                </h2>
                <p className="text-xs text-argo-grey mb-4">
                    Comparte este link con los adultos que quieras invitar a realizar la experiencia Argo con sus niños.
                </p>

                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-argo-neutral border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy font-mono truncate">
                        {playLink}
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-argo-border rounded-lg hover:bg-argo-neutral transition-all flex-shrink-0"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>

                <p className="text-[10px] text-argo-grey/50 mt-3">
                    Cada vez que alguien inicie la experiencia desde este link, se descontará 1 crédito de tu cuenta.
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-argo-border rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold mb-1">Créditos</p>
                    <p className="text-2xl font-bold text-argo-navy">{tenant.credits_remaining}</p>
                </div>
                <div className="bg-white border border-argo-border rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold mb-1">Sesiones</p>
                    <p className="text-2xl font-bold text-argo-navy">—</p>
                    <p className="text-[10px] text-argo-grey/50 mt-0.5">Próximamente</p>
                </div>
                <div className="bg-white border border-argo-border rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold mb-1">Plan</p>
                    <p className="text-2xl font-bold text-argo-navy capitalize">{tenant.plan}</p>
                </div>
            </div>
        </div>
    );
};
