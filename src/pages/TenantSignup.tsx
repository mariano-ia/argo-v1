import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Google icon ─────────────────────────────────────────────────────────────

const GoogleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

type Mode = 'signup' | 'login';

export const TenantSignup: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get('plan') || 'trial';

    const [mode, setMode]         = useState<Mode>('signup');
    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [info, setInfo]         = useState('');
    const [loading, setLoading]   = useState(false);

    // If already logged in, try to create tenant and redirect
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                createTenantAndRedirect(data.session.user.id, data.session.user.email ?? '', data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Mi equipo');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                const googleName = session.user.user_metadata?.full_name as string | undefined;
                createTenantAndRedirect(
                    session.user.id,
                    session.user.email ?? '',
                    googleName || name || session.user.email?.split('@')[0] || 'Mi equipo',
                    googleName,
                );
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const createTenantAndRedirect = async (userId: string, userEmail: string, displayName: string, fullName?: string) => {
        try {
            const res = await fetch('/api/create-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_user_id: userId,
                    email: userEmail,
                    display_name: displayName,
                    full_name: fullName || null,
                }),
            });

            if (res.ok) {
                navigate('/dashboard', { replace: true });
            } else {
                const data = await res.json().catch(() => ({}));
                console.error('[TenantSignup] create-tenant failed:', data.error);
                // Still redirect — tenant might already exist
                navigate('/dashboard', { replace: true });
            }
        } catch {
            // Network error — still try to redirect
            navigate('/dashboard', { replace: true });
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/signup?plan=' + plan },
        });
    };

    const handleEmail = async () => {
        if (!email || password.length < 6) return;
        if (mode === 'signup' && !name.trim()) {
            setError('Ingresa tu nombre o el de tu organización.');
            return;
        }

        setError('');
        setInfo('');
        setLoading(true);

        if (mode === 'signup') {
            const { data, error: err } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name.trim() } },
            });

            setLoading(false);

            if (err) {
                setError(
                    err.message.includes('already registered')
                        ? 'Ya existe una cuenta con ese email. Inicia sesión.'
                        : err.message,
                );
                return;
            }

            if (!data.session) {
                setInfo('Te enviamos un email de verificación. Confirma tu cuenta y vuelve aquí.');
                return;
            }
            // onAuthStateChange will handle redirect
        } else {
            const { error: err } = await supabase.auth.signInWithPassword({ email, password });
            setLoading(false);

            if (err) {
                setError('Email o contraseña incorrectos.');
                return;
            }
            // onAuthStateChange will handle redirect
        }
    };

    const switchMode = () => {
        setMode(m => m === 'signup' ? 'login' : 'signup');
        setError('');
        setInfo('');
    };

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
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>beta</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#86868B', fontWeight: 400 }}>
                        {mode === 'signup' ? 'Crea tu cuenta para acceder al panel' : 'Ingresa a tu panel'}
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
                        <GoogleIcon /> Continuar con Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-[#D2D2D7]" />
                        <span style={{ fontSize: '11px', color: '#86868B', letterSpacing: '0.08em' }}>O</span>
                        <div className="flex-1 h-px bg-[#D2D2D7]" />
                    </div>

                    {/* Form fields */}
                    <div className="space-y-3">
                        {mode === 'signup' && (
                            <input
                                type="text"
                                placeholder="Tu nombre o el de tu organización"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none transition-colors"
                                style={{ border: '1px solid #D2D2D7' }}
                            />
                        )}
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none transition-colors"
                            style={{ border: '1px solid #D2D2D7' }}
                        />
                        <input
                            type="password"
                            placeholder="Contraseña (mínimo 6 caracteres)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEmail()}
                            className="w-full rounded-xl px-4 py-3 text-sm text-[#1D1D1F] focus:outline-none transition-colors"
                            style={{ border: '1px solid #D2D2D7' }}
                        />
                    </div>

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
                        disabled={loading || !email || password.length < 6}
                        className="w-full bg-[#1D1D1F] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 transition-all"
                    >
                        {loading
                            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            : <>{mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'} <ChevronRight size={15} /></>
                        }
                    </motion.button>
                </div>

                {/* Mode toggle */}
                <p className="text-center" style={{ fontSize: '12px', color: '#86868B' }}>
                    {mode === 'signup' ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                    <button onClick={switchMode} className="text-[#1D1D1F] font-medium underline">
                        {mode === 'signup' ? 'Iniciar sesión' : 'Crear una'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
};
