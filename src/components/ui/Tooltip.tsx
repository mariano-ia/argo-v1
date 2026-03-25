import React, { useState, useRef, useEffect } from 'react';

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
