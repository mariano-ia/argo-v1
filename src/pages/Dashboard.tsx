import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';
import {
    Users, BarChart2, HelpCircle, ShieldCheck, MessageCircle, LogOut, Menu, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/admin/sessions',  label: 'Sesiones',  icon: Users },
    { to: '/admin/metrics',   label: 'Métricas',  icon: BarChart2 },
    { to: '/admin/feedback',  label: 'Feedback',  icon: MessageCircle },
    { to: '/admin/questions', label: 'Preguntas', icon: HelpCircle },
    { to: '/admin/users',     label: 'Admins',    icon: ShieldCheck },
];

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <aside
            className={`flex flex-col h-full bg-white border-r border-argo-border flex-shrink-0 transition-all duration-200 ${
                mobile ? 'w-56' : collapsed ? 'w-14' : 'w-56'
            }`}
        >
            {/* Logo */}
            <div className={`h-14 flex items-center border-b border-argo-border ${collapsed && !mobile ? 'justify-center px-0' : 'gap-2 px-5'}`}>
                <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>A</span>{!collapsed || mobile ? <><span style={{ fontWeight: 800 }}>rgo</span><span style={{ fontWeight: 100 }}> Method</span></> : null}
                </span>
                {(!collapsed || mobile) && (
                    <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>beta</span>
                )}
            </div>

            {/* Nav */}
            <nav className={`flex-1 py-4 space-y-0.5 ${collapsed && !mobile ? 'px-1.5' : 'px-3'}`}>
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
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
                        {/* Tooltip on hover when collapsed */}
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
                {/* Collapse toggle (desktop only) */}
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
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
