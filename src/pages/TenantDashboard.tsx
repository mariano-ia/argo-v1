import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';
import { ToastProvider } from '../components/ui/Toast';
import { useLang } from '../context/LangContext';
import { getDashboardT } from '../lib/dashboardTranslations';
import type { Session } from '@supabase/supabase-js';
import {
    LayoutDashboard, Link2, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen,
    Users, Compass, MessageCircle, Layers,
} from 'lucide-react';

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

const OTHER_LANGS: Record<string, [string, string]> = { es: ['en', 'pt'], en: ['es', 'pt'], pt: ['es', 'en'] };

export const TenantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { lang, setLang } = useLang();
    const dt = getDashboardT(lang);

    const NAV_MAIN = [
        { to: '/dashboard',          label: dt.nav.inicio,    icon: LayoutDashboard, end: true },
        { to: '/dashboard/players',  label: dt.nav.jugadores, icon: Users,           end: false },
        { to: '/dashboard/groups',   label: dt.nav.grupos,    icon: Layers,          end: false },
        { to: '/dashboard/guide',    label: dt.nav.guia,      icon: Compass,         end: false },
        { to: '/dashboard/chat',     label: dt.nav.chat,      icon: MessageCircle,   end: false },
    ];
    const NAV_CONFIG = [
        { to: '/dashboard/link',     label: dt.nav.miLink,    icon: Link2,           end: false },
        { to: '/dashboard/settings', label: dt.nav.ajustes,   icon: Settings,        end: false },
    ];

    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // DEV bypass
    const isDev = import.meta.env.DEV;
    const [devBypass] = useState(() => isDev && new URLSearchParams(window.location.search).has('dev'));

    useEffect(() => {
        if (devBypass) {
            setSession({} as Session);
            setTenant({ id: 'dev-tenant-000', slug: 'dev', display_name: 'Dev Tenant', plan: 'trial', credits_remaining: 99 });
            return;
        }
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTenant = React.useCallback(() => {
        if (!session || devBypass) return;
        supabase
            .from('tenants')
            .select('id, slug, display_name, plan, credits_remaining')
            .eq('auth_user_id', session.user.id)
            .single()
            .then(({ data }) => { if (data) setTenant(data); });
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
                {/* Logo */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center h-14 px-0' : 'gap-1 px-6 pt-7 pb-8'}`}>
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>A</span>
                        {!isCollapsed && <><span style={{ fontWeight: 800 }}>rgo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span></>}
                    </span>
                </div>

                {/* Nav — Principal */}
                <nav className={`flex-1 space-y-0.5 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
                    {!isCollapsed && (
                        <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.12em] px-3 mb-1.5">
                            {lang === 'en' ? 'Main' : lang === 'pt' ? 'Principal' : 'Principal'}
                        </p>
                    )}
                    {NAV_MAIN.map(item => <NavItem key={item.to} {...item} />)}

                    {!isCollapsed && (
                        <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.12em] px-3 mt-6 mb-1.5">
                            {lang === 'en' ? 'Settings' : lang === 'pt' ? 'Configuracao' : 'Configuracion'}
                        </p>
                    )}
                    {isCollapsed && <div className="h-px bg-argo-border mx-1 my-3 opacity-50" />}
                    {NAV_CONFIG.map(item => <NavItem key={item.to} {...item} />)}
                </nav>

                {/* Bottom section */}
                <div className={`pb-5 space-y-3 ${isCollapsed ? 'px-1.5' : 'px-4'}`}>
                    {/* Credits */}
                    {!isCollapsed && tenant && (
                        <div className="px-4 py-3 rounded-xl bg-argo-bg">
                            <p className="text-[24px] font-bold text-argo-navy leading-none">{tenant.credits_remaining}</p>
                            <p className="text-[11px] text-argo-grey mt-1">
                                {lang === 'en' ? 'credits available' : lang === 'pt' ? 'creditos disponiveis' : 'creditos disponibles'}
                            </p>
                        </div>
                    )}

                    {/* User + logout */}
                    {!isCollapsed && tenant && (
                        <div className="flex items-center gap-2.5 px-3 py-2">
                            <div className="w-[30px] h-[30px] rounded-full bg-argo-violet-100 text-argo-violet-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                                {initials}
                            </div>
                            <span className="text-xs font-medium text-argo-secondary truncate flex-1">{tenant.display_name}</span>
                            <button onClick={handleLogout} title={dt.nav.cerrarSesion} className="text-argo-light hover:text-argo-grey transition-colors">
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}

                    {isCollapsed && (
                        <button onClick={handleLogout} title={dt.nav.cerrarSesion} className="flex items-center justify-center py-2 w-full text-argo-light hover:text-argo-grey transition-colors">
                            <LogOut size={15} />
                        </button>
                    )}

                    {/* Collapse toggle */}
                    {!mobile && (
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            className={`flex items-center gap-2.5 py-2 rounded-[10px] text-[13px] font-medium text-argo-light hover:text-argo-grey transition-all w-full ${
                                isCollapsed ? 'justify-center px-0' : 'px-3'
                            }`}
                        >
                            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                            {!isCollapsed && (lang === 'en' ? 'Collapse' : lang === 'pt' ? 'Minimizar' : 'Minimizar')}
                        </button>
                    )}

                    {/* Language selector */}
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 px-3">
                            {(OTHER_LANGS[lang] ?? ['en', 'pt']).map(l => (
                                <button key={l} onClick={() => setLang(l as 'es' | 'en' | 'pt')} className="text-[11px] font-medium text-argo-light hover:text-argo-navy transition-colors uppercase tracking-wide">
                                    {l}
                                </button>
                            ))}
                            <span className="text-[11px] font-bold text-argo-navy uppercase tracking-wide">{lang}</span>
                        </div>
                    )}

                    {!isCollapsed && (
                        <p className="text-[9px] text-argo-light/40 uppercase tracking-widest px-3">v{APP_VERSION}</p>
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
                    <button onClick={() => setSidebarOpen(true)} className="text-argo-grey">
                        <Menu size={20} />
                    </button>
                    <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:px-12 md:py-10">
                    <Outlet context={{ tenant, refreshTenant: fetchTenant, dt, lang }} />
                </main>
            </div>
        </div>
        </ToastProvider>
    );
};
