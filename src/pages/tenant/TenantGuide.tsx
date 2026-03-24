import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    SITUATIONS, SITUATION_CARDS, CATEGORY_COLORS,
    type Situation, type SituationCard,
} from '../../lib/situationalGuide';
import { AXIS_CONFIG } from '../../lib/groupBalanceRules';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData { id: string; slug: string; display_name: string; plan: string; credits_remaining: number; }
interface SessionRow { id: string; child_name: string; child_age: number; sport: string | null; archetype_label: string; eje: string; motor: string; }

/* ── Category icons (replace emojis) ───────────────────────────────────────── */

const AXIS_DOT: Record<string, string> = { D: '#f97316', I: '#f59e0b', S: '#22c55e', C: '#6366f1' };

/* ── Component ─────────────────────────────────────────────────────────────── */

export const TenantGuide: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [groups, setGroups] = useState<{ id: string; name: string; session_ids: string[] }[]>([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    // Player selector state
    const [playerSearch, setPlayerSearch] = useState('');
    const [playerEjeFilter, setPlayerEjeFilter] = useState<string | null>(null);
    const [playerGroupFilter, setPlayerGroupFilter] = useState<string | null>(null);
    const [playerShowAll, setPlayerShowAll] = useState(false);

    const fetchSessions = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const headers = { Authorization: `Bearer ${session.access_token}` };
        try {
            const res = await fetch('/api/tenant-sessions', { headers });
            if (res.ok) { const data = await res.json(); setSessions(data.sessions); }
        } finally { setSessionsLoaded(true); }
        // Fetch groups with members
        try {
            const res = await fetch('/api/tenant-groups', { headers });
            if (res.ok) {
                const data = await res.json();
                // For each group, fetch members
                const groupsWithMembers = await Promise.all(
                    (data.groups ?? []).map(async (g: { id: string; name: string }) => {
                        try {
                            const mRes = await fetch(`/api/tenant-groups?id=${g.id}`, { headers });
                            if (mRes.ok) {
                                const mData = await mRes.json();
                                return { id: g.id, name: g.name, session_ids: (mData.members ?? []).map((m: { session_id: string }) => m.session_id) };
                            }
                        } catch { /* ignore */ }
                        return { id: g.id, name: g.name, session_ids: [] };
                    })
                );
                setGroups(groupsWithMembers);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { if (tenant) fetchSessions(); }, [tenant, fetchSessions]);

    const categories = useMemo(() => [...new Set(SITUATIONS.map(s => s.category))], []);
    const filtered = useMemo(() => SITUATIONS.filter(s => {
        if (categoryFilter && s.category !== categoryFilter) return false;
        if (search) { const q = search.toLowerCase(); return s.title.toLowerCase().includes(q) || s.whatYouSee.toLowerCase().includes(q); }
        return true;
    }), [search, categoryFilter]);

    const selectedPlayer = sessions.find(s => s.id === selectedPlayerId) ?? null;

    // Get card for selected situation + player
    const activeCard: SituationCard | null = useMemo(() => {
        if (!selectedSituation) return null;
        if (selectedSituation.category === 'Grupal') {
            return SITUATION_CARDS.find(c => c.situationId === selectedSituation.id && c.eje === 'group') ?? null;
        }
        if (selectedPlayer) {
            return SITUATION_CARDS.find(c => c.situationId === selectedSituation.id && c.eje === selectedPlayer.eje) ?? null;
        }
        return null;
    }, [selectedSituation, selectedPlayer]);

    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    /* ── Render ────────────────────────────────────────────────────────────── */

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.guide.titulo}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.guide.subtitulo}</p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} />}
            </div>

            {/* Search + filters — full width */}
            <div className="space-y-3 mb-6">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-argo-light" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={dt.guide.buscarPlaceholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-argo-border text-[13px] outline-none focus:border-argo-violet-200 transition-colors"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                            !categoryFilter ? 'bg-argo-navy text-white border-argo-navy' : 'border-argo-border text-argo-grey hover:border-argo-violet-200'
                        }`}
                    >
                        {dt.common.todas}
                    </button>
                    {categories.map(cat => {
                        const cc = CATEGORY_COLORS[cat] ?? { bg: '#f3f4f6', text: '#374151' };
                        const isActive = categoryFilter === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(isActive ? null : cat)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                                    isActive
                                        ? 'border-transparent text-white'
                                        : 'border-argo-border text-argo-grey hover:border-argo-violet-200'
                                }`}
                                style={isActive ? { background: cc.text, borderColor: cc.text } : {}}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Two-panel layout — equal halves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" style={{ minHeight: 'calc(100vh - 18rem)' }}>

                {/* ═══ LEFT PANEL — Situations list ═══ */}
                <div className="bg-white rounded-[14px] shadow-argo overflow-hidden">
                    {filtered.map(situation => {
                        const isActive = selectedSituation?.id === situation.id;
                        return (
                            <button
                                key={situation.id}
                                onClick={() => { setSelectedSituation(situation); setSelectedPlayerId(null); }}
                                className={`w-full text-left px-5 py-3.5 border-b border-argo-border last:border-b-0 transition-all ${
                                    isActive ? 'bg-argo-violet-50' : 'hover:bg-argo-bg/50'
                                }`}
                            >
                                <p className={`text-[13px] font-semibold ${isActive ? 'text-argo-violet-500' : 'text-argo-navy'}`}>
                                    {situation.title}
                                </p>
                                <p className="text-[11px] text-argo-light mt-0.5 line-clamp-2 leading-relaxed">{situation.whatYouSee}</p>
                            </button>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-xs text-argo-light">{lang === 'en' ? 'No situations found.' : lang === 'pt' ? 'Nenhuma situacao encontrada.' : 'No se encontraron situaciones.'}</p>
                        </div>
                    )}
                </div>

                {/* ═══ RIGHT PANEL — Detail ═══ */}
                <div className="min-w-0">
                    <AnimatePresence mode="wait">
                        {!selectedSituation ? (
                            /* Empty state */
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center h-[400px]"
                            >
                                <div className="text-center max-w-sm">
                                    <Compass size={28} className="text-argo-border mx-auto mb-4" />
                                    <p className="text-[15px] font-semibold text-argo-navy mb-2">
                                        {lang === 'en' ? 'Select a situation' : lang === 'pt' ? 'Selecione uma situacao' : 'Selecciona una situacion'}
                                    </p>
                                    <p className="text-xs text-argo-light leading-relaxed">
                                        {lang === 'en'
                                            ? 'Choose a situation from the list to understand what is happening and how to help. You can also select one of your athletes to get personalized recommendations based on their profile.'
                                            : lang === 'pt'
                                                ? 'Escolha uma situacao da lista para entender o que esta acontecendo e como ajudar. Voce tambem pode selecionar um dos seus atletas para obter recomendacoes personalizadas com base no perfil dele.'
                                                : 'Elige una situacion de la lista para entender que esta pasando y como ayudar. Tambien puedes seleccionar a uno de tus deportistas para recibir recomendaciones personalizadas segun su perfil.'}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedSituation.id + (selectedPlayerId ?? '')}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Situation header */}
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: (CATEGORY_COLORS[selectedSituation.category] ?? { bg: '#f3f4f6' }).bg, color: (CATEGORY_COLORS[selectedSituation.category] ?? { text: '#374151' }).text }}>
                                            {selectedSituation.category}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-bold text-argo-navy">{selectedSituation.title}</h2>
                                </div>

                                {/* What you see + what's happening */}
                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.guide.loQueVes}</p>
                                        <p className="text-[13px] text-argo-secondary leading-relaxed">{selectedSituation.whatYouSee}</p>
                                    </div>
                                    <div className="border-t border-argo-border pt-4">
                                        <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-1.5">{dt.guide.loQuePasa}</p>
                                        <p className="text-[13px] text-argo-secondary leading-relaxed">{selectedSituation.whatsHappening}</p>
                                    </div>
                                </div>

                                {/* Player selector with search, filters, pagination */}
                                {selectedSituation.category !== 'Grupal' && (() => {
                                    const VISIBLE_COUNT = 10;
                                    const groupSessionIds = playerGroupFilter
                                        ? new Set(groups.find(g => g.id === playerGroupFilter)?.session_ids ?? [])
                                        : null;

                                    const filteredPlayers = sessions.filter(s => {
                                        if (playerSearch && !s.child_name.toLowerCase().includes(playerSearch.toLowerCase())) return false;
                                        if (playerEjeFilter && s.eje !== playerEjeFilter) return false;
                                        if (groupSessionIds && !groupSessionIds.has(s.id)) return false;
                                        return true;
                                    });

                                    const visiblePlayers = playerShowAll ? filteredPlayers : filteredPlayers.slice(0, VISIBLE_COUNT);
                                    const hasMore = filteredPlayers.length > VISIBLE_COUNT && !playerShowAll;

                                    return (
                                        <div className="bg-white rounded-[14px] shadow-argo px-6 py-5 space-y-3">
                                            <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em]">
                                                {lang === 'en' ? 'Personalize for a player' : lang === 'pt' ? 'Personalizar para um jogador' : 'Personalizar para un jugador'}
                                            </p>

                                            {!sessionsLoaded ? (
                                                <div className="flex gap-2">
                                                    {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-argo-bg rounded-lg animate-pulse" />)}
                                                </div>
                                            ) : sessions.length === 0 ? (
                                                <p className="text-xs text-argo-light">
                                                    {lang === 'en' ? 'No athletes profiled yet. Share your link to get started.' : lang === 'pt' ? 'Nenhum atleta perfilado ainda. Compartilhe seu link para comecar.' : 'Todavia no hay deportistas perfilados. Comparte tu link para comenzar.'}
                                                </p>
                                            ) : (
                                                <>
                                                    {/* Filters row */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="relative flex-1 min-w-[140px]">
                                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-argo-light" />
                                                            <input
                                                                value={playerSearch}
                                                                onChange={e => { setPlayerSearch(e.target.value); setPlayerShowAll(false); }}
                                                                placeholder={lang === 'en' ? 'Search...' : lang === 'pt' ? 'Buscar...' : 'Buscar...'}
                                                                className="w-full pl-7 pr-2 py-1.5 rounded-md border border-argo-border text-[11px] outline-none focus:border-argo-violet-200 transition-colors"
                                                            />
                                                        </div>

                                                        {/* Group dropdown */}
                                                        {groups.length > 0 && (
                                                            <select
                                                                value={playerGroupFilter ?? ''}
                                                                onChange={e => { setPlayerGroupFilter(e.target.value || null); setPlayerShowAll(false); }}
                                                                className="px-2 py-1.5 rounded-md border border-argo-border text-[11px] text-argo-secondary outline-none focus:border-argo-violet-200 transition-colors bg-white"
                                                            >
                                                                <option value="">{lang === 'en' ? 'All formations' : lang === 'pt' ? 'Todas as formacoes' : 'Todas las formaciones'}</option>
                                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                            </select>
                                                        )}

                                                        {/* Eje filter chips */}
                                                        {(['D', 'I', 'S', 'C'] as const).map(eje => {
                                                            const dot = AXIS_DOT[eje];
                                                            const isActive = playerEjeFilter === eje;
                                                            return (
                                                                <button
                                                                    key={eje}
                                                                    onClick={() => { setPlayerEjeFilter(isActive ? null : eje); setPlayerShowAll(false); }}
                                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                                                                        isActive ? 'bg-argo-navy text-white' : 'text-argo-grey hover:bg-argo-bg'
                                                                    }`}
                                                                >
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? 'rgba(255,255,255,0.5)' : dot }} />
                                                                    {AXIS_CONFIG[eje]?.name ?? eje}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Player chips */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {visiblePlayers.map(s => {
                                                            const dot = AXIS_DOT[s.eje] ?? '#6366f1';
                                                            const isSelected = selectedPlayerId === s.id;
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    onClick={() => setSelectedPlayerId(isSelected ? null : s.id)}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                                                        isSelected
                                                                            ? 'border-argo-navy bg-argo-navy text-white'
                                                                            : 'border-argo-border text-argo-secondary hover:border-argo-violet-200'
                                                                    }`}
                                                                >
                                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : dot }} />
                                                                    {s.child_name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Show more / count */}
                                                    {hasMore && (
                                                        <button
                                                            onClick={() => setPlayerShowAll(true)}
                                                            className="text-[11px] font-medium text-argo-violet-500 hover:opacity-70 transition-opacity"
                                                        >
                                                            {lang === 'en' ? `Show all (${filteredPlayers.length})` : lang === 'pt' ? `Mostrar todos (${filteredPlayers.length})` : `Ver todos (${filteredPlayers.length})`}
                                                        </button>
                                                    )}
                                                    {filteredPlayers.length === 0 && (
                                                        <p className="text-[11px] text-argo-light">
                                                            {lang === 'en' ? 'No players match the filters.' : lang === 'pt' ? 'Nenhum jogador corresponde aos filtros.' : 'Ningun jugador coincide con los filtros.'}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Personalized card (if player selected or grupal) */}
                                <AnimatePresence>
                                    {activeCard && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-4"
                                        >
                                            {/* What's happening for this profile */}
                                            {activeCard.whatsHappeningForProfile && (
                                                <div className="bg-argo-bg rounded-[14px] px-6 py-5 border-l-2 border-argo-violet-200">
                                                    <p className="text-[10px] font-semibold text-argo-violet-500 uppercase tracking-[0.1em] mb-1.5">
                                                        {selectedPlayer
                                                            ? `${selectedPlayer.child_name} (${AXIS_CONFIG[selectedPlayer.eje]?.name ?? selectedPlayer.eje})`
                                                            : dt.guide.paraElGrupo}
                                                    </p>
                                                    <p className="text-[13px] text-argo-secondary leading-relaxed">{activeCard.whatsHappeningForProfile}</p>
                                                </div>
                                            )}

                                            {/* How to accompany */}
                                            <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                                                <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-3">{dt.guide.comoAcompanar}</p>
                                                <div className="space-y-3">
                                                    {activeCard.howToAccompany.map((text, i) => (
                                                        <div key={i} className="flex items-start gap-3">
                                                            <span className="mt-0.5 w-5 h-5 rounded-full bg-argo-violet-50 text-argo-violet-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                                {i + 1}
                                                            </span>
                                                            <p className="text-[13px] text-argo-secondary leading-relaxed">{text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* If not responding */}
                                            {activeCard.ifNotResponding && (
                                                <div className="bg-amber-50/50 border border-amber-200/60 rounded-[14px] px-6 py-5">
                                                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-[0.1em] mb-1.5">{dt.guide.siNoResponde}</p>
                                                    <p className="text-[13px] text-amber-900 leading-relaxed">{activeCard.ifNotResponding}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
