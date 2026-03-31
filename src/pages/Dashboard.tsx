import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';
import {
    Users, BarChart2, HelpCircle, ShieldCheck, MessageCircle, LogOut, Menu, PanelLeftClose, PanelLeftOpen, FileText, Building2, Cpu, DollarSign, ShoppingBag, ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/admin/sessions',  label: 'Sesiones',  icon: Users },
    { to: '/admin/tenants',   label: 'Tenants',   icon: Building2 },
    { to: '/admin/ai-usage',  label: 'Consumo IA', icon: Cpu },
    { to: '/admin/revenue',   label: 'Revenue',   icon: DollarSign },
    { to: '/admin/argo-one',  label: 'Argo One',  icon: ShoppingBag },
    { to: '/admin/metrics',   label: 'Métricas',  icon: BarChart2 },
    { to: '/admin/feedback',  label: 'Feedback',  icon: MessageCircle },
    { to: '/admin/questions', label: 'Preguntas', icon: HelpCircle },
    { to: '/admin/audit',     label: 'Audit log',  icon: ClipboardList },
    { to: '/admin/users',     label: 'Admins',    icon: ShieldCheck },
    { to: '/admin/blog',      label: 'Blog',      icon: FileText },
];

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

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
                    {!isCollapsed && (
                        <span className="ml-1.5 text-[9px] font-semibold bg-argo-violet-100 text-argo-violet-500 px-1.5 py-0.5 rounded tracking-wide">admin</span>
                    )}
                </div>

                {/* Nav */}
                <nav className={`flex-1 space-y-0.5 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            title={isCollapsed ? label : undefined}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-2.5 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                                    isCollapsed ? 'justify-center px-0' : 'px-3'
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
                                    {!isCollapsed && label}
                                    {isCollapsed && (
                                        <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-argo-navy text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                            {label}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className={`pb-5 space-y-2 ${isCollapsed ? 'px-1.5' : 'px-4'}`}>
                    {!mobile && (
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            className={`flex items-center gap-2.5 py-2 rounded-[10px] text-[13px] font-medium text-argo-light hover:text-argo-grey transition-all w-full ${
                                isCollapsed ? 'justify-center px-0' : 'px-3'
                            }`}
                        >
                            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                            {!isCollapsed && 'Minimizar'}
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? 'Salir' : undefined}
                        className={`group relative flex items-center gap-2.5 py-2 rounded-[10px] text-[13px] font-medium text-argo-light hover:text-argo-grey transition-all w-full ${
                            isCollapsed ? 'justify-center px-0' : 'px-3'
                        }`}
                    >
                        <LogOut size={15} />
                        {!isCollapsed && 'Salir'}
                        {isCollapsed && (
                            <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-argo-navy text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                Salir
                            </span>
                        )}
                    </button>
                    {!isCollapsed && (
                        <p className="text-[9px] text-argo-light/40 uppercase tracking-widest px-3">v{APP_VERSION}</p>
                    )}
                </div>
            </aside>
        );
    };

    return (
        <div className="flex h-screen bg-argo-bg overflow-hidden">
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-50 flex">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <div className="md:hidden h-14 flex items-center gap-3 px-4 bg-white border-b border-argo-border">
                    <button onClick={() => setSidebarOpen(true)} className="text-argo-grey">
                        <Menu size={20} />
                    </button>
                    <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                    <span className="text-[9px] font-semibold bg-argo-violet-100 text-argo-violet-500 px-1.5 py-0.5 rounded tracking-wide">admin</span>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:px-12 md:py-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
