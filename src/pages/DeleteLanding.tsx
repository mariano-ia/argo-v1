import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { useLang } from '../context/LangContext';

type UiState = 'loading' | 'success' | 'expired' | 'invalid' | 'error';

const COPY = {
    es: {
        loading: 'Eliminando tus datos...',
        successTitle: '¡Listo!',
        successBody: (n: number) => `Eliminamos permanentemente ${n === 1 ? '1 perfil' : `${n} perfiles`} de nuestros sistemas. Esta acción no es reversible.`,
        successNone: 'No había datos asociados a tu email al momento de la confirmación.',
        expiredTitle: 'Enlace expirado',
        expiredBody: 'Este enlace de confirmación ya expiró. Por seguridad, los enlaces son válidos por solo 1 hora. Puedes iniciar una nueva solicitud desde la página de eliminación.',
        invalidTitle: 'Enlace inválido',
        invalidBody: 'Este enlace no es válido. Puedes iniciar una nueva solicitud desde la página de eliminación.',
        errorTitle: 'Algo salió mal',
        errorBody: 'Inténtalo de nuevo en unos minutos o escríbenos a hola@argomethod.com.',
        backToHome: 'Volver al inicio',
        newRequest: 'Iniciar nueva solicitud',
    },
    en: {
        loading: 'Deleting your data...',
        successTitle: 'Done',
        successBody: (n: number) => `We permanently deleted ${n === 1 ? '1 profile' : `${n} profiles`} from our systems. This action is not reversible.`,
        successNone: 'No data was associated with your email at the time of confirmation.',
        expiredTitle: 'Link expired',
        expiredBody: 'This confirmation link has expired. For security, links are valid for only 1 hour. You can start a new request from the deletion page.',
        invalidTitle: 'Invalid link',
        invalidBody: 'This link is not valid. You can start a new request from the deletion page.',
        errorTitle: 'Something went wrong',
        errorBody: 'Please try again in a few minutes or email us at hola@argomethod.com.',
        backToHome: 'Back to home',
        newRequest: 'Start a new request',
    },
    pt: {
        loading: 'Excluindo seus dados...',
        successTitle: 'Pronto',
        successBody: (n: number) => `Excluímos permanentemente ${n === 1 ? '1 perfil' : `${n} perfis`} dos nossos sistemas. Esta ação não é reversível.`,
        successNone: 'Não havia dados associados ao seu email no momento da confirmação.',
        expiredTitle: 'Link expirado',
        expiredBody: 'Este link de confirmação expirou. Por segurança, os links são válidos por apenas 1 hora. Você pode iniciar uma nova solicitação na página de exclusão.',
        invalidTitle: 'Link inválido',
        invalidBody: 'Este link não é válido. Você pode iniciar uma nova solicitação na página de exclusão.',
        errorTitle: 'Algo deu errado',
        errorBody: 'Tente novamente em alguns minutos ou escreva para hola@argomethod.com.',
        backToHome: 'Voltar ao início',
        newRequest: 'Iniciar nova solicitação',
    },
};

export const DeleteLanding: React.FC = () => {
    const { token = '' } = useParams<{ token: string }>();
    const { lang } = useLang();
    const t = COPY[lang];

    const [uiState, setUiState] = useState<UiState>('loading');
    const [deletedCount, setDeletedCount] = useState<number>(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/confirm-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                if (cancelled) return;
                if (res.status === 410) { setUiState('expired'); return; }
                if (res.status === 404) { setUiState('invalid'); return; }
                const json = await res.json().catch(() => null);
                if (!res.ok || !json?.ok) {
                    setUiState('error');
                    return;
                }
                setDeletedCount(json.deleted_count ?? 0);
                setUiState('success');
            } catch {
                if (!cancelled) setUiState('error');
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

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
                        <div className="mx-auto w-14 h-14 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                        <p className="text-argo-grey text-sm">{t.loading}</p>
                    </>
                )}

                {uiState === 'success' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-argo-navy">{t.successTitle}</h2>
                        <p className="text-argo-secondary text-base leading-relaxed">
                            {deletedCount > 0 ? t.successBody(deletedCount) : t.successNone}
                        </p>
                        <Link to="/" className="inline-block mt-2 text-sm text-argo-grey hover:text-argo-navy transition-colors">
                            {t.backToHome}
                        </Link>
                    </>
                )}

                {uiState === 'expired' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-argo-navy">{t.expiredTitle}</h2>
                        <p className="text-argo-secondary text-base leading-relaxed">{t.expiredBody}</p>
                        <Link to="/delete" className="inline-flex items-center gap-2 mt-2 text-sm text-argo-navy font-medium hover:underline">
                            <Trash2 className="w-4 h-4" />
                            {t.newRequest}
                        </Link>
                    </>
                )}

                {uiState === 'invalid' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-argo-navy">{t.invalidTitle}</h2>
                        <p className="text-argo-secondary text-base leading-relaxed">{t.invalidBody}</p>
                        <Link to="/delete" className="inline-flex items-center gap-2 mt-2 text-sm text-argo-navy font-medium hover:underline">
                            <Trash2 className="w-4 h-4" />
                            {t.newRequest}
                        </Link>
                    </>
                )}

                {uiState === 'error' && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-argo-navy">{t.errorTitle}</h2>
                        <p className="text-argo-secondary text-base leading-relaxed">{t.errorBody}</p>
                    </>
                )}
            </div>
        </div>
    );
};
