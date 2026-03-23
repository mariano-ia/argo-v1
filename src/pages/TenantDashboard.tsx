import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';
import { ToastProvider } from '../components/ui/Toast';
import type { Session } from '@supabase/supabase-js';
import {
    Home, Link2, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Users, BookOpen, UserCircle, MessageCircle,
} from 'lucide-react';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

const NAV_ITEMS = [
    { to: '/dashboard',          label: 'Inicio',  icon: Home,     end: true },
    { to: '/dashboard/players',  label: 'Jugadores', icon: UserCircle, end: false },
    { to: '/dashboard/groups',   label: 'Grupos',    icon: Users,      end: false },
    { to: '/dashboard/guide',    label: 'Guía',      icon: BookOpen,     end: false },
    { to: '/dashboard/chat',     label: 'Chat',      icon: MessageCircle, end: false },
    { to: '/dashboard/link',     label: 'Mi link',   icon: Link2,         end: false },
    { to: '/dashboard/settings', label: 'Ajustes', icon: Settings, end: false },
];

export const TenantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // DEV bypass: skip auth, load fake tenant
    const isDev = import.meta.env.DEV;
    const [devBypass] = useState(() => isDev && new URLSearchParams(window.location.search).has('dev'));

    useEffect(() => {
        if (devBypass) {
            setSession({} as Session); // truthy placeholder
            setTenant({
                id: 'dev-tenant-000',
                slug: 'dev',
                display_name: 'Dev Tenant',
                plan: 'trial',
                credits_remaining: 99,
            });
            return;
        }
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load tenant data once session is available
    const fetchTenant = React.useCallback(() => {
        if (!session || devBypass) return;
        supabase
            .from('tenants')
            .select('id, slug, display_name, plan, credits_remaining')
            .eq('auth_user_id', session.user.id)
            .single()
            .then(({ data }) => {
                if (data) setTenant(data);
            });
    }, [session, devBypass]);

    useEffect(() => {
        fetchTenant();
    }, [fetchTenant]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Loading
    if (session === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    // Not logged in
    if (!session) return <Navigate to="/signup" replace />;

    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <aside
            className={`flex flex-col h-full bg-white border-r border-argo-border flex-shrink-0 transition-all duration-200 ${
                mobile ? 'w-56' : collapsed ? 'w-14' : 'w-56'
            }`}
        >
            {/* Logo + tenant name */}
            <div className={`h-14 flex items-center border-b border-argo-border ${collapsed && !mobile ? 'justify-center px-0' : 'gap-2 px-5'}`}>
                <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>A</span>{!collapsed || mobile ? <><span style={{ fontWeight: 800 }}>rgo</span><span style={{ fontWeight: 100 }}> Method</span></> : null}
                </span>
                {(!collapsed || mobile) && (
                    <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>beta</span>
                )}
            </div>

            {/* Credits badge */}
            {(!collapsed || mobile) && tenant && (
                <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[#F0F0FF] border border-[#BBBCFF]/30">
                    <p className="text-[10px] text-argo-grey uppercase tracking-widest font-semibold">Créditos</p>
                    <p className="text-lg font-bold text-argo-navy">{tenant.credits_remaining}</p>
                </div>
            )}

            {/* Nav */}
            <nav className={`flex-1 py-4 space-y-0.5 ${collapsed && !mobile ? 'px-1.5' : 'px-3'}`}>
                {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed && !mobile ? label : undefined}
                        className={({ isActive }) =>
                            `group relative flex items-center gap-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                collapsed && !mobile ? 'justify-center px-0' : 'px-3'
                            } ${
                                isActive
                                    ? 'bg-argo-indigo text-white'
                                    : 'text-argo-grey hover:text-argo-navy hover:bg-argo-neutral'
                            }`
                        }
                    >
                        <Icon size={15} />
                        {(!collapsed || mobile) && label}
                        {collapsed && !mobile && (
                            <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-argo-navy text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                {label}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className={`pb-4 space-y-1 border-t border-argo-border pt-4 ${collapsed && !mobile ? 'px-1.5' : 'px-3'}`}>
                {!mobile && (
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Expandir menú' : 'Minimizar menú'}
                        className={`flex items-center gap-3 py-2 rounded-lg text-sm font-semibold text-argo-grey hover:text-argo-navy hover:bg-argo-neutral transition-all w-full ${
                            collapsed ? 'justify-center px-0' : 'px-3'
                        }`}
                    >
                        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                        {!collapsed && 'Minimizar'}
                    </button>
                )}
                <button
                    onClick={handleLogout}
                    title={collapsed && !mobile ? 'Salir' : undefined}
                    className={`group relative flex items-center gap-3 py-2 rounded-lg text-sm font-semibold text-argo-grey hover:text-red-500 hover:bg-red-50 transition-all w-full ${
                        collapsed && !mobile ? 'justify-center px-0' : 'px-3'
                    }`}
                >
                    <LogOut size={15} />
                    {(!collapsed || mobile) && 'Salir'}
                    {collapsed && !mobile && (
                        <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-argo-navy text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            Salir
                        </span>
                    )}
                </button>
                {(!collapsed || mobile) && (
                    <p className="text-[9px] text-argo-grey/40 uppercase tracking-widest px-3 pt-1">
                        v{APP_VERSION}
                    </p>
                )}
            </div>
        </aside>
    );

    return (
        <ToastProvider>
        <div className="flex h-screen bg-argo-neutral overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-50 flex">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile topbar */}
                <div className="md:hidden h-14 flex items-center gap-3 px-4 bg-white border-b border-argo-border">
                    <button onClick={() => setSidebarOpen(true)} className="text-argo-grey">
                        <Menu size={20} />
                    </button>
                    <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                    </span>
                    <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>beta</span>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet context={{ tenant, refreshTenant: fetchTenant }} />
                </main>
            </div>
        </div>
        </ToastProvider>
    );
};
