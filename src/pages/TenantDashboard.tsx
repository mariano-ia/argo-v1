import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../components/ui/Toast';
import { Tooltip } from '../components/ui/Tooltip';
import { useLang } from '../context/LangContext';
import { getDashboardT } from '../lib/dashboardTranslations';
import { TenantOnboarding } from './tenant/TenantOnboarding';
import { TrialEndModal } from '../components/dashboard/TrialEndModal';
import type { Session } from '@supabase/supabase-js';
import {
    LayoutDashboard, Settings, LogOut, PanelLeftClose, PanelLeftOpen,
    Users, Compass, MessageCircle, Layers, UserPlus, User, Shield, HelpCircle,
    ChevronsUpDown, Check, Share2,
} from 'lucide-react';

export interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    roster_limit: number;
    active_players_count: number;
    institution_type?: string | null;
    sport?: string | null;
    country?: string | null;
    city?: string | null;
    logo_url?: string | null;
    onboarding_completed: boolean;
    trial_expires_at?: string | null;
    ai_queries_count?: number;
    ai_queries_reset_at?: string | null;
    subscription_provider?: string | null;
    subscription_id?: string | null;
}

export interface MemberProfile {
    full_name: string | null;
    role_in_institution: string | null;
}

export type PlanStatus = 'active' | 'trial' | 'trial_expired';

/** One institution the identity belongs to (see docs/CONTEXT-SWITCHER.md). */
export interface Membership {
    tenant: TenantData;
    role: string;
    member_id: string | null;
    memberProfile: MemberProfile | null;
    teams: { id: string; name: string; slug: string }[];
    status: PlanStatus;
    blocked: boolean;
}

/** Which institution + hat the user is acting as. Phase 1 only resolves
 *  tenantId (defaults to the primary membership); the switcher (Phase 3) lets
 *  the user change it and `hat` will start driving the data scope + nav. */
export type ContextHat = 'admin' | { plantelId: string };

export interface ActiveContext {
    tenantId: string;
    hat: ContextHat;
}

const activeCtxKey = (userId: string) => `argo_active_context_${userId}`;

function readStoredContext(userId: string | undefined): ActiveContext | null {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(activeCtxKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.tenantId === 'string') return parsed as ActiveContext;
    } catch { /* ignore */ }
    return null;
}

function writeStoredContext(userId: string | undefined, ctx: ActiveContext): void {
    if (!userId) return;
    try { localStorage.setItem(activeCtxKey(userId), JSON.stringify(ctx)); } catch { /* ignore */ }
}


export const TenantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const location = useLocation();
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
    const [role, setRole] = useState<string>('owner');
    const [teams, setTeams] = useState<{ id: string; name: string; slug: string }[]>([]);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [activeContext, setActiveContextState] = useState<ActiveContext | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Mobile share-link snackbar (tab bar): visible ~4s after copying.
    const [linkCopied, setLinkCopied] = useState(false);
    const linkSnackTimer = useRef<ReturnType<typeof setTimeout>>();
    // Mobile plantel/hat switcher (topbar, right edge).
    const [mobileHatOpen, setMobileHatOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const [hasNewPlayers, setHasNewPlayers] = useState(false);
    const [showTrialModal, setShowTrialModal] = useState(true);
    const sessionCountRef = useRef<number | null>(null);

    // DEV bypass — only on localhost, never on deployed previews
    const [devBypass] = useState(() =>
        import.meta.env.DEV
        && window.location.hostname === 'localhost'
        && new URLSearchParams(window.location.search).has('dev')
    );

    useEffect(() => {
        if (devBypass) {
            setSession({} as Session);
            const params = new URLSearchParams(window.location.search);
            const forceOnboarding = params.has('onboarding');
            // Default to an unlocked plan so the UI is fully visible; append
            // &plan=trial to preview the locked/trial states.
            const devPlan = params.get('plan') ?? 'pro';
            setTenant({ id: 'dev-tenant-000', slug: 'dev', display_name: 'Dev Tenant', plan: devPlan, roster_limit: devPlan === 'trial' ? 8 : 50, active_players_count: 3, onboarding_completed: !forceOnboarding, trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
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
                // Membership list. Back-compat: synthesize one from the top-level
                // fields if an older payload lacks `memberships`.
                const list: Membership[] = Array.isArray(data.memberships) && data.memberships.length > 0
                    ? data.memberships
                    : (data.tenant ? [{
                        tenant: data.tenant,
                        role: data.role ?? 'owner',
                        member_id: data.member_id ?? null,
                        memberProfile: data.memberProfile ?? null,
                        teams: Array.isArray(data.teams) ? data.teams : [],
                        status: 'active' as PlanStatus,
                        blocked: false,
                    }] : []);
                setMemberships(list);

                // Resolve the active membership: stored context if still valid,
                // else the primary (first) one. Single-membership users always
                // land on their only institution — identical to before.
                const userId = session?.user?.id;
                const stored = readStoredContext(userId);
                const active = list.find(m => m.tenant?.id === stored?.tenantId) ?? list[0] ?? null;

                if (active) {
                    setTenant(active.tenant);
                    setMemberProfile(active.memberProfile);
                    setRole(active.role);
                    setTeams(active.teams);
                    setMemberId(active.member_id);
                    // Resolve the hat: a coach defaults to their first plantel (no
                    // admin hat); a stored plantel hat is honored only if that
                    // plantel still exists in this membership's teams.
                    const teamsList = active.teams ?? [];
                    const defaultHat: ContextHat = active.role !== 'coach'
                        ? 'admin'
                        : (teamsList[0] ? { plantelId: teamsList[0].id } : 'admin');
                    const sh = stored?.hat;
                    let hat: ContextHat = defaultHat;
                    if (sh === 'admin' && active.role !== 'coach') hat = 'admin';
                    else if (sh && typeof sh === 'object' && teamsList.some(t => t.id === sh.plantelId)) hat = { plantelId: sh.plantelId };
                    const ctx: ActiveContext = { tenantId: active.tenant.id, hat };
                    setActiveContextState(ctx);
                    writeStoredContext(userId, ctx);
                } else {
                    setTenant(null);
                }
            }
        } catch { /* silently fail */ }
    }, [session, devBypass]);

    useEffect(() => { fetchTenant(); }, [fetchTenant]);

    /* ── Active context switch (dormant in Phase 1; wired by the switcher in
          Phase 3). Re-points tenant/role/teams to the chosen membership and
          persists the choice. ──────────────────────────────────────────────── */
    const setActiveContext = React.useCallback((ctx: ActiveContext) => {
        setActiveContextState(ctx);
        writeStoredContext(session?.user?.id, ctx);
        setShowTrialModal(true); // re-arm the blocked prompt for the new context
        const active = memberships.find(m => m.tenant?.id === ctx.tenantId);
        if (active) {
            setTenant(active.tenant);
            setMemberProfile(active.memberProfile);
            setRole(active.role);
            setTeams(active.teams);
            setMemberId(active.member_id);
        }
    }, [session, memberships]);

    /* ── New-session notification dot ─────────────────────────────────────── */
    const checkNewSessions = useCallback(async () => {
        if (!session || devBypass || !tenant) return;
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) return;
        try {
            const res = await fetch(`/api/tenant-sessions?tenant_id=${tenant.id}`, {
                headers: { Authorization: `Bearer ${authSession.access_token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const count = data.sessions?.length ?? 0;
            sessionCountRef.current = count;
            const storageKey = `argo_seen_sessions_${tenant.id}`;
            const lastSeen = parseInt(localStorage.getItem(storageKey) ?? '0', 10);
            setHasNewPlayers(count > lastSeen);
        } catch { /* silently fail */ }
    }, [session, devBypass, tenant]);

    useEffect(() => {
        checkNewSessions();
        const interval = setInterval(checkNewSessions, 30_000);
        return () => clearInterval(interval);
    }, [checkNewSessions]);

    // Clear dot when user visits /dashboard/players
    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/players') && tenant && sessionCountRef.current !== null) {
            localStorage.setItem(`argo_seen_sessions_${tenant.id}`, String(sessionCountRef.current));
            setHasNewPlayers(false);
        }
    }, [location.pathname, tenant]);

    // Switching to a plantel hat hides the admin-only sections; if the user is on
    // one of them, send them back to Inicio.
    useEffect(() => {
        const isAdmin = (activeContext?.hat ?? 'admin') === 'admin' && role !== 'coach';
        if (!isAdmin && (location.pathname.startsWith('/dashboard/planteles') || location.pathname.startsWith('/dashboard/users'))) {
            navigate('/dashboard', { replace: true });
        }
    }, [activeContext, role, location.pathname, navigate]);

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

    // Institution initials (for institution block in sidebar)
    const initials = tenant?.display_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '';
    // User display name and initials (for footer and greeting)
    const userDisplayName = memberProfile?.full_name
        || (session?.user?.user_metadata?.full_name as string | undefined)
        || (session?.user?.user_metadata?.name as string | undefined)
        || session?.user?.email?.split('@')[0]
        || '';
    const userInitials = userDisplayName.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

    const profileIncomplete = !!(tenant && !tenant.institution_type);
    const trialExpired = !!(tenant && tenant.plan === 'trial' && tenant.trial_expires_at && new Date(tenant.trial_expires_at) < new Date());

    // ── Active context (institution × hat) drives nav + data scope ──────────
    // role = the membership permission level; the active HAT decides the view.
    const isCoachRole = role === 'coach';
    const activeMembership = memberships.find(m => m.tenant.id === (activeContext?.tenantId ?? tenant?.id)) ?? null;
    const activeTeams = activeMembership?.teams ?? teams;
    const currentHat: ContextHat = activeContext?.hat ?? 'admin';
    const effectiveTeamId = typeof currentHat === 'object' ? currentHat.plantelId : null;
    // Admin nav (Users + Planteles) shows only in the "Administración" hat of a
    // non-coach membership. A plantel hat renders the coach-style nav + scope.
    const isAdminView = currentHat === 'admin' && !isCoachRole;

    const adminLabel = lang === 'en' ? 'Administration' : lang === 'pt' ? 'Administração' : 'Administración';
    const activeHatLabel = effectiveTeamId
        ? (activeTeams.find(t => t.id === effectiveTeamId)?.name ?? '')
        : adminLabel;
    const totalHats = (isCoachRole ? 0 : 1) + activeTeams.length;
    const hasSwitcher = memberships.length > 1 || totalHats > 1;

    const defaultHatFor = (m: Membership): ContextHat =>
        m.role !== 'coach' ? 'admin' : (m.teams[0] ? { plantelId: m.teams[0].id } : 'admin');
    const switchToInstitution = (m: Membership) => { setActiveContext({ tenantId: m.tenant.id, hat: defaultHatFor(m) }); setSwitcherOpen(false); };
    const switchToHat = (hat: ContextHat) => { if (activeContext) setActiveContext({ tenantId: activeContext.tenantId, hat }); setSwitcherOpen(false); };

    const plantelesLabel = lang === 'en' ? 'Teams' : lang === 'pt' ? 'Plantéis' : 'Planteles';
    const NAV_MAIN = [
        { to: '/dashboard',          label: dt.nav.inicio,    icon: LayoutDashboard, end: true },
        { to: '/dashboard/players',  label: dt.nav.jugadores, icon: Users,           end: false },
        { to: '/dashboard/chat',     label: dt.nav.chat,      icon: MessageCircle,   end: false },
        { to: '/dashboard/grupos',   label: dt.nav.grupos,    icon: Layers,          end: false },
        { to: '/dashboard/guide',    label: dt.nav.guia,      icon: Compass,         end: false },
    ];
    // Planteles + Usuarios are one pair: the institution's structure and its
    // people. Admin-only, rendered together (Planteles above Usuarios) as their
    // own cluster so it reads as two things that belong together.
    const NAV_INSTITUCION = isAdminView
        ? [
            { to: '/dashboard/planteles', label: plantelesLabel,   icon: Shield,   end: false },
            { to: '/dashboard/users',     label: dt.nav.usuarios,  icon: UserPlus, end: false },
        ]
        : [];
    const NAV_CONFIG = [
        { to: '/dashboard/settings', label: dt.nav.ajustes, icon: Settings,   end: false },
        { to: '/dashboard/help',     label: dt.nav.ayuda,   icon: HelpCircle, end: false },
    ];

    /* ── Nav item renderer ─────────────────────────────────────────────────── */
    const NavItem = ({ to, label, icon: Icon, end, showDot }: { to: string; label: string; icon: React.FC<{ size?: number | string }>; end: boolean; showDot?: boolean }) => (
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
                    <div className="relative flex-shrink-0">
                        <Icon size={16} />
                        {showDot && collapsed && !sidebarOpen && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                    </div>
                    {(!collapsed || sidebarOpen) && label}
                    {(!collapsed || sidebarOpen) && showDot && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
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
        const daysLeft = tenant?.trial_expires_at
            ? Math.max(0, Math.ceil((new Date(tenant.trial_expires_at).getTime() - Date.now()) / 86400000))
            : null;
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
                        {/* Institution logo — collapsed (opens the switcher) */}
                        {tenant && (
                            <Tooltip text={hasSwitcher ? (lang === 'en' ? 'Switch context' : lang === 'pt' ? 'Trocar contexto' : 'Cambiar contexto') : tenant.display_name} position="right">
                                <button
                                    type="button"
                                    onClick={() => { if (hasSwitcher) { setCollapsed(false); setSwitcherOpen(true); } }}
                                    className={`relative ${hasSwitcher ? 'cursor-pointer' : 'cursor-default'}`}
                                >
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
                                    {hasSwitcher && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border border-argo-border flex items-center justify-center"><ChevronsUpDown size={8} className="text-argo-grey" /></span>}
                                </button>
                            </Tooltip>
                        )}
                        <div className="w-6 h-px bg-argo-border" />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between px-6 pt-7 pb-4">
                            <div className="flex items-center gap-1.5">
                                <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                                    <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}>Method®</span>
                                </span>
                                                            </div>
                            {!mobile && (
                                <Tooltip text={lang === 'en' ? 'Collapse' : lang === 'pt' ? 'Recolher' : 'Colapsar'}>
                                    <button onClick={() => setCollapsed(true)} className="text-argo-light hover:text-argo-grey transition-colors p-1 rounded-lg hover:bg-argo-bg">
                                        <PanelLeftClose size={16} />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                        {/* Context switcher (institution × hat) */}
                        {tenant && (
                            <div className="px-4 pb-4 relative">
                                <button
                                    type="button"
                                    onClick={() => { if (hasSwitcher) setSwitcherOpen(v => !v); }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-left transition-colors ${hasSwitcher ? 'border border-argo-border bg-white shadow-sm hover:border-argo-violet-200 hover:bg-argo-bg' : 'cursor-default'}`}
                                >
                                    {tenant.logo_url ? (
                                        <img src={tenant.logo_url} alt={tenant.display_name} className="w-8 h-8 rounded-[8px] object-contain border border-argo-border bg-white flex-shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-[8px] bg-argo-violet-100 text-argo-violet-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">{initials}</div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-semibold text-argo-navy truncate leading-tight">{tenant.display_name}</p>
                                        {(hasSwitcher || effectiveTeamId) && (
                                            <p className="text-[10px] text-argo-grey truncate leading-tight">{activeHatLabel}</p>
                                        )}
                                    </div>
                                    {hasSwitcher && <ChevronsUpDown size={15} className="text-argo-grey flex-shrink-0" />}
                                </button>

                                {switcherOpen && hasSwitcher && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
                                        <div className="absolute left-4 right-4 top-full mt-1 z-40 bg-white border border-argo-border rounded-xl shadow-lg py-1.5 max-h-[60vh] overflow-y-auto">
                                            {memberships.map(m => {
                                                const isActiveInst = m.tenant.id === activeContext?.tenantId;
                                                return (
                                                    <div key={m.tenant.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => { if (!isActiveInst) switchToInstitution(m); }}
                                                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${isActiveInst ? '' : 'hover:bg-argo-bg transition-colors'}`}
                                                        >
                                                            {m.tenant.logo_url ? (
                                                                <img src={m.tenant.logo_url} alt="" className="w-5 h-5 rounded-[5px] object-contain border border-argo-border bg-white flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-[5px] bg-argo-violet-100 text-argo-violet-500 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                                                    {m.tenant.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                                                </div>
                                                            )}
                                                            <span className="text-[12px] font-semibold text-argo-navy truncate flex-1">{m.tenant.display_name}</span>
                                                            {m.blocked && (
                                                                <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                                                    {lang === 'en' ? 'Paused' : 'Pausada'}
                                                                </span>
                                                            )}
                                                        </button>
                                                        {isActiveInst && (
                                                            <div className="pb-1">
                                                                {m.role !== 'coach' && (
                                                                    <button type="button" onClick={() => switchToHat('admin')} className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-left hover:bg-argo-bg transition-colors">
                                                                        <span className={`text-[12px] flex-1 ${currentHat === 'admin' ? 'font-semibold text-argo-violet-500' : 'text-argo-secondary'}`}>{adminLabel}</span>
                                                                        {currentHat === 'admin' && <Check size={13} className="text-argo-violet-500 flex-shrink-0" />}
                                                                    </button>
                                                                )}
                                                                {m.teams.map(t => {
                                                                    const on = effectiveTeamId === t.id;
                                                                    return (
                                                                        <button key={t.id} type="button" onClick={() => switchToHat({ plantelId: t.id })} className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-left hover:bg-argo-bg transition-colors">
                                                                            <span className={`text-[12px] truncate flex-1 ${on ? 'font-semibold text-argo-violet-500' : 'text-argo-secondary'}`}>{t.name}</span>
                                                                            {on && <Check size={13} className="text-argo-violet-500 flex-shrink-0" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                                <div className="mx-2 mt-1 h-px bg-argo-border" />
                            </div>
                        )}
                    </>
                )}

                {/* Plan banner — institution-level (plan + roster). Hidden from coaches. */}
                {tenant && !isCollapsed && !isCoachRole && (
                    <div className="mx-3 mb-3">
                        {tenant.plan === 'trial' ? (
                            <div className="bg-argo-violet-50 border border-argo-violet-100 rounded-[10px] px-3 py-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold text-argo-violet-500">
                                        {lang === 'en' ? 'Trial plan' : lang === 'pt' ? 'Plano de teste' : 'Plan de prueba'}
                                    </p>
                                    <span className="text-[10px] font-bold text-argo-violet-400 bg-argo-violet-100 px-1.5 py-0.5 rounded-md">
                                        {tenant.active_players_count}/{tenant.roster_limit} {lang === 'en' ? 'players' : lang === 'pt' ? 'jogadores' : 'jugadores'}
                                    </span>
                                </div>
                                {daysLeft !== null && (
                                    <p className={`text-[10px] font-medium ${daysLeft <= 3 ? 'text-amber-600' : 'text-argo-violet-400'}`}>
                                        {daysLeft === 0
                                            ? (lang === 'en' ? 'Expires today' : lang === 'pt' ? 'Expira hoje' : 'Expira hoy')
                                            : daysLeft === 1
                                                ? (lang === 'en' ? '1 day left' : lang === 'pt' ? '1 dia restante' : '1 día restante')
                                                : (lang === 'en' ? `${daysLeft} days left` : lang === 'pt' ? `${daysLeft} dias restantes` : `${daysLeft} días restantes`)}
                                    </p>
                                )}
                                <p className="text-[10px] text-argo-violet-400 leading-snug">
                                    {lang === 'en' ? 'Unlock all features with a paid plan.' : lang === 'pt' ? 'Desbloqueie tudo com um plano pago.' : 'Accede a todo con un plan pago.'}
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/pricing')}
                                    className="w-full text-center text-[11px] font-semibold text-white bg-argo-violet-500 hover:bg-argo-violet-600 transition-colors rounded-lg py-1.5"
                                >
                                    {lang === 'en' ? 'See plans' : lang === 'pt' ? 'Ver planos' : 'Ver planes'}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-[10px] px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide">
                                        {tenant.plan === 'pro' ? 'PRO' : tenant.plan === 'academy' ? 'Academy' : 'Enterprise'}
                                    </p>
                                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-md">
                                        {tenant.active_players_count}/{tenant.roster_limit}
                                    </span>
                                </div>
                                <p className="text-[10px] text-green-600 mt-1">
                                    {lang === 'en' ? 'All features unlocked' : lang === 'pt' ? 'Todas as funções desbloqueadas' : 'Todas las funcionalidades activas'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Nav — Principal */}
                <nav className={`flex-1 space-y-0.5 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
                    {NAV_MAIN.map(item => <NavItem key={item.to} {...item} showDot={item.to === '/dashboard/players' ? hasNewPlayers : undefined} />)}

                    {/* Institution cluster — Planteles + Usuarios go together (admin only).
                        Sandwiched between two dividers so they read as one pair. */}
                    {NAV_INSTITUCION.length > 0 && (
                        <>
                            <div className={`${isCollapsed ? 'mx-1 my-4' : 'mx-3 my-5'}`}>
                                <div className="h-px bg-argo-border opacity-60" />
                            </div>
                            {NAV_INSTITUCION.map(item => <NavItem key={item.to} {...item} />)}
                        </>
                    )}

                    {/* Separator */}
                    <div className={`${isCollapsed ? 'mx-1 my-4' : 'mx-3 my-5'}`}>
                        <div className="h-px bg-argo-border opacity-60" />
                    </div>

                    {NAV_CONFIG.map(item => <NavItem key={item.to} {...item} showDot={item.to === '/dashboard/settings' ? profileIncomplete : undefined} />)}
                    {profileIncomplete && !isCollapsed && (
                        <p className="px-3 pt-0.5 text-[11px] text-argo-light leading-snug">
                            {lang === 'en' ? 'Complete your institution profile.' : lang === 'pt' ? 'Complete o perfil da sua instituição.' : 'Completa el perfil de tu institución.'}
                        </p>
                    )}
                </nav>

                {/* Bottom section */}
                <div className={`pb-5 space-y-3 ${isCollapsed ? 'px-1.5' : 'px-4'}`}>
                    {/* User + logout — always visible when sidebar is expanded */}
                    {!isCollapsed && (
                        <div className="flex items-center gap-2.5 px-3 py-2">
                            <div className="w-[28px] h-[28px] rounded-full bg-argo-violet-100 text-argo-violet-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {userInitials || <User size={13} />}
                            </div>
                            <span className="text-xs font-medium text-argo-secondary truncate flex-1">
                                {userDisplayName}
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
        {tenant && tenant.onboarding_completed && trialExpired && (
            <TrialEndModal
                open={showTrialModal}
                lang={lang}
                rosterCount={tenant.active_players_count}
                isCoach={isCoachRole}
                onUpgrade={() => { setShowTrialModal(false); navigate('/dashboard/pricing'); }}
                onClose={() => setShowTrialModal(false)}
            />
        )}
        <div className="flex h-[100dvh] bg-argo-bg overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Mobile drawer removed (Modo Cancha): on the phone only the bottom
                tab bar surfaces exist; settings/admin/context switching live on
                desktop by design. */}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Mobile topbar: brand left, plantel/hat switcher right (no
                    hamburger — Modo Cancha keeps only field surfaces on mobile) */}
                <div className="md:hidden h-14 flex items-center justify-between px-4 bg-white border-b border-argo-border relative">
                    <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}>Method®</span>
                    </span>
                    {tenant && tenant.onboarding_completed && (() => {
                        const hats: Array<{ key: string; label: string; hat: ContextHat }> = [
                            ...(role !== 'coach' ? [{ key: 'admin', label: lang === 'en' ? 'Administration' : lang === 'pt' ? 'Administração' : 'Administración', hat: 'admin' as ContextHat }] : []),
                            ...teams.map(t => ({ key: t.id, label: t.name, hat: { plantelId: t.id } as ContextHat })),
                        ];
                        if (hats.length < 2) return null;
                        const currentKey = currentHat === 'admin' ? 'admin' : currentHat.plantelId;
                        const currentLabel = hats.find(h => h.key === currentKey)?.label ?? hats[0].label;
                        return (
                            <>
                                <button
                                    onClick={() => setMobileHatOpen(v => !v)}
                                    className="flex items-center gap-1.5 max-w-[55%] px-2.5 py-1.5 rounded-full border border-argo-border bg-white text-[12px] font-medium text-argo-secondary active:bg-argo-bg transition-colors"
                                >
                                    <span className="truncate">{currentLabel}</span>
                                    <ChevronsUpDown size={13} className="text-argo-grey flex-shrink-0" />
                                </button>
                                {mobileHatOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setMobileHatOpen(false)} />
                                        <div className="absolute right-3 top-[52px] z-50 w-56 bg-white rounded-xl shadow-argo-hover border border-argo-border py-1">
                                            {hats.map(h => (
                                                <button
                                                    key={h.key}
                                                    onClick={() => { setActiveContext({ tenantId: activeContext?.tenantId ?? tenant.id, hat: h.hat }); setMobileHatOpen(false); }}
                                                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] text-argo-secondary active:bg-argo-bg transition-colors"
                                                >
                                                    <span className="truncate">{h.label}</span>
                                                    {h.key === currentKey && <Check size={14} className="text-argo-violet-500 flex-shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>

                <main className="flex-1 overflow-y-auto p-6 pb-24 md:px-12 md:py-10">
                    {tenant && !tenant.onboarding_completed ? (
                        <TenantOnboarding tenant={tenant} onComplete={fetchTenant} lang={lang} />
                    ) : (
                        <Outlet context={{ tenant, refreshTenant: fetchTenant, dt, lang, userEmail: session?.user?.email ?? '', memberProfile, role, teams, memberId, devBypass, memberships, activeContext, setActiveContext, effectiveTeamId, isAdminView }} />
                    )}
                </main>

                {/* ── Mobile bottom tab bar (Modo Cancha B1): the 4 core surfaces
                    plus the raised SHARE LINK button in the center — the single
                    most-used field action (share the play link on WhatsApp).
                    Secondary nav (Guía, Ajustes, Ayuda, admin, logout) lives in
                    the topbar drawer; no "Más" tab (it duplicated the drawer). ── */}
                {tenant && tenant.onboarding_completed && (() => {
                    const activeTeam = (teams ?? []).find(tm => tm.id === effectiveTeamId) ?? null;
                    const rosterFull = tenant.active_players_count >= tenant.roster_limit;
                    const playUrl = `${window.location.origin}/play/${tenant.slug}${activeTeam ? `/${activeTeam.slug}` : ''}`;
                    // Tap = copy + snackbar confirmation (owner-specified UX).
                    const copyPlayLink = async () => {
                        if (rosterFull) {
                            window.alert(lang === 'en'
                                ? 'Your team is full: new players cannot register with this link. Free a slot or upgrade your plan.'
                                : lang === 'pt'
                                    ? 'Sua equipe está completa: novos jogadores não podem se registrar com este link. Libere uma vaga ou atualize seu plano.'
                                    : 'Tu equipo está completo: no pueden registrarse jugadores nuevos con este link. Libera un lugar o actualiza tu plan.');
                            return;
                        }
                        try { await navigator.clipboard.writeText(playUrl); } catch { /* clipboard denied: snackbar still confirms intent */ }
                        setLinkCopied(true);
                        clearTimeout(linkSnackTimer.current);
                        linkSnackTimer.current = setTimeout(() => setLinkCopied(false), 4000);
                    };
                    const tabs = [
                        { to: '/dashboard', label: dt.nav.inicio, icon: LayoutDashboard, end: true },
                        { to: '/dashboard/players', label: dt.nav.jugadores, icon: Users, end: false },
                        { to: '/dashboard/chat', label: 'Coach', icon: MessageCircle, end: false },
                        { to: '/dashboard/grupos', label: dt.nav.grupos, icon: Layers, end: false },
                    ];
                    const TabLink = ({ t }: { t: typeof tabs[number] }) => (
                        <NavLink
                            to={t.to}
                            end={t.end}
                            className={({ isActive }) =>
                                `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors active:bg-argo-bg ${
                                    isActive ? 'text-argo-violet-500' : 'text-argo-grey'
                                }`}
                        >
                            <t.icon size={18} />
                            <span className="truncate max-w-full px-0.5">{t.label}</span>
                        </NavLink>
                    );
                    return (
                        <>
                            {/* Snackbar: floats just above the share button */}
                            {linkCopied && (
                                <div className="md:hidden fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] inset-x-0 z-50 flex justify-center pointer-events-none px-4">
                                    <div className="pointer-events-auto bg-argo-navy text-white text-[12px] font-medium px-4 py-2.5 rounded-full shadow-lg">
                                        {lang === 'en' ? 'Link copied. Ready to share.' : lang === 'pt' ? 'Link copiado. Já pode compartilhar.' : 'Link copiado. Ya puedes compartirlo.'}
                                    </div>
                                </div>
                            )}
                            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-argo-border flex items-stretch pb-[env(safe-area-inset-bottom)]">
                                <TabLink t={tabs[0]} />
                                <TabLink t={tabs[1]} />
                                {/* The play link belongs to a plantel. With no plantel focused
                                    (e.g. the Administración hat) there is no per-plantel link to
                                    share, so — mirroring the desktop, which offers no link — the
                                    button is omitted instead of leaking the institution-wide
                                    /play/<slug> link. The tab bar falls back to 4 even tabs. */}
                                {activeTeam && (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3">
                                        <button
                                            onClick={copyPlayLink}
                                            aria-label={lang === 'en' ? 'Share play link' : lang === 'pt' ? 'Compartilhar link' : 'Compartir link'}
                                            className={`-mt-7 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                                                rosterFull ? 'bg-argo-light text-white' : 'bg-argo-violet-500 text-white'
                                            }`}
                                        >
                                            <Share2 size={20} />
                                        </button>
                                        <span className="text-[10px] font-medium text-argo-grey -mt-0.5 whitespace-nowrap">
                                            {lang === 'en' ? 'Share link' : lang === 'pt' ? 'Compartilhar' : 'Compartir link'}
                                        </span>
                                    </div>
                                )}
                                <TabLink t={tabs[2]} />
                                <TabLink t={tabs[3]} />
                            </nav>
                        </>
                    );
                })()}
            </div>
        </div>
        </ToastProvider>
    );
};
