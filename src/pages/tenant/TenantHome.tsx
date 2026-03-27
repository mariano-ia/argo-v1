import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Activity, Users, Layers, ChevronRight, Send } from 'lucide-react';
import { LinkWidget } from '../../components/dashboard/LinkWidget';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';
import { InfoTip } from '../../components/ui/Tooltip';
import { supabase } from '../../lib/supabase';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { calcAxisDistribution, getGroupTypes } from '../../lib/groupBalance';
import { AXIS_CONFIG } from '../../lib/groupBalanceRules';
import type { MemberProfile } from '../../lib/groupBalance';
import { AXIS_COLORS, AXIS_CHIP_STYLE, AXIS_LABELS } from '../../lib/designTokens';

interface TenantData { id: string; slug: string; display_name: string; plan: string; credits_remaining: number; }
interface SessionRow { id: string; child_name: string; child_age: number; adult_name: string; adult_email: string; sport: string | null; archetype_label: string; eje: string; motor: string; eje_secundario: string | null; lang: string | null; created_at: string; }


const MICRO_DESC: Record<string, Record<string, string>> = {
    'D-Rápido': { es: 'Lidera con acción directa', en: 'Leads with direct action', pt: 'Lidera com ação direta' },
    'D-Medio':  { es: 'Decide con propósito claro', en: 'Decides with clear purpose', pt: 'Decide com propósito claro' },
    'D-Lento':  { es: 'Persiste con determinación firme', en: 'Persists with steady resolve', pt: 'Persiste com determinação firme' },
    'I-Rápido': { es: 'Contagia entusiasmo al grupo', en: 'Spreads enthusiasm to the group', pt: 'Contagia o grupo com entusiasmo' },
    'I-Medio':  { es: 'Conecta a través del vínculo', en: 'Connects through relationship', pt: 'Conecta pelo vínculo' },
    'I-Lento':  { es: 'Observa y conecta en profundidad', en: 'Observes and connects deeply', pt: 'Observa e conecta em profundidade' },
    'S-Rápido': { es: 'Responde rápido para apoyar', en: 'Responds quickly to support', pt: 'Responde rápido para apoiar' },
    'S-Medio':  { es: 'Sostiene con consistencia', en: 'Sustains with consistency', pt: 'Sustenta com consistência' },
    'S-Lento':  { es: 'Estabiliza desde la calma', en: 'Stabilizes from a place of calm', pt: 'Estabiliza a partir da calma' },
    'C-Rápido': { es: 'Analiza y ejecuta al instante', en: 'Analyzes and acts instantly', pt: 'Analisa e executa na hora' },
    'C-Medio':  { es: 'Procesa con método y precisión', en: 'Processes with method and precision', pt: 'Processa com método e precisão' },
    'C-Lento':  { es: 'Observa antes de intervenir', en: 'Observes before acting', pt: 'Observa antes de intervir' },
};

const ARCHETYPE_LABELS: Record<string, Record<string, string>> = {
    'D-Rápido': { es: 'Impulsor Dinámico',    en: 'Dynamic Driver',        pt: 'Impulsor Dinâmico' },
    'D-Medio':  { es: 'Impulsor Decidido',     en: 'Decisive Driver',       pt: 'Impulsor Decidido' },
    'D-Lento':  { es: 'Impulsor Persistente',  en: 'Persistent Driver',     pt: 'Impulsor Persistente' },
    'I-Rápido': { es: 'Conector Vibrante',     en: 'Vibrant Connector',     pt: 'Conector Vibrante' },
    'I-Medio':  { es: 'Conector Relacional',   en: 'Relational Connector',  pt: 'Conector Relacional' },
    'I-Lento':  { es: 'Conector Reflexivo',    en: 'Reflective Connector',  pt: 'Conector Reflexivo' },
    'S-Rápido': { es: 'Sostén Ágil',           en: 'Agile Supporter',       pt: 'Sustento Ágil' },
    'S-Medio':  { es: 'Sostén Confiable',      en: 'Reliable Supporter',    pt: 'Sustento Confiável' },
    'S-Lento':  { es: 'Sostén Sereno',         en: 'Serene Supporter',      pt: 'Sustento Sereno' },
    'C-Rápido': { es: 'Estratega Reactivo',    en: 'Reactive Strategist',   pt: 'Estrategista Reativo' },
    'C-Medio':  { es: 'Estratega Analítico',   en: 'Analytical Strategist', pt: 'Estrategista Analítico' },
    'C-Lento':  { es: 'Estratega Observador',  en: 'Observer Strategist',   pt: 'Estrategista Observador' },
};

/* ── Activity digest. 5 cases ───────────────────────────────────────────── */
function getActivityDigest(sessions: SessionRow[], lang: string): string {
    if (sessions.length === 0) {
        return lang === 'en' ? 'Share your link to start getting sessions.' :
               lang === 'pt' ? 'Compartilhe seu link para comecar a receber sessoes.' :
               'Comparte tu link para empezar a recibir sesiones.';
    }
    const now = Date.now();
    const twoWeeksAgo = now - 14 * 86400000;
    const fourWeeksAgo = now - 28 * 86400000;
    const recent = sessions.filter(s => new Date(s.created_at).getTime() > twoWeeksAgo).length;
    const prev = sessions.filter(s => {
        const t = new Date(s.created_at).getTime();
        return t > fourWeeksAgo && t <= twoWeeksAgo;
    }).length;

    // Case 1: Growing
    if (recent > prev && recent > 0) {
        return lang === 'en' ? `Activity is growing. ${recent} new sessions in the last 2 weeks.` :
               lang === 'pt' ? `A atividade esta crescendo. ${recent} novas sessoes nas ultimas 2 semanas.` :
               `La actividad viene creciendo. ${recent} sesiones nuevas en las ultimas 2 semanas.`;
    }
    // Case 2: Declining
    if (recent < prev && prev > 0) {
        return lang === 'en' ? 'Activity slowed down a bit. Sharing your link with new groups can help reactivate it.' :
               lang === 'pt' ? 'A atividade diminuiu um pouco. Compartilhar seu link com novos grupos pode ajudar a reativa-la.' :
               'La actividad bajo un poco. Compartir tu link con nuevos grupos puede ayudar a reactivarla.';
    }
    // Case 3: Inactive (0 in last 2 weeks)
    if (recent === 0) {
        return lang === 'en' ? 'No new sessions in the last 2 weeks. Share your link to reactivate.' :
               lang === 'pt' ? 'Sem novas sessoes nas ultimas 2 semanas. Compartilhe seu link para reativar.' :
               'Hace 2 semanas que no hay sesiones nuevas. Comparte tu link para reactivar.';
    }
    // Case 4: Stable
    const totalWeeks = Math.max(1, Math.ceil((now - new Date(sessions[sessions.length - 1]?.created_at).getTime()) / (7 * 86400000)));
    const avg = Math.round(sessions.length / totalWeeks);
    return lang === 'en' ? `Stable activity. About ${avg} sessions per week on average.` :
           lang === 'pt' ? `Atividade estavel. Cerca de ${avg} sessoes por semana em media.` :
           `Actividad estable. Alrededor de ${avg} sesiones por semana en promedio.`;
}

/* ── Distribution digest. short, motivational, home-specific ────────────── */
const HOME_DISTRIBUTION_DIGEST: Record<string, Record<string, string>> = {
    Competitivo: {
        es: 'Tus deportistas se encienden con los desafios. La competencia sana y los retos claros son un gran canal para mantener su motivacion.',
        en: 'Your athletes light up with challenges. Healthy competition and clear goals are great channels to keep them motivated.',
        pt: 'Seus atletas se acendem com desafios. A competicao saudavel e metas claras sao otimos canais para mante-los motivados.',
    },
    Social: {
        es: 'Tus deportistas responden bien al trabajo en equipo y a las dinamicas grupales. Esa energia social es una herramienta muy valiosa para el entrenador.',
        en: 'Your athletes respond well to teamwork and group dynamics. That social energy is a very valuable tool for the coach.',
        pt: 'Seus atletas respondem bem ao trabalho em equipe e as dinamicas de grupo. Essa energia social e uma ferramenta muito valiosa para o treinador.',
    },
    Cohesivo: {
        es: 'Tus deportistas valoran la estabilidad y la confianza del grupo. Los cambios graduales y bien explicados son la mejor forma de ayudarlos a crecer.',
        en: 'Your athletes value stability and group trust. Gradual, well-explained changes are the best way to help them grow.',
        pt: 'Seus atletas valorizam a estabilidade e a confianca do grupo. Mudancas graduais e bem explicadas sao a melhor forma de ajuda-los a crescer.',
    },
    'Metódico': {
        es: 'Tus deportistas tienden a observar y analizar antes de actuar. Explicar el "para que" de cada ejercicio los compromete mas con la actividad.',
        en: 'Your athletes tend to observe and analyze before acting. Explaining the "why" behind each drill gets them more engaged.',
        pt: 'Seus atletas tendem a observar e analisar antes de agir. Explicar o "por que" de cada exercicio os compromete mais com a atividade.',
    },
    Balanceado: {
        es: 'Tus deportistas tienen perfiles variados. Eso es una fortaleza: te permite probar distintos enfoques y encontrar lo que funciona mejor con cada uno.',
        en: 'Your athletes have varied profiles. That is a strength: it lets you try different approaches and find what works best with each one.',
        pt: 'Seus atletas tem perfis variados. Isso e um ponto forte: permite experimentar diferentes abordagens e encontrar o que funciona melhor com cada um.',
    },
};

function getDistributionDigest(sessions: SessionRow[], lang: string): string {
    if (sessions.length < 3) {
        return lang === 'en' ? 'More profiles are needed to see the distribution of your athletes.' :
               lang === 'pt' ? 'Mais perfis são necessários para ver a distribuição dos seus atletas.' :
               'Se necesitan más perfiles para ver la distribución de tus deportistas.';
    }
    const members: MemberProfile[] = sessions.map(s => ({
        session_id: s.id, child_name: s.child_name, child_age: s.child_age,
        sport: s.sport ?? '', eje: s.eje as MemberProfile['eje'],
        motor: s.motor, eje_secundario: s.eje_secundario ?? '', archetype_label: s.archetype_label,
    }));
    const dist = calcAxisDistribution(members);
    const types = getGroupTypes(dist);
    const primary = types[0] ?? 'Balanceado';
    return HOME_DISTRIBUTION_DIGEST[primary]?.[lang] ?? HOME_DISTRIBUTION_DIGEST[primary]?.es ?? '';
}

/* ── Component ───────────────────────────────────────────────────────────── */
export const TenantHome: React.FC = () => {
    const { tenant, refreshTenant } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [groupCount, setGroupCount] = useState<number | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);

    useEffect(() => {
        const payment = searchParams.get('payment');
        if (payment === 'success') { setPaymentMsg({ type: 'success', text: dt.home.pagoConfirmado }); refreshTenant(); setSearchParams({}, { replace: true }); setTimeout(() => setPaymentMsg(null), 6000); }
        else if (payment === 'cancel') { setPaymentMsg({ type: 'cancel', text: dt.home.pagoCancelado }); setSearchParams({}, { replace: true }); setTimeout(() => setPaymentMsg(null), 4000); }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!tenant) return;
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const headers = { Authorization: `Bearer ${session.access_token}` };
            // Fetch sessions
            try {
                const res = await fetch('/api/tenant-sessions', { headers });
                if (res.ok) { const data = await res.json(); setSessions(data.sessions); }
            } catch { /* silently fail */ }
            finally { setSessionsLoading(false); }
            // Fetch group count
            try {
                const res = await fetch('/api/tenant-groups', { headers });
                if (res.ok) { const data = await res.json(); setGroupCount(data.groups?.length ?? 0); }
            } catch { /* silently fail */ }
        };
        fetchData();
        const interval = setInterval(fetchData, 30_000);
        return () => clearInterval(interval);
    }, [tenant]);

    // All hooks MUST be above any early return
    const locale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-AR';

    const chartData = useMemo(() => {
        const nowMs = Date.now();
        const buckets: { week: string; sessions: number }[] = [];
        // i=7 is the oldest week, i=0 is the current week ending today
        for (let i = 7; i >= 0; i--) {
            const weekEnd = i === 0 ? nowMs : nowMs - i * 7 * 86400000;
            const weekStart = weekEnd - 7 * 86400000;
            const count = sessions.filter(s => { const t = new Date(s.created_at).getTime(); return t > weekStart && t <= weekEnd; }).length;
            // Label with the END of the period so the last bar always shows today's date
            const d = new Date(weekEnd);
            buckets.push({ week: d.toLocaleDateString(locale, { day: '2-digit', month: 'short' }), sessions: count });
        }
        return buckets;
    }, [sessions, locale]);

    if (!tenant) {
        return <div className="flex items-center justify-center h-40"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short' });
    const uniquePlayers = new Set(sessions.map(s => s.child_name)).size;
    const now = new Date();
    const thisMonthCount = sessions.filter(s => { const d = new Date(s.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;

    // Distribution
    const axisCounts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    sessions.forEach(s => { if (axisCounts[s.eje] !== undefined) axisCounts[s.eje]++; });
    const totalForDist = sessions.length || 1;



    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {paymentMsg && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${paymentMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {paymentMsg.text}
                </div>
            )}

            {/* ═══ ROW 1: Header + Link ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.home.bienvenida(tenant.display_name)}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.home.descripcionInicio}</p>
                </div>
                <LinkWidget slug={tenant.slug} lang={lang} />
            </div>

            {/* ═══ ROW 2: Stats ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {[
                    { icon: Coins, label: dt.home.creditos, value: tenant.credits_remaining, sub: `Plan ${tenant.plan}`, tip: lang === 'en' ? '1 credit = 1 play. Credits are consumed when a session starts.' : lang === 'pt' ? '1 crédito = 1 jogada. Os créditos são consumidos ao iniciar uma sessão.' : '1 crédito = 1 jugada. Los créditos se consumen al iniciar una sesión.' },
                    { icon: Activity, label: lang === 'en' ? 'Sessions' : lang === 'pt' ? 'Sessoes' : 'Sesiones', value: sessionsLoading ? '...' : sessions.length, sub: thisMonthCount > 0 ? `+${thisMonthCount} ${lang === 'en' ? 'this month' : lang === 'pt' ? 'este mes' : 'este mes'}` : (lang === 'en' ? 'completed' : 'completadas'), tip: lang === 'en' ? 'Total completed experiences by your athletes' : lang === 'pt' ? 'Total de experiências completadas pelos seus atletas' : 'Total de experiencias completadas por tus deportistas' },
                    { icon: Users, label: lang === 'en' ? 'Athletes' : lang === 'pt' ? 'Atletas' : 'Deportistas', value: sessionsLoading ? '...' : uniquePlayers, sub: lang === 'en' ? 'with profile' : lang === 'pt' ? 'com perfil' : 'con perfil', tip: lang === 'en' ? 'Unique athletes who completed a profile' : lang === 'pt' ? 'Atletas únicos que completaram um perfil' : 'Deportistas únicos que completaron un perfil' },
                    { icon: Layers, label: lang === 'en' ? 'Groups' : lang === 'pt' ? 'Grupos' : 'Grupos', value: groupCount ?? (sessionsLoading ? '...' : 0), sub: lang === 'en' ? 'created' : lang === 'pt' ? 'criados' : 'creados', tip: lang === 'en' ? 'Organize your athletes in groups to see team dynamics' : lang === 'pt' ? 'Organize seus atletas em grupos para ver a dinâmica de equipe' : 'Organiza tus deportistas en grupos para ver la dinámica de equipo' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="bg-white rounded-[14px] px-6 py-5 shadow-argo transition-all hover:shadow-argo-hover group"
                    >
                        <div className="w-9 h-9 rounded-[10px] bg-argo-bg flex items-center justify-center text-argo-grey mb-3.5 transition-colors group-hover:bg-argo-violet-50 group-hover:text-argo-violet-400">
                            <stat.icon size={18} />
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <p className="text-xs text-argo-grey font-medium">{stat.label}</p>
                            <InfoTip text={stat.tip} />
                        </div>
                        <p className="text-[32px] font-bold text-argo-navy tracking-tight leading-none">{stat.value}</p>
                        <p className="text-[11px] text-argo-light mt-1">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* ═══ ROW 3: Activity chart + Distribution ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-10">
                {/* Activity */}
                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-1">
                        {lang === 'en' ? 'Recent activity' : lang === 'pt' ? 'Atividade recente' : 'Actividad reciente'}
                    </h2>
                    <p className="text-[11px] text-argo-light mb-4">
                        {lang === 'en' ? 'Sessions per week, last 8 weeks' : lang === 'pt' ? 'Sessoes por semana, ultimas 8 semanas' : 'Sesiones por semana, ultimas 8 semanas'}
                    </p>
                    {sessionsLoading ? (
                        <div className="h-[120px] bg-argo-bg rounded-lg animate-pulse" />
                    ) : (
                        <div className="h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#955FB5" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#955FB5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#AEAEB2' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ background: '#1D1D1F', border: 'none', borderRadius: 8, fontSize: 12, color: 'white', padding: '6px 10px' }}
                                        labelStyle={{ color: '#AEAEB2', fontSize: 10 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sessions"
                                        stroke="#955FB5"
                                        strokeWidth={2}
                                        fill="url(#areaGrad)"
                                        animationDuration={800}
                                        animationEasing="ease-out"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <p className="text-xs text-argo-secondary leading-relaxed mt-4 pl-3 border-l-2 border-argo-violet-100">
                        {sessionsLoading ? '...' : getActivityDigest(sessions, lang)}
                    </p>
                </div>

                {/* Mini chat widget */}
                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5 flex flex-col">
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-1">
                        {lang === 'en' ? 'Argo Consultant' : 'Consultor Argo'}
                    </h2>
                    <p className="text-[11px] text-argo-light mb-3">
                        {lang === 'en' ? 'Ask anything about your athletes' : lang === 'pt' ? 'Pergunte qualquer coisa sobre seus atletas' : 'Consulta lo que necesites sobre tus deportistas'}
                    </p>

                    {/* Example prompts */}
                    <div className="space-y-1.5 mb-4">
                        {(lang === 'en'
                            ? ['How do I motivate a player who doesn\'t want to train?', 'Explain the profiles of Mateo and Allegra']
                            : lang === 'pt'
                                ? ['Como motivo um jogador que nao quer treinar?', 'Me explique o perfil de Mateo e Allegra']
                                : ['¿Como motivo a un jugador que no quiere entrenar?', 'Explicame el perfil de Mateo y Allegra']
                        ).map((p, i) => (
                            <div key={i} className="px-3 py-2 rounded-lg border border-argo-border text-[11px] text-argo-light cursor-default">
                                {p}
                            </div>
                        ))}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.target as HTMLFormElement).elements.namedItem('chatInput') as HTMLInputElement;
                            const q = input.value.trim();
                            if (q) navigate(`/dashboard/chat?q=${encodeURIComponent(q)}`);
                        }}
                        className="mt-auto"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                name="chatInput"
                                type="text"
                                placeholder={lang === 'en' ? 'Write your question...' : lang === 'pt' ? 'Escreva sua pergunta...' : 'Escribe tu consulta...'}
                                className="flex-1 rounded-lg border border-argo-border bg-argo-bg px-3.5 py-2.5 text-[13px] outline-none focus:border-argo-violet-200 transition-colors"
                            />
                            <button
                                type="submit"
                                className="p-2.5 rounded-lg bg-argo-navy text-white hover:bg-argo-navy/90 transition-colors flex-shrink-0"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ═══ ROW 4: Last 3 sessions + Distribution ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-stretch">
                <div className="bg-white rounded-[14px] shadow-argo">
                    <div className="flex items-center justify-between px-6 pt-5 pb-0">
                        <h2 className="text-[15px] font-semibold text-argo-navy">
                            {lang === 'en' ? 'Latest sessions' : lang === 'pt' ? 'Ultimas sessoes' : 'Ultimas sesiones'}
                        </h2>
                        <button onClick={() => navigate('/dashboard/players')} className="flex items-center gap-1 text-xs font-medium text-argo-violet-500 hover:opacity-70 transition-opacity">
                            {dt.home.verTodas}<ChevronRight size={12} />
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        {sessionsLoading ? (
                            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-14 bg-argo-bg rounded-lg animate-pulse" />)}</div>
                        ) : sessions.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-argo-secondary">{dt.home.sinSesiones}</p>
                                <p className="text-xs text-argo-light mt-1">{dt.home.sinSesionesDesc}</p>
                            </div>
                        ) : (
                            <div>
                                {sessions.slice(0, 3).map((s, idx) => {
                                    const chip = AXIS_CHIP_STYLE[s.eje] ?? AXIS_CHIP_STYLE.C;
                                    const dot = AXIS_COLORS[s.eje] ?? '#6366f1';
                                    const key = `${s.eje}-${s.motor}`;
                                    const micro = MICRO_DESC[key]?.[lang] ?? '';
                                    const archetypeLabel = ARCHETYPE_LABELS[key]?.[lang] ?? s.archetype_label;
                                    return (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.25, delay: idx * 0.06 }}
                                            className="flex items-center gap-3.5 py-3.5 border-b border-argo-border last:border-b-0 group"
                                        >
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-semibold text-argo-navy truncate">{s.child_name}</p>
                                                <p className="text-xs text-argo-grey mt-0.5">
                                                    {s.child_age} {dt.common.anos}{s.sport ? `  ·  ${s.sport}` : ''}  ·  {formatDate(s.created_at)}
                                                </p>
                                                {micro && <p className="text-[11px] text-argo-light mt-0.5 italic">{micro}</p>}
                                            </div>
                                            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-transparent flex-shrink-0 hidden sm:inline-block" style={{ border: `1px solid ${chip.border}`, color: chip.text }}>
                                                {archetypeLabel}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution */}
                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5 flex flex-col">
                    <h2 className="text-[15px] font-semibold text-argo-navy mb-1">
                        {lang === 'en' ? 'Profile distribution' : lang === 'pt' ? 'Distribuição de perfis' : 'Distribución de perfiles'}
                    </h2>
                    <p className="text-[11px] text-argo-light mb-4">
                        {lang === 'en' ? 'Your athletes by behavioral axis' : lang === 'pt' ? 'Seus atletas por eixo comportamental' : 'Tus deportistas por eje de conducta'}
                    </p>

                    {sessionsLoading ? (
                        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-4 bg-argo-bg rounded animate-pulse" />)}</div>
                    ) : (
                        <div className="space-y-3.5">
                            {(['D', 'I', 'S', 'C'] as const).map((axis, i) => {
                                const count = axisCounts[axis];
                                const pct = Math.round((count / totalForDist) * 100);
                                const cfg = AXIS_CONFIG[axis];
                                const name = dt.profile?.axisNames?.[axis] ?? AXIS_LABELS[axis];
                                return (
                                    <div key={axis} className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-argo-secondary w-20">{name}</span>
                                        <div className="flex-1 h-[5px] rounded-sm bg-argo-border overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-sm"
                                                style={{ background: cfg.color, opacity: 0.7 }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 + i * 0.08 }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-semibold text-argo-grey w-8 text-right">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!sessionsLoading && sessions.length >= 3 && (
                        <p className="text-xs text-argo-secondary leading-relaxed mt-auto pt-5 pl-3 border-l-2 border-argo-violet-100">
                            {getDistributionDigest(sessions, lang)}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
