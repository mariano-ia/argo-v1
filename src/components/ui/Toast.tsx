import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    text: string;
}

interface ToastContextValue {
    toast: (type: ToastMessage['type'], text: string) => void;
}

/* ── Context ───────────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

/* ── Provider ──────────────────────────────────────────────────────────────── */

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    const toast = useCallback((type: ToastMessage['type'], text: string) => {
        const id = Math.random().toString(36).slice(2);
        setMessages(prev => [...prev, { id, type, text }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setMessages(prev => prev.filter(m => m.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container — fixed bottom-center */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
                <AnimatePresence>
                    {messages.map(msg => (
                        <ToastItem key={msg.id} message={msg} onDismiss={dismiss} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

/* ── Toast Item ────────────────────────────────────────────────────────────── */

const ToastItem: React.FC<{ message: ToastMessage; onDismiss: (id: string) => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(message.id), 4000);
        return () => clearTimeout(timer);
    }, [message.id, onDismiss]);

    const colors = {
        success: 'bg-emerald-900 text-emerald-100 border-emerald-700',
        error: 'bg-red-900 text-red-100 border-red-700',
        info: 'bg-argo-navy text-white border-argo-navy',
    };

    const Icon = message.type === 'error' ? AlertCircle : CheckCircle;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${colors[message.type]}`}
        >
            <Icon size={16} className="flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{message.text}</p>
            <button
                onClick={() => onDismiss(message.id)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
