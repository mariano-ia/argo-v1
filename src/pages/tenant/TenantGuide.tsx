import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    SITUATIONS, SITUATION_CARDS, CATEGORY_COLORS,
    getCardsForSituation,
    type Situation, type SituationCard,
} from '../../lib/situationalGuide';
import { AXIS_CONFIG } from '../../lib/groupBalanceRules';
import { SkeletonList, SkeletonSessionRow } from '../../components/ui/Skeleton';
import { getDashboardT } from '../../lib/dashboardTranslations';
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
    sport: string | null;
    archetype_label: string;
    eje: string;
    motor: string;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export const TenantGuide: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    // State
    const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<SessionRow | null>(null);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    // Fetch sessions once
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
            setSessionsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (tenant) fetchSessions();
    }, [tenant, fetchSessions]);

    // Filtered situations
    const categories = [...new Set(SITUATIONS.map(s => s.category))];
    const filtered = SITUATIONS.filter(s => {
        if (categoryFilter && s.category !== categoryFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return s.title.toLowerCase().includes(q) || s.whatYouSee.toLowerCase().includes(q);
        }
        return true;
    });

    // Get the right card
    const activeCard: SituationCard | null = selectedSituation
        ? selectedPlayer
            ? SITUATION_CARDS.find(c => c.situationId === selectedSituation.id && c.eje === selectedPlayer.eje) ?? null
            : selectedSituation.category === 'Grupal'
                ? SITUATION_CARDS.find(c => c.situationId === selectedSituation.id && c.eje === 'group') ?? null
                : null
        : null;

    /* ── Loading ───────────────────────────────────────────────────────────── */

    if (!tenant) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    /* ── Card detail view ──────────────────────────────────────────────────── */

    if (selectedSituation && (activeCard || selectedSituation.category === 'Grupal')) {
        const card = activeCard ?? getCardsForSituation(selectedSituation.id).find(c => c.eje === 'group');
        const catColor = CATEGORY_COLORS[selectedSituation.category] ?? { bg: '#f3f4f6', text: '#374151' };

        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
            >
                <button
                    onClick={() => { setSelectedPlayer(null); if (selectedSituation.category === 'Grupal') setSelectedSituation(null); else setSelectedSituation(selectedSituation); }}
                    className="flex items-center gap-2 text-sm text-argo-grey hover:text-argo-navy transition-colors"
                >
                    <ArrowLeft size={16} />
                    {selectedSituation.category === 'Grupal' ? dt.guide.volverSituaciones : dt.guide.cambiarJugador}
                </button>

                {/* Situation header */}
                <div className="bg-white rounded-[14px] shadow-argo p-6 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl">{selectedSituation.icon}</span>
                        <h1 className="text-xl font-bold text-argo-navy">{selectedSituation.title}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: catColor.bg, color: catColor.text }}>
                            {selectedSituation.category}
                        </span>
                    </div>
                    {selectedPlayer && (
                        <div className="flex items-center gap-2 pt-1">
                            <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                                style={{ background: AXIS_CONFIG[selectedPlayer.eje]?.color ?? '#666' }}
                            >
                                {selectedPlayer.eje}
                            </span>
                            <span className="text-sm font-medium text-argo-navy">{selectedPlayer.child_name}</span>
                            <span className="text-xs text-argo-grey">{selectedPlayer.archetype_label}</span>
                        </div>
                    )}
                </div>

                {/* What you see */}
                <div className="bg-white rounded-[14px] shadow-argo p-6 space-y-2">
                    <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">{dt.guide.loQueVes}</h3>
                    <p className="text-sm text-argo-secondary leading-relaxed">{selectedSituation.whatYouSee}</p>
                </div>

                {/* What's happening */}
                <div className="bg-white rounded-[14px] shadow-argo p-6 space-y-2">
                    <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">{dt.guide.loQuePasa}</h3>
                    <p className="text-sm text-argo-secondary leading-relaxed">{selectedSituation.whatsHappening}</p>
                    {card && (
                        <div className="mt-3 pt-3 border-t border-argo-border">
                            <p className="text-xs font-semibold text-argo-violet-500 uppercase tracking-widest mb-1.5">
                                {selectedPlayer ? dt.guide.conEstePerfil(AXIS_CONFIG[selectedPlayer.eje]?.name ?? selectedPlayer.eje) : dt.guide.paraElGrupo}
                            </p>
                            <p className="text-sm text-argo-navy leading-relaxed">{card.whatsHappeningForProfile}</p>
                        </div>
                    )}
                </div>

                {/* How to accompany */}
                {card && (
                    <div className="bg-white rounded-[14px] shadow-argo p-6 space-y-3">
                        <h3 className="text-xs font-bold text-argo-navy uppercase tracking-widest">{dt.guide.comoAcompanar}</h3>
                        <div className="space-y-3">
                            {card.howToAccompany.map((text, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="mt-0.5 w-6 h-6 rounded-full bg-argo-violet-50 text-argo-violet-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm text-argo-secondary leading-relaxed">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* If not responding */}
                {card && (
                    <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-6 space-y-2">
                        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest">{dt.guide.siNoResponde}</h3>
                        <p className="text-sm text-amber-900 leading-relaxed">{card.ifNotResponding}</p>
                    </div>
                )}
            </motion.div>
        );
    }

    /* ── Player selection view ─────────────────────────────────────────────── */

    if (selectedSituation && selectedSituation.category !== 'Grupal') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
            >
                <button
                    onClick={() => setSelectedSituation(null)}
                    className="flex items-center gap-2 text-sm text-argo-grey hover:text-argo-navy transition-colors"
                >
                    <ArrowLeft size={16} />
                    {dt.guide.volverSituaciones}
                </button>

                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedSituation.icon}</span>
                        <h1 className="text-xl font-bold text-argo-navy">{selectedSituation.title}</h1>
                    </div>
                    <p className="text-sm text-argo-grey mt-2">
                        {dt.guide.seleccionaJugador}
                    </p>
                </div>

                <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                    <div className="px-6 py-4 border-b border-argo-border">
                        <h2 className="text-[15px] font-semibold text-argo-navy">{dt.guide.tusJugadores}</h2>
                    </div>

                    {!sessionsLoaded ? (
                        <SkeletonList rows={5} RowComponent={SkeletonSessionRow} />
                    ) : sessions.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-argo-secondary">{dt.guide.sinJugadores}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-argo-border">
                            {sessions.map(s => {
                                const cfg = AXIS_CONFIG[s.eje];
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedPlayer(s)}
                                        className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-argo-bg/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                                                style={{ background: cfg?.color ?? '#666' }}
                                            >
                                                {s.eje}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-argo-navy truncate">{s.child_name}</p>
                                                <p className="text-xs text-argo-secondary">{s.child_age} {dt.common.anos}{s.sport ? ` · ${s.sport}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="border border-argo-violet-500/35 text-argo-violet-500/75 bg-transparent rounded-full text-[11px] font-medium px-3 py-1">
                                                {s.archetype_label}
                                            </span>
                                            <ChevronRight size={16} className="text-argo-grey/40" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Or view general context */}
                <button
                    onClick={() => {
                        // Show with generic D card as "general" view
                        const genericCard = getCardsForSituation(selectedSituation.id);
                        if (genericCard.length > 0) {
                            // Show situation without player-specific context
                            setSelectedPlayer({ id: '', child_name: 'Vista general', child_age: 0, sport: '', archetype_label: '', eje: 'D', motor: '' });
                        }
                    }}
                    className="text-sm text-argo-violet-500 hover:text-argo-navy transition-colors font-medium"
                >
                    {dt.guide.verContextoGeneral}
                </button>
            </motion.div>
        );
    }

    /* ── Situation list view ────────────────────────────────────────────────── */

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            <div>
                <h1 className="font-display text-2xl font-bold text-argo-navy tracking-tight">{dt.guide.titulo}</h1>
                <p className="text-sm text-argo-secondary mt-1">
                    {dt.guide.subtitulo}
                </p>
            </div>

            {/* Search + category filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-grey" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={dt.guide.buscarPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-argo-border text-sm outline-none focus:border-argo-navy transition-colors"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            !categoryFilter ? 'bg-argo-navy text-white border-argo-navy' : 'border-argo-border text-argo-grey hover:border-argo-navy/30'
                        }`}
                    >
                        {dt.common.todas}
                    </button>
                    {categories.map(cat => {
                        const cc = CATEGORY_COLORS[cat] ?? { bg: '#f3f4f6', text: '#374151' };
                        return (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    categoryFilter === cat ? 'border-transparent' : 'border-argo-border hover:border-argo-navy/30'
                                }`}
                                style={categoryFilter === cat ? { background: cc.bg, color: cc.text, borderColor: cc.text + '40' } : {}}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Situation cards */}
            <div className="space-y-3">
                {filtered.map(situation => {
                    const catColor = CATEGORY_COLORS[situation.category] ?? { bg: '#f3f4f6', text: '#374151' };
                    return (
                        <button
                            key={situation.id}
                            onClick={() => {
                                setSelectedSituation(situation);
                                setSelectedPlayer(null);
                            }}
                            className="w-full bg-white rounded-[14px] shadow-argo p-5 text-left hover:shadow-argo-hover transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">{situation.icon}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-bold text-argo-navy">{situation.title}</h3>
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                            style={{ background: catColor.bg, color: catColor.text }}
                                        >
                                            {situation.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-argo-grey mt-1.5 leading-relaxed line-clamp-2">
                                        {situation.whatYouSee}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-argo-grey/30 group-hover:text-argo-navy/40 transition-colors mt-1 flex-shrink-0" />
                            </div>
                        </button>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-sm text-argo-grey">No se encontraron situaciones.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
