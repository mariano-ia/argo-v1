import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

type Clarity = 'muy_claro' | 'algo_claro' | 'confuso';
type Helpfulness = 'mucho' | 'algo' | 'poco';
type Identification = 'identificado' | 'mas_o_menos' | 'nada';

interface ChipOption<T extends string> {
    value: T;
    label: string;
}

const CLARITY_OPTIONS: ChipOption<Clarity>[] = [
    { value: 'muy_claro', label: 'Muy claro' },
    { value: 'algo_claro', label: 'Algo claro' },
    { value: 'confuso', label: 'Confuso' },
];

const HELPFULNESS_OPTIONS: ChipOption<Helpfulness>[] = [
    { value: 'mucho', label: 'Mucho' },
    { value: 'algo', label: 'Algo' },
    { value: 'poco', label: 'Poco' },
];

const IDENTIFICATION_OPTIONS: ChipOption<Identification>[] = [
    { value: 'identificado', label: 'Identificado' },
    { value: 'mas_o_menos', label: 'Más o menos' },
    { value: 'nada', label: 'Nada' },
];

// ─── Chip selector component ─────────────────────────────────────────────────

function ChipGroup<T extends string>({
    options,
    selected,
    onChange,
}: {
    options: ChipOption<T>[];
    selected: T | null;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {options.map(opt => {
                const active = selected === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer
                            ${active
                                ? 'text-white shadow-md scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        style={active ? { backgroundColor: '#955fb5', boxShadow: '0 4px 6px -1px rgba(149,95,181,0.3)' } : undefined}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export const FeedbackForm: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();

    const [clarity, setClarity] = useState<Clarity | null>(null);
    const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(null);
    const [identification, setIdentification] = useState<Identification | null>(null);
    const [openComment, setOpenComment] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-select first question from email link
    useEffect(() => {
        const q1 = searchParams.get('q1');
        if (q1 && ['muy_claro', 'algo_claro', 'confuso'].includes(q1)) {
            setClarity(q1 as Clarity);
        }
    }, [searchParams]);

    const canSubmit = clarity && helpfulness && identification && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || !sessionId) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    clarity,
                    helpfulness,
                    identification,
                    openComment: openComment.trim() || undefined,
                }),
            });

            if (res.status === 409) {
                setSubmitted(true);
                return;
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Error inesperado' }));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Thank you screen ─────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-gray-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center"
                >
                    <div className="mb-6">
                        <span className="font-display text-2xl tracking-tight">
                            <span className="font-extrabold">Argo</span>
                            <span className="font-extralight"> Method</span>
                        </span>
                    </div>
                    <h1 className="font-quest text-2xl font-bold text-gray-900 mb-2">
                        Gracias por tu opinión
                    </h1>
                    <p className="font-quest text-gray-500 text-sm leading-relaxed">
                        Tu feedback nos ayuda a mejorar la experiencia para cada deportista.
                    </p>
                </motion.div>
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-gray-50 flex items-center justify-center p-4">
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl shadow-lg p-8 md:p-10 max-w-lg w-full"
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg tracking-tight">
                            <span className="font-extrabold">Argo</span>
                            <span className="font-extralight"> Method</span>
                        </span>
                    </div>
                    <h1 className="font-quest text-xl font-bold text-gray-900 mt-4">
                        Tu opinión nos ayuda a mejorar
                    </h1>
                    <p className="font-quest text-sm text-gray-400 mt-1">
                        Son solo 4 preguntas &middot; 30 segundos
                    </p>
                </div>

                {/* Q1 — Clarity */}
                <div className="mb-7">
                    <label className="font-quest text-sm font-semibold text-gray-800 block mb-3">
                        1. ¿Qué tan claro te resultó el informe?
                    </label>
                    <ChipGroup options={CLARITY_OPTIONS} selected={clarity} onChange={setClarity} />
                </div>

                {/* Q2 — Helpfulness */}
                <div className="mb-7">
                    <label className="font-quest text-sm font-semibold text-gray-800 block mb-3">
                        2. ¿Sentís que te ayuda a comprender mejor al deportista?
                    </label>
                    <ChipGroup options={HELPFULNESS_OPTIONS} selected={helpfulness} onChange={setHelpfulness} />
                </div>

                {/* Q3 — Identification */}
                <div className="mb-7">
                    <label className="font-quest text-sm font-semibold text-gray-800 block mb-3">
                        3. ¿Qué tan identificado te sentiste con el resultado?
                    </label>
                    <ChipGroup options={IDENTIFICATION_OPTIONS} selected={identification} onChange={setIdentification} />
                </div>

                {/* Q4 — Open comment */}
                <div className="mb-8">
                    <label className="font-quest text-sm font-semibold text-gray-800 block mb-3">
                        4. ¿Qué cambiarías o mejorarías?
                        <span className="font-normal text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <textarea
                        value={openComment}
                        onChange={e => setOpenComment(e.target.value)}
                        placeholder="Tu sugerencia..."
                        rows={3}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-quest text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                        maxLength={1000}
                    />
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 text-sm text-red-600 font-quest"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full py-3.5 rounded-2xl font-quest font-semibold text-sm transition-all duration-200
                        ${canSubmit
                            ? 'text-white shadow-md cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    style={canSubmit ? { backgroundColor: '#955fb5', boxShadow: '0 4px 6px -1px rgba(149,95,181,0.3)' } : undefined}
                >
                    {submitting ? 'Enviando...' : 'Enviar opinión'}
                </button>
            </motion.form>
        </div>
    );
};
