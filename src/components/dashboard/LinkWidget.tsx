import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
    slug: string;
    lang: string;
}

export const LinkWidget: React.FC<Props> = ({ slug, lang }) => {
    const [copied, setCopied] = useState(false);
    const fullUrl = `${window.location.origin}/play/${slug}`;
    const displayUrl = `argomethod.com/play/${slug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-[11px] text-argo-grey hidden sm:inline">
                {displayUrl}
            </span>
            <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-argo-violet-500 text-white text-[11px] font-semibold hover:bg-argo-violet-400 transition-colors flex-shrink-0"
            >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied
                    ? (lang === 'en' ? 'Copied' : 'Copiado')
                    : (lang === 'en' ? 'Copy link' : lang === 'pt' ? 'Copiar link' : 'Copiar link')}
            </button>
        </div>
    );
};
