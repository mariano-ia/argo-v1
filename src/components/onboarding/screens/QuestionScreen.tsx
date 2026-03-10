import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../../../lib/onboardingData';
import { QuestionAnswer } from '../../../lib/profileResolver';

type Axis = 'D' | 'I' | 'S' | 'C';

// Option styles by position (A/B/C/D) — independent of axis so kids don't get cues
const OPTION_STYLES = [
    {
        letter: 'A',
        idle:     'border-sky-200   bg-sky-50   text-argo-navy',
        selected: 'border-sky-400   bg-sky-500   text-white',
        dot:      'bg-sky-500 text-white',
        ring:     'ring-sky-300',
    },
    {
        letter: 'B',
        idle:     'border-amber-200  bg-amber-50  text-argo-navy',
        selected: 'border-amber-400  bg-amber-500  text-white',
        dot:      'bg-amber-500 text-white',
        ring:     'ring-amber-300',
    },
    {
        letter: 'C',
        idle:     'border-violet-200 bg-violet-50 text-argo-navy',
        selected: 'border-violet-400 bg-violet-500 text-white',
        dot:      'bg-violet-500 text-white',
        ring:     'ring-violet-300',
    },
    {
        letter: 'D',
        idle:     'border-emerald-200 bg-emerald-50 text-argo-navy',
        selected: 'border-emerald-400 bg-emerald-500 text-white',
        dot:      'bg-emerald-500 text-white',
        ring:     'ring-emerald-300',
    },
] as const;

// ─── Ship Progress Bar ─────────────────────────────────────────────────────────

const ShipProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const pct = total > 1 ? (current / (total - 1)) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="relative h-8 flex items-center">
                {/* Ocean track */}
                <div className="absolute inset-x-0 h-2 rounded-full bg-sky-100 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                    />
                </div>

                {/* Waypoints */}
                {Array.from({ length: total }, (_, i) => {
                    const pos = total > 1 ? (i / (total - 1)) * 100 : 0;
                    const done = i < current;
                    const active = i === current;
                    return (
                        <div
                            key={i}
                            className="absolute top-1/2 -translate-y-1/2"
                            style={{ left: `${pos}%`, transform: `translate(-50%, -50%)` }}
                        >
                            <div className={`
                                rounded-full border-2 transition-all duration-300
                                ${done    ? 'w-2.5 h-2.5 bg-blue-500 border-blue-500'
                                : active  ? 'w-3.5 h-3.5 bg-white border-blue-400 shadow-md shadow-blue-200'
                                :           'w-2 h-2 bg-sky-100 border-sky-200'}
                            `} />
                        </div>
                    );
                })}

                {/* Ship emoji that moves */}
                <motion.div
                    className="absolute top-1/2 pointer-events-none"
                    style={{ translateY: '-50%' }}
                    animate={{ left: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                >
                    <span className="text-xl -translate-x-1/2 block select-none" style={{ transform: 'translateX(-50%)' }}>
                        ⛵
                    </span>
                </motion.div>
            </div>

            <p className="text-center text-[11px] font-bold text-sky-600 uppercase tracking-widest">
                Decisión {current + 1} de {total}
            </p>
        </div>
    );
};

// ─── Option Button ─────────────────────────────────────────────────────────────

interface OptionProps {
    style: typeof OPTION_STYLES[number];
    label: string;
    index: number;
    isChosen: boolean;
    isOther: boolean;
    onSelect: () => void;
}

const OptionButton: React.FC<OptionProps> = ({ style, label, index, isChosen, isOther, onSelect }) => (
    <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isOther ? 0.35 : 1, y: 0 }}
        transition={{ delay: index * 0.07, type: 'spring', stiffness: 360, damping: 28 }}
        onClick={onSelect}
        disabled={isChosen || isOther}
        whileTap={!isChosen && !isOther ? { scale: 0.97 } : {}}
        className={`
            w-full text-left px-4 py-4 rounded-2xl border-2
            flex items-center gap-4 transition-all duration-200 cursor-pointer
            min-h-[72px]
            ${isChosen
                ? `${style.selected} shadow-lg ring-4 ${style.ring}`
                : `${style.idle} hover:shadow-md hover:scale-[1.01]`
            }
        `}
    >
        {/* Letter badge */}
        <div className={`
            w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
            text-sm font-black transition-all duration-300
            ${isChosen ? 'bg-white/25 text-white' : `${style.dot} opacity-80`}
        `}>
            <AnimatePresence mode="wait">
                {isChosen ? (
                    <motion.svg
                        key="check"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        className="w-5 h-5 text-white"
                        fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                ) : (
                    <motion.span key="letter" className="text-white font-black text-sm">
                        {style.letter}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>

        {/* Label */}
        <span className={`flex-1 text-base font-medium leading-snug ${isChosen ? 'text-white' : 'text-argo-navy'}`}>
            {label}
        </span>
    </motion.button>
);

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
    nombreNino: string;
    onAnswer: (answer: QuestionAnswer) => void;
}

export const QuestionScreen: React.FC<Props> = ({
    question,
    questionIndex,
    totalQuestions,
    nombreNino,
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

    return (
        <motion.div
            key={question.number}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-5 max-w-lg mx-auto w-full"
        >
            {/* Ship progress */}
            <ShipProgress current={questionIndex} total={totalQuestions} />

            {/* Question card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl px-6 py-7 border border-[#D2D2D7]"
            >
                <p className="text-[10px] font-medium text-[#86868B] uppercase tracking-[0.2em] mb-2">
                    {question.title}
                </p>
                <p className="text-xl font-medium text-[#1D1D1F] leading-snug" style={{ letterSpacing: '-0.01em' }}>
                    {intro}
                </p>
            </motion.div>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((opt, i) => (
                    <OptionButton
                        key={`${question.number}-${i}`}
                        style={OPTION_STYLES[i % OPTION_STYLES.length]}
                        label={opt.label}
                        index={i}
                        isChosen={chosen === i}
                        isOther={chosen !== null && chosen !== i}
                        onSelect={() => handleSelect(i)}
                    />
                ))}
            </div>
        </motion.div>
    );
};
