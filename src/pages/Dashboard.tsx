import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';
import {
    Users, BarChart2, HelpCircle, LogOut, Anchor, Menu, Mail,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/dashboard/sessions',  label: 'Sesiones',  icon: Users },
    { to: '/dashboard/leads',     label: 'Leads',     icon: Mail },
    { to: '/dashboard/metrics',   label: 'Métricas',  icon: BarChart2 },
    { to: '/dashboard/questions', label: 'Preguntas', icon: HelpCircle },
];

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const Sidebar = () => (
        <aside className="flex flex-col h-full bg-white border-r border-argo-border w-56 flex-shrink-0">
            {/* Logo */}
            <div className="h-14 flex items-center gap-2 px-5 border-b border-argo-border">
                <Anchor size={15} className="text-argo-indigo" />
                <span className="font-display text-sm font-bold text-argo-navy">Argo</span>
                <span className="text-[9px] text-argo-grey/50 font-semibold uppercase tracking-widest ml-auto">
                    Dashboard
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-0.5">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-argo-indigo text-white'
                                    : 'text-argo-grey hover:text-argo-navy hover:bg-argo-neutral'
                            }`
                        }
                    >
                        <Icon size={15} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 space-y-1 border-t border-argo-border pt-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-argo-grey hover:text-red-500 hover:bg-red-50 transition-all w-full"
                >
                    <LogOut size={15} /> Salir
                </button>
                <p className="text-[9px] text-argo-grey/40 uppercase tracking-widest px-3 pt-1">
                    v{APP_VERSION}
                </p>
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
                        <Sidebar />
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
                    <span className="font-display text-sm font-bold text-argo-navy">Argo Dashboard</span>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
