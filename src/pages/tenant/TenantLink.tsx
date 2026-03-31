import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Check, Share2 } from 'lucide-react';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';
import { SectionIntro } from '../../components/dashboard/SectionIntro';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    roster_limit: number;
    active_players_count: number;
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

    const linkIntroBody = lang === 'en'
        ? 'Share this link with the responsible adult (parent or guardian). Each athlete who plays takes a spot on your team.'
        : lang === 'pt'
            ? 'Compartilhe este link com o adulto responsável (pai, mãe ou responsável). Cada atleta que joga ocupa um lugar na sua equipe.'
            : 'Comparte este link con el adulto responsable (padre, madre o tutor). Cada deportista que juega ocupa un lugar en tu equipo.';

    return (
        <div>
            <SectionIntro
                storageKey="argo_intro_link_v1"
                icon={<Share2 size={16} />}
                title={lang === 'en' ? 'My Link' : lang === 'pt' ? 'Meu Link' : 'Mi Link'}
                body={linkIntroBody}
            />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.nav.miLink}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">
                        {dt.link.descripcion}
                    </p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} disabled={tenant.active_players_count >= tenant.roster_limit} />}
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
                        {lang === 'en'
                            ? `Each athlete who plays takes a spot on your roster. You have ${tenant.active_players_count} of ${tenant.roster_limit} spots used.`
                            : lang === 'pt'
                                ? `Cada atleta que joga ocupa um lugar no seu elenco. Você tem ${tenant.active_players_count} de ${tenant.roster_limit} lugares ocupados.`
                                : `Cada deportista que juega ocupa un lugar en tu roster. Tienes ${tenant.active_players_count} de ${tenant.roster_limit} lugares ocupados.`}
                    </p>
                </div>
            </div>
        </div>
    );
};
