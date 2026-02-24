import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../../../lib/onboardingData';
import { QuestionAnswer } from '../../../lib/profileResolver';

type Axis = 'D' | 'I' | 'S' | 'C';

const AXIS_STYLE: Record<Axis, { selectedBg: string; selectedBorder: string; selectedText: string; dot: string }> = {
    D: { selectedBg: 'bg-red-50',    selectedBorder: 'border-red-400',    selectedText: 'text-red-700',    dot: 'bg-red-400' },
    I: { selectedBg: 'bg-yellow-50', selectedBorder: 'border-yellow-400', selectedText: 'text-yellow-700', dot: 'bg-yellow-400' },
    S: { selectedBg: 'bg-green-50',  selectedBorder: 'border-green-400',  selectedText: 'text-green-700',  dot: 'bg-green-400' },
    C: { selectedBg: 'bg-blue-50',   selectedBorder: 'border-blue-400',   selectedText: 'text-blue-700',   dot: 'bg-blue-400' },
};

const DotProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="space-y-2">
        <div className="flex gap-1.5 justify-center flex-wrap">
            {Array.from({ length: total }, (_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`rounded-full transition-all duration-300 ${
                        i < current
                            ? 'w-2 h-2 bg-argo-indigo'
                            : i === current
                            ? 'w-3 h-3 bg-argo-indigo/50 ring-2 ring-argo-indigo/30'
                            : 'w-2 h-2 bg-argo-border'
                    }`}
                />
            ))}
        </div>
        <p className="text-center text-[10px] font-bold text-argo-grey/60 uppercase tracking-widest">
            {questionIndexToLabel(current)} de {total}
        </p>
    </div>
);

function questionIndexToLabel(i: number): string {
    return `Decisión ${i + 1}`;
}

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
        }, 700);
    };

    const intro = question.intro.replace(/\{\{NOMBRE_NIÑO\}\}/g, nombreNino);

    return (
        <motion.div
            key={question.number}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6 max-w-lg mx-auto w-full"
        >
            {/* Progress */}
            <DotProgress current={questionIndex} total={totalQuestions} />

            {/* Question card */}
            <div className="bg-argo-navy rounded-2xl px-6 py-7 space-y-2 shadow-lg shadow-argo-navy/20">
                <p className="text-[10px] font-bold text-argo-indigo/80 uppercase tracking-[0.2em]">
                    {question.title}
                </p>
                <p className="text-xl font-bold text-white leading-snug">
                    {intro}
                </p>
            </div>

            {/* Options — staggered entry */}
            <div className="space-y-3">
                {question.options.map((opt, i) => {
                    const axis = opt.axis as Axis;
                    const style = AXIS_STYLE[axis];
                    const isChosen = chosen === i;
                    const isOther = chosen !== null && !isChosen;

                    return (
                        <motion.button
                            key={`${question.number}-${i}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, type: 'spring', stiffness: 380, damping: 26 }}
                            onClick={() => handleSelect(i)}
                            disabled={chosen !== null}
                            whileTap={chosen === null ? { scale: 0.97 } : {}}
                            className={`
                                w-full text-left px-5 py-5 rounded-2xl border-2
                                text-base font-medium leading-snug
                                transition-all duration-250 cursor-pointer
                                min-h-[72px] flex items-center gap-4
                                ${isChosen
                                    ? `${style.selectedBg} ${style.selectedBorder} ${style.selectedText} shadow-md`
                                    : isOther
                                    ? 'border-argo-border bg-white/60 text-argo-grey/40'
                                    : 'border-argo-border bg-white text-argo-navy hover:border-argo-indigo/50 hover:shadow-sm'
                                }
                            `}
                        >
                            {/* Radio dot */}
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex-shrink-0
                                flex items-center justify-center transition-all duration-300
                                ${isChosen ? `${style.dot} border-transparent` : 'border-argo-border'}
                            `}>
                                <AnimatePresence>
                                    {isChosen && (
                                        <motion.svg
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0 }}
                                            className="w-3 h-3 text-white"
                                            fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor" strokeWidth={3}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </motion.svg>
                                    )}
                                </AnimatePresence>
                            </div>

                            <span className="flex-1">{opt.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};
