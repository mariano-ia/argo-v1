import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Plus, Loader2, MessageCircle, PanelLeftClose, PanelLeftOpen, Lock } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
import { supabase } from '../../lib/supabase';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData { id: string; slug: string; display_name: string; plan: string; credits_remaining: number; }
interface Thread { thread_id: string; content: string; created_at: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; created_at?: string; }

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
    es: ['¿Como motivo a un jugador que no quiere entrenar?', 'Explicame el perfil de Mateo y Allegra', '¿Que hago si un jugador se frustra cuando pierde?'],
    en: ['How do I motivate a player who doesn\'t want to train?', 'Explain the profiles of Mateo and Allegra', 'What do I do if a player gets frustrated when they lose?'],
    pt: ['Como motivo um jogador que nao quer treinar?', 'Me explique o perfil de Mateo e Allegra', 'O que faco se um jogador fica frustrado quando perde?'],
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
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();
    const { lang } = useLang();
    const dt = getDashboardT(lang);

    const [threads, setThreads] = useState<Thread[]>([]);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [autoSent, setAutoSent] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const prompts = SUGGESTED_PROMPTS[lang as keyof typeof SUGGESTED_PROMPTS] ?? SUGGESTED_PROMPTS.es;
    const groupedThreads = useMemo(() => groupThreadsByDate(threads, lang), [threads, lang]);

    const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    /* ── Fetch threads ────────────────────────────────────────────────────── */

    const fetchThreads = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-chat?action=threads', { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setThreads(data.threads); }
        } finally { setThreadsLoading(false); }
    }, []);

    useEffect(() => { if (tenant) fetchThreads(); }, [tenant, fetchThreads]);

    // Auto-send from query param (e.g. ?q=How+do+I+motivate...)
    useEffect(() => {
        const q = searchParams.get('q');
        if (q && tenant && !autoSent) {
            setAutoSent(true);
            setSearchParams({}, { replace: true });
            // Small delay to let the component mount
            setTimeout(() => sendMessage(q), 300);
        }
    }, [tenant, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Open thread ──────────────────────────────────────────────────────── */

    const openThread = async (threadId: string) => {
        setActiveThreadId(threadId);
        setMessages([]);
        setMessagesLoading(true);
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch(`/api/tenant-chat?action=messages&thread_id=${threadId}`, { headers: authHeaders(token) });
            if (res.ok) { const data = await res.json(); setMessages(data.messages); scrollToBottom(); }
        } finally { setMessagesLoading(false); }
    };

    /* ── New thread ───────────────────────────────────────────────────────── */

    const startNewThread = () => { setActiveThreadId(null); setMessages([]); setInput(''); inputRef.current?.focus(); };

    /* ── Send message ─────────────────────────────────────────────────────── */

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || sending) return;
        setSending(true);
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        scrollToBottom();

        const token = await getToken();
        if (!token) { setSending(false); return; }

        try {
            const res = await fetch('/api/tenant-chat', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ action: 'send', thread_id: activeThreadId, message: msg, lang }),
            });
            if (res.ok) {
                const data = await res.json();
                if (!activeThreadId && data.thread_id) setActiveThreadId(data.thread_id);
                setMessages(prev => [...prev, { role: 'assistant', content: data.message.content }]);
                scrollToBottom();
                fetchThreads();
            } else {
                const errData = await res.json().catch(() => ({}));
                setMessages(prev => [...prev, { role: 'assistant', content: errData.error === 'AI service error' ? dt.chat.errorIA : dt.chat.errorGenerico }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: dt.chat.errorConexion }]);
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
            className="flex h-[calc(100vh-7rem)] bg-white rounded-[14px] shadow-argo overflow-hidden"
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
                        ) : (
                            groupedThreads.map(group => (
                                <div key={group.label} className="mb-3">
                                    <p className="text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em] px-3 mb-1 mt-3">
                                        {group.label}
                                    </p>
                                    {group.items.map(t => (
                                        <button
                                            key={t.thread_id}
                                            onClick={() => openThread(t.thread_id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] truncate transition-all ${
                                                activeThreadId === t.thread_id
                                                    ? 'bg-argo-violet-50 text-argo-violet-500 font-medium'
                                                    : 'text-argo-secondary hover:bg-argo-bg'
                                            }`}
                                        >
                                            {t.content}
                                        </button>
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
                                    {lang === 'en' ? 'Argo Consultant' : 'Consultor Argo'}
                                </h2>
                                <p className="text-xs text-argo-grey mt-1.5 leading-relaxed">
                                    {dt.chat.consultaDesc}
                                </p>
                            </div>
                            <div className="space-y-2 w-full max-w-sm">
                                {prompts.map((p, i) => (
                                    <div
                                        key={i}
                                        className="px-4 py-3 rounded-xl border border-argo-border text-[13px] text-left text-argo-light cursor-default"
                                    >
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-argo-navy text-white rounded-br-md'
                                            : 'bg-argo-bg text-argo-navy rounded-bl-md'
                                    }`}>
                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{renderMd(msg.content)}</p>
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
                    {/* Trial query counter */}
                    {tenant?.plan === 'trial' && (
                        <div className="flex justify-end mb-1">
                            <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                threads.length >= 10
                                    ? 'bg-red-50 text-red-600'
                                    : threads.length >= 7
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-argo-violet-50 text-argo-violet-500'
                            }`}>
                                <span className="font-bold tabular-nums">{threads.length}/10</span>
                                <span className="font-medium opacity-80">
                                    {lang === 'en' ? 'free trial queries' : 'consultas free trial'}
                                </span>
                            </span>
                        </div>
                    )}
                    {tenant?.plan === 'trial' && threads.length >= 10 ? (
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
                    {(tenant?.plan !== 'trial' || threads.length < 10) && (
                        <p className="text-[10px] text-argo-light text-center">
                            {dt.chat.disclaimer}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
