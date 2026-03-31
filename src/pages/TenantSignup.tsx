import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';

// ─── Google icon ─────────────────────────────────────────────────────────────

const GoogleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// ─── i18n ────────────────────────────────────────────────────────────────────

const T = {
    es: {
        signupTitle: 'Crea tu cuenta',
        signupSubtitle: 'Comienza tu periodo de prueba de 14 días gratis.',
        loginTitle: 'Bienvenido de vuelta',
        loginSubtitle: 'Ingresa a tu panel.',
        google: 'Continuar con Google',
        or: 'O',
        nameLabel: 'Nombre de tu equipo o institución',
        namePlaceholder: 'Ej: Club Atlético Rosario',
        emailLabel: 'Email',
        emailPlaceholder: 'tu@email.com',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: 'Mínimo 6 caracteres',
        confirmLabel: 'Confirmar contraseña',
        confirmPlaceholder: 'Repite tu contraseña',
        createAccount: 'Crear cuenta',
        login: 'Iniciar sesión',
        hasAccount: '¿Ya tienes cuenta?',
        noAccount: '¿No tienes cuenta?',
        loginLink: 'Iniciar sesión',
        signupLink: 'Crear una',
        forgotPassword: '¿Olvidaste tu contraseña?',
        forgotSent: 'Te enviamos un email para restablecer tu contraseña.',
        required: 'obligatorio',
        errorName: 'Ingresa el nombre de tu equipo o institución.',
        errorPasswordMatch: 'Las contraseñas no coinciden.',
        errorPasswordShort: 'La contraseña debe tener al menos 6 caracteres.',
        errorAlreadyRegistered: 'Ya existe una cuenta con ese email. Inicia sesión.',
        errorLogin: 'Email o contraseña incorrectos.',
        errorGeneric: 'Ocurrió un error. Intenta de nuevo.',
        verifyEmail: 'Te enviamos un email de verificación. Confirma tu cuenta y vuelve aquí.',
        terms: 'Al crear tu cuenta aceptas los',
        termsLink: 'Términos de Servicio',
        and: 'y la',
        privacyLink: 'Política de Privacidad',
    },
    en: {
        signupTitle: 'Create your account',
        signupSubtitle: 'Start your 14-day free trial.',
        loginTitle: 'Welcome back',
        loginSubtitle: 'Sign in to your dashboard.',
        google: 'Continue with Google',
        or: 'Or',
        nameLabel: 'Team or institution name',
        namePlaceholder: 'E.g.: Rosario Athletic Club',
        emailLabel: 'Email',
        emailPlaceholder: 'you@email.com',
        passwordLabel: 'Password',
        passwordPlaceholder: 'At least 6 characters',
        confirmLabel: 'Confirm password',
        confirmPlaceholder: 'Repeat your password',
        createAccount: 'Create account',
        login: 'Sign in',
        hasAccount: 'Already have an account?',
        noAccount: "Don't have an account?",
        loginLink: 'Sign in',
        signupLink: 'Create one',
        forgotPassword: 'Forgot your password?',
        forgotSent: 'We sent you an email to reset your password.',
        required: 'required',
        errorName: 'Enter your team or institution name.',
        errorPasswordMatch: 'Passwords do not match.',
        errorPasswordShort: 'Password must be at least 6 characters.',
        errorAlreadyRegistered: 'An account with this email already exists. Sign in.',
        errorLogin: 'Incorrect email or password.',
        errorGeneric: 'An error occurred. Try again.',
        verifyEmail: 'We sent you a verification email. Confirm your account and come back.',
        terms: 'By creating your account you agree to the',
        termsLink: 'Terms of Service',
        and: 'and the',
        privacyLink: 'Privacy Policy',
    },
    pt: {
        signupTitle: 'Crie sua conta',
        signupSubtitle: 'Comece seu período de teste de 14 dias grátis.',
        loginTitle: 'Bem-vindo de volta',
        loginSubtitle: 'Entre no seu painel.',
        google: 'Continuar com Google',
        or: 'Ou',
        nameLabel: 'Nome do seu time ou instituição',
        namePlaceholder: 'Ex: Clube Atlético Rosário',
        emailLabel: 'Email',
        emailPlaceholder: 'seu@email.com',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Mínimo 6 caracteres',
        confirmLabel: 'Confirmar senha',
        confirmPlaceholder: 'Repita sua senha',
        createAccount: 'Criar conta',
        login: 'Entrar',
        hasAccount: 'Já tem uma conta?',
        noAccount: 'Não tem uma conta?',
        loginLink: 'Entrar',
        signupLink: 'Criar uma',
        forgotPassword: 'Esqueceu sua senha?',
        forgotSent: 'Enviamos um email para redefinir sua senha.',
        required: 'obrigatório',
        errorName: 'Insira o nome do seu time ou instituição.',
        errorPasswordMatch: 'As senhas não coincidem.',
        errorPasswordShort: 'A senha deve ter pelo menos 6 caracteres.',
        errorAlreadyRegistered: 'Já existe uma conta com esse email. Entre.',
        errorLogin: 'Email ou senha incorretos.',
        errorGeneric: 'Ocorreu um erro. Tente novamente.',
        verifyEmail: 'Enviamos um email de verificação. Confirme sua conta e volte aqui.',
        terms: 'Ao criar sua conta você aceita os',
        termsLink: 'Termos de Serviço',
        and: 'e a',
        privacyLink: 'Política de Privacidade',
    },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ label: string; required?: boolean; requiredText: string }> = ({ label, required, requiredText }) => (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-argo-light uppercase tracking-[0.08em] mb-1.5">
        {label}
        {required && <span className="text-[10px] font-medium text-argo-violet-500 normal-case tracking-normal">({requiredText})</span>}
    </label>
);

const PasswordInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ value, onChange, placeholder, onKeyDown }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-argo-violet-300 focus:border-argo-violet-400 transition-colors"
                style={{ border: '1px solid #D2D2D7' }}
            />
            <button
                type="button"
                onClick={() => setVisible(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-argo-light hover:text-argo-grey transition-colors"
                tabIndex={-1}
            >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────

type Mode = 'signup' | 'login';

export const TenantSignup: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { lang } = useLang();
    const t = T[lang as keyof typeof T] ?? T.es;
    const plan = searchParams.get('plan') || 'trial';

    const [mode, setMode]             = useState<Mode>(searchParams.get('login') === '1' ? 'login' : 'signup');
    const [name, setName]             = useState('');
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [confirmPw, setConfirmPw]   = useState('');
    const [error, setError]           = useState('');
    const [info, setInfo]             = useState('');
    const [loading, setLoading]       = useState(false);

    // Password strength
    const pwLength = password.length >= 6;
    const pwMatch = password === confirmPw && confirmPw.length > 0;

    // If already logged in, try to create tenant and redirect
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                createTenantAndRedirect(data.session.user.id, data.session.user.email ?? '', data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Mi equipo');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                const googleName = (session.user.user_metadata?.full_name || session.user.user_metadata?.name) as string | undefined;
                createTenantAndRedirect(
                    session.user.id,
                    session.user.email ?? '',
                    googleName || name || session.user.email?.split('@')[0] || 'Mi equipo',
                    googleName,
                );
            }
        });

        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const createTenantAndRedirect = async (userId: string, userEmail: string, displayName: string, fullName?: string) => {
        try {
            await fetch('/api/create-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth_user_id: userId, email: userEmail, display_name: displayName, full_name: fullName || null }),
            });
        } catch { /* proceed anyway */ }
        navigate('/dashboard', { replace: true });
    };

    const handleGoogle = async () => {
        setLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/signup?plan=' + plan },
        });
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError(lang === 'en' ? 'Enter your email first.' : lang === 'pt' ? 'Insira seu email primeiro.' : 'Ingresa tu email primero.');
            return;
        }
        setError('');
        setLoading(true);
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/set-password',
        });
        setLoading(false);
        setInfo(t.forgotSent);
    };

    const handleEmail = async () => {
        setError('');
        setInfo('');

        if (mode === 'signup') {
            if (!name.trim()) { setError(t.errorName); return; }
            if (!pwLength) { setError(t.errorPasswordShort); return; }
            if (!pwMatch) { setError(t.errorPasswordMatch); return; }
        } else {
            if (password.length < 1) return;
        }

        setLoading(true);

        if (mode === 'signup') {
            const { data, error: err } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name.trim() } },
            });
            setLoading(false);

            if (err) {
                setError(err.message.includes('already registered') ? t.errorAlreadyRegistered : t.errorGeneric);
                return;
            }
            if (!data.session) {
                setInfo(t.verifyEmail);
                return;
            }
        } else {
            const { error: err } = await supabase.auth.signInWithPassword({ email, password });
            setLoading(false);
            if (err) { setError(t.errorLogin); return; }
        }
    };

    const switchMode = () => {
        setMode(m => m === 'signup' ? 'login' : 'signup');
        setError('');
        setInfo('');
        setConfirmPw('');
    };

    const canSubmit = mode === 'login'
        ? email && password.length >= 1
        : email && name.trim() && pwLength && pwMatch;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4"
             style={{ backgroundColor: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-5"
            >
                {/* Logo */}
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center justify-center gap-1.5 mb-2">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>beta</span>
                    </Link>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1D1D1F', marginBottom: '2px' }}>
                        {mode === 'signup' ? t.signupTitle : t.loginTitle}
                    </p>
                    <p style={{ fontSize: '13px', color: '#86868B', fontWeight: 400 }}>
                        {mode === 'signup' ? t.signupSubtitle : t.loginSubtitle}
                    </p>
                </div>

                {/* Auth card */}
                <div style={{ background: '#fff', border: '1px solid #D2D2D7', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                     className="space-y-4">

                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
                        style={{ border: '1px solid #D2D2D7' }}
                    >
                        <GoogleIcon /> {t.google}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-[#D2D2D7]" />
                        <span style={{ fontSize: '11px', color: '#86868B', letterSpacing: '0.08em' }}>{t.or}</span>
                        <div className="flex-1 h-px bg-[#D2D2D7]" />
                    </div>

                    {/* Form fields */}
                    <div className="space-y-3">
                        {mode === 'signup' && (
                            <div>
                                <FieldLabel label={t.nameLabel} required requiredText={t.required} />
                                <input
                                    type="text"
                                    placeholder={t.namePlaceholder}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-argo-violet-300 focus:border-argo-violet-400 transition-colors"
                                    style={{ border: '1px solid #D2D2D7' }}
                                />
                            </div>
                        )}
                        <div>
                            {mode === 'signup' && <FieldLabel label={t.emailLabel} required requiredText={t.required} />}
                            <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-argo-violet-300 focus:border-argo-violet-400 transition-colors"
                                style={{ border: '1px solid #D2D2D7' }}
                            />
                        </div>
                        <div>
                            {mode === 'signup' && <FieldLabel label={t.passwordLabel} required requiredText={t.required} />}
                            <PasswordInput
                                value={password}
                                onChange={setPassword}
                                placeholder={mode === 'signup' ? t.passwordPlaceholder : t.passwordLabel}
                                onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleEmail()}
                            />
                            {/* Password strength indicator (signup only) */}
                            {mode === 'signup' && password.length > 0 && (
                                <div className="flex items-center gap-2 mt-1.5 px-1">
                                    <div className="flex-1 h-1 rounded-full bg-argo-border overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${password.length >= 8 ? 'bg-green-500 w-full' : pwLength ? 'bg-amber-400 w-2/3' : 'bg-red-400 w-1/3'}`}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium ${pwLength ? 'text-green-600' : 'text-argo-light'}`}>
                                        {password.length >= 8
                                            ? (lang === 'en' ? 'Strong' : lang === 'pt' ? 'Forte' : 'Fuerte')
                                            : pwLength
                                                ? 'OK'
                                                : (lang === 'en' ? 'Too short' : lang === 'pt' ? 'Muito curta' : 'Muy corta')
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                        {mode === 'signup' && (
                            <div>
                                <FieldLabel label={t.confirmLabel} required requiredText={t.required} />
                                <PasswordInput
                                    value={confirmPw}
                                    onChange={setConfirmPw}
                                    placeholder={t.confirmPlaceholder}
                                    onKeyDown={e => e.key === 'Enter' && handleEmail()}
                                />
                                {confirmPw.length > 0 && !pwMatch && (
                                    <p className="text-[10px] text-red-500 mt-1 px-1">{t.errorPasswordMatch}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Forgot password (login mode) */}
                    {mode === 'login' && (
                        <button
                            onClick={handleForgotPassword}
                            className="text-[12px] text-argo-grey hover:text-argo-navy transition-colors"
                        >
                            {t.forgotPassword}
                        </button>
                    )}

                    {error && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
                           style={{ border: '1px solid #FCD34D' }}>
                            {error}
                        </p>
                    )}
                    {info && (
                        <p className="text-xs text-[#424245] bg-[#F5F5F7] rounded-lg px-3 py-2"
                           style={{ border: '1px solid #D2D2D7' }}>
                            {info}
                        </p>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEmail}
                        disabled={loading || !canSubmit}
                        className="w-full bg-[#1D1D1F] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 transition-all"
                    >
                        {loading
                            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            : <>{mode === 'signup' ? t.createAccount : t.login} <ChevronRight size={15} /></>
                        }
                    </motion.button>

                    {/* Terms (signup only) */}
                    {mode === 'signup' && (
                        <p className="text-[11px] text-argo-light text-center leading-relaxed">
                            {t.terms}{' '}
                            <Link to="/terms" className="underline hover:text-argo-navy transition-colors">{t.termsLink}</Link>
                            {' '}{t.and}{' '}
                            <Link to="/privacy" className="underline hover:text-argo-navy transition-colors">{t.privacyLink}</Link>.
                        </p>
                    )}
                </div>

                {/* Mode toggle */}
                <p className="text-center" style={{ fontSize: '12px', color: '#86868B' }}>
                    {mode === 'signup' ? t.hasAccount : t.noAccount}{' '}
                    <button onClick={switchMode} className="text-[#1D1D1F] font-medium underline">
                        {mode === 'signup' ? t.loginLink : t.signupLink}
                    </button>
                </p>
            </motion.div>
        </div>
    );
};
