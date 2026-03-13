import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../../../lib/onboardingData';
import { QuestionAnswer } from '../../../lib/profileResolver';
import { NauticalIcon, NauticalIconName } from '../illustrations/NauticalIcons';
import { AnchorCounter } from '../AnchorCounter';

type Axis = 'D' | 'I' | 'S' | 'C';

// ─── Icon mapping per question/option ────────────────────────────────────────

/** Maps [questionNumber][optionIndex] → icon name */
const OPTION_ICONS: Record<number, NauticalIconName[]> = {
    1:  ['compass', 'lightning', 'wave', 'flag'],
    2:  ['spyglass', 'oar', 'map', 'flag'],
    3:  ['spyglass', 'helm', 'parrot', 'lightning'],
    4:  ['flag', 'map', 'compass', 'lighthouse'],
    5:  ['rope', 'oar', 'compass', 'flag'],
    6:  ['horn', 'rope', 'spyglass', 'anchor'],
    7:  ['wave', 'spyglass', 'knot', 'flag'],
    8:  ['star', 'map', 'oar', 'lightning'],
    9:  ['spyglass', 'oar', 'wave', 'flag'],
    10: ['star', 'compass', 'oar', 'anchor'],
    11: ['spyglass', 'star', 'wave', 'lightning'],
    12: ['flag', 'map', 'anchor', 'spyglass'],
};

// ─── Option colors by position ───────────────────────────────────────────────

const OPTION_STYLES = [
    {
        letter: 'A',
        idle:     'border-sky-200/70   bg-sky-50/55   text-argo-navy',
        selected: 'border-sky-400   bg-sky-500   text-white',
        dot:      'bg-sky-500 text-white',
        ring:     'ring-sky-300',
        iconIdle: '#0284c7',
    },
    {
        letter: 'B',
        idle:     'border-amber-200/70  bg-amber-50/55  text-argo-navy',
        selected: 'border-amber-400  bg-amber-500  text-white',
        dot:      'bg-amber-500 text-white',
        ring:     'ring-amber-300',
        iconIdle: '#d97706',
    },
    {
        letter: 'C',
        idle:     'border-violet-200/70 bg-violet-50/55 text-argo-navy',
        selected: 'border-violet-400 bg-violet-500 text-white',
        dot:      'bg-violet-500 text-white',
        ring:     'ring-violet-300',
        iconIdle: '#7c3aed',
    },
    {
        letter: 'D',
        idle:     'border-emerald-200/70 bg-emerald-50/55 text-argo-navy',
        selected: 'border-emerald-400 bg-emerald-500 text-white',
        dot:      'bg-emerald-500 text-white',
        ring:     'ring-emerald-300',
        iconIdle: '#059669',
    },
] as const;

// ─── Progress Bar ────────────────────────────────────────────────────────────

const ShipProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const pct = total > 1 ? (current / (total - 1)) * 100 : 0;

    return (
        <div className="relative h-5 flex items-center">
            <div className="absolute inset-x-0 h-1 rounded-full bg-white/25 overflow-hidden">
                <motion.div
                    className="h-full bg-white/65 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                />
            </div>
            {Array.from({ length: total }, (_, i) => {
                const pos = total > 1 ? (i / (total - 1)) * 100 : 0;
                const done = i < current;
                const active = i === current;
                return (
                    <div key={i} className="absolute top-1/2" style={{ left: `${pos}%`, transform: 'translate(-50%, -50%)' }}>
                        <motion.div
                            animate={{
                                width:  active ? 14 : done ? 10 : 8,
                                height: active ? 14 : done ? 10 : 8,
                                backgroundColor: active ? 'rgba(255,255,255,1)' : done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)',
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="rounded-full"
                        />
                    </div>
                );
            })}
        </div>
    );
};

// ─── Option Card (with icon) ─────────────────────────────────────────────────

interface OptionProps {
    style: typeof OPTION_STYLES[number];
    label: string;
    icon: NauticalIconName;
    index: number;
    isChosen: boolean;
    isOther: boolean;
    onSelect: () => void;
}

const OptionCard: React.FC<OptionProps> = ({ style, label, icon, index, isChosen, isOther, onSelect }) => (
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
            min-h-[80px] backdrop-blur-sm
            ${isChosen
                ? `${style.selected} shadow-lg ring-4 ${style.ring}`
                : `${style.idle} hover:shadow-md hover:scale-[1.01]`
            }
        `}
    >
        {/* Icon */}
        <motion.div
            animate={isChosen ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`
                w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center
                transition-all duration-300
                ${isChosen ? 'bg-white/25' : 'bg-white/60'}
            `}
        >
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
                    <motion.div key="icon">
                        <NauticalIcon name={icon} size={22} color={style.iconIdle} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>

        {/* Label */}
        <span className={`flex-1 text-base font-medium leading-snug ${isChosen ? 'text-white' : 'text-argo-navy'}`}>
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
    const icons = OPTION_ICONS[question.number] ?? ['star', 'star', 'star', 'star'];

    return (
        <motion.div
            key={question.number}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-5 max-w-lg mx-auto w-full"
        >
            {/* Header: progress bar + anchor counter */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <ShipProgress current={questionIndex} total={totalQuestions} />
                </div>
                <AnchorCounter count={anchorsCollected} total={totalQuestions} />
            </div>

            {/* Question card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white/25 backdrop-blur-sm rounded-2xl px-6 py-7"
                style={{ border: '1px solid rgba(255,255,255,0.45)' }}
            >
                <p className="text-[#1D1D1F] leading-snug" style={{ fontWeight: 300, fontSize: '20px', letterSpacing: '-0.02em' }}>
                    {intro}
                </p>
            </motion.div>

            {/* Option cards with icons */}
            <div className="space-y-3">
                {question.options.map((opt, i) => (
                    <OptionCard
                        key={`${question.number}-${i}`}
                        style={OPTION_STYLES[i % OPTION_STYLES.length]}
                        label={opt.label}
                        icon={icons[i]}
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
