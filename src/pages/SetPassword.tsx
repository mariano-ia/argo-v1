import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Stage = 'waiting' | 'form' | 'saving' | 'done' | 'error';
type Lang = 'es' | 'en' | 'pt';

const COPY: Record<Lang, {
    title: string; subtitle: string;
    labelPassword: string; placeholderPassword: string;
    labelConfirm: string; placeholderConfirm: string;
    errorShort: string; errorMismatch: string; errorGeneric: string;
    saving: string; cta: string; redirecting: string;
}> = {
    es: {
        title: 'Crea tu contraseña',
        subtitle: 'Elige una contraseña para acceder al dashboard de Argo.',
        labelPassword: 'Contraseña',
        placeholderPassword: 'Mínimo 8 caracteres',
        labelConfirm: 'Confirmar contraseña',
        placeholderConfirm: 'Repite la contraseña',
        errorShort: 'La contraseña debe tener al menos 8 caracteres.',
        errorMismatch: 'Las contraseñas no coinciden.',
        errorGeneric: 'Ocurrió un error. Intenta de nuevo.',
        saving: 'Guardando…',
        cta: 'Crear cuenta y entrar',
        redirecting: 'Accediendo al dashboard…',
    },
    en: {
        title: 'Create your password',
        subtitle: 'Choose a password to access the Argo dashboard.',
        labelPassword: 'Password',
        placeholderPassword: 'Minimum 8 characters',
        labelConfirm: 'Confirm password',
        placeholderConfirm: 'Repeat your password',
        errorShort: 'Password must be at least 8 characters.',
        errorMismatch: 'Passwords do not match.',
        errorGeneric: 'An error occurred. Please try again.',
        saving: 'Saving…',
        cta: 'Create account and sign in',
        redirecting: 'Redirecting to dashboard…',
    },
    pt: {
        title: 'Crie sua senha',
        subtitle: 'Escolha uma senha para acessar o dashboard do Argo.',
        labelPassword: 'Senha',
        placeholderPassword: 'Mínimo 8 caracteres',
        labelConfirm: 'Confirmar senha',
        placeholderConfirm: 'Repita sua senha',
        errorShort: 'A senha deve ter pelo menos 8 caracteres.',
        errorMismatch: 'As senhas não coincidem.',
        errorGeneric: 'Ocorreu um erro. Tente novamente.',
        saving: 'Salvando…',
        cta: 'Criar conta e entrar',
        redirecting: 'Acessando o dashboard…',
    },
};

export const SetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rawLang = searchParams.get('lang') ?? 'es';
    const lang: Lang = (['es', 'en', 'pt'] as const).includes(rawLang as Lang) ? (rawLang as Lang) : 'es';
    const c = COPY[lang];

    const [stage, setStage] = useState<Stage>('waiting');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [fieldError, setFieldError] = useState('');

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') setStage('form');
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setStage('form');
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError('');

        if (password.length < 8) { setFieldError(c.errorShort); return; }
        if (password !== confirm) { setFieldError(c.errorMismatch); return; }

        setStage('saving');
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) { setFieldError(updateError.message); setStage('form'); return; }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetch('/api/accept-invite', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
            }

            setStage('done');
            setTimeout(() => navigate('/dashboard'), 1200);
        } catch {
            setFieldError(c.errorGeneric);
            setStage('form');
        }
    };

    if (stage === 'waiting') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-bg">
                <div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (stage === 'done') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-bg">
                <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg mx-auto">✓</div>
                    <p className="text-sm font-medium text-argo-navy">{c.redirecting}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-argo-bg p-6">
            <div className="bg-white rounded-[14px] shadow-argo p-8 w-full max-w-sm space-y-6">
                <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span>
                        <span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                    <span className="text-[9px] font-semibold bg-argo-violet-100 text-argo-violet-500 px-1.5 py-0.5 rounded tracking-wide">beta</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-argo-navy">{c.title}</h1>
                    <p className="text-sm text-argo-grey mt-1">{c.subtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-semibold text-argo-light uppercase tracking-widest mb-1">
                            {c.labelPassword}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder={c.placeholderPassword}
                            className="w-full rounded-lg border border-argo-border bg-argo-bg px-3.5 py-2.5 text-sm outline-none focus:border-argo-violet-300 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-argo-light uppercase tracking-widest mb-1">
                            {c.labelConfirm}
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            placeholder={c.placeholderConfirm}
                            className="w-full rounded-lg border border-argo-border bg-argo-bg px-3.5 py-2.5 text-sm outline-none focus:border-argo-violet-300 transition-colors"
                        />
                    </div>

                    {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}

                    <button
                        type="submit"
                        disabled={stage === 'saving'}
                        className="w-full py-2.5 rounded-lg bg-argo-navy text-white text-sm font-semibold hover:bg-argo-navy/90 transition-colors disabled:opacity-50"
                    >
                        {stage === 'saving' ? c.saving : c.cta}
                    </button>
                </form>
            </div>
        </div>
    );
};
