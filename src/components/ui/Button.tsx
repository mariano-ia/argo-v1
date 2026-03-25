import React from 'react';
import { Loader2 } from 'lucide-react';

/* ── Variants ──────────────────────────────────────────────────────────────── */

const variants = {
    primary:   'bg-argo-navy text-white hover:bg-argo-secondary',
    violet:    'bg-argo-violet-500 text-white hover:bg-argo-violet-600',
    secondary: 'bg-argo-bg text-argo-navy border border-argo-border hover:bg-argo-neutral',
    ghost:     'text-argo-secondary hover:bg-argo-bg',
    danger:    'bg-red-600 text-white hover:bg-red-700',
} as const;

const sizes = {
    sm:   'px-3 py-1.5 text-xs gap-1.5',
    md:   'px-4 py-2.5 text-sm gap-2',
    lg:   'px-6 py-3 text-sm gap-2.5',
} as const;

/* ── Component ─────────────────────────────────────────────────────────────── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
    loading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    disabled,
    className = '',
    ...props
}) => (
    <button
        disabled={disabled || loading}
        className={[
            'inline-flex items-center justify-center font-medium rounded-lg transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variants[variant],
            sizes[size],
            className,
        ].join(' ')}
        {...props}
    >
        {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
        {children}
    </button>
);
