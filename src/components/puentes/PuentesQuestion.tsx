import { motion } from 'framer-motion';
import { Card } from '../ui';
import type { PuentesQuestion as Q, PuentesOption } from '../../lib/puentesQuestions';

interface Props {
    question: Q;
    onSelect: (option: PuentesOption) => void;
}

// The adult questionnaire is generic (measures the adult's own style, reusable
// across any child the adult bridges toward), so the prompt is shown verbatim —
// no child-name anchor.
// Mobile-first sizing: the whole card must fit small phone viewports (the
// original fixed p-6/py-4 stack overflowed an iPhone SE and the fold hid the
// bottom options), so paddings/text scale down below `sm`.
export function PuentesQuestion({ question, onSelect }: Props) {
    const prompt = question.prompt;
    const compact = question.layout === 'compact';
    return (
        <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
        >
            <Card padding="sm" className="sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-argo-navy leading-snug">
                    {prompt}
                </h2>
                <div className={`mt-5 sm:mt-6 grid gap-2.5 sm:gap-3 ${compact ? 'grid-cols-2' : ''}`}>
                    {question.options.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => onSelect(opt)}
                            className={`text-left w-full rounded-[14px] border border-argo-border bg-white hover:bg-argo-bg hover:border-argo-violet-200 active:bg-argo-bg transition-colors text-argo-secondary font-medium leading-relaxed ${compact ? 'px-4 py-3.5' : 'px-4 py-3 sm:px-5 sm:py-4'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
}
