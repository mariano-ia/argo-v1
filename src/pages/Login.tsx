import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (authError) {
            setError('Credenciales incorrectas. Revisá tu email y contraseña.');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-argo-neutral flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 100 }}>Argo</span><span style={{ fontWeight: 800 }}> Method</span>
                        </span>
                        <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            beta
                        </span>
                    </div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Dashboard</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border border-argo-border rounded-2xl p-8 shadow-sm space-y-4">
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
                        {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : 'Ingresar'}
                    </button>
                </form>

                <p className="text-center text-[10px] text-argo-grey/50 mt-6 uppercase tracking-widest">
                    Argo v{APP_VERSION}
                </p>
            </div>
        </div>
    );
};
