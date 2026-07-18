import React, { useState } from 'react';
import { Ticket, Check, X } from 'lucide-react';

/**
 * Shared discount-coupon field for our own checkout surfaces (ArgoOne®,
 * ArgoPuente®, demo unlock). Always-visible input + "Aplicar"; on success it
 * shows the applied code and the discounted total, and reports the applied
 * coupon up via onChange. Validation is a live PREVIEW against /api/validate-coupon;
 * the real discount is re-resolved and applied server-side by each checkout
 * endpoint (the client is never trusted for the charged amount).
 *
 * Coupons are managed in the Stripe Dashboard. Create them WITHOUT a product
 * restriction (applies_to.products) — our checkouts use ad-hoc price_data line
 * items with no Stripe Product id, so a product-restricted coupon never matches.
 */

export interface AppliedCoupon {
    code: string;
    discountedCents: number;
    percentOff: number | null;
    amountOffCents: number | null;
}

type Lang = 'es' | 'en' | 'pt';

interface CouponFieldProps {
    product: 'one' | 'puente';
    baseCents: number;
    lang: Lang;
    onChange: (applied: AppliedCoupon | null) => void;
    className?: string;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const T: Record<Lang, {
    label: string;
    placeholder: string;
    apply: string;
    remove: string;
    percent: (p: number) => string;
    amount: (a: string) => string;
    errEmpty: string;
    errNotFound: string;
    errMinimum: string;
    errGeneric: string;
}> = {
    es: {
        label: '¿Tienes un cupón de descuento?',
        placeholder: 'Código de cupón',
        apply: 'Aplicar',
        remove: 'Quitar',
        percent: (p) => `${p}% de descuento`,
        amount: (a) => `${a} de descuento`,
        errEmpty: 'Ingresa un código.',
        errNotFound: 'Cupón inválido o vencido. Revisa el código.',
        errMinimum: 'Este cupón requiere un monto mínimo mayor.',
        errGeneric: 'No pudimos validar el cupón. Intenta de nuevo.',
    },
    en: {
        label: 'Have a discount code?',
        placeholder: 'Coupon code',
        apply: 'Apply',
        remove: 'Remove',
        percent: (p) => `${p}% off`,
        amount: (a) => `${a} off`,
        errEmpty: 'Enter a code.',
        errNotFound: 'Invalid or expired coupon. Check the code.',
        errMinimum: 'This coupon requires a higher minimum amount.',
        errGeneric: "We couldn't validate the coupon. Try again.",
    },
    pt: {
        label: 'Tem um cupom de desconto?',
        placeholder: 'Código do cupom',
        apply: 'Aplicar',
        remove: 'Remover',
        percent: (p) => `${p}% de desconto`,
        amount: (a) => `${a} de desconto`,
        errEmpty: 'Digite um código.',
        errNotFound: 'Cupom inválido ou vencido. Verifique o código.',
        errMinimum: 'Este cupom exige um valor mínimo maior.',
        errGeneric: 'Não conseguimos validar o cupom. Tente de novo.',
    },
};

export const CouponField: React.FC<CouponFieldProps> = ({ product, baseCents, lang, onChange, className }) => {
    const t = T[lang] ?? T.es;
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [applied, setApplied] = useState<AppliedCoupon | null>(null);

    const apply = async () => {
        const trimmed = code.trim();
        if (!trimmed) { setError(t.errEmpty); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: trimmed, product, base_cents: baseCents }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.valid) {
                setError(data.error === 'minimum' ? t.errMinimum
                    : data.error === 'not_found' ? t.errNotFound
                    : data.error === 'rate_limited' ? t.errGeneric
                    : t.errNotFound);
                setLoading(false);
                return;
            }
            const next: AppliedCoupon = {
                code: data.code,
                discountedCents: data.discounted_cents,
                percentOff: data.percent_off ?? null,
                amountOffCents: data.amount_off_cents ?? null,
            };
            setApplied(next);
            onChange(next);
        } catch {
            setError(t.errGeneric);
        }
        setLoading(false);
    };

    const remove = () => {
        setApplied(null);
        setCode('');
        setError('');
        onChange(null);
    };

    const discountLabel = applied
        ? (applied.percentOff != null
            ? t.percent(applied.percentOff)
            : applied.amountOffCents != null
                ? t.amount(money(applied.amountOffCents))
                : '')
        : '';

    return (
        <div className={className}>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-argo-secondary mb-2">
                <Ticket size={13} className="text-argo-violet-500" />
                {t.label}
            </label>

            {applied ? (
                <div className="flex items-center justify-between gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 min-w-0">
                        <Check size={14} className="text-green-600 flex-shrink-0" />
                        <span className="text-[13px] font-bold text-green-700 tracking-wide">{applied.code}</span>
                        <span className="text-xs text-green-700/90 truncate">{discountLabel}</span>
                    </span>
                    <button
                        type="button"
                        onClick={remove}
                        className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-green-700 underline hover:no-underline"
                    >
                        <X size={12} /> {t.remove}
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => { setCode(e.target.value); if (error) setError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
                        placeholder={t.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className={[
                            'flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm text-argo-navy uppercase tracking-wide',
                            'placeholder:normal-case placeholder:tracking-normal placeholder:text-argo-light',
                            'focus:outline-none focus:ring-2 focus:ring-argo-violet-300',
                            error ? 'border-red-400' : 'border-argo-border',
                        ].join(' ')}
                    />
                    <button
                        type="button"
                        onClick={apply}
                        disabled={loading}
                        className="flex-shrink-0 px-4 rounded-xl border border-argo-border bg-white text-sm font-semibold text-argo-navy hover:bg-argo-bg disabled:opacity-50 transition-colors"
                    >
                        {loading ? '…' : t.apply}
                    </button>
                </div>
            )}

            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default CouponField;
