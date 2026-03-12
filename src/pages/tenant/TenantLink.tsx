import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, Share2 } from 'lucide-react';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

export const TenantLink: React.FC = () => {
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

    const shareLink = async () => {
        if (navigator.share) {
            await navigator.share({
                title: 'Argo Method — Experiencia deportiva',
                text: 'Realiza la experiencia Argo para descubrir el perfil deportivo de tu niño/a.',
                url: playLink,
            });
        } else {
            copyLink();
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-argo-navy mb-1">Mi link</h1>
            <p className="text-sm text-argo-grey mb-8">
                Comparte este link para que los adultos realicen la experiencia Argo con sus niños.
            </p>

            <div className="bg-white border border-argo-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-argo-neutral border border-argo-border rounded-lg px-4 py-3 text-sm text-argo-navy font-mono truncate">
                        {playLink}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-argo-navy text-white rounded-lg hover:opacity-90 transition-all"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copiado' : 'Copiar link'}
                    </button>
                    <button
                        onClick={shareLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-argo-border rounded-lg hover:bg-argo-neutral transition-all"
                    >
                        <Share2 size={14} /> Compartir
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-argo-border">
                    <p className="text-xs text-argo-grey">
                        Cada vez que alguien inicie la experiencia desde este link, se descontará 1 crédito de tu cuenta.
                        Actualmente tienes <strong className="text-argo-navy">{tenant.credits_remaining}</strong> crédito{tenant.credits_remaining !== 1 ? 's' : ''}.
                    </p>
                </div>
            </div>
        </div>
    );
};
