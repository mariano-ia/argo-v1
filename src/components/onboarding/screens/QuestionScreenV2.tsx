import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../../../lib/onboardingData';
import { QuestionAnswer } from '../../../lib/profileResolver';
import { AnchorCounter } from '../AnchorCounter';

type Axis = 'D' | 'I' | 'S' | 'C';

// ─── Emoji mapping per question/option ───────────────────────────────────────

const OPTION_EMOJIS: Record<number, string[]> = {
    1:  ['🔍', '💨', '😌', '👋'],
    2:  ['🤔', '🏄', '👣', '🤝'],
    3:  ['🎯', '⚙️', '💬', '⚡'],
    4:  ['👂', '🗺️', '🧭', '🏠'],
    5:  ['💪', '🏃', '🧠', '🔎'],
    6:  ['📣', '🤲', '👀', '⚓'],
    7:  ['😮‍💨', '🔬', '💪', '🙋'],
    8:  ['😄', '📍', '🚣', '🔥'],
    9:  ['👁️', '⚔️', '😴', '📢'],
    10: ['🙌', '🎓', '🏃', '🤗'],
    11: ['📈', '🎲', '🌊', '⏱️'],
    12: ['🎉', '✅', '🛡️', '🔭'],
};

// ─── Option colors — saturated game-style ────────────────────────────────────

const CARD_COLORS = [
    { bg: '#4EA8DE', shadow: '#3478A6' },
    { bg: '#F4A261', shadow: '#C47D3F' },
    { bg: '#9B72CF', shadow: '#7548A8' },
    { bg: '#5EC08D', shadow: '#3D9966' },
] as const;

// ─── Ship Progress Bar ──────────────────────────────────────────────────────

const ShipProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const pct = total > 1 ? (current / (total - 1)) * 100 : 0;

    return (
        <div className="relative h-6 flex items-center">
            {/* Track */}
            <div className="absolute inset-x-0 h-2 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-white/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                />
            </div>
            {/* Sailing ship emoji */}
            <motion.div
                className="absolute top-1/2 z-10"
                style={{ transform: 'translate(-50%, -50%)' }}
                animate={{ left: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            >
                <span className="text-lg drop-shadow-md">⛵</span>
            </motion.div>
        </div>
    );
};

// ─── 3D Option Card ─────────────────────────────────────────────────────────

interface OptionProps {
    color: typeof CARD_COLORS[number];
    emoji: string;
    label: string;
    index: number;
    isChosen: boolean;
    isOther: boolean;
    onSelect: () => void;
}

const OptionCard: React.FC<OptionProps> = ({ color, emoji, label, index, isChosen, isOther, onSelect }) => (
    <motion.button
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: isOther ? 0.3 : 1, y: 0 }}
        transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 28 }}
        onClick={onSelect}
        disabled={isChosen || isOther}
        whileTap={!isChosen && !isOther ? { y: 3 } : {}}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-transform min-h-[60px]"
        style={{
            background: isChosen ? color.bg : color.bg,
            boxShadow: isChosen
                ? `0 1px 0 ${color.shadow}`
                : `0 4px 0 ${color.shadow}`,
            transform: isChosen ? 'translateY(3px)' : 'translateY(0)',
            opacity: isOther ? 0.3 : 1,
        }}
    >
        {/* Emoji or checkmark */}
        <AnimatePresence mode="wait">
            {isChosen ? (
                <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-2xl flex-shrink-0 w-8 text-center"
                >
                    ✓
                </motion.span>
            ) : (
                <motion.span
                    key="emoji"
                    className="text-2xl flex-shrink-0 w-8 text-center"
                >
                    {emoji}
                </motion.span>
            )}
        </AnimatePresence>

        {/* Label */}
        <span className="flex-1 font-quest font-semibold text-lg text-white leading-snug text-left">
            {label}
        </span>
    </motion.button>
);

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
    questionIndex,
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
    const emojis = OPTION_EMOJIS[question.number] ?? ['⭐', '⭐', '⭐', '⭐'];

    return (
        <motion.div
            key={question.number}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex flex-col justify-end"
            style={{ zIndex: 2 }}
        >
            {/* ── Zone 1: Question title floating over the scene ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute top-[28%] left-0 right-0 px-6 text-center"
            >
                <h2 className="font-adventure text-2xl md:text-3xl text-white text-adventure leading-tight">
                    {intro}
                </h2>
            </motion.div>

            {/* ── Zone 2: Decisions panel (bottom 48%) ── */}
            <div
                className="relative px-4 pb-6 pt-8"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)',
                }}
            >
                {/* Progress bar + anchor counter */}
                <div className="flex items-center gap-3 mb-4 max-w-lg mx-auto">
                    <div className="flex-1">
                        <ShipProgress current={questionIndex} total={totalQuestions} />
                    </div>
                    <AnchorCounter count={anchorsCollected} total={totalQuestions} />
                </div>

                {/* Option cards */}
                <div className="space-y-2.5 max-w-lg mx-auto">
                    {question.options.map((opt, i) => (
                        <OptionCard
                            key={`${question.number}-${i}`}
                            color={CARD_COLORS[i % CARD_COLORS.length]}
                            emoji={emojis[i]}
                            label={opt.label}
                            index={i}
                            isChosen={chosen === i}
                            isOther={chosen !== null && chosen !== i}
                            onSelect={() => handleSelect(i)}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
