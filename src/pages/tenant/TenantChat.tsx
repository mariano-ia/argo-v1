import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Plus, Loader2, MessageCircle, PanelLeftClose, PanelLeftOpen, Lock, Trash2, ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
import { supabase } from '../../lib/supabase';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData { id: string; slug: string; display_name: string; plan: string; roster_limit: number; active_players_count: number; }
interface Thread { thread_id: string; content: string; created_at: string; matched_player?: string | null; }
interface ChatMessage { id?: number | string | null; role: 'user' | 'assistant'; content: string; created_at?: string; rating?: number | null; }
interface Suggestions { players: string[]; chem_group: string | null; }

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const getToken = async () => { const { data: { session } } = await supabase.auth.getSession(); return session?.access_token ?? null; };
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

function renderMd(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /\*\*(.*?)\*\*/g;
    let last = 0, match: RegExpExecArray | null, k = 0;
    while ((match = re.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        parts.push(<strong key={k++} className="font-semibold">{match[1]}</strong>);
        last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length ? parts : text;
}

const SUGGESTED_PROMPTS = {
    es: ['¿Cómo motivo a un jugador que no quiere entrenar?', '¿Cómo equilibro un equipo con perfiles muy distintos?', '¿Qué hago si un jugador se frustra cuando pierde?'],
    en: ['How do I motivate a player who doesn\'t want to train?', 'How do I balance a team with very different profiles?', 'What do I do if a player gets frustrated when they lose?'],
    pt: ['Como motivo um jogador que não quer treinar?', 'Como equilibro uma equipe com perfis bem diferentes?', 'O que faço se um jogador fica frustrado quando perde?'],
};

function groupThreadsByDate(threads: Thread[], lang: string): { label: string; items: Thread[] }[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - 7 * 86400000;

    const labels = {
        es: { today: 'Hoy', week: 'Esta semana', older: 'Anteriores' },
        en: { today: 'Today', week: 'This week', older: 'Earlier' },
        pt: { today: 'Hoje', week: 'Esta semana', older: 'Anteriores' },
    };
    const l = labels[lang as keyof typeof labels] ?? labels.es;

    const groups: { label: string; items: Thread[] }[] = [
        { label: l.today, items: [] },
        { label: l.week, items: [] },
        { label: l.older, items: [] },
    ];

    threads.forEach(t => {
        const ts = new Date(t.created_at).getTime();
        if (ts >= today) groups[0].items.push(t);
        else if (ts >= weekAgo) groups[1].items.push(t);
        else groups[2].items.push(t);
    });

    return groups.filter(g => g.items.length > 0);
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export const TenantChat: React.FC = () => {
    const { tenant, effectiveTeamId } = useOutletContext<{ tenant: TenantData | null; effectiveTeamId?: string | null }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const [threads, setThreads] = useState<Thread[]>([]);
    const [totalUserMessages, setTotalUserMessages] = useState(0);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    // On phones the 280px sidebar squeezes the chat into a sliver: start closed.
    const [panelOpen, setPanelOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768));
    const [threadSearch, setThreadSearch] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [autoSent, setAutoSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [restored, setRestored] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Personalized empty-state prompts (#3): real roster/group names teach the
    // coach that the assistant knows THEIR team; static prompts fill the gaps.
    const prompts = useMemo(() => {
        const base = SUGGESTED_PROMPTS[lang as keyof typeof SUGGESTED_PROMPTS] ?? SUGGESTED_PROMPTS.es;
        const out: string[] = [];
        const [p1, p2] = suggestions?.players ?? [];
        if (p1) out.push(lang === 'en' ? `How do I support ${p1} in the activity?` : lang === 'pt' ? `Como acompanho ${p1} na atividade?` : `¿Cómo acompaño a ${p1} en la actividad?`);
        if (p2) out.push(lang === 'en' ? `What role fits ${p2} in the next match?` : lang === 'pt' ? `Que papel dou a ${p2} no próximo jogo?` : `¿Qué rol le doy a ${p2} en el próximo partido?`);
        if (suggestions?.chem_group) out.push(lang === 'en' ? `How is the chemistry of group "${suggestions.chem_group}"?` : lang === 'pt' ? `Como é a química do grupo "${suggestions.chem_group}"?` : `¿Cómo es la química del grupo "${suggestions.chem_group}"?`);
        for (const b of base) { if (out.length >= 3) break; out.push(b); }
        return out.slice(0, 3);
    }, [suggestions, lang]);
    // Sidebar search (#17): filter by content or matched player, accent-insensitive.
    const filteredThreads = useMemo(() => {
        const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const q = norm(threadSearch.trim());
        if (!q) return threads;
        return threads.filter(t =>
            norm(t.content).includes(q) || norm(t.matched_player ?? '').includes(q));
    }, [threads, threadSearch]);
    const groupedThreads = useMemo(() => groupThreadsByDate(filteredThreads, lang), [filteredThreads, lang]);

    const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // Persist the active conversation so a reload reopens it (O4).
    const threadStorageKey = tenant ? `argo-coach-thread-${tenant.id}` : null;
    const persistThread = useCallback((id: string | null) => {
        if (!threadStorageKey) return;
        try { if (id) localStorage.setItem(threadStorageKey, id); else localStorage.removeItem(threadStorageKey); } catch { /* ignore */ }
    }, [threadStorageKey]);

    /* ── Fetch threads ────────────────────────────────────────────────────── */

    const fetchThreads = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch(`/api/tenant-chat?action=threads&tenant_id=${tenant?.id ?? ''}&team=${effectiveTeamId ?? ''}`, { headers: authHeaders(token) });
            if (res.ok) {
                const data = await res.json();
                setThreads(data.threads);
                setTotalUserMessages(data.total_user_messages ?? 0);
                if (data.suggestions) setSuggestions(data.suggestions);
            }
        } finally { setThreadsLoading(false); }
    }, [tenant?.id, effectiveTeamId]);

    useEffect(() => { if (tenant) fetchThreads(); }, [tenant, fetchThreads]);

    // Switching context (institution OR plantel) resets the open conversation —
    // chats are per-context. Skip the first run so a restored thread isn't wiped
    // on mount. Keyed on both tenant and plantel: an admin with two institutions
    // sits in the 'admin' hat (effectiveTeamId null) in both, so plantel alone
    // would miss the A→B institution switch.
    const ctxInitRef = useRef(true);
    useEffect(() => {
        if (ctxInitRef.current) { ctxInitRef.current = false; return; }
        setActiveThreadId(null);
        setMessages([]);
        setThreadSearch('');
        persistThread(null);
    }, [effectiveTeamId, tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-send from query param (e.g. ?q=How+do+I+motivate...)
    const cameFromDeepLink = useRef(false);
    useEffect(() => {
        const q = searchParams.get('q');
        if (q && tenant && !autoSent) {
            cameFromDeepLink.current = true; // capture before clearing q, so the restore effect can defer
            setAutoSent(true);
            setSearchParams({}, { replace: true });
            // Small delay to let the component mount
            setTimeout(() => sendMessage(q), 300);
        }
    }, [tenant, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Open thread ──────────────────────────────────────────────────────── */

    const openThread = async (threadId: string) => {
        setActiveThreadId(threadId);
        setErrorMsg(null);
        persistThread(threadId);
        setMessages([]);
        setMessagesLoading(true);
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch(`/api/tenant-chat?action=messages&thread_id=${threadId}&tenant_id=${tenant?.id ?? ''}`, { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setMessages(data.messages); scrollToBottom(); }
        } finally { setMessagesLoading(false); }
    };

    // Reopen the last conversation on reload, unless a ?q= deep-link starts a
    // fresh chat (O4). Runs once after the thread list has loaded.
    useEffect(() => {
        if (restored || !tenant || threadsLoading) return;
        setRestored(true);
        // A ?q= deep-link owns the screen (it auto-sends into a fresh chat). The
        // ref survives the param being cleared, unlike searchParams.get('q').
        if (cameFromDeepLink.current) return;
        let stored: string | null = null;
        try { stored = threadStorageKey ? localStorage.getItem(threadStorageKey) : null; } catch { stored = null; }
        if (stored && threads.some(t => t.thread_id === stored)) openThread(stored);
    }, [tenant, threadsLoading, threads, restored, searchParams, threadStorageKey]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── New thread ───────────────────────────────────────────────────────── */

    const startNewThread = () => { setActiveThreadId(null); setMessages([]); setInput(''); setErrorMsg(null); persistThread(null); inputRef.current?.focus(); };

    /* ── Delete thread (#17) ──────────────────────────────────────────────── */

    const deleteThread = async (threadId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ok = window.confirm(lang === 'en' ? 'Delete this conversation?' : lang === 'pt' ? 'Excluir esta conversa?' : '¿Eliminar esta conversación?');
        if (!ok) return;
        const token = await getToken();
        if (!token) return;
        await fetch('/api/tenant-chat', {
            method: 'POST', headers: authHeaders(token),
            body: JSON.stringify({ action: 'delete_thread', thread_id: threadId, tenant_id: tenant?.id }),
        }).catch(() => { /* list refresh below surfaces the state either way */ });
        if (activeThreadId === threadId) startNewThread();
        fetchThreads();
    };

    /* ── Rate message (#18) ───────────────────────────────────────────────── */

    const rateMessage = async (msg: ChatMessage, value: 1 | -1) => {
        if (!msg.id) return;
        const next = msg.rating === value ? 0 : value; // tap again to clear
        setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, rating: next === 0 ? null : next } : m)));
        const token = await getToken();
        if (!token) return;
        fetch('/api/tenant-chat', {
            method: 'POST', headers: authHeaders(token),
            body: JSON.stringify({ action: 'rate', message_id: msg.id, rating: next, tenant_id: tenant?.id }),
        }).catch(() => { /* optimistic; a lost rating is not worth an error banner */ });
    };

    /* ── Send message ─────────────────────────────────────────────────────── */

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || sending) return;
        setErrorMsg(null);
        setSending(true);
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        scrollToBottom();

        const token = await getToken();
        if (!token) { setSending(false); return; }

        // On any failure: drop the optimistic user bubble, restore the text, and
        // surface an error banner with retry — never fake an assistant reply and
        // never lose the question (O6). The server saved nothing on failure, so
        // no trial query was consumed (O5/E11).
        const fail = (friendly: string) => {
            setMessages(prev => prev.slice(0, -1));
            setInput(msg);
            setErrorMsg(friendly);
        };

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 55_000); // 55s timeout
            const res = await fetch('/api/tenant-chat', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ action: 'send', thread_id: activeThreadId, message: msg, lang, tenant_id: tenant?.id, team: effectiveTeamId ?? undefined }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
                const data = await res.json();
                const content = data.message?.content;
                if (!content) {
                    fail(dt.chat.errorIA);
                } else {
                    if (!activeThreadId && data.thread_id) { setActiveThreadId(data.thread_id); persistThread(data.thread_id); }
                    setMessages(prev => [...prev, { id: data.message?.id ?? null, role: 'assistant', content }]);
                    setTotalUserMessages(prev => prev + 1);
                    fetchThreads();
                    scrollToBottom();
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                if (errData.error === 'Trial message limit reached') {
                    // Hard cap — keep the lock UX (handled by the counter), not a banner.
                    setMessages(prev => prev.slice(0, -1));
                    setTotalUserMessages(10);
                    return;
                }
                const errText = errData.error === 'trial_expired'
                    ? (lang === 'en' ? 'Your trial has expired. Upgrade your plan to continue.' : lang === 'pt' ? 'Seu período de teste expirou. Atualize seu plano.' : 'Tu periodo de prueba ha finalizado. Actualiza tu plan para continuar.')
                    : errData.error === 'Rate limit exceeded. Try again later.'
                        ? (lang === 'en' ? 'Too many messages. Please wait a moment.' : lang === 'pt' ? 'Muitas mensagens. Aguarde um momento.' : 'Demasiados mensajes. Espera un momento.')
                        : (errData.message || dt.chat.errorIA);
                fail(errText);
            }
        } catch (err) {
            const isTimeout = err instanceof DOMException && err.name === 'AbortError';
            fail(isTimeout
                ? (lang === 'en' ? 'The request timed out. Please try again.' : lang === 'pt' ? 'A solicitação expirou. Tente novamente.' : 'La solicitud tardó demasiado. Intenta de nuevo.')
                : dt.chat.errorConexion);
        } finally { setSending(false); inputRef.current?.focus(); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    if (!tenant) {
        return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" /></div>;
    }

    /* ── Render ────────────────────────────────────────────────────────────── */

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex h-[calc(100dvh-7rem)] bg-white rounded-[14px] shadow-argo overflow-hidden"
        >
            {/* ═══ LEFT PANEL — Thread history ═══ */}
            <div className={`flex-shrink-0 border-r border-argo-border flex flex-col transition-all duration-200 ${panelOpen ? 'w-[280px]' : 'w-[48px]'}`}>
                {/* Top: toggle + new chat */}
                <div className={`pt-4 pb-2 flex-shrink-0 ${panelOpen ? 'px-3 flex items-center justify-between' : 'px-2 flex flex-col items-center gap-2'}`}>
                    {panelOpen && (
                        <button
                            onClick={startNewThread}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-argo-navy hover:bg-argo-bg transition-colors"
                        >
                            <Plus size={18} strokeWidth={1.5} />
                            <span className="text-[14px] font-medium">{lang === 'en' ? 'New chat' : lang === 'pt' ? 'Novo chat' : 'Nuevo chat'}</span>
                        </button>
                    )}
                    <Tooltip text={panelOpen ? (lang === 'en' ? 'Hide conversations' : lang === 'pt' ? 'Ocultar conversas' : 'Ocultar conversaciones') : (lang === 'en' ? 'Show conversations' : lang === 'pt' ? 'Mostrar conversas' : 'Mostrar conversaciones')}>
                        <button
                            onClick={() => setPanelOpen(v => !v)}
                            className="text-argo-light hover:text-argo-grey transition-colors p-1.5 rounded-lg hover:bg-argo-bg"
                        >
                            {panelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                        </button>
                    </Tooltip>
                </div>

                {/* Thread search (#17) — only when expanded and there is history */}
                {panelOpen && threads.length > 0 && (
                    <div className="px-3 pb-1 flex-shrink-0">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-argo-light pointer-events-none" />
                            <input
                                value={threadSearch}
                                onChange={e => setThreadSearch(e.target.value)}
                                placeholder={lang === 'en' ? 'Search conversations' : lang === 'pt' ? 'Buscar conversas' : 'Buscar conversaciones'}
                                className="w-full text-[12px] pl-8 pr-2.5 py-1.5 rounded-lg border border-argo-border bg-argo-bg outline-none focus:border-argo-violet-200 transition-colors"
                            />
                        </div>
                    </div>
                )}

                {/* Thread list — only when expanded */}
                {panelOpen && (
                    <div className="flex-1 overflow-y-auto px-2 pb-3">
                        {threadsLoading ? (
                            <div className="space-y-2 px-2 pt-2">
                                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-argo-bg rounded-lg animate-pulse" />)}
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="flex flex-col items-center pt-8 px-3 text-center">
                                <MessageCircle size={20} className="text-argo-border mb-2" />
                                <p className="text-xs text-argo-light">{dt.chat.sinConversaciones}</p>
                            </div>
                        ) : filteredThreads.length === 0 ? (
                            <p className="text-xs text-argo-light text-center pt-6 px-3">
                                {lang === 'en' ? 'No conversations match.' : lang === 'pt' ? 'Nenhuma conversa encontrada.' : 'Ninguna conversación coincide.'}
                            </p>
                        ) : (
                            groupedThreads.map(group => (
                                <div key={group.label} className="mb-3">
                                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] px-3 mb-1 mt-3">
                                        {group.label}
                                    </p>
                                    {group.items.map(t => (
                                        <div key={t.thread_id} className="relative">
                                            <button
                                                onClick={() => openThread(t.thread_id)}
                                                className={`w-full text-left pl-3 pr-8 py-2 rounded-lg text-[12px] truncate transition-all ${
                                                    activeThreadId === t.thread_id
                                                        ? 'bg-argo-violet-50 text-argo-violet-500 font-medium'
                                                        : 'text-argo-secondary hover:bg-argo-bg'
                                                }`}
                                            >
                                                {t.matched_player ? (
                                                    <>
                                                        <span className="font-semibold">{t.matched_player}</span>
                                                        <span> · {t.content}</span>
                                                    </>
                                                ) : t.content}
                                            </button>
                                            <button
                                                onClick={e => deleteThread(t.thread_id, e)}
                                                aria-label={lang === 'en' ? 'Delete conversation' : lang === 'pt' ? 'Excluir conversa' : 'Eliminar conversación'}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-argo-light/60 hover:text-red-500 hover:bg-red-50 active:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ═══ RIGHT PANEL — Chat ═══ */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {messagesLoading ? (
                        <div className="space-y-3 pt-4">
                            {[1,2,3].map(i => <div key={i} className="h-12 bg-argo-bg rounded-xl animate-pulse" style={{ width: i % 2 === 0 ? '60%' : '75%', marginLeft: i % 2 === 0 ? 'auto' : 0 }} />)}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-5">
                            <div className="w-9 h-9 rounded-[10px] bg-argo-bg flex items-center justify-center text-argo-grey">
                                <MessageCircle size={18} />
                            </div>
                            <div className="text-center max-w-sm">
                                <h2 className="text-base font-semibold text-argo-navy">
                                    {'Argo Coach'}
                                </h2>
                                <p className="text-xs text-argo-grey mt-1.5 leading-relaxed">
                                    {dt.chat.consultaDesc}
                                </p>
                            </div>
                            <div className="space-y-2 w-full max-w-sm">
                                {prompts.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(p)}
                                        disabled={sending}
                                        className="block w-full px-4 py-3 rounded-xl border border-argo-border text-[13px] text-left text-argo-secondary hover:border-argo-violet-200 hover:bg-argo-bg active:bg-argo-bg transition-colors disabled:opacity-50"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-argo-navy text-white rounded-br-md'
                                            : 'bg-argo-bg text-argo-navy rounded-bl-md'
                                    }`}>
                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{renderMd(msg.content)}</p>
                                        {/* Like/dislike (#18): quality signal per assistant reply */}
                                        {msg.role === 'assistant' && msg.id != null && (
                                            <div className="flex items-center gap-1 mt-2 -mb-0.5">
                                                <button
                                                    onClick={() => rateMessage(msg, 1)}
                                                    aria-label={lang === 'en' ? 'Helpful' : lang === 'pt' ? 'Útil' : 'Útil'}
                                                    className={`p-1 rounded transition-colors ${msg.rating === 1 ? 'text-argo-violet-500 bg-argo-violet-50' : 'text-argo-light hover:text-argo-grey hover:bg-white active:bg-white'}`}
                                                >
                                                    <ThumbsUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => rateMessage(msg, -1)}
                                                    aria-label={lang === 'en' ? 'Not helpful' : lang === 'pt' ? 'Não útil' : 'No útil'}
                                                    className={`p-1 rounded transition-colors ${msg.rating === -1 ? 'text-red-500 bg-red-50' : 'text-argo-light hover:text-argo-grey hover:bg-white active:bg-white'}`}
                                                >
                                                    <ThumbsDown size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {sending && (
                                <div className="flex justify-start">
                                    <div className="bg-argo-bg rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-argo-grey/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-argo-grey/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-argo-grey/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 border-t border-argo-border px-5 py-3 space-y-1.5">
                    {/* Error banner with retry — keeps the question, no fake assistant reply */}
                    {errorMsg && (
                        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-1">
                            <p className="text-[12px] text-red-600">{errorMsg}</p>
                            <button
                                onClick={() => sendMessage()}
                                disabled={sending || !input.trim()}
                                className="text-[12px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-40 flex-shrink-0"
                            >
                                {lang === 'en' ? 'Retry' : lang === 'pt' ? 'Tentar de novo' : 'Reintentar'}
                            </button>
                        </div>
                    )}
                    {/* Trial query counter */}
                    {tenant?.plan === 'trial' && (
                        <div className="flex justify-end mb-1">
                            <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                totalUserMessages >= 10
                                    ? 'bg-red-50 text-red-600'
                                    : totalUserMessages >= 7
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-argo-violet-50 text-argo-violet-500'
                            }`}>
                                <span className="font-bold tabular-nums">{totalUserMessages}/10</span>
                                <span className="font-medium opacity-80">
                                    {lang === 'en' ? 'free trial queries' : lang === 'pt' ? 'consultas de teste' : 'consultas free trial'}
                                </span>
                            </span>
                        </div>
                    )}
                    {tenant?.plan === 'trial' && totalUserMessages >= 10 ? (
                        <div className="flex items-center gap-2.5 bg-argo-bg rounded-xl px-4 py-3 border border-argo-border">
                            <Lock size={13} className="text-argo-light flex-shrink-0" />
                            <p className="text-[12px] text-argo-secondary">
                                {lang === 'en' ? 'You\'ve used all 10 trial queries.' : lang === 'pt' ? 'Você usou todas as 10 consultas de teste.' : 'Usaste las 10 consultas de prueba.'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={dt.chat.escribePlaceholder}
                                rows={1}
                                className="flex-1 resize-none rounded-xl border border-argo-border px-4 py-2.5 text-[13px] outline-none focus:border-argo-violet-200 transition-colors max-h-32 bg-argo-bg"
                                style={{ minHeight: '42px' }}
                                disabled={sending}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || sending}
                                className="p-2.5 rounded-xl bg-argo-navy text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-argo-navy/90 transition-colors flex-shrink-0"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    )}
                    {(tenant?.plan !== 'trial' || totalUserMessages < 10) && (
                        <p className="text-[10px] text-argo-light text-center">
                            {dt.chat.disclaimer}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
