import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Google icon ───────────────────────────────────────────────────────────────

const GoogleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────

const Logo: React.FC = () => (
    <div className="flex items-center justify-center gap-1.5">
        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
        </span>
        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
            beta
        </span>
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const MAX_PLAYS = 3;

interface Props {
    onAuthenticated: () => void;
}

type Mode = 'login' | 'signup';

export const UserAuthGate: React.FC<Props> = ({ onAuthenticated }) => {
    const [mode, setMode]         = useState<Mode>('login');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [info, setInfo]         = useState('');
    const [loading, setLoading]   = useState(false);
    const [blocked, setBlocked]   = useState(false);

    const handleGoogle = async () => {
        setLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/app' },
        });
        // Page navigates away — no need to setLoading(false)
    };

    const handleEmail = async () => {
        if (!email || password.length < 6) return;
        setError('');
        setInfo('');
        setLoading(true);

        const { data, error: err } =
            mode === 'login'
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({ email, password });

        setLoading(false);

        if (err) {
            const msg = err.message.includes('Invalid login credentials')
                ? 'Email o contraseña incorrectos.'
                : err.message.includes('already registered')
                ? 'Ya existe una cuenta con ese email. Inicia sesión.'
                : err.message;
            setError(msg);
            return;
        }

        if (mode === 'signup' && !data.session) {
            // Email confirmation is enabled in Supabase — inform the user
            setInfo('Te enviamos un email de verificación. Confirma tu cuenta y vuelve aquí.');
            return;
        }

        // Check play limit immediately after auth
        const count = (data.user?.user_metadata?.play_count ?? 0) as number;
        if (count >= MAX_PLAYS) {
            setBlocked(true);
            return;
        }

        onAuthenticated();
    };

    const switchMode = () => {
        setMode(m => m === 'login' ? 'signup' : 'login');
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
                    <Logo />
                </div>

                {blocked ? (
                    /* Blocked message — shown immediately after auth */
                    <div style={{ background: '#fff', border: '1px solid #D2D2D7', borderRadius: '20px', padding: '32px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                        <h2 style={{ fontWeight: 300, fontSize: '22px', color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                            Ya completaste tus {MAX_PLAYS} experiencias
                        </h2>
                        <p style={{ fontWeight: 400, fontSize: '14px', color: '#86868B', lineHeight: 1.7, margin: 0 }}>
                            Cada cuenta puede usar Argo Method hasta {MAX_PLAYS} veces. Si necesitas más sesiones, contáctanos.
                        </p>
                    </div>
                ) : (
                    <>
                    {/* Nautical notice */}
                    <div style={{ background: 'rgba(187,188,255,0.25)', border: '1px solid rgba(187,188,255,0.6)', borderRadius: '16px', padding: '16px 20px' }}>
                        <p style={{ fontWeight: 300, fontSize: '15px', color: '#1D1D1F', lineHeight: 1.65, letterSpacing: '-0.01em', margin: 0 }}>
                            ¡Preparados para zarpar! Asegúrate de estar con el niño o la niña. Su interacción es la base de la Metodología Argo.
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

                        {/* Email + password */}
                        <div className="space-y-3">
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
                                : <>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} <ChevronRight size={15} /></>
                            }
                        </motion.button>
                    </div>

                    {/* Mode toggle */}
                    <p className="text-center" style={{ fontSize: '12px', color: '#86868B' }}>
                        {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                        <button onClick={switchMode} className="text-[#1D1D1F] font-medium underline">
                            {mode === 'login' ? 'Crear una' : 'Iniciar sesión'}
                        </button>
                    </p>
                    </>
                )}
            </motion.div>
        </div>
    );
};
