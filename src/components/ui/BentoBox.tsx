
import React from 'react';
import { cn } from '@/lib/utils';

interface BentoProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    isGlass?: boolean;
}

export const BentoBox: React.FC<BentoProps> = ({ title, children, className, isGlass = true }) => {
    return (
        <div className={cn(
            "rounded-2xl p-6 relative overflow-hidden border",
            isGlass
                ? "bg-argos-surface/30 backdrop-blur-md border-white/5"
                : "bg-argos-surface border-transparent",
            className
        )}>
            {title && (
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <div className="w-1 h-3 bg-argos-ember"></div>
                    <h4 className="text-xs uppercase tracking-widest text-argos-muted">{title}</h4>
                </div>
            )}
            <div className="text-argos-text relative z-10">
                {children}
            </div>

            {/* Tech accents */}
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-argos-muted/20"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-argos-muted/20"></div>
        </div>
    );
};
