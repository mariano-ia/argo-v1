import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session) return;
        const email = session.user.email;
        if (!email) { setIsAdmin(false); return; }

        supabase
            .from('admin_users')
            .select('id')
            .eq('email', email)
            .maybeSingle()
            .then(({ data }) => setIsAdmin(!!data));
    }, [session]);

    if (session === undefined || (session && isAdmin === undefined)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-argo-neutral">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!session) return <Navigate to="/admin/login" replace />;

    if (!isAdmin) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
};
