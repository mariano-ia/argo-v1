import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

interface Props {
    slug: string;
    lang: string;
    disabled?: boolean;
}

const TEXTS: Record<string, { label: string; tooltip: string; copy: string; copied: string; noCredits: string }> = {
    es: {
        label: 'Invita deportistas a jugar con tu link',
        tooltip: 'Al compartir este link, los deportistas pueden completar la experiencia y sus perfiles quedan asociados a la plataforma.',
        copy: 'Copiar link',
        copied: 'Copiado',
        noCredits: 'Sin créditos disponibles. Compra más para compartir el link.',
    },
    en: {
        label: 'Invite athletes to play with your link',
        tooltip: 'When you share this link, athletes can complete the experience and their profiles are linked to your platform.',
        copy: 'Copy link',
        copied: 'Copied',
        noCredits: 'No credits available. Purchase more to share your link.',
    },
    pt: {
        label: 'Convide atletas a jogar com seu link',
        tooltip: 'Ao compartilhar este link, os atletas podem completar a experiencia e seus perfis ficam associados à plataforma.',
        copy: 'Copiar link',
        copied: 'Copiado',
        noCredits: 'Sem créditos disponíveis. Compre mais para compartilhar o link.',
    },
};

export const LinkWidget: React.FC<Props> = ({ slug, lang, disabled = false }) => {
    const [copied, setCopied] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const fullUrl = `${window.location.origin}/play/${slug}`;
    const t = TEXTS[lang] ?? TEXTS.es;

    const handleCopy = () => {
        if (disabled) return;
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1.5 justify-end mb-2 relative">
                <p className="text-[11px] text-argo-grey leading-relaxed">{t.label}</p>
                <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(v => !v)}
                    className="w-[18px] h-[18px] rounded-full bg-argo-bg border border-argo-border flex items-center justify-center text-argo-grey hover:bg-argo-violet-50 hover:border-argo-violet-200 hover:text-argo-violet-500 transition-all flex-shrink-0"
                >
                    <Info size={11} />
                </button>
                {showTooltip && (
                    <div className="absolute top-full right-0 mt-1.5 z-50 w-[260px] px-3 py-2.5 rounded-lg bg-argo-navy text-white text-[11px] leading-relaxed text-left shadow-lg">
                        {disabled ? t.noCredits : t.tooltip}
                    </div>
                )}
            </div>
            <button
                onClick={handleCopy}
                disabled={disabled}
                title={disabled ? t.noCredits : undefined}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
                    disabled
                        ? 'bg-argo-bg border border-argo-border text-argo-light cursor-not-allowed'
                        : 'bg-argo-violet-500 text-white hover:bg-argo-violet-400'
                }`}
            >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? t.copied : t.copy}
            </button>
        </div>
    );
};
