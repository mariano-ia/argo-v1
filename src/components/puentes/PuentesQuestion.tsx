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
export function PuentesQuestion({ question, onSelect }: Props) {
    const prompt = question.prompt;
    return (
        <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
        >
            <Card padding="lg">
                <h2 className="text-xl font-semibold text-argo-navy leading-snug">
                    {prompt}
                </h2>
                <div className="mt-6 grid gap-3">
                    {question.options.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => onSelect(opt)}
                            className="text-left w-full px-5 py-4 rounded-[14px] border border-argo-border bg-white hover:bg-argo-bg hover:border-argo-violet-200 transition-colors text-argo-secondary font-medium leading-relaxed"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
}
