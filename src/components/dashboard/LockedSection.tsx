import React, { useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * Wraps content in a blur + lock overlay for trial-locked features.
 * The label appears above the blurred area; the CTA is shown centered on top.
 * Optional `tooltip` adds a hover/tap description explaining the locked feature.
 */
export const LockedSection: React.FC<{
    label: string;
    cta: string;
    tooltip?: string;
    children: React.ReactNode;
}> = ({ label, cta, tooltip, children }) => {
    const [tipVisible, setTipVisible] = useState(false);

    return (
        <div className="space-y-2">
            <div
                className="relative inline-flex items-center gap-1.5 cursor-default"
                onMouseEnter={() => tooltip && setTipVisible(true)}
                onMouseLeave={() => setTipVisible(false)}
                onClick={() => tooltip && setTipVisible(v => !v)}
            >
                <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em]">{label}</p>
                <Lock size={9} className="text-argo-light" />
                {tooltip && tipVisible && (
                    <div className="absolute z-50 left-0 top-full mt-1.5 w-[260px] px-3 py-2.5 rounded-lg bg-argo-navy text-white text-[11px] leading-relaxed font-medium shadow-lg">
                        {tooltip}
                    </div>
                )}
            </div>
            <div className="relative rounded-xl overflow-hidden min-h-[52px]">
                <div className="select-none pointer-events-none" style={{ filter: 'blur(2px)' }}>
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-amber-50 border border-amber-300 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                        <Lock size={9} className="text-amber-600 flex-shrink-0" />
                        <p className="text-[11px] text-amber-700 font-semibold">{cta}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
