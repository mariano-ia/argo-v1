import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Landing }            from './pages/Landing';
import { Login }              from './pages/Login';
import { TenantSignup }      from './pages/TenantSignup';
import { TenantDashboard }   from './pages/TenantDashboard';
import { TenantHome }        from './pages/tenant/TenantHome';
import { TenantLink }        from './pages/tenant/TenantLink';
import { TenantSettings }    from './pages/tenant/TenantSettings';
import { Dashboard }          from './pages/Dashboard';
import { Sessions }           from './pages/dashboard/Sessions';
import { Metrics }            from './pages/dashboard/Metrics';
import { QuestionsAdmin }     from './pages/dashboard/QuestionsAdmin';
import { AdminRoute }         from './components/AdminRoute';
import { OnboardingFlow }     from './components/onboarding/OnboardingFlow';
import { UserAuthGate }       from './components/onboarding/UserAuthGate';

const MAX_PLAYS = 3;
const TEST_EMAILS = ['marianonoceti@gmail.com'];

// ─── Blocked screen ───────────────────────────────────────────────────────────

const BlockedView: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
         style={{ backgroundColor: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '360px' }}>
            <div className="flex items-center justify-center gap-1.5 mb-8">
                <span style={{ fontSize: '18px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 100 }}> Method</span>
                </span>
                <span style={{ background: '#BBBCFF', color: '#1D1D1F', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    beta
                </span>
            </div>
            <h2 style={{ fontWeight: 300, fontSize: '24px', color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                Ya completaste tus {MAX_PLAYS} experiencias
            </h2>
            <p style={{ fontWeight: 400, fontSize: '15px', color: '#86868B', lineHeight: 1.7 }}>
                Cada cuenta puede usar Argo Method hasta {MAX_PLAYS} veces. Si necesitas más sesiones, contáctanos.
            </p>
        </div>
    </div>
);

// ─── User app wrapper (auth + play limit) ─────────────────────────────────────

const UserApp: React.FC = () => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [blocked, setBlocked] = useState(false);

    const checkBlocked = (s: Session) => {
        if (TEST_EMAILS.includes(s.user.email ?? '')) return;
        const count = (s.user.user_metadata?.play_count ?? 0) as number;
        setBlocked(count >= MAX_PLAYS);
    };

    const upsertLead = async (s: Session) => {
        if (!s.user.email) return;
        await supabase.from('leads').upsert(
            { user_id: s.user.id, email: s.user.email, last_seen: new Date().toISOString() },
            { onConflict: 'user_id' },
        );
    };

    useEffect(() => {
        const isOAuthCallback = window.location.hash.includes('access_token') ||
                                window.location.search.includes('code=');

        if (!isOAuthCallback) {
            supabase.auth.signOut();
            setSession(null);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
            setSession(s ?? null);
            if (s) { checkBlocked(s); upsertLead(s); }
        });

        return () => subscription.unsubscribe();
    }, []);

    const onPlayComplete = async () => {
        if (!session) return;
        if (TEST_EMAILS.includes(session.user.email ?? '')) return;
        const current = (session.user.user_metadata?.play_count ?? 0) as number;
        await supabase.auth.updateUser({ data: { play_count: current + 1 } });
    };

    if (session === undefined) return null;
    if (!session) return <UserAuthGate onAuthenticated={() => {}} />;
    if (blocked) return <BlockedView />;

    return (
        <OnboardingFlow
            userEmail={session.user.email ?? ''}
            onPlayComplete={onPlayComplete}
        />
    );
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/"       element={<Landing />} />
            <Route path="/app"    element={<UserApp />} />
            <Route path="/signup" element={<TenantSignup />} />

            {/* Tenant dashboard */}
            <Route path="/dashboard" element={<TenantDashboard />}>
                <Route index           element={<TenantHome />} />
                <Route path="link"     element={<TenantLink />} />
                <Route path="settings" element={<TenantSettings />} />
            </Route>

            {/* Admin (superadmin) */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>}>
                <Route index            element={<Sessions />} />
                <Route path="sessions"  element={<Sessions />} />
                <Route path="metrics"   element={<Metrics />} />
                <Route path="questions" element={<QuestionsAdmin />} />
            </Route>
        </Routes>
    );
}

export default App;
