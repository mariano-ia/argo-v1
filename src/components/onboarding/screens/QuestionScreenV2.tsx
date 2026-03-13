import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../../../lib/onboardingData';
import { QuestionAnswer } from '../../../lib/profileResolver';

type Axis = 'D' | 'I' | 'S' | 'C';

// ─── Phase labels ────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
    port: 'El Puerto',
    'open-sea': 'Mar Abierto',
    storm: 'La Tormenta',
    calm: 'La Calma',
    island: 'La Isla',
};

function getPhase(qIndex: number): string {
    if (qIndex <= 1) return 'port';
    if (qIndex <= 3) return 'open-sea';
    if (qIndex <= 6) return 'storm';
    if (qIndex <= 9) return 'calm';
    return 'island';
}

// ─── Stitch badge colors (solid saturated, matching Stitch output) ───────────

const BADGE_BG = ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981']; // blue, amber, violet, emerald
const LETTERS = ['A', 'B', 'C', 'D'];

// ─── Word-by-word typewriter ─────────────────────────────────────────────────

function useWordTypewriter(text: string, speed = 55): { displayed: string; done: boolean } {
    const words = text.split(' ');
    const [count, setCount] = useState(0);

    useEffect(() => { setCount(0); }, [text]);

    useEffect(() => {
        if (count >= words.length) return;
        const t = setTimeout(() => setCount(c => c + 1), speed);
        return () => clearTimeout(t);
    }, [count, words.length, speed]);

    return { displayed: words.slice(0, count).join(' '), done: count >= words.length };
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
    nombreNino: string;
    anchorsCollected: number;
    onAnswer: (answer: QuestionAnswer) => void;
}

export const QuestionScreenV2: React.FC<Props> = ({
    question,
    totalQuestions,
    nombreNino,
    anchorsCollected,
    onAnswer,
}) => {
    const startTime = useRef(Date.now());
    const [chosen, setChosen] = useState<number | null>(null);

    useEffect(() => {
        startTime.current = Date.now();
        setChosen(null);
    }, [question.number]);

    const handleSelect = (optionIndex: number) => {
        if (chosen !== null) return;
        setChosen(optionIndex);

        const responseTimeMs = Date.now() - startTime.current;
        setTimeout(() => {
            onAnswer({ axis: question.options[optionIndex].axis as Axis, responseTimeMs });
        }, 650);
    };

    const intro = question.intro.replace(/\{\{NOMBRE_NIÑO\}\}/g, nombreNino);
    const { displayed, done } = useWordTypewriter(intro, 55);
    const phase = getPhase(anchorsCollected);

    return (
        <motion.div
            key={question.number}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex flex-col"
            style={{ zIndex: 2 }}
        >
            {/* ── Background overlay gradient (Stitch pattern) ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1, background: 'linear-gradient(to bottom, transparent 0%, rgba(16,25,34,0.4) 40%, rgba(16,25,34,0.6) 60%, rgba(16,25,34,0.9) 100%)' }}
            />

            {/* ── Top Bar: chapter label + dot progress ── */}
            <header
                className="relative px-6 pt-10"
                style={{ zIndex: 2 }}
            >
                {/* Chapter label */}
                <h2 className="font-quest text-white text-base font-extrabold tracking-[0.35em] text-center uppercase mb-4">
                    {PHASE_LABELS[phase] || ''}
                </h2>

                {/* Dot progress — one dot per question */}
                <div className="flex items-center justify-center gap-2">
                    {[...Array(totalQuestions)].map((_, i) => {
                        const isCompleted = i < anchorsCollected;
                        const isCurrent = i === anchorsCollected;
                        return (
                            <motion.div
                                key={i}
                                className="rounded-full"
                                style={{
                                    width: isCurrent ? 10 : 7,
                                    height: isCurrent ? 10 : 7,
                                    background: isCompleted
                                        ? 'linear-gradient(135deg, #22D3EE, #34D399)'
                                        : isCurrent
                                            ? 'rgba(255,255,255,0.9)'
                                            : 'rgba(255,255,255,0.2)',
                                    boxShadow: isCurrent
                                        ? '0 0 8px rgba(255,255,255,0.5)'
                                        : isCompleted
                                            ? '0 0 4px rgba(52,211,153,0.4)'
                                            : 'none',
                                }}
                                animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                                transition={isCurrent ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                            />
                        );
                    })}
                </div>
            </header>

            {/* ── Spacer — scene breathes ── */}
            <div className="flex-1 relative" style={{ zIndex: 2 }} />

            {/* ── Bottom: narrator + question card + options (Stitch pattern) ── */}
            <main className="relative px-5 pb-8 flex flex-col gap-3" style={{ zIndex: 2 }}>
                {/* Narrator pill — Stitch: primary bg, white text */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex justify-start"
                >
                    <div
                        className="flex h-8 items-center gap-2 rounded-full px-4 shadow-lg"
                        style={{
                            background: 'rgba(17,115,212,0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        <span className="text-white text-xs font-bold uppercase tracking-wider font-quest">
                            {nombreNino}
                        </span>
                    </div>
                </motion.div>

                {/* Question text — no background card, matches story title style */}
                <motion.p
                    key={question.number}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                    className="font-adventure text-white text-3xl font-light leading-tight tracking-normal px-2"
                >
                    {displayed}
                    {!done && (
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="inline-block ml-1 w-0.5 h-5 bg-white/70 align-middle"
                        />
                    )}
                </motion.p>

                {/* Option buttons — Stitch glass-button: white 0.08, blur 12, white border 0.15 */}
                <div className="flex flex-col gap-3 mt-1">
                    {question.options.map((opt, i) => {
                        const isChosen = chosen === i;
                        const isOther = chosen !== null && chosen !== i;

                        return (
                            <motion.button
                                key={`${question.number}-${i}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: isOther ? 0.3 : 1, y: 0 }}
                                transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 28 }}
                                onClick={() => handleSelect(i)}
                                disabled={isChosen || isOther}
                                whileTap={!isChosen && !isOther ? { scale: 0.95 } : {}}
                                className="flex items-center p-3 rounded-lg text-left"
                                style={{
                                    background: isChosen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: isChosen
                                        ? '1.5px solid rgba(255,255,255,0.35)'
                                        : '1px solid rgba(255,255,255,0.15)',
                                }}
                            >
                                {/* Solid color badge — Stitch: 40x40 rounded-lg, saturated bg */}
                                <AnimatePresence mode="wait">
                                    {isChosen ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-lg shadow-lg"
                                            style={{ background: BADGE_BG[i] }}
                                        >
                                            ✓
                                        </motion.div>
                                    ) : (
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-lg shadow-lg font-quest"
                                            style={{ background: BADGE_BG[i] }}
                                        >
                                            {LETTERS[i]}
                                        </div>
                                    )}
                                </AnimatePresence>
                                <span className="ml-4 text-white font-medium font-quest text-[15px]">
                                    {opt.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </main>
        </motion.div>
    );
};
