import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLang } from '../../../context/LangContext';
import { getOdysseyT } from '../../../lib/odysseyTranslations';
import { maskEmail } from '../../../lib/maskEmail';
import { checkConsentStatus, requestConsent, type RequestConsentInput } from '../../../lib/consentStore';

type UiState = 'waiting' | 'expired' | 'invalid';

interface Props {
    token: string;
    childName: string;
    adultEmail: string;
    resendInput: RequestConsentInput; // snapshot used if the user clicks Resend
    onConfirmed: (token: string) => void;
    onCancel: () => void;
}

const POLL_INTERVAL_MS = 5000;
const RESEND_COOLDOWN_MS = 60_000;

export const ParentalConsentWaiting: React.FC<Props> = ({
    token: initialToken,
    childName,
    adultEmail,
    resendInput,
    onConfirmed,
    onCancel,
}) => {
    const { lang } = useLang();
    const ot = getOdysseyT(lang);

    const [token, setToken] = useState(initialToken);
    const [uiState, setUiState] = useState<UiState>('waiting');
    const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
    const [resendFlash, setResendFlash] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Polling loop
    useEffect(() => {
        if (uiState !== 'waiting') return;

        let cancelled = false;
        const tick = async () => {
            const status = await checkConsentStatus(token);
            if (cancelled) return;
            if (status === 'confirmed') {
                if (pollRef.current) clearInterval(pollRef.current);
                onConfirmed(token);
            } else if (status === 'expired') {
                if (pollRef.current) clearInterval(pollRef.current);
                setUiState('expired');
            } else if (status === 'not_found') {
                if (pollRef.current) clearInterval(pollRef.current);
                setUiState('invalid');
            }
            // 'pending' → keep polling
        };

        // Kick once immediately so we don't wait 5s on mount
        void tick();
        pollRef.current = setInterval(tick, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
        };
    }, [token, uiState, onConfirmed]);

    const onResend = async () => {
        if (Date.now() < resendCooldownUntil) return;
        setResendCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
        const result = await requestConsent(resendInput);
        if (result.ok && result.token) {
            setToken(result.token);
            setResendFlash(true);
            setTimeout(() => setResendFlash(false), 3000);
        }
    };

    const masked = maskEmail(adultEmail);

    // ── Error states ──
    if (uiState === 'expired' || uiState === 'invalid') {
        const msg = uiState === 'expired' ? ot.consentWaitingExpired : ot.consentWaitingInvalid;
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto text-center space-y-6 py-12"
            >
                <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-argo-navy text-base leading-relaxed">{msg}</p>
                <button
                    onClick={onCancel}
                    className="w-full bg-[#1D1D1F] text-white font-medium py-4 rounded-xl text-sm"
                >
                    {ot.consentWaitingRestart}
                </button>
            </motion.div>
        );
    }

    // ── Waiting state ──
    const resendDisabled = Date.now() < resendCooldownUntil;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto space-y-8 py-8"
        >
            <div className="flex justify-center">
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center"
                >
                    <Mail className="w-8 h-8 text-[#1D1D1F]" />
                </motion.div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="font-display text-2xl font-light text-[#1D1D1F]" style={{ letterSpacing: '-0.02em' }}>
                    {ot.consentWaitingTitle}
                </h2>
                <p className="text-sm text-argo-grey">{ot.consentWaitingSubtitle(masked)}</p>
            </div>

            <div className="rounded-xl bg-[#F5F5F7] p-4 text-center">
                <p className="text-sm text-argo-navy leading-relaxed">{ot.consentWaitingWhy(childName)}</p>
                <p className="text-xs text-argo-grey mt-3">⏱ {ot.consentWaitingExpiry}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-argo-grey">
                <div className="w-4 h-4 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                <span>{ot.consentWaitingStatus}</span>
            </div>

            <div className="space-y-2">
                <button
                    onClick={onResend}
                    disabled={resendDisabled}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#D2D2D7] text-sm font-medium text-argo-navy hover:border-[#1D1D1F] disabled:opacity-40 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    {resendFlash ? '✓' : ot.consentWaitingResend}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-argo-grey hover:text-argo-navy transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {ot.consentWaitingChangeEmail}
                </button>
            </div>

            {lang === 'en' && ot.consentWaitingCoppaFooter && (
                <p className="text-[11px] text-argo-grey text-center leading-relaxed">{ot.consentWaitingCoppaFooter}</p>
            )}
        </motion.div>
    );
};
