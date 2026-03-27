import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    storageKey: string;
    icon: React.ReactNode;
    title: string;
    body: string;
}

export const SectionIntro: React.FC<Props> = ({ storageKey, icon, title, body }) => {
    const [visible, setVisible] = useState(() => !localStorage.getItem(storageKey));
    if (!visible) return null;

    return (
        <div className="bg-argo-violet-50 border border-argo-violet-100 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-[9px] bg-argo-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-argo-violet-500">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-argo-violet-600 uppercase tracking-[0.08em] mb-1">{title}</p>
                <p className="text-sm text-argo-secondary leading-relaxed">{body}</p>
            </div>
            <button
                onClick={() => { localStorage.setItem(storageKey, '1'); setVisible(false); }}
                className="text-argo-light hover:text-argo-grey transition-colors flex-shrink-0 mt-0.5 p-0.5 rounded"
            >
                <X size={14} />
            </button>
        </div>
    );
};
