import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';

type Mode = 'password' | 'magic';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode]         = useState<Mode>('password');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [info, setInfo]         = useState('');
    const [loading, setLoading]   = useState(false);

    // Redirect when session is established — handles magic link callback too
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) navigate('/admin');
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            if (session) navigate('/admin');
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const handlePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (authError) setError('Credenciales incorrectas. Revisa tu email y contraseña.');
        // navigation handled by onAuthStateChange
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setError('');
        setInfo('');
        setLoading(true);
        const { error: authError } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin + '/admin/login' },
        });
        setLoading(false);
        if (authError) {
            setError(authError.message);
        } else {
            setInfo('Revisa tu email — te enviamos un link para ingresar directamente.');
        }
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setError('');
        setInfo('');
    };

    return (
        <div className="min-h-screen bg-argo-neutral flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            beta
                        </span>
                    </div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Plataforma</h1>
                </div>

                {/* Mode tabs */}
                <div className="flex bg-white border border-argo-border rounded-xl p-1 mb-4 gap-1">
                    {(['password', 'magic'] as Mode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                                mode === m
                                    ? 'bg-argo-navy text-white'
                                    : 'text-argo-grey hover:text-argo-navy'
                            }`}
                        >
                            {m === 'password' ? 'Contraseña' : 'Magic link'}
                        </button>
                    ))}
                </div>

                <div className="bg-white border border-argo-border rounded-2xl p-8 shadow-sm space-y-4">
                    {mode === 'password' ? (
                        <form onSubmit={handlePassword} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-argo-grey uppercase tracking-widest mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 focus:border-argo-indigo"
                                    placeholder="admin@argo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-argo-grey uppercase tracking-widest mb-1.5">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 focus:border-argo-indigo"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-argo-navy text-white font-bold py-3 rounded-lg text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                            >
                                {loading
                                    ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    : 'Ingresar'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMagicLink} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-argo-grey uppercase tracking-widest mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 focus:border-argo-indigo"
                                    placeholder="admin@argo.com"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                                    {error}
                                </p>
                            )}
                            {info && (
                                <p className="text-xs text-argo-navy bg-[#F0F0FF] border border-[#BBBCFF] rounded-lg px-4 py-2.5">
                                    {info}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full bg-argo-navy text-white font-bold py-3 rounded-lg text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                            >
                                {loading
                                    ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    : 'Enviar magic link'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-[10px] text-argo-grey/50 mt-6 uppercase tracking-widest">
                    Argo v{APP_VERSION}
                </p>
            </div>
        </div>
    );
};
