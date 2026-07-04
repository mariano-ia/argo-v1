import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type AdminRole = 'superadmin' | 'limited';

// Fail-closed default: only ever read outside the provider, where restricting is the safe value
const AdminRoleContext = createContext<AdminRole>('limited');
export const useAdminRole = () => useContext(AdminRoleContext);

// Tabs available to 'limited' admins. Single source for nav filtering (Dashboard)
// and route guarding (SuperadminOnly in App.tsx).
export const LIMITED_ADMIN_TABS = new Set([
    '/admin/sessions',
    '/admin/tenants',
    '/admin/ai-usage',
    '/admin/contactos',
    '/admin/blog',
]);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    // undefined = loading, null = not an admin
    const [role, setRole] = useState<AdminRole | null | undefined>(undefined);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session) return;
        const email = session.user.email;
        if (!email) { setRole(null); return; }

        supabase
            .from('admin_users')
            .select('id, role')
            .eq('email', email)
            .maybeSingle()
            .then(({ data }) => {
                // Only an explicit 'limited' restricts; anything else is full access
                setRole(data ? (data.role === 'limited' ? 'limited' : 'superadmin') : null);
            });
    }, [session]);

    if (session === undefined || (session && role === undefined)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!session) return <Navigate to="/admin/login" replace />;

    if (!role) return <Navigate to="/dashboard" replace />;

    return <AdminRoleContext.Provider value={role}>{children}</AdminRoleContext.Provider>;
};

// Wraps admin child routes that limited admins must not reach via direct URL.
export const SuperadminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const role = useAdminRole();
    if (role !== 'superadmin') return <Navigate to="/admin" replace />;
    return <>{children}</>;
};
