import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui';
import { CouponField, type AppliedCoupon } from './CouponField';

/**
 * Confirmation modal for one-click checkout surfaces (e.g. the ArgoOne® panel's
 * "buy again / update report / create bridge" buttons) that otherwise redirect
 * straight to Stripe. It gives those buttons a place for the coupon field so the
 * discount lives in our own UI everywhere. On confirm it hands the parent the
 * entered coupon code (or null); the parent runs its existing checkout call.
 */

type Lang = 'es' | 'en' | 'pt';

interface CouponPurchaseModalProps {
    open: boolean;
    product: 'one' | 'puente';
    baseCents: number;
    title: string;
    subtitle?: string;
    lang: Lang;
    loading?: boolean;
    onConfirm: (couponCode: string | null) => void;
    onClose: () => void;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const T: Record<Lang, { total: string; pay: string; cancel: string }> = {
    es: { total: 'Total', pay: 'Pagar', cancel: 'Cancelar' },
    en: { total: 'Total', pay: 'Pay', cancel: 'Cancel' },
    pt: { total: 'Total', pay: 'Pagar', cancel: 'Cancelar' },
};

export const CouponPurchaseModal: React.FC<CouponPurchaseModalProps> = ({
    open, product, baseCents, title, subtitle, lang, loading, onConfirm, onClose,
}) => {
    const t = T[lang] ?? T.es;
    const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

    if (!open) return null;

    const total = coupon ? coupon.discountedCents : baseCents;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-argo-navy/40 px-4"
            onClick={() => { if (!loading) onClose(); }}
        >
            <div
                className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-argo-navy">{title}</h3>
                        {subtitle && <p className="text-xs text-argo-grey mt-0.5 leading-relaxed">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-shrink-0 text-argo-grey hover:text-argo-navy disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Price row (struck-through base when a coupon is applied) */}
                <div className="flex items-baseline justify-between rounded-[14px] bg-argo-bg px-4 py-3 mb-4">
                    <span className="text-xs uppercase tracking-widest text-argo-grey font-semibold">{t.total}</span>
                    <span className="flex items-baseline gap-2">
                        {coupon && (
                            <span className="text-sm text-argo-light line-through tabular-nums">{money(baseCents)}</span>
                        )}
                        <span className="text-2xl font-bold text-argo-navy tracking-tight tabular-nums">{money(total)}</span>
                    </span>
                </div>

                <CouponField
                    product={product}
                    baseCents={baseCents}
                    lang={lang}
                    onChange={setCoupon}
                    className="mb-5"
                />

                <div className="flex flex-col gap-2">
                    <Button
                        variant="violet"
                        size="lg"
                        className="w-full"
                        loading={loading}
                        onClick={() => onConfirm(coupon?.code ?? null)}
                    >
                        {t.pay} · {money(total)}
                    </Button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="text-sm font-semibold text-argo-grey hover:text-argo-navy py-1 disabled:opacity-40"
                    >
                        {t.cancel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CouponPurchaseModal;
