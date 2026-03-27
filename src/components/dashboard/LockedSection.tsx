import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Wraps content in a blur + lock overlay for trial-locked features.
 * The label appears above the blurred area; the CTA is shown centered on top.
 */
export const LockedSection: React.FC<{
    label: string;
    cta: string;
    children: React.ReactNode;
}> = ({ label, cta, children }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em]">{label}</p>
            <Lock size={9} className="text-argo-light" />
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
