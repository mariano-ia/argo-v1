import React from 'react';

/* ── Component ─────────────────────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-xs font-semibold text-argo-grey tracking-wide uppercase">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={[
                        'w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy bg-white',
                        'placeholder:text-argo-light',
                        'focus:outline-none focus:ring-2 focus:ring-argo-violet-500/30 focus:border-argo-violet-200',
                        'disabled:bg-argo-bg disabled:cursor-not-allowed',
                        'transition-colors',
                        error ? 'border-red-300 focus:ring-red-500/30 focus:border-red-300' : '',
                        className,
                    ].join(' ')}
                    {...props}
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
