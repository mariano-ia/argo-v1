import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    CATEGORY_COLORS, getSituations, getSituationCards,
    type Situation, type SituationCard,
} from '../../lib/situationalGuide';
import { AXIS_CONFIG } from '../../lib/groupBalanceRules';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import { LinkWidget } from '../../components/dashboard/LinkWidget';
import { SectionIntro } from '../../components/dashboard/SectionIntro';
import { LockedSection } from '../../components/dashboard/LockedSection';
import { AXIS_COLORS } from '../../lib/designTokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData { id: string; slug: string; display_name: string; plan: string; credits_remaining: number; }
interface SessionRow { id: string; child_name: string; child_age: number; sport: string | null; archetype_label: string; eje: string; motor: string; }

/* ── Category icons (replace emojis) ───────────────────────────────────────── */


const CATEGORY_LABELS: Record<string, Record<string, string>> = {
    es: { Motivación: 'Motivación', Emocional: 'Emocional', Comunicación: 'Comunicación', Presión: 'Presión', Social: 'Social', Concentración: 'Concentración', Observación: 'Observación', Grupal: 'Grupal' },
    en: { Motivación: 'Motivation', Emocional: 'Emotional', Comunicación: 'Communication', Presión: 'Pressure', Social: 'Social', Concentración: 'Focus', Observación: 'Observation', Grupal: 'Team' },
    pt: { Motivación: 'Motivação', Emocional: 'Emocional', Comunicación: 'Comunicação', Presión: 'Pressão', Social: 'Social', Concentración: 'Concentração', Observación: 'Observação', Grupal: 'Coletivo' },
};
const getCategoryLabel = (cat: string, lang: string) => CATEGORY_LABELS[lang]?.[cat] ?? cat;

/** Renders profilePerspectives text with styled axis name markers */
function renderPerspectives(text: string, lang: string): React.ReactNode {
    const MARKER_MAP: Record<string, { label: string; color: string }> = lang === 'en' ? {
        '{{Driver}}':     { label: 'Driver',     color: '#f97316' },
        '{{Connector}}':  { label: 'Connector',  color: '#f59e0b' },
        '{{Supporter}}':  { label: 'Supporter',  color: '#22c55e' },
        '{{Strategist}}': { label: 'Strategist', color: '#6366f1' },
    } : lang === 'pt' ? {
        '{{Impulsionador}}': { label: 'Impulsionador', color: '#f97316' },
        '{{Conector}}':      { label: 'Conector',      color: '#f59e0b' },
        '{{Sustentador}}':   { label: 'Sustentador',   color: '#22c55e' },
        '{{Estrategista}}':  { label: 'Estrategista',  color: '#6366f1' },
    } : {
        '{{Impulsor}}':  { label: 'Impulsor',  color: '#f97316' },
        '{{Conector}}':  { label: 'Conector',  color: '#f59e0b' },
        '{{Sosten}}':    { label: 'Sosten',    color: '#22c55e' },
        '{{Estratega}}': { label: 'Estratega', color: '#6366f1' },
    };
    const markerNames = Object.keys(MARKER_MAP).map(k => k.slice(2, -2));
    const regex = new RegExp(`\\{\\{(${markerNames.join('|')})\\}\\}`, 'g');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const marker = MARKER_MAP[match[0]];
        if (marker) {
            parts.push(
                <span key={key++} className="font-semibold text-argo-navy">
                    {marker.label}
                </span>
            );
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts;
}

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

    const categories = useMemo(() => [...new Set(getSituations(lang).map(s => s.category))], [lang]);
    const filtered = useMemo(() => getSituations(lang).filter(s => {
        if (categoryFilter && s.category !== categoryFilter) return false;
        if (search) { const q = search.toLowerCase(); return s.title.toLowerCase().includes(q) || s.whatYouSee.toLowerCase().includes(q); }
        return true;
    }), [search, categoryFilter, lang]);

    const selectedPlayer = sessions.find(s => s.id === selectedPlayerId) ?? null;

    // Get card for selected situation + player
    const activeCard: SituationCard | null = useMemo(() => {
        if (!selectedSituation) return null;
        const cards = getSituationCards(lang);
        if (selectedSituation.category === 'Grupal') {
            return cards.find(c => c.situationId === selectedSituation.id && c.eje === 'group') ?? null;
        }
        if (selectedPlayer) {
            return cards.find(c => c.situationId === selectedSituation.id && c.eje === selectedPlayer.eje) ?? null;
        }
        return null;
    }, [selectedSituation, selectedPlayer, lang]);

    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    /* ── Render ────────────────────────────────────────────────────────────── */

    const guideIntroBody = lang === 'en'
        ? 'Common training situations, organized by category. For each one, guidance based on the athlete\'s profile.'
        : lang === 'pt'
            ? 'Situações comuns do treino, organizadas por categoria. Para cada uma, orientações com base no perfil do atleta.'
            : 'Situaciones habituales del entrenamiento, organizadas por categoría. Para cada una, orientaciones según el perfil del deportista.';

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <SectionIntro
                storageKey="argo_intro_guide_v1"
                icon={<Compass size={16} />}
                title={lang === 'en' ? 'Guide' : lang === 'pt' ? 'Guia' : 'Guía'}
                body={guideIntroBody}
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.nav.guia}</h1>
                    <p className="text-[13px] text-argo-grey mt-1">{dt.guide.subtitulo}</p>
                </div>
                {tenant && <LinkWidget slug={tenant.slug} lang={lang} disabled={tenant.credits_remaining === 0} />}
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
                                {getCategoryLabel(cat, lang)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* ═══ LEFT PANEL — Situations list (scrollable) ═══ */}
                <div className="bg-white rounded-[14px] shadow-argo overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
                    {filtered.map(situation => {
                        const isActive = selectedSituation?.id === situation.id;
                        const cc = CATEGORY_COLORS[situation.category] ?? { bg: '#f3f4f6', text: '#374151' };
                        return (
                            <button
                                key={situation.id}
                                onClick={() => { setSelectedSituation(situation); setSelectedPlayerId(null); }}
                                className={`w-full text-left px-5 py-3.5 border-b border-argo-border last:border-b-0 transition-all ${
                                    isActive ? 'bg-argo-violet-50' : 'hover:bg-argo-bg/50'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`text-[13px] font-semibold ${isActive ? 'text-argo-violet-500' : 'text-argo-navy'}`}>
                                        {situation.title}
                                    </p>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold flex-shrink-0" style={{ background: cc.bg, color: cc.text }}>
                                        {getCategoryLabel(situation.category, lang)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-argo-light line-clamp-2 leading-relaxed">{situation.whatYouSee}</p>
                            </button>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="py-10 flex flex-col items-center text-center">
                            <Search size={22} className="text-argo-border mb-2" />
                            <p className="text-xs text-argo-light">{lang === 'en' ? 'No situations found.' : lang === 'pt' ? 'Nenhuma situação encontrada.' : 'No se encontraron situaciones.'}</p>
                        </div>
                    )}
                </div>

                {/* ═══ RIGHT PANEL — Detail (sticky) ═══ */}
                <div className="min-w-0 lg:sticky lg:top-6">
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
                                        {lang === 'en' ? 'Select a situation' : lang === 'pt' ? 'Selecione uma situação' : 'Selecciona una situación'}
                                    </p>
                                    <p className="text-xs text-argo-light leading-relaxed">
                                        {lang === 'en'
                                            ? 'Choose a situation from the list to understand what is happening and how to help. You can also select one of your athletes to get personalized recommendations based on their profile.'
                                            : lang === 'pt'
                                                ? 'Escolha uma situação da lista para entender o que está acontecendo e como ajudar. Você também pode selecionar um dos seus atletas para obter recomendações personalizadas com base no perfil dele.'
                                                : 'Elige una situación de la lista para entender qué está pasando y cómo ayudar. También puedes seleccionar a uno de tus deportistas para recibir recomendaciones personalizadas según su perfil.'}
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
                                            {getCategoryLabel(selectedSituation.category, lang)}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-bold text-argo-navy">{selectedSituation.title}</h2>
                                </div>

                                {/* Profile perspectives by axis */}
                                {selectedSituation.profilePerspectives && (
                                    <div className="bg-white rounded-[14px] shadow-argo px-6 py-5 space-y-4">
                                        <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em]">
                                            {lang === 'en' ? 'How each profile experiences this situation' : lang === 'pt' ? 'Como cada perfil vivencia esta situação' : 'Cómo vive cada perfil esta situación'}
                                        </p>
                                        {selectedSituation.profilePerspectives
                                            .split(/Si (?:el jugador tiene perfil |es |el perfil es |hay un )|Un /)
                                            .filter(Boolean)
                                            .length > 1
                                            ? /* Split by axis markers and render as separate paragraphs */
                                              (() => {
                                                  const text = selectedSituation.profilePerspectives!;
                                                  const markers = ['{{Impulsor}}', '{{Conector}}', '{{Sosten}}', '{{Estratega}}'];
                                                  const parts: { marker: string; text: string }[] = [];
                                                  let remaining = text;

                                                  markers.forEach(marker => {
                                                      const idx = remaining.indexOf(marker);
                                                      if (idx !== -1) {
                                                          // Find the start of this sentence (look back for ". " or start)
                                                          let sentenceStart = remaining.lastIndexOf('. ', idx);
                                                          if (sentenceStart === -1) sentenceStart = 0;
                                                          else sentenceStart += 2;

                                                          // Find the end (next marker or end)
                                                          let sentenceEnd = remaining.length;
                                                          markers.forEach(m => {
                                                              if (m !== marker) {
                                                                  const mIdx = remaining.indexOf(m, idx + marker.length);
                                                                  if (mIdx !== -1) {
                                                                      const prevPeriod = remaining.lastIndexOf('. ', mIdx);
                                                                      if (prevPeriod > idx && prevPeriod < sentenceEnd) {
                                                                          sentenceEnd = prevPeriod + 1;
                                                                      }
                                                                  }
                                                              }
                                                          });

                                                          parts.push({ marker, text: remaining.slice(sentenceStart, sentenceEnd).trim() });
                                                      }
                                                  });

                                                  // Fallback: if splitting failed, render as one block
                                                  if (parts.length === 0) {
                                                      return (
                                                          <p className="text-[13px] text-argo-secondary leading-[1.8]">
                                                              {renderPerspectives(text, lang)}
                                                          </p>
                                                      );
                                                  }

                                                  return (
                                                      <div className="space-y-3">
                                                          {parts.map((p, i) => (
                                                              <div key={i} className="pl-3 border-l-2" style={{ borderColor: AXIS_COLORS[['D','I','S','C'][i]] + '40' }}>
                                                                  <p className="text-[13px] text-argo-secondary leading-[1.75]">
                                                                      {renderPerspectives(p.text, lang)}
                                                                  </p>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  );
                                              })()
                                            : <p className="text-[13px] text-argo-secondary leading-[1.8]">{renderPerspectives(selectedSituation.profilePerspectives, lang)}</p>
                                        }
                                    </div>
                                )}

                                {/* Player selector with search, filters, pagination */}
                                {selectedSituation.category !== 'Grupal' && tenant?.plan === 'trial' && (
                                    <LockedSection
                                        label={lang === 'en' ? 'Personalize for a player' : lang === 'pt' ? 'Personalizar para um jogador' : 'Personalizar para un jugador'}
                                        cta={lang === 'en' ? 'Available in paid plans' : lang === 'pt' ? 'Disponível nos planos pagos' : 'Disponible en planes pagos'}
                                    >
                                        <div className="bg-white rounded-[14px] px-6 py-5 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {['Valentina', 'Tomás', 'Sofía', 'Lucas', 'Camila'].map(n => (
                                                    <span key={n} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-argo-border text-argo-secondary">
                                                        <span className="w-2 h-2 rounded-full bg-argo-border" />
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </LockedSection>
                                )}
                                {selectedSituation.category !== 'Grupal' && tenant?.plan !== 'trial' && (() => {
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
                                                <div className="flex flex-col items-center py-4 text-center">
                                                    <Users size={20} className="text-argo-border mb-2" />
                                                    <p className="text-xs text-argo-light leading-relaxed">
                                                        {lang === 'en' ? 'No athletes profiled yet. Share your link to get started.' : lang === 'pt' ? 'Nenhum atleta perfilado ainda. Compartilhe seu link para começar.' : 'Todavía no hay deportistas perfilados. Comparte tu link para comenzar.'}
                                                    </p>
                                                </div>
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
                                                                <option value="">{lang === 'en' ? 'All formations' : lang === 'pt' ? 'Todas as formações' : 'Todas las formaciones'}</option>
                                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                            </select>
                                                        )}

                                                        {/* Eje filter chips */}
                                                        {(['D', 'I', 'S', 'C'] as const).map(eje => {
                                                            const dot = AXIS_COLORS[eje];
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
                                                            const dot = AXIS_COLORS[s.eje] ?? '#6366f1';
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
                                    {activeCard && tenant?.plan !== 'trial' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-4"
                                        >
                                            {/* What's happening for this profile */}
                                            {activeCard.whatsHappeningForProfile && (
                                                <div className="bg-white rounded-[14px] shadow-argo px-6 py-5">
                                                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] mb-2">{dt.guide.loQuePasa}</p>
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
