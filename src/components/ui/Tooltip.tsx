import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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

export const Tooltip: React.FC<TooltipProps> = ({
    text,
    children,
    position = 'top',
    delay = 200,
    maxWidth,
}) => {
    // Rendered in a portal with fixed positioning (same pattern as InfoTip) so
    // an ancestor's overflow-hidden (e.g. the animated expanding ficha) can't
    // clip it, and clamped to the viewport so it never runs off an edge.
    // Two passes: render offscreen to measure, then place.
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const [placed, setPlaced] = useState<React.CSSProperties | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const anchorRef = useRef<HTMLSpanElement>(null);
    const tipRef = useRef<HTMLSpanElement>(null);

    const show = () => {
        // Hover-only devices: on touch, iOS synthesizes mouseenter on tap and
        // never fires mouseleave until the NEXT tap elsewhere, leaving a stale
        // bubble floating after every action (mirrors hoverOnlyWhenSupported).
        if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
        timerRef.current = setTimeout(() => {
            if (anchorRef.current) setAnchorRect(anchorRef.current.getBoundingClientRect());
        }, delay);
    };

    const hide = () => {
        clearTimeout(timerRef.current);
        setAnchorRect(null);
        setPlaced(null);
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    // A fixed-position tooltip doesn't track its anchor: hide it as soon as
    // anything scrolls (capture catches inner scrollers) or the window resizes.
    useEffect(() => {
        if (!anchorRect) return;
        const onMove = () => hide();
        window.addEventListener('scroll', onMove, true);
        window.addEventListener('resize', onMove);
        return () => {
            window.removeEventListener('scroll', onMove, true);
            window.removeEventListener('resize', onMove);
        };
    }, [anchorRect]); // eslint-disable-line react-hooks/exhaustive-deps

    useLayoutEffect(() => {
        if (!anchorRect || !tipRef.current) return;
        const t = tipRef.current.getBoundingClientRect();
        const GAP = 6, MARGIN = 8;
        let top: number, left: number;
        if (position === 'top' || position === 'bottom') {
            left = anchorRect.left + anchorRect.width / 2 - t.width / 2;
            top = position === 'top' ? anchorRect.top - t.height - GAP : anchorRect.bottom + GAP;
        } else {
            top = anchorRect.top + anchorRect.height / 2 - t.height / 2;
            left = position === 'left' ? anchorRect.left - t.width - GAP : anchorRect.right + GAP;
        }
        left = Math.min(Math.max(left, MARGIN), window.innerWidth - t.width - MARGIN);
        top = Math.min(Math.max(top, MARGIN), window.innerHeight - t.height - MARGIN);
        setPlaced({ top, left });
        // text/maxWidth are deps: a tooltip whose text changes WHILE visible
        // (e.g. "Reenviar informe" → "Informe enviado") must re-measure, or it
        // keeps the old box's centering and clamping.
    }, [anchorRect, position, text, maxWidth]);

    return (
        <span ref={anchorRef} className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
            {children}
            {anchorRect && createPortal(
                <span
                    ref={tipRef}
                    style={{
                        position: 'fixed',
                        zIndex: 9999,
                        ...(placed ?? { top: -9999, left: -9999 }),
                        ...(maxWidth ? { maxWidth, whiteSpace: 'normal' } : {}),
                    }}
                    className={`px-2.5 py-1.5 rounded-lg bg-argo-navy text-white text-[11px] leading-relaxed font-medium shadow-lg pointer-events-none ${maxWidth ? '' : 'whitespace-nowrap'}`}
                >
                    {text}
                </span>,
                document.body,
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
