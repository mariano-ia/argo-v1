import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Question } from '../../../lib/onboardingData';
import { QuestionAnswer } from '../../../lib/profileResolver';

interface Props {
    question: Question;
    questionIndex: number;   // 0-based
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

    // Reset timer each time a new question mounts
    useEffect(() => {
        startTime.current = Date.now();
        setChosen(null);
    }, [question.number]);

    const handleSelect = (optionIndex: number) => {
        if (chosen !== null) return;
        setChosen(optionIndex);
        const responseTimeMs = Date.now() - startTime.current;
        // Slight delay so user sees their selection before advancing
        setTimeout(() => {
            onAnswer({ axis: question.options[optionIndex].axis, responseTimeMs });
        }, 600);
    };

    const progress = (questionIndex / totalQuestions) * 100;

    // Inject nombre into intro text
    const intro = question.intro.replace(/\{\{NOMBRE_NIÑO\}\}/g, nombreNino);

    return (
        <motion.div
            key={question.number}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-6 max-w-lg mx-auto"
        >
            {/* Progress */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-argo-grey uppercase tracking-widest">
                    <span>Decisión {questionIndex + 1} de {totalQuestions}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-argo-border rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-argo-indigo rounded-full"
                        initial={{ width: `${progress}%` }}
                        animate={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-argo-indigo uppercase tracking-[0.2em]">
                    {question.title}
                </div>
                <p className="text-lg font-semibold text-argo-navy leading-snug">
                    {intro}
                </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((opt, i) => (
                    <motion.button
                        key={i}
                        onClick={() => handleSelect(i)}
                        whileHover={chosen === null ? { scale: 1.01 } : {}}
                        whileTap={chosen === null ? { scale: 0.99 } : {}}
                        className={`w-full text-left px-5 py-4 rounded-argo-sm border-2 text-sm leading-relaxed transition-all ${
                            chosen === i
                                ? 'border-argo-indigo bg-argo-indigo/10 text-argo-navy font-semibold'
                                : chosen !== null
                                ? 'border-argo-border bg-white text-argo-grey opacity-50'
                                : 'border-argo-border bg-white text-argo-navy hover:border-argo-indigo/60'
                        }`}
                    >
                        {opt.label}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};
