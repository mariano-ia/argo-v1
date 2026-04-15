import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

const COPY = {
    es: {
        title: 'Eliminar mis datos',
        intro: 'Puedes solicitar la eliminación permanente de los datos recolectados por Argo Method en cualquier momento. Completa el formulario y te enviaremos un email con un enlace de confirmación.',
        warning: 'Esta acción es irreversible. Una vez confirmada, eliminamos todas las respuestas, perfiles generados, secciones de IA y registros asociados.',
        emailLabel: 'Tu email',
        emailPlaceholder: 'el email que usaste para registrarte',
        childLabel: 'Nombre del deportista (opcional)',
        childHint: 'Si lo dejás vacío, eliminaremos todos los perfiles asociados a tu email.',
        childPlaceholder: 'nombre del niño o niña',
        submit: 'Solicitar eliminación',
        submitting: 'Enviando...',
        sentTitle: 'Revisa tu email',
        sentBody: 'Si existe algún dato asociado a ese email, te enviamos un correo con un enlace de confirmación. El enlace expira en una hora.',
        sentNote: 'Por tu seguridad no te confirmamos si el email existía en nuestro sistema. Solo haremos la eliminación si tú clickeas el link.',
        errorTitle: 'Algo salió mal',
        errorBody: 'Inténtalo de nuevo en unos minutos. Si el problema persiste, escríbenos a hola@argomethod.com.',
        back: 'Volver al inicio',
        altContact: 'También puedes escribir directamente a hola@argomethod.com desde el email del adulto responsable.',
    },
    en: {
        title: 'Delete my data',
        intro: 'You can request permanent deletion of the data Argo Method has collected at any time. Fill out the form and we will send you an email with a confirmation link.',
        warning: 'This action is irreversible. Once confirmed, we delete all answers, generated profiles, AI sections, and related records.',
        emailLabel: 'Your email',
        emailPlaceholder: 'the email you used to register',
        childLabel: "Child's name (optional)",
        childHint: 'If left blank, we will delete all profiles associated with your email.',
        childPlaceholder: 'child name',
        submit: 'Request deletion',
        submitting: 'Sending...',
        sentTitle: 'Check your email',
        sentBody: 'If any data exists for that email, we sent you a message with a confirmation link. The link expires in one hour.',
        sentNote: 'For your security, we do not confirm whether the email existed in our system. Deletion only happens if you click the link.',
        errorTitle: 'Something went wrong',
        errorBody: 'Please try again in a few minutes. If the problem persists, email us at hola@argomethod.com.',
        back: 'Back to home',
        altContact: 'You can also email hola@argomethod.com directly from the responsible adult\'s address.',
    },
    pt: {
        title: 'Excluir meus dados',
        intro: 'Você pode solicitar a exclusão permanente dos dados coletados pelo Argo Method a qualquer momento. Preencha o formulário e enviaremos um email com um link de confirmação.',
        warning: 'Esta ação é irreversível. Uma vez confirmada, excluímos todas as respostas, perfis gerados, seções de IA e registros associados.',
        emailLabel: 'Seu email',
        emailPlaceholder: 'o email que você usou para se registrar',
        childLabel: 'Nome do atleta (opcional)',
        childHint: 'Se deixar em branco, excluiremos todos os perfis associados ao seu email.',
        childPlaceholder: 'nome da criança',
        submit: 'Solicitar exclusão',
        submitting: 'Enviando...',
        sentTitle: 'Verifique seu email',
        sentBody: 'Se existirem dados para esse email, enviamos uma mensagem com um link de confirmação. O link expira em uma hora.',
        sentNote: 'Por segurança, não confirmamos se o email existia em nosso sistema. A exclusão só acontece se você clicar no link.',
        errorTitle: 'Algo deu errado',
        errorBody: 'Tente novamente em alguns minutos. Se o problema persistir, escreva para hola@argomethod.com.',
        back: 'Voltar ao início',
        altContact: 'Você também pode escrever diretamente para hola@argomethod.com do email do responsável.',
    },
};

export const DeleteMyData: React.FC = () => {
    const { lang } = useLang();
    const t = COPY[lang];

    const [email, setEmail] = useState('');
    const [childName, setChildName] = useState('');
    const [status, setStatus] = useState<Status>('idle');

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || status === 'submitting') return;
        setStatus('submitting');
        try {
            const res = await fetch('/api/request-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adult_email: email.trim(),
                    child_name: childName.trim() || undefined,
                    lang,
                }),
            });
            if (res.ok) setStatus('sent');
            else setStatus('error');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-argo-neutral">
            <div className="max-w-[560px] mx-auto px-6 py-16">
                <Link to="/" className="inline-flex items-center gap-1.5 mb-8">
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                </Link>

                <h1 className="text-2xl font-bold text-argo-navy tracking-tight mb-3">{t.title}</h1>
                <p className="text-sm text-argo-secondary leading-relaxed mb-5">{t.intro}</p>

                <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-8">
                    <p className="text-sm text-red-900 leading-relaxed">{t.warning}</p>
                </div>

                {status !== 'sent' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">{t.emailLabel}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={t.emailPlaceholder}
                                autoComplete="email"
                                className="w-full border border-[#D2D2D7] rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-argo-grey uppercase tracking-widest">{t.childLabel}</label>
                            <input
                                type="text"
                                value={childName}
                                onChange={e => setChildName(e.target.value)}
                                placeholder={t.childPlaceholder}
                                className="w-full border border-[#D2D2D7] rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors"
                            />
                            <p className="text-xs text-argo-grey">{t.childHint}</p>
                        </div>

                        {status === 'error' && (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                                <p className="text-sm font-semibold text-red-900">{t.errorTitle}</p>
                                <p className="text-xs text-red-900/80 mt-1 leading-relaxed">{t.errorBody}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!isValid || status === 'submitting'}
                            className="w-full bg-red-600 text-white font-medium py-4 rounded-xl text-sm disabled:opacity-40 transition-all hover:bg-red-700"
                        >
                            {status === 'submitting' ? t.submitting : t.submit}
                        </button>

                        <p className="text-xs text-argo-grey text-center leading-relaxed">{t.altContact}</p>
                    </form>
                )}

                {status === 'sent' && (
                    <div className="rounded-xl bg-green-50 border border-green-100 p-6 text-center space-y-3">
                        <h2 className="text-lg font-semibold text-green-900">{t.sentTitle}</h2>
                        <p className="text-sm text-green-900/90 leading-relaxed">{t.sentBody}</p>
                        <p className="text-xs text-green-900/70 leading-relaxed">{t.sentNote}</p>
                    </div>
                )}

                <div className="mt-12 pt-6 border-t border-argo-border">
                    <Link to="/" className="text-sm text-argo-grey hover:text-argo-navy transition-colors">
                        {t.back}
                    </Link>
                </div>
            </div>
        </div>
    );
};
