import { motion } from 'framer-motion';
import { Button, Card } from '../ui';
import { getPuentesCopy } from '../../lib/puentesTranslations';
import type { Lang } from '../../types/puentes';

interface Props {
    childName: string;
    lang: Lang;
    onStart: () => void;
    childOptions?: string[];
    selectedAnchor?: number;
    onAnchorChange?: (idx: number) => void;
}

const ANCHOR_COPY: Record<Lang, { label: string; helper: string }> = {
    es: {
        label: 'Pensando en',
        helper: 'Tus respuestas se aplican a todos tus hijos. Elige a quién traer a la mente al responder. Vas a ver un informe por cada uno.',
    },
    en: {
        label: 'Thinking about',
        helper: 'Your answers apply to all your children. Choose who to keep in mind while answering. You will see a report for each one.',
    },
    pt: {
        label: 'Pensando em',
        helper: 'Suas respostas se aplicam a todos os seus filhos. Escolha em quem pensar ao responder. Você verá um relatório para cada um.',
    },
};

export function PuentesIntro({
    childName,
    lang,
    onStart,
    childOptions = [],
    selectedAnchor = 0,
    onAnchorChange,
}: Props) {
    const c = getPuentesCopy(lang);
    const anchor = ANCHOR_COPY[lang] ?? ANCHOR_COPY.es;
    const hasMultiple = childOptions.length > 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
        >
            <Card padding="lg" className="text-center">
                <p className="text-xs uppercase tracking-widest text-argo-violet-500 mb-3 font-semibold">
                    {c.intro.eyebrow}
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-argo-navy">
                    {c.intro.title}
                </h1>
                <p className="mt-5 text-argo-secondary text-base leading-relaxed">
                    {c.intro.subtitle(childName)}
                </p>
                <p className="mt-4 text-sm text-argo-grey">
                    {c.intro.estimatedTime}
                </p>

                {hasMultiple && (
                    <div className="mt-6 pt-6 border-t border-argo-border">
                        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-argo-grey mb-3">
                            {anchor.label}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {childOptions.map((name, idx) => (
                                <button
                                    key={`${name}-${idx}`}
                                    type="button"
                                    onClick={() => onAnchorChange?.(idx)}
                                    className={[
                                        'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                                        idx === selectedAnchor
                                            ? 'bg-argo-violet-500 text-white shadow-[0_2px_8px_rgba(149,95,181,0.3)]'
                                            : 'bg-argo-bg text-argo-navy hover:bg-argo-neutral border border-argo-border',
                                    ].join(' ')}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-argo-light leading-relaxed max-w-sm mx-auto">
                            {anchor.helper}
                        </p>
                    </div>
                )}

                <div className="mt-8">
                    <Button variant="violet" size="lg" onClick={onStart}>
                        {c.intro.startCta}
                    </Button>
                </div>
                <p className="mt-6 text-xs text-argo-light leading-relaxed max-w-sm mx-auto">
                    {c.intro.disclaimer}
                </p>
            </Card>
        </motion.div>
    );
}
