import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../components/ui/Toast';
import { Tooltip } from '../components/ui/Tooltip';
import { useLang } from '../context/LangContext';
import { getDashboardT } from '../lib/dashboardTranslations';
import { TenantOnboarding } from './tenant/TenantOnboarding';
import type { Session } from '@supabase/supabase-js';
import {
    LayoutDashboard, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen,
    Users, Compass, MessageCircle, Layers, UserPlus, User,
} from 'lucide-react';

export interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
    institution_type?: string | null;
    sport?: string | null;
    country?: string | null;
    city?: string | null;
    logo_url?: string | null;
    onboarding_completed: boolean;
}


export const TenantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const NAV_MAIN = [
        { to: '/dashboard',          label: dt.nav.inicio,    icon: LayoutDashboard, end: true },
        { to: '/dashboard/players',  label: dt.nav.jugadores, icon: Users,           end: false },
        { to: '/dashboard/groups',   label: dt.nav.grupos,    icon: Layers,          end: false },
        { to: '/dashboard/guide',    label: dt.nav.guia,      icon: Compass,         end: false },
        { to: '/dashboard/chat',     label: dt.nav.chat,      icon: MessageCircle,   end: false },
    ];
    const NAV_CONFIG = [
        { to: '/dashboard/users',    label: dt.nav.usuarios,  icon: UserPlus,        end: false },
        { to: '/dashboard/settings', label: dt.nav.ajustes,   icon: Settings,        end: false },
    ];

    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // DEV bypass — only on localhost, never on deployed previews
    const [devBypass] = useState(() =>
        import.meta.env.DEV
        && window.location.hostname === 'localhost'
        && new URLSearchParams(window.location.search).has('dev')
    );

    useEffect(() => {
        if (devBypass) {
            setSession({} as Session);
            const forceOnboarding = new URLSearchParams(window.location.search).has('onboarding');
            setTenant({ id: 'dev-tenant-000', slug: 'dev', display_name: 'Dev Tenant', plan: 'trial', credits_remaining: 99, onboarding_completed: !forceOnboarding });
            return;
        }
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTenant = React.useCallback(async () => {
        if (!session || devBypass) return;
        // Use server endpoint so tenant_members RLS is bypassed (service role key)
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) return;
        try {
            const res = await fetch('/api/tenant-info', {
                headers: { Authorization: `Bearer ${authSession.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.tenant) setTenant(data.tenant);
            }
        } catch { /* silently fail */ }
    }, [session, devBypass]);

    useEffect(() => { fetchTenant(); }, [fetchTenant]);

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    // Loading
    if (session === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-bg">
                <div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!session) return <Navigate to="/signup" replace />;

    const initials = tenant?.display_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '';

    /* ── Nav item renderer ─────────────────────────────────────────────────── */
    const NavItem = ({ to, label, icon: Icon, end }: { to: string; label: string; icon: React.FC<{ size?: number | string }>; end: boolean }) => (
        <NavLink
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            title={collapsed && !sidebarOpen ? label : undefined}
            className={({ isActive }) =>
                `group relative flex items-center gap-2.5 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                    collapsed && !sidebarOpen ? 'justify-center px-0' : 'px-3'
                } ${
                    isActive
                        ? 'text-argo-violet-500 bg-argo-violet-50'
                        : 'text-argo-grey hover:text-argo-navy hover:bg-argo-bg'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-argo-violet-500" />}
                    <Icon size={16} />
                    {(!collapsed || sidebarOpen) && label}
                    {collapsed && !sidebarOpen && (
                        <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-argo-navy text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            {label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );

    /* ── Sidebar ───────────────────────────────────────────────────────────── */
    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => {
        const isCollapsed = collapsed && !mobile;
        return (
            <aside className={`flex flex-col h-full bg-white border-r border-argo-border flex-shrink-0 transition-all duration-200 ${
                mobile ? 'w-[220px]' : isCollapsed ? 'w-14' : 'w-[220px]'
            }`}>
                {/* Logo + collapse toggle */}
                {isCollapsed ? (
                    <div className="flex flex-col items-center pt-5 pb-3 gap-3">
                        <Tooltip text={dt.nav.inicio} position="right">
                            <button onClick={() => setCollapsed(false)} className="text-argo-light hover:text-argo-grey transition-colors p-1.5 rounded-lg hover:bg-argo-bg">
                                <PanelLeftOpen size={16} />
                            </button>
                        </Tooltip>
                        {/* Institution logo — collapsed */}
                        {tenant && (
                            <Tooltip text={tenant.display_name} position="right">
                                {tenant.logo_url ? (
                                    <img
                                        src={tenant.logo_url}
                                        alt={tenant.display_name}
                                        className="w-8 h-8 rounded-[8px] object-contain border border-argo-border bg-white"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-[8px] bg-argo-violet-100 text-argo-violet-500 flex items-center justify-center text-[11px] font-bold">
                                        {initials}
                                    </div>
                                )}
                            </Tooltip>
                        )}
                        <div className="w-6 h-px bg-argo-border" />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between px-6 pt-7 pb-4">
                            <div className="flex items-center gap-1.5">
                                <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                                    <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                                </span>
                                <span className="text-[9px] font-semibold bg-argo-violet-100 text-argo-violet-500 px-1.5 py-0.5 rounded tracking-wide">beta</span>
                            </div>
                            {!mobile && (
                                <Tooltip text={lang === 'en' ? 'Collapse' : lang === 'pt' ? 'Recolher' : 'Colapsar'}>
                                    <button onClick={() => setCollapsed(true)} className="text-argo-light hover:text-argo-grey transition-colors p-1 rounded-lg hover:bg-argo-bg">
                                        <PanelLeftClose size={16} />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                        {/* Institution block */}
                        {tenant && (
                            <div className="px-4 pb-4">
                                <div className="flex items-center gap-2.5 px-2 py-2 rounded-[10px]">
                                    {tenant.logo_url ? (
                                        <img
                                            src={tenant.logo_url}
                                            alt={tenant.display_name}
                                            className="w-8 h-8 rounded-[8px] object-contain border border-argo-border bg-white flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-[8px] bg-argo-violet-100 text-argo-violet-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                                            {initials}
                                        </div>
                                    )}
                                    <span className="text-[13px] font-semibold text-argo-navy truncate">{tenant.display_name}</span>
                                </div>
                                <div className="mx-2 mt-1 h-px bg-argo-border" />
                            </div>
                        )}
                    </>
                )}

                {/* Nav — Principal */}
                <nav className={`flex-1 space-y-0.5 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
                    {NAV_MAIN.map(item => <NavItem key={item.to} {...item} />)}

                    {/* Separator */}
                    <div className={`${isCollapsed ? 'mx-1 my-4' : 'mx-3 my-5'}`}>
                        <div className="h-px bg-argo-border opacity-60" />
                    </div>

                    {NAV_CONFIG.map(item => <NavItem key={item.to} {...item} />)}
                </nav>

                {/* Bottom section */}
                <div className={`pb-5 space-y-3 ${isCollapsed ? 'px-1.5' : 'px-4'}`}>
                    {/* User + logout — always visible when sidebar is expanded */}
                    {!isCollapsed && (
                        <div className="flex items-center gap-2.5 px-3 py-2">
                            <div className="w-[28px] h-[28px] rounded-full bg-argo-bg border border-argo-border text-argo-grey flex items-center justify-center flex-shrink-0">
                                <User size={13} />
                            </div>
                            <span className="text-xs font-medium text-argo-secondary truncate flex-1">
                                {session?.user?.email ?? ''}
                            </span>
                            <Tooltip text={dt.nav.cerrarSesion}>
                                <button onClick={handleLogout} className="text-argo-light hover:text-argo-grey transition-colors flex-shrink-0">
                                    <LogOut size={14} />
                                </button>
                            </Tooltip>
                        </div>
                    )}

                    {isCollapsed && (
                        <Tooltip text={dt.nav.cerrarSesion} position="right">
                            <button onClick={handleLogout} className="flex items-center justify-center py-2 w-full text-argo-light hover:text-argo-grey transition-colors">
                                <LogOut size={15} />
                            </button>
                        </Tooltip>
                    )}

                </div>
            </aside>
        );
    };

    return (
        <ToastProvider>
        <div className="flex h-screen bg-argo-bg overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-50 flex">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Mobile topbar */}
                <div className="md:hidden h-14 flex items-center gap-3 px-4 bg-white border-b border-argo-border">
                    <Tooltip text="Menu" position="bottom">
                        <button onClick={() => setSidebarOpen(true)} className="text-argo-grey">
                            <Menu size={20} />
                        </button>
                    </Tooltip>
                    <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                    <span className="text-[9px] font-semibold bg-argo-violet-100 text-argo-violet-500 px-1.5 py-0.5 rounded tracking-wide">beta</span>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:px-12 md:py-10">
                    {tenant && !tenant.onboarding_completed ? (
                        <TenantOnboarding tenant={tenant} onComplete={fetchTenant} lang={lang} />
                    ) : (
                        <Outlet context={{ tenant, refreshTenant: fetchTenant, dt, lang }} />
                    )}
                </main>
            </div>
        </div>
        </ToastProvider>
    );
};
