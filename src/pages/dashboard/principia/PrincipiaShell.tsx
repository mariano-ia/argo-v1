import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, AlertTriangle, ScrollText, CalendarDays } from 'lucide-react';
import { AREA_MODULES } from '../../../lib/principia/areas';
import { SEVERITY_COLORS } from '../../../lib/designTokens';

const ZONE_A = [
    { to: '/admin/principia',            label: 'Resumen',    icon: LayoutDashboard, end: true },
    { to: '/admin/principia/bandeja',    label: 'Bandeja',    icon: Inbox },
    { to: '/admin/principia/incidentes', label: 'Incidentes', icon: AlertTriangle },
    { to: '/admin/principia/registros',  label: 'Registros',  icon: ScrollText },
    { to: '/admin/principia/consilium',  label: 'Consilium',  icon: CalendarDays },
];

export const PrincipiaShell: React.FC = () => {
    return (
        <div className="flex min-h-full">
            <aside className="w-60 shrink-0 border-r border-argo-border bg-white px-3 py-4">
                <p className="px-2 text-xs font-semibold uppercase tracking-widest text-argo-grey">Transversal</p>
                <nav className="mt-2 space-y-0.5">
                    {ZONE_A.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium ${
                                    isActive ? 'bg-argo-bg text-argo-navy' : 'text-argo-secondary hover:bg-argo-bg'
                                }`}>
                            <Icon size={16} /> {label}
                        </NavLink>
                    ))}
                </nav>

                <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-widest text-argo-grey">Cohortes</p>
                <nav className="mt-2 space-y-0.5">
                    {AREA_MODULES.map(({ id, label, agentName, icon: Icon, status }) => {
                        const live = status === 'live';
                        const dot = live ? SEVERITY_COLORS.sano.dot : SEVERITY_COLORS.offline.dot;
                        return (
                            <NavLink key={id} to={`/admin/principia/area/${id}`}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                                        isActive ? 'bg-argo-bg text-argo-navy' : 'text-argo-secondary hover:bg-argo-bg'
                                    }`}>
                                <span className={`h-2 w-2 rounded-full ${dot}`} />
                                <Icon size={15} className="opacity-70" />
                                <span className="flex-1 truncate">{label} - {agentName}</span>
                                <span className="text-xs text-argo-light">{live ? 'EN VIVO' : 'proximamente'}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>
            <section className="flex-1 min-w-0 p-6">
                <Outlet />
            </section>
        </div>
    );
};
