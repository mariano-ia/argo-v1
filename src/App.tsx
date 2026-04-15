import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useLang } from './context/LangContext';

// ─── Public pages (loaded eagerly — part of initial bundle) ─────────────────
import { Landing }            from './pages/Landing';
import { Login }              from './pages/Login';
import { TenantSignup }      from './pages/TenantSignup';
import { TenantPlay }        from './pages/TenantPlay';
import { BlogIndex }           from './pages/BlogIndex';
import { BlogPost }            from './pages/BlogPost';
import { BlogCategory }        from './pages/BlogCategory';
import { NotFound }           from './pages/NotFound';

// ─── Lazy-loaded pages (separate chunks, loaded on demand) ──────────────────

// Tenant dashboard (only loaded when authenticated tenant accesses /dashboard)
const TenantDashboard = lazy(() => import('./pages/TenantDashboard').then(m => ({ default: m.TenantDashboard })));
const TenantHome      = lazy(() => import('./pages/tenant/TenantHome').then(m => ({ default: m.TenantHome })));
const TenantLink      = lazy(() => import('./pages/tenant/TenantLink').then(m => ({ default: m.TenantLink })));
const TenantSettings  = lazy(() => import('./pages/tenant/TenantSettings').then(m => ({ default: m.TenantSettings })));
const TenantUsers     = lazy(() => import('./pages/tenant/TenantUsers').then(m => ({ default: m.TenantUsers })));
const TenantGroups    = lazy(() => import('./pages/tenant/TenantGroups').then(m => ({ default: m.TenantGroups })));
const TenantGuide     = lazy(() => import('./pages/tenant/TenantGuide').then(m => ({ default: m.TenantGuide })));
const TenantPlayers   = lazy(() => import('./pages/tenant/TenantPlayers').then(m => ({ default: m.TenantPlayers })));
const TenantChat      = lazy(() => import('./pages/tenant/TenantChat').then(m => ({ default: m.TenantChat })));
const TenantPricing   = lazy(() => import('./pages/tenant/TenantPricing').then(m => ({ default: m.TenantPricing })));

// Admin dashboard (only loaded when admin accesses /admin)
const Dashboard       = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Sessions        = lazy(() => import('./pages/dashboard/Sessions').then(m => ({ default: m.Sessions })));
const Metrics         = lazy(() => import('./pages/dashboard/Metrics').then(m => ({ default: m.Metrics })));
const QuestionsAdmin  = lazy(() => import('./pages/dashboard/QuestionsAdmin').then(m => ({ default: m.QuestionsAdmin })));
const AdminUsers      = lazy(() => import('./pages/dashboard/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminTenants    = lazy(() => import('./pages/dashboard/AdminTenants').then(m => ({ default: m.AdminTenants })));
const AdminAIUsage    = lazy(() => import('./pages/dashboard/AdminAIUsage').then(m => ({ default: m.AdminAIUsage })));
const AdminRevenue    = lazy(() => import('./pages/dashboard/AdminRevenue').then(m => ({ default: m.AdminRevenue })));
const AdminArgoOne    = lazy(() => import('./pages/dashboard/AdminArgoOne').then(m => ({ default: m.AdminArgoOne })));
const AdminAuditLog   = lazy(() => import('./pages/dashboard/AdminAuditLog').then(m => ({ default: m.AdminAuditLog })));
const AdminFeedback   = lazy(() => import('./pages/dashboard/Feedback').then(m => ({ default: m.Feedback })));
const BlogAdmin       = lazy(() => import('./pages/dashboard/BlogAdmin').then(m => ({ default: m.BlogAdmin })));
const BlogEditor      = lazy(() => import('./pages/dashboard/BlogEditor').then(m => ({ default: m.BlogEditor })));

// Other lazy pages (loaded on demand)
const SetPassword       = lazy(() => import('./pages/SetPassword').then(m => ({ default: m.SetPassword })));
const FeedbackForm      = lazy(() => import('./pages/FeedbackForm').then(m => ({ default: m.FeedbackForm })));
const ReportPage        = lazy(() => import('./pages/ReportPage').then(m => ({ default: m.ReportPage })));
const TermsPage         = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage       = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const PricingPage       = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const OnePlay           = lazy(() => import('./pages/OnePlay').then(m => ({ default: m.OnePlay })));
const OnePanel          = lazy(() => import('./pages/OnePanel').then(m => ({ default: m.OnePanel })));
const ConsentLanding    = lazy(() => import('./pages/ConsentLanding').then(m => ({ default: m.ConsentLanding })));
const ResultRevealPreview = lazy(() => import('./pages/ResultRevealPreview').then(m => ({ default: m.ResultRevealPreview })));
const TestIslas         = lazy(() => import('./pages/TestIslas').then(m => ({ default: m.TestIslas })));
const TestEsquivar      = lazy(() => import('./pages/TestEsquivar').then(m => ({ default: m.TestEsquivar })));
const TestTormenta      = lazy(() => import('./pages/TestTormenta').then(m => ({ default: m.TestTormenta })));

import { AdminRoute }         from './components/AdminRoute';
import { OnboardingFlowV2 }   from './components/onboarding/OnboardingFlowV2';
import type { AdultData }     from './components/onboarding/OnboardingFlowV2';
import { UserAuthGate }       from './components/onboarding/UserAuthGate';
import { takeConsentResume }  from './lib/consentStore';

// ─── Lazy loading fallback ──────────────────────────────────────────────────
const LazyFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-argo-neutral">
        <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
    </div>
);

const MAX_PLAYS = 3;
const TEST_EMAILS = ['marianonoceti@gmail.com'];

// ─── Blocked screen ───────────────────────────────────────────────────────────

const BLOCKED_I18N: Record<string, { title: string; message: string }> = {
    es: { title: `Ya completaste tus ${MAX_PLAYS} experiencias`, message: `Cada cuenta puede usar Argo Method hasta ${MAX_PLAYS} veces. Si necesitas mas sesiones, contactanos.` },
    en: { title: `You've completed your ${MAX_PLAYS} experiences`, message: `Each account can use Argo Method up to ${MAX_PLAYS} times. Contact us if you need more sessions.` },
    pt: { title: `Voce completou suas ${MAX_PLAYS} experiencias`, message: `Cada conta pode usar o Argo Method ate ${MAX_PLAYS} vezes. Entre em contato se precisar de mais sessoes.` },
};

const BlockedView: React.FC = () => {
    const { lang } = useLang();
    const t = BLOCKED_I18N[lang] ?? BLOCKED_I18N.es;
    return (
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
                    {t.title}
                </h2>
                <p style={{ fontWeight: 400, fontSize: '15px', color: '#86868B', lineHeight: 1.7 }}>
                    {t.message}
                </p>
            </div>
        </div>
    );
};

// ─── User app wrapper (auth + play limit) ─────────────────────────────────────

const UserApp: React.FC = () => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [blocked, setBlocked] = useState(false);
    // If we arrived from /consent/:token (auth flow), pull the resume payload
    // from sessionStorage so we skip the form and jump to device-handoff.
    const [initialConsent] = useState<{ token: string; adultData: AdultData } | null>(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('consent');
        if (!token) return null;
        const resume = takeConsentResume(token);
        if (!resume) return null;
        return { token: resume.token, adultData: resume.adultData };
    });

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
    if (!session) {
        // DEV bypass — skip auth in local development
        if (import.meta.env.DEV) {
            return (
                <div>
                    <UserAuthGate onAuthenticated={() => {}} />
                    <button
                        onClick={() => setSession({ user: { email: 'dev@localhost', id: 'dev', user_metadata: {} } } as unknown as Session)}
                        style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, background: '#955FB5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: 0.85 }}
                    >
                        DEV: Skip login
                    </button>
                </div>
            );
        }
        return <UserAuthGate onAuthenticated={() => {}} />;
    }
    if (blocked) return <BlockedView />;

    return (
        <OnboardingFlowV2
            userEmail={session.user.email ?? ''}
            onPlayComplete={onPlayComplete}
            initialConsent={initialConsent}
        />
    );
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
    return (
        <Suspense fallback={<LazyFallback />}>
        <Routes>
            {/* Public */}
            <Route path="/"       element={<Landing />} />
            <Route path="/app"    element={<UserApp />} />
            <Route path="/play/:slug" element={<TenantPlay />} />
            <Route path="/signup" element={<TenantSignup />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/preview/result" element={<ResultRevealPreview />} />
            <Route path="/review/:sessionId" element={<FeedbackForm />} />
            <Route path="/report/:sessionId" element={<ReportPage />} />
            <Route path="/pricing"    element={<PricingPage />} />
            <Route path="/one/:slug"  element={<OnePlay />} />
            <Route path="/one/panel"  element={<OnePanel />} />
            <Route path="/terms"      element={<TermsPage />} />
            <Route path="/privacy"    element={<PrivacyPage />} />
                <Route path="/consent/:token" element={<ConsentLanding />} />
            <Route path="/blog"       element={<BlogIndex />} />
            <Route path="/blog/category/:category" element={<BlogCategory />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/test/islas" element={<TestIslas />} />
            <Route path="/test/esquivar" element={<TestEsquivar />} />
            <Route path="/test/tormenta" element={<TestTormenta />} />

            {/* Tenant dashboard */}
            <Route path="/dashboard" element={<TenantDashboard />}>
                <Route index           element={<TenantHome />} />
                <Route path="players"  element={<TenantPlayers />} />
                <Route path="groups"   element={<TenantGroups />} />
                <Route path="guide"    element={<TenantGuide />} />
                <Route path="chat"     element={<TenantChat />} />
                <Route path="link"     element={<TenantLink />} />
                <Route path="users"    element={<TenantUsers />} />
                <Route path="settings" element={<TenantSettings />} />
                <Route path="pricing"  element={<TenantPricing />} />
            </Route>

            {/* Admin (superadmin) */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>}>
                <Route index            element={<Sessions />} />
                <Route path="sessions"  element={<Sessions />} />
                <Route path="metrics"   element={<Metrics />} />
                <Route path="tenants"   element={<AdminTenants />} />
                <Route path="ai-usage"  element={<AdminAIUsage />} />
                <Route path="revenue"   element={<AdminRevenue />} />
                <Route path="argo-one"  element={<AdminArgoOne />} />
                <Route path="audit"     element={<AdminAuditLog />} />
                <Route path="feedback"  element={<AdminFeedback />} />
                <Route path="questions" element={<QuestionsAdmin />} />
                <Route path="users"     element={<AdminUsers />} />
                <Route path="blog"          element={<BlogAdmin />} />
                <Route path="blog/new"      element={<BlogEditor />} />
                <Route path="blog/edit/:id" element={<BlogEditor />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
    );
}

export default App;
