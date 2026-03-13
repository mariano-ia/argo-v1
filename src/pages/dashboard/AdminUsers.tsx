import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';

interface AdminUser {
    id: string;
    email: string;
    created_at: string;
}

export const AdminUsers: React.FC = () => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [currentEmail, setCurrentEmail] = useState('');

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? '';
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setCurrentEmail(data.session?.user.email ?? '');
        });
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/admin-users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAdmins(data.admins);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setCreating(true);

        try {
            const token = await getToken();
            const res = await fetch('/api/admin-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error al crear admin');
                return;
            }

            setAdmins(prev => [...prev, data.admin]);
            setEmail('');
            setPassword('');
            setSuccess(`Admin ${data.admin.email} creado exitosamente.`);
            setTimeout(() => setSuccess(''), 4000);
        } catch {
            setError('Error de conexión');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (admin: AdminUser) => {
        setConfirmingId(null);
        try {
            const token = await getToken();
            const res = await fetch('/api/admin-users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: admin.email }),
            });

            if (res.ok) {
                setAdmins(prev => prev.filter(a => a.id !== admin.id));
            } else {
                const data = await res.json();
                setError(data.error || 'Error al eliminar');
                setTimeout(() => setError(''), 4000);
            }
        } catch {
            setError('Error de conexión');
            setTimeout(() => setError(''), 4000);
        }
    };

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-argo-navy">Usuarios admin</h1>
                <p className="text-sm text-argo-grey mt-0.5">
                    Los usuarios admin pueden acceder al panel de administración completo.
                </p>
            </div>

            {/* Create form */}
            <div className="bg-white border border-argo-border rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Plus size={15} className="text-argo-grey" />
                    <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">
                        Agregar admin
                    </h2>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="Email"
                        className="flex-1 border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 focus:border-argo-indigo"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Contraseña (min. 6 caracteres)"
                        className="flex-1 border border-argo-border rounded-lg px-4 py-2.5 text-sm text-argo-navy focus:outline-none focus:ring-2 focus:ring-argo-indigo/30 focus:border-argo-indigo"
                    />
                    <button
                        type="submit"
                        disabled={creating}
                        className="px-5 py-2.5 text-sm font-semibold bg-argo-navy text-white rounded-lg hover:bg-argo-navy/90 transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                    >
                        {creating ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                            <Plus size={14} />
                        )}
                        Crear
                    </button>
                </form>

                {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mt-3">
                        {error}
                    </p>
                )}
                {success && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mt-3">
                        {success}
                    </p>
                )}
            </div>

            {/* Admin list */}
            <div className="bg-white border border-argo-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-argo-border flex items-center gap-2">
                    <ShieldCheck size={15} className="text-argo-grey" />
                    <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">
                        Admins activos
                    </h2>
                    <span className="text-xs text-argo-grey ml-auto">
                        {loading ? '…' : `${admins.length} usuario${admins.length !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                    </div>
                ) : admins.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-argo-grey">No hay usuarios admin registrados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-argo-border">
                        {admins.map(admin => (
                            <div
                                key={admin.id}
                                className="px-6 py-4 flex items-center justify-between hover:bg-argo-neutral/50 transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-argo-navy">
                                        {admin.email}
                                        {admin.email === currentEmail && (
                                            <span className="ml-2 text-[10px] font-bold text-argo-indigo bg-[#F0F0FF] px-2 py-0.5 rounded-full">
                                                Vos
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-argo-grey/60 mt-0.5">
                                        Desde {fmt(admin.created_at)}
                                    </p>
                                </div>

                                {admin.email !== currentEmail && (
                                    <div>
                                        {confirmingId === admin.id ? (
                                            <span className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(admin)}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingId(null)}
                                                    className="text-xs text-argo-grey hover:text-argo-navy transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmingId(admin.id)}
                                                className="text-argo-grey/40 hover:text-red-500 transition-colors p-1"
                                                title="Quitar acceso admin"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
