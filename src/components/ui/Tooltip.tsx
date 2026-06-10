import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    // Rendered in a portal with fixed positioning so it can't be clipped by an
    // ancestor's overflow-hidden, and clamped to the viewport so it never runs
    // off the right edge (the icon often sits at the far right of a row).
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const ref = useRef<HTMLButtonElement>(null);

    const WIDTH = 260;
    const open = () => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const left = Math.min(Math.max(r.right - WIDTH, 8), window.innerWidth - WIDTH - 8);
        const top = position === 'top' ? r.top - 6 : r.bottom + 6;
        setCoords({ top, left });
    };
    const close = () => setCoords(null);

    return (
        <span className="relative inline-flex flex-shrink-0">
            <button
                ref={ref}
                onMouseEnter={open}
                onMouseLeave={close}
                onClick={() => (coords ? close() : open())}
                className="w-[18px] h-[18px] rounded-full bg-argo-bg border border-argo-border flex items-center justify-center text-argo-grey hover:bg-argo-violet-50 hover:border-argo-violet-200 hover:text-argo-violet-500 transition-all"
            >
                <Info size={11} />
            </button>
            {coords && createPortal(
                <div
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width: WIDTH, zIndex: 9999, transform: position === 'top' ? 'translateY(-100%)' : undefined }}
                    className="px-3 py-2.5 rounded-lg bg-argo-navy text-white text-[11px] leading-relaxed text-left shadow-lg pointer-events-none"
                >
                    {text}
                </div>,
                document.body,
            )}
        </span>
    );
};
