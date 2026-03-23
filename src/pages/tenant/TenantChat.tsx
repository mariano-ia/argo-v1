import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TenantData {
    id: string;
    slug: string;
    display_name: string;
    plan: string;
    credits_remaining: number;
}

interface Thread {
    thread_id: string;
    content: string;
    created_at: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
};

const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
});

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const SUGGESTED_PROMPTS = {
    es: [
        '¿Cómo motivo a un jugador que no quiere entrenar?',
        '¿Cómo armo las duplas para el ejercicio de hoy?',
        '¿Qué hago si un jugador se frustra cuando pierde?',
    ],
    en: [
        'How do I motivate a player who doesn\'t want to train?',
        'How should I pair players for today\'s drill?',
        'What do I do if a player gets frustrated when they lose?',
    ],
    pt: [
        'Como motivo um jogador que não quer treinar?',
        'Como formo as duplas para o exercício de hoje?',
        'O que faço se um jogador fica frustrado quando perde?',
    ],
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export const TenantChat: React.FC = () => {
    const { tenant } = useOutletContext<{ tenant: TenantData | null }>();

    // Thread list
    const [threads, setThreads] = useState<Thread[]>([]);
    const [threadsLoading, setThreadsLoading] = useState(true);

    // Active chat
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    // Chat mode
    const [chatOpen, setChatOpen] = useState(false);

    // Input
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // TODO: detect tenant language from config. For now, default to 'es'.
    const lang = 'es';
    const prompts = SUGGESTED_PROMPTS[lang] ?? SUGGESTED_PROMPTS.es;

    /* ── Scroll to bottom ──────────────────────────────────────────────────── */

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    /* ── Fetch threads ─────────────────────────────────────────────────────── */

    const fetchThreads = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/tenant-chat?action=threads', { headers: authHeaders(token) });
            if (res.ok) {
                const data = await res.json();
                setThreads(data.threads);
            }
        } finally {
            setThreadsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant) fetchThreads();
    }, [tenant, fetchThreads]);

    /* ── Open thread ───────────────────────────────────────────────────────── */

    const openThread = async (threadId: string) => {
        setActiveThreadId(threadId);
        setMessages([]);
        setMessagesLoading(true);
        setChatOpen(true);
        const token = await getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/tenant-chat?action=messages&thread_id=${threadId}`, {
                headers: authHeaders(token),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                scrollToBottom();
            }
        } finally {
            setMessagesLoading(false);
        }
    };

    /* ── New thread ────────────────────────────────────────────────────────── */

    const startNewThread = () => {
        setActiveThreadId(null);
        setMessages([]);
        setInput('');
        setChatOpen(true);
    };

    const goToList = () => {
        setActiveThreadId(null);
        setMessages([]);
        setInput('');
        setChatOpen(false);
        fetchThreads();
    };

    /* ── Send message ──────────────────────────────────────────────────────── */

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || sending) return;

        setSending(true);
        setInput('');

        // Optimistic UI: add user message immediately
        const userMsg: ChatMessage = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        scrollToBottom();

        const token = await getToken();
        if (!token) { setSending(false); return; }

        try {
            const res = await fetch('/api/tenant-chat', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({
                    action: 'send',
                    thread_id: activeThreadId,
                    message: msg,
                    lang,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Set thread ID if new thread
                if (!activeThreadId && data.thread_id) {
                    setActiveThreadId(data.thread_id);
                }
                // Add assistant message
                setMessages(prev => [...prev, { role: 'assistant', content: data.message.content }]);
                scrollToBottom();
                // Refresh thread list
                fetchThreads();
            } else {
                const errData = await res.json().catch(() => ({}));
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: errData.error === 'AI service error'
                        ? 'Hubo un problema con el servicio de IA. Intenta de nuevo en unos segundos.'
                        : 'Ocurrió un error. Intenta de nuevo.',
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
            }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    /* ── Loading ───────────────────────────────────────────────────────────── */

    if (!tenant) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    /* ── Chat view (thread selected or new) ────────────────────────────────── */

    if (chatOpen) {
        return (
            <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 py-3 px-1 flex-shrink-0">
                    <button
                        onClick={goToList}
                        className="p-2 rounded-lg hover:bg-argo-neutral transition-colors"
                    >
                        <ArrowLeft size={18} className="text-argo-grey" />
                    </button>
                    <h1 className="text-lg font-bold text-argo-navy flex-1">Chat DISC</h1>
                    <button
                        onClick={startNewThread}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-argo-border hover:border-argo-navy/30 text-argo-grey transition-colors"
                    >
                        <Plus size={14} />
                        Nueva
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-4">
                    {messagesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        /* Empty new thread — show suggested prompts */
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-14 h-14 rounded-2xl bg-argo-indigo/10 flex items-center justify-center">
                                <MessageCircle size={24} className="text-argo-indigo" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-bold text-argo-navy">Consulta sobre DISC</h2>
                                <p className="text-sm text-argo-grey mt-1">
                                    Pregunta lo que necesites sobre tus jugadores, el equipo, o situaciones de entrenamiento.
                                </p>
                            </div>
                            <div className="space-y-2 w-full max-w-sm">
                                {prompts.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(p)}
                                        disabled={sending}
                                        className="w-full px-4 py-3 rounded-xl border border-argo-border text-sm text-left text-argo-navy hover:bg-argo-neutral/50 hover:border-argo-navy/20 transition-all disabled:opacity-50"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-argo-navy text-white rounded-br-md'
                                            : 'bg-white border border-argo-border text-argo-navy rounded-bl-md shadow-sm'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing indicator */}
                    {sending && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-argo-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-argo-grey/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-argo-grey/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-argo-grey/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 border-t border-argo-border bg-white px-1 py-3">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe tu consulta..."
                            rows={1}
                            className="flex-1 resize-none rounded-xl border border-argo-border px-4 py-2.5 text-sm outline-none focus:border-argo-navy transition-colors max-h-32"
                            style={{ minHeight: '42px' }}
                            disabled={sending}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || sending}
                            className="p-2.5 rounded-xl bg-argo-navy text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-argo-navy/90 transition-colors flex-shrink-0"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Thread list view ──────────────────────────────────────────────────── */

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-argo-navy">Chat DISC</h1>
                    <p className="text-sm text-argo-grey mt-1">
                        Tu asistente personal de perfilamiento DISC. Pregunta sobre tus jugadores, situaciones o dinámica de equipo.
                    </p>
                </div>
                <button
                    onClick={startNewThread}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-argo-navy text-white text-sm font-medium hover:bg-argo-navy/90 transition-colors"
                >
                    <Plus size={15} />
                    Nueva consulta
                </button>
            </div>

            {/* Thread list */}
            <div className="bg-white border border-argo-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-argo-border flex items-center gap-2">
                    <MessageCircle size={15} className="text-argo-grey" />
                    <h2 className="text-sm font-semibold text-argo-navy uppercase tracking-widest">
                        Conversaciones
                    </h2>
                </div>

                {threadsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                    </div>
                ) : threads.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-argo-indigo/10 flex items-center justify-center mx-auto mb-3">
                            <MessageCircle size={20} className="text-argo-indigo" />
                        </div>
                        <p className="text-sm text-argo-grey">Todavía no tienes conversaciones.</p>
                        <p className="text-xs text-argo-grey/50 mt-1">Inicia una nueva consulta sobre tus jugadores.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-argo-border">
                        {threads.map(t => (
                            <button
                                key={t.thread_id}
                                onClick={() => openThread(t.thread_id)}
                                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-argo-neutral/50 transition-colors text-left"
                            >
                                <div className="w-9 h-9 rounded-xl bg-argo-indigo/10 flex items-center justify-center flex-shrink-0">
                                    <MessageCircle size={16} className="text-argo-indigo" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-argo-navy truncate">{t.content}</p>
                                    <p className="text-[10px] text-argo-grey/60 mt-0.5">
                                        {formatDate(t.created_at)} · {formatTime(t.created_at)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
