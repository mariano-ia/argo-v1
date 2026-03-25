import React from 'react';

/* ── Card ──────────────────────────────────────────────────────────────────── */

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const paddings = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
}) => (
    <div
        onClick={onClick}
        className={[
            'bg-white rounded-[14px] shadow-argo',
            paddings[padding],
            hover ? 'hover:shadow-argo-hover transition-shadow cursor-pointer' : '',
            onClick ? 'cursor-pointer' : '',
            className,
        ].join(' ')}
    >
        {children}
    </div>
);
