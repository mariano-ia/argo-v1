import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Stage = 'waiting' | 'form' | 'saving' | 'done' | 'error';

export const SetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [stage, setStage] = useState<Stage>('waiting');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [fieldError, setFieldError] = useState('');

    useEffect(() => {
        // Supabase JS client auto-exchanges the invite token from the URL hash
        // and fires onAuthStateChange with SIGNED_IN when ready.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                setStage('form');
            }
        });
        // If already signed in (rare — user refreshes the page after token was consumed)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setStage('form');
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError('');

        if (password.length < 8) {
            setFieldError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirm) {
            setFieldError('Las contraseñas no coinciden.');
            return;
        }

        setStage('saving');

        try {
            // Set the new password
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setFieldError(updateError.message);
                setStage('form');
                return;
            }

            // Link user to tenant (sets auth_user_id in tenant_members)
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
            setFieldError('Ocurrió un error. Intenta de nuevo.');
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
                    <p className="text-sm font-medium text-argo-navy">Accediendo al dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-argo-bg p-6">
            <div className="bg-white rounded-[14px] shadow-argo p-8 w-full max-w-sm space-y-6">
                {/* Logo */}
                <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span>
                        <span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                    <span className="text-[9px] font-semibold bg-argo-violet-100 text-argo-violet-500 px-1.5 py-0.5 rounded tracking-wide">beta</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-argo-navy">Crea tu contraseña</h1>
                    <p className="text-sm text-argo-grey mt-1">Elige una contraseña para acceder al dashboard de Argo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-semibold text-argo-light uppercase tracking-widest mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full rounded-lg border border-argo-border bg-argo-bg px-3.5 py-2.5 text-sm outline-none focus:border-argo-violet-300 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-argo-light uppercase tracking-widest mb-1">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            placeholder="Repite la contraseña"
                            className="w-full rounded-lg border border-argo-border bg-argo-bg px-3.5 py-2.5 text-sm outline-none focus:border-argo-violet-300 transition-colors"
                        />
                    </div>

                    {fieldError && (
                        <p className="text-xs text-red-600">{fieldError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={stage === 'saving'}
                        className="w-full py-2.5 rounded-lg bg-argo-navy text-white text-sm font-semibold hover:bg-argo-navy/90 transition-colors disabled:opacity-50"
                    >
                        {stage === 'saving' ? 'Guardando…' : 'Crear cuenta y entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
