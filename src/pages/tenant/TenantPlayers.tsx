import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Clock, AlertCircle, UserCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getReportData } from '../../lib/argosEngine';
import { getTendenciaContent } from '../../lib/archetypeData';
import { AXIS_CONFIG } from '../../lib/groupBalanceRules';
import { SkeletonPlayerCard } from '../../components/ui/Skeleton';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { LinkWidget } from '../../components/dashboard/LinkWidget';
import { useLang } from '../../context/LangContext';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

interface SessionRow {
    id: string;
    child_name: string;
    child_age: number;
    adult_name: string;
    adult_email: string;
    sport: string | null;
    archetype_label: string;
    eje: string;
    motor: string;
    eje_secundario: string | null;
    lang: string | null;
    created_at: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const formatDate = (iso: string, lang: string) => {
    const locale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-AR';
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysSince = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));

const monthsSince = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
};

// MOTOR_LABELS removed — now using dt.profile.motorNames

const MOTOR_COLORS: Record<string, { bg: string; text: string }> = {
    'Rápido': { bg: '#fef3c7', text: '#92400e' },
    'Medio':  { bg: '#e0e7ff', text: '#3730a3' },
    'Lento':  { bg: '#cffafe', text: '#155e75' },
};

/* ── Player Card ───────────────────────────────────────────────────────────── */

const PlayerCard: React.FC<{ session: SessionRow; dt: ReturnType<typeof getDashboardT>; lang: string }> = ({ session, dt, lang }) => {
    const [expanded, setExpanded] = useState(false);
    const months = monthsSince(session.created_at);
    const needsReprofile = months >= 6;

    const axisCfg = AXIS_CONFIG[session.eje];
    const motorCfg = MOTOR_COLORS[session.motor] ?? { bg: '#f3f4f6', text: '#374151' };
    const tendencia = session.eje_secundario
        ? dt.profile.tendenciaLabels[session.eje_secundario] ?? null
        : null;

    // Get report data for bridge words and key info
    const reportData = useMemo(() => {
        try {
            return getReportData(session.eje as any, session.motor as any, '', session.child_name);
        } catch { return null; }
    }, [session.eje, session.motor, session.child_name]);

    const tendenciaContent = useMemo(() => {
        if (!session.eje_secundario) return null;
        try {
            return getTendenciaContent(session.eje as any, session.eje_secundario as any);
        } catch { return null; }
    }, [session.eje, session.eje_secundario]);

    return (
        <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
            {/* ── Level 1: Quick scan ──────────────────────────────────────── */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 text-left hover:bg-argo-bg/30 transition-colors"
            >
                <div className="flex items-start gap-3">
                    {/* Axis badge */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: axisCfg?.color ?? '#666' }}
                    >
                        {session.eje}
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* Name + age + sport */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-argo-navy">{session.child_name}</h3>
                            <span className="text-sm text-argo-grey">
                                {session.child_age} {dt.common.anos}{session.sport ? ` · ${session.sport}` : ''}
                            </span>
                        </div>

                        {/* Archetype + tendencia */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-block border border-argo-violet-500/35 text-argo-violet-500/75 bg-transparent rounded-full text-[11px] font-medium px-3 py-1">
                                {session.archetype_label}
                            </span>
                            {tendencia && (
                                <span className="text-xs text-argo-grey italic">
                                    {tendencia}
                                </span>
                            )}
                            <span
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: motorCfg.bg, color: motorCfg.text }}
                            >
                                {dt.profile.motorNames[session.motor] ?? session.motor}
                            </span>
                        </div>

                        {/* Bridge words preview (top 3) */}
                        {reportData && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {reportData.palabrasPuente.slice(0, 3).map((w, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                                        style={{ background: axisCfg?.bgColor ?? '#f3f4f6', color: axisCfg?.color ?? '#374151' }}
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side: date + reprofile indicator + expand */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            {needsReprofile && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertCircle size={10} />
                                    {dt.players.rePerfilar}
                                </span>
                            )}
                            {expanded ? <ChevronUp size={16} className="text-argo-grey" /> : <ChevronDown size={16} className="text-argo-grey" />}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-argo-grey/60">
                            <Clock size={10} />
                            {formatDate(session.created_at, lang)}
                            {months > 0 && <span>· {months} {dt.players.meses}</span>}
                        </div>
                    </div>
                </div>
            </button>

            {/* ── Level 2: Expanded detail ─────────────────────────────────── */}
            {expanded && (
                <div className="border-t border-argo-border px-5 py-5 space-y-5">
                    {/* Key insight */}
                    {reportData && (
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">{dt.players.loEsencial}</h4>
                            <p className="text-sm text-argo-navy leading-relaxed">{reportData.perfil}</p>
                        </div>
                    )}

                    {/* Bridge words (full) */}
                    {reportData && (
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">{dt.players.palabrasPuente}</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {reportData.palabrasPuente.map((w, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                                        style={{ background: axisCfg?.bgColor, color: axisCfg?.color, borderColor: axisCfg?.borderColor }}
                                    >
                                        {w}
                                    </span>
                                ))}
                                {tendenciaContent?.palabrasPuenteExtra?.map((w, i) => (
                                    <span
                                        key={`e-${i}`}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed"
                                        style={{ background: axisCfg?.bgColor + '80', color: axisCfg?.color, borderColor: axisCfg?.borderColor }}
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Noise words */}
                    {reportData && (
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">{dt.players.evitarComunicacion}</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {reportData.palabrasRuido.map((w, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                                    >
                                        {w}
                                    </span>
                                ))}
                                {tendenciaContent?.palabrasRuidoExtra?.map((w, i) => (
                                    <span
                                        key={`e-${i}`}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50/50 text-red-600 border border-dashed border-red-200"
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tendencia paragraph */}
                    {tendenciaContent && (
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">
                                {dt.players.brujulaSecundaria}: {tendencia}
                            </h4>
                            <p className="text-xs text-argo-grey leading-relaxed">{tendenciaContent.parrafo.replace(/\{nombre\}/g, session.child_name)}</p>
                        </div>
                    )}

                    {/* Coaching situations (guía) */}
                    {reportData && reportData.guia?.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">{dt.players.guiaRapida}</h4>
                            {reportData.guia.map((g, i) => (
                                <div key={i} className="bg-argo-bg/50 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-semibold text-argo-navy">{g.situacion}</p>
                                    <p className="text-[11px] text-emerald-700">
                                        <span className="font-semibold">{dt.players.activar}:</span> {g.activador}
                                    </p>
                                    <p className="text-[11px] text-red-600">
                                        <span className="font-semibold">{dt.players.aConsiderar}:</span> {g.desmotivacion}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Checklist */}
                    {reportData?.checklist && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-argo-navy uppercase tracking-widest">{dt.players.checklistEntrenamiento}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: dt.players.antes, text: reportData.checklist.antes },
                                    { label: dt.players.durante, text: reportData.checklist.durante },
                                    { label: dt.players.despues, text: reportData.checklist.despues },
                                ].map(c => (
                                    <div key={c.label} className="bg-argo-bg/50 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-argo-violet-500 uppercase">{c.label}</p>
                                        <p className="text-[11px] text-argo-grey leading-relaxed mt-1">{c.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Re-profile timeline */}
                    <div className="pt-3 border-t border-argo-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-argo-grey" />
                                <span className="text-xs text-argo-grey">
                                    {dt.players.perfiladoEl} {formatDate(session.created_at, lang)} ({daysSince(session.created_at)} {dt.players.dias})
                                </span>
                            </div>
                            {needsReprofile && (
                                <span className="text-xs text-amber-700 font-medium">
                                    {dt.players.seRecomiendaRePerfilar}
                                </span>
                            )}
                        </div>
                        {/* Timeline bar */}
                        <div className="mt-2 w-full h-1.5 rounded-full bg-argo-bg overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, (monthsSince(session.created_at) / 8) * 100)}%`,
                                    background: needsReprofile ? '#f59e0b' : '#6366f1',
                                }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-argo-grey/50">{dt.players.perfiladoEl.split(' ')[0]}</span>
                            <span className="text-[9px] text-argo-grey/50">8 {dt.players.meses} ({dt.players.rePerfilar.toLowerCase()})</span>
                        </div>
                    </div>

                    {/* Adult info */}
                    <div className="text-xs text-argo-grey/60 pt-2 border-t border-argo-border">
                        {dt.homeExtra.adulto}: {session.adult_name} ({session.adult_email})
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Main Component ────────────────────────────────────────────────────────── */

export const TenantPlayers: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null; refreshTenant: () => void }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [ejeFilter, setEjeFilter] = useState<string | null>(null);
    const [showReprofileOnly, setShowReprofileOnly] = useState(false);

    const fetchSessions = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const res = await fetch('/api/tenant-sessions', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant) fetchSessions();
    }, [tenant, fetchSessions]);

    // Filters
    const filtered = useMemo(() => {
        return sessions.filter(s => {
            if (ejeFilter && s.eje !== ejeFilter) return false;
            if (showReprofileOnly && monthsSince(s.created_at) < 6) return false;
            if (search) {
                const q = search.toLowerCase();
                return s.child_name.toLowerCase().includes(q) ||
                    s.archetype_label.toLowerCase().includes(q) ||
                    (s.sport ?? '').toLowerCase().includes(q);
            }
            return true;
        });
    }, [sessions, search, ejeFilter, showReprofileOnly]);

    // Stats
    const reprofileCount = sessions.filter(s => monthsSince(s.created_at) >= 6).length;

    if (!tenant) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.players.titulo}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">
                        {dt.players.subtitulo}
                    </p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} />}
            </div>

            {/* Re-profile alert */}
            {reprofileCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">
                            {dt.players.rePerfilarAlerta(reprofileCount)}
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            {dt.players.rePerfilarAlertaDesc}
                        </p>
                    </div>
                </div>
            )}

            {/* Search + filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={dt.players.buscarPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-argo-border text-sm outline-none focus:border-argo-navy transition-colors"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Eje filters */}
                    {(['D', 'I', 'S', 'C'] as const).map(eje => {
                        const cfg = AXIS_CONFIG[eje];
                        const isActive = ejeFilter === eje;
                        return (
                            <button
                                key={eje}
                                onClick={() => setEjeFilter(isActive ? null : eje)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                    isActive ? 'text-white border-transparent' : 'border-argo-border text-argo-grey hover:border-argo-navy/30'
                                }`}
                                style={isActive ? { background: cfg?.color } : {}}
                            >
                                <span className={`w-3 h-3 rounded ${isActive ? 'bg-white/30' : ''}`}
                                    style={!isActive ? { background: cfg?.color, opacity: 0.6 } : {}} />
                                {dt.profile.axisNames[eje] ?? cfg?.name}
                            </button>
                        );
                    })}
                    {/* Re-profile filter */}
                    <button
                        onClick={() => setShowReprofileOnly(!showReprofileOnly)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            showReprofileOnly
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'border-argo-border text-argo-grey hover:border-amber-300'
                        }`}
                    >
                        <AlertCircle size={12} />
                        {dt.players.rePerfilar} ({reprofileCount})
                    </button>
                </div>
            </div>

            {/* Players list */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonPlayerCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-[14px] bg-argo-violet-50 flex items-center justify-center mx-auto mb-3">
                        <UserCircle size={20} className="text-argo-violet-500" />
                    </div>
                    <p className="text-sm text-argo-secondary">
                        {sessions.length === 0
                            ? dt.players.sinJugadores
                            : dt.players.sinResultados}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-argo-grey">{filtered.length} {filtered.length === 1 ? dt.common.jugador : dt.common.jugadores}</p>
                    {filtered.map(s => (
                        <PlayerCard key={s.id} session={s} dt={dt} lang={lang} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};
