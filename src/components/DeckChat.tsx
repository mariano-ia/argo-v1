import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
    { es: '¿Funciona para deportes individuales?', en: 'Does it work for individual sports?', pt: 'Funciona para esportes individuais?' },
    { es: '¿Qué tan preciso es el perfil?', en: 'How accurate is the profile?', pt: 'Quão preciso é o perfil?' },
    { es: '¿Cómo ayuda al entrenador?', en: 'How does it help the coach?', pt: 'Como ajuda o treinador?' },
];

const WELCOME: Record<string, string> = {
    es: 'Hola. Soy el asistente de Argo Method. Puedo responder preguntas sobre el producto, precios, cómo funciona y más. ¿En qué puedo ayudarte?',
    en: 'Hi! I\'m the Argo Method assistant. I can answer questions about the product, pricing, how it works, and more. How can I help?',
    pt: 'Olá! Sou o assistente do Argo Method. Posso responder perguntas sobre o produto, preços, como funciona e mais. Como posso ajudar?',
};

const PLACEHOLDER: Record<string, string> = {
    es: 'Escribe tu pregunta...',
    en: 'Type your question...',
    pt: 'Escreva sua pergunta...',
};

const MAX_MSGS = 10;

export default function DeckChat({ lang = 'es' }: { lang?: string }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: WELCOME[lang] || WELCOME.es }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [msgCount, setMsgCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    const send = async (text: string) => {
        if (!text.trim() || loading || msgCount >= MAX_MSGS) return;
        setShowSuggestions(false);
        const userMsg: Message = { role: 'user', content: text.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setMsgCount(c => c + 1);
        setLoading(true);

        const history = [...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0), userMsg]
            .slice(-8)
            .map(m => ({ role: m.role, content: m.content }));

        try {
            const res = await fetch('/api/deck-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content || (lang === 'en' ? 'Sorry, I couldn\'t process that. Try again.' : 'Lo siento, no pude procesar eso. Intenta de nuevo.'),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: lang === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Intenta de nuevo.',
            }]);
        }
        setLoading(false);
    };

    const remaining = MAX_MSGS - msgCount;

    return (
        <>
            {/* FAB */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 200,
                    width: 52, height: 52, borderRadius: '50%',
                    background: '#955FB5', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 18px rgba(149,95,181,.35)',
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
            >
                {open ? (
                    <span style={{ color: '#fff', fontSize: 18, fontWeight: 300 }}>✕</span>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                )}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
                        style={{
                            position: 'fixed', bottom: 88, right: 24, zIndex: 199,
                            width: 380, maxHeight: 520,
                            background: '#FAFAFA', border: '1px solid #E5E7EB',
                            borderRadius: 18, display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 18px', borderBottom: '1px solid #E5E7EB',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0,
                                animation: 'argo-chat-pulse 2s ease-out infinite',
                            }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>Argo Asistente</div>
                                <div style={{ fontSize: 11, color: '#86868B' }}>
                                    {lang === 'en' ? 'Ask anything about the product' : lang === 'pt' ? 'Pergunte sobre o produto' : 'Pregunta lo que quieras sobre el producto'}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} style={{
                            flex: 1, overflowY: 'auto', padding: '16px 18px',
                            display: 'flex', flexDirection: 'column', gap: 12,
                            minHeight: 200, maxHeight: 340,
                        }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{
                                    maxWidth: '85%', fontSize: 13, lineHeight: 1.55,
                                    padding: '10px 14px', borderRadius: 14,
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    ...(m.role === 'user'
                                        ? { background: '#955FB5', color: '#fff', borderBottomRightRadius: 4 }
                                        : { background: '#F5F5F7', color: '#424245', border: '1px solid #E5E7EB', borderBottomLeftRadius: 4 }
                                    ),
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1D1D1F">$1</strong>')
                                }}
                                />
                            ))}
                            {loading && (
                                <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#AEAEB2', padding: '4px 0' }}>
                                    Pensando...
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        {showSuggestions && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 18px 12px' }}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => send((s as Record<string, string>)[lang] || s.es)}
                                        style={{
                                            fontSize: 11, padding: '6px 12px', borderRadius: 20,
                                            border: '1px solid #E5E7EB', color: '#86868B',
                                            cursor: 'pointer', background: 'transparent',
                                            fontFamily: 'Inter, sans-serif', transition: 'all .2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4BCE8'; e.currentTarget.style.color = '#955FB5'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#86868B'; }}
                                    >
                                        {(s as Record<string, string>)[lang] || s.es}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{
                            padding: '12px 14px', borderTop: '1px solid #E5E7EB',
                            display: 'flex', gap: 8, alignItems: 'center',
                        }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') send(input); }}
                                placeholder={PLACEHOLDER[lang] || PLACEHOLDER.es}
                                maxLength={500}
                                disabled={msgCount >= MAX_MSGS}
                                style={{
                                    flex: 1, border: '1px solid #E5E7EB', borderRadius: 10,
                                    padding: '9px 14px', fontFamily: 'Inter, sans-serif',
                                    fontSize: 13, color: '#1D1D1F', outline: 'none',
                                    background: 'transparent',
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#D4BCE8'}
                                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                            />
                            <button
                                onClick={() => send(input)}
                                disabled={!input.trim() || loading || msgCount >= MAX_MSGS}
                                style={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    background: '#955FB5', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, opacity: (!input.trim() || loading) ? 0.3 : 1,
                                    transition: 'opacity .2s',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                            </button>
                        </div>

                        {/* Limit */}
                        {remaining <= 3 && (
                            <div style={{ fontSize: 10, color: '#AEAEB2', textAlign: 'center', padding: '0 14px 10px' }}>
                                {remaining} {remaining === 1 ? 'mensaje restante' : 'mensajes restantes'}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`@keyframes argo-chat-pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.4)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}`}</style>
        </>
    );
}
