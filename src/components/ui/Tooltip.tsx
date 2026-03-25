import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

/* ── Tooltip ───────────────────────────────────────────────────────────────── */

type Position = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: Position;
    delay?: number;
    maxWidth?: number;
}

const positionClasses: Record<Position, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

export const Tooltip: React.FC<TooltipProps> = ({
    text,
    children,
    position = 'top',
    delay = 200,
    maxWidth,
}) => {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const show = () => {
        timerRef.current = setTimeout(() => setVisible(true), delay);
    };

    const hide = () => {
        clearTimeout(timerRef.current);
        setVisible(false);
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    return (
        <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
            {children}
            {visible && (
                <span
                    className={`absolute z-50 px-2.5 py-1.5 rounded-lg bg-argo-navy text-white text-[11px] leading-relaxed font-medium shadow-lg pointer-events-none ${maxWidth ? '' : 'whitespace-nowrap'} ${positionClasses[position]}`}
                    style={maxWidth ? { maxWidth, whiteSpace: 'normal' } : undefined}
                >
                    {text}
                </span>
            )}
        </span>
    );
};

/* ── InfoTip — Info icon button + tooltip (like LinkWidget pattern) ─────── */

interface InfoTipProps {
    text: string;
    position?: Position;
}

export const InfoTip: React.FC<InfoTipProps> = ({ text, position = 'bottom' }) => {
    const [visible, setVisible] = useState(false);

    return (
        <span className="relative inline-flex flex-shrink-0">
            <button
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onClick={() => setVisible(v => !v)}
                className="w-[18px] h-[18px] rounded-full bg-argo-bg border border-argo-border flex items-center justify-center text-argo-grey hover:bg-argo-violet-50 hover:border-argo-violet-200 hover:text-argo-violet-500 transition-all"
            >
                <Info size={11} />
            </button>
            {visible && (
                <div
                    className={`absolute z-50 w-[260px] px-3 py-2.5 rounded-lg bg-argo-navy text-white text-[11px] leading-relaxed text-left shadow-lg pointer-events-none ${positionClasses[position]}`}
                >
                    {text}
                </div>
            )}
        </span>
    );
};
