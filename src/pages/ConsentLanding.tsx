import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { confirmConsent, saveConsentResume } from '../lib/consentStore';
import { useLang, type Lang } from '../context/LangContext';
import { getOdysseyT } from '../lib/odysseyTranslations';

type UiState = 'loading' | 'success' | 'redirecting' | 'expired' | 'invalid';

export const ConsentLanding: React.FC = () => {
    const { token = '' } = useParams<{ token: string }>();
    const { lang, setLang } = useLang();

    const [uiState, setUiState] = useState<UiState>('loading');
    const [childName, setChildName] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = await confirmConsent(token);
            if (cancelled) return;
            if (result.ok) {
                if (result.lang === 'es' || result.lang === 'en' || result.lang === 'pt') {
                    setLang(result.lang as Lang);
                }
                setChildName(result.childName ?? '');

                // Auto-resume the play flow in the same browser so the user
                // doesn't have to hunt for the original tab. We stash the
                // pre-filled adultData in sessionStorage and redirect to the
                // appropriate play URL with ?consent=TOKEN.
                const cd = result.consentData;
                let target: string | null = null;
                if (cd) {
                    saveConsentResume({
                        token,
                        adultData: {
                            nombreAdulto: cd.adult_name,
                            email: cd.adult_email,
                            nombreNino: cd.child_name,
                            edad: cd.child_age,
                            deporte: cd.sport ?? '',
                        },
                        flowType: cd.flow_type,
                        lang: cd.lang,
                    });

                    if (cd.flow_type === 'tenant' && cd.tenant_slug) {
                        target = `/play/${cd.tenant_slug}?consent=${token}`;
                    } else if (cd.flow_type === 'one' && cd.one_link_slug) {
                        target = `/one/${cd.one_link_slug}?consent=${token}`;
                    } else if (cd.flow_type === 'auth') {
                        target = `/app?consent=${token}`;
                    }
                }

                // Show 'redirecting' copy when we actually have a target to
                // send the user to; otherwise fall back to 'success' which
                // asks them to return to the original tab.
                if (target) {
                    setUiState('redirecting');
                    setTimeout(() => {
                        window.location.href = target!;
                    }, 1200);
                } else {
                    setUiState('success');
                }
            } else if (result.error === 'expired') {
                setUiState('expired');
            } else {
                setUiState('invalid');
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const ot = getOdysseyT(lang);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-argo-neutral">
            <div className="max-w-md w-full text-center space-y-6 py-12">
                <div className="flex items-center justify-center gap-1.5 mb-8">
                    <span style={{ fontSize: 18, letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                    </span>
                </div>

                {uiState === 'loading' && (
                    <>
                        <div className="mx-auto w-14 h-14 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                        <p className="text-argo-grey text-sm">{ot.consentLandingLoading}</p>
                    </>
                )}

                {uiState === 'success' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">
                            {ot.consentLandingSuccess(childName || '—')}
                        </p>
                    </>
                )}

                {uiState === 'redirecting' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">
                            {ot.consentLandingRedirecting(childName || '—')}
                        </p>
                        <div className="mx-auto w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin mt-4" />
                    </>
                )}

                {uiState === 'expired' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-amber-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">{ot.consentLandingExpired}</p>
                    </>
                )}

                {uiState === 'invalid' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <p className="text-argo-navy text-base leading-relaxed">{ot.consentLandingInvalid}</p>
                    </>
                )}
            </div>
        </div>
    );
};
