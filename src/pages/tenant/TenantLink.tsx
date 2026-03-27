import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, Share2 } from 'lucide-react';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

export const TenantLink: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [copied, setCopied] = React.useState(false);

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
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
                title: 'Argo Method',
                text: dt.link.descripcion,
                url: playLink,
            });
        } else {
            copyLink();
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.nav.miLink}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">
                        {dt.link.descripcion}
                    </p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} />}
            </div>

            <div className="bg-white rounded-[14px] p-6 shadow-argo">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-argo-bg border border-argo-border rounded-lg px-4 py-3 text-sm text-argo-navy font-mono truncate">
                        {playLink}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-argo-navy text-white rounded-lg hover:opacity-90 transition-all"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? dt.link.copiado : dt.link.copiarLink}
                    </button>
                    <button
                        onClick={shareLink}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-argo-border rounded-lg hover:bg-argo-bg transition-all"
                    >
                        <Share2 size={14} /> {dt.link.compartir}
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-argo-border">
                    <p className="text-xs text-argo-grey">
                        {dt.link.creditoNota}
                        {' '}{dt.link.creditoConteo(tenant.credits_remaining)}
                    </p>
                </div>
            </div>
        </div>
    );
};
